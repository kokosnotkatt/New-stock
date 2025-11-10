import express from 'express';
import finnhubService from '../services/finnhubService.js';
import symbolDetector from '../services/symbolDetector.js';

const router = express.Router();

// ✅ Helper: ตรวจสอบว่า image URL valid หรือไม่
const isValidImageUrl = (url) => {
  if (!url) return false;
  if (!url.startsWith('http')) return false;
  
  const blacklistedDomains = [
    'static2.finnhub.io',
    'static.finnhub.io'
  ];
  
  return !blacklistedDomains.some(domain => url.includes(domain));
};

// 🆕 GET /api/news - ดึงข่าวล่าสุด พร้อม detect symbols
router.get('/', async (req, res) => {
  try {
    const { category = 'general', limit = 50, detectSymbols: shouldDetect = 'true' } = req.query;
    
    console.log(`📰 Fetching news - category: ${category}, limit: ${limit}, detect: ${shouldDetect}`);
    
    const news = await finnhubService.getMarketNews(category);
    const limitedNews = news.slice(0, parseInt(limit));
    
    let validImageCount = 0;
    let noImageCount = 0;
    
    // แปลงข้อมูลให้ตรงกับ format ของ Frontend
    let formattedNews = limitedNews.map((item, index) => {
      let imageUrl = item.image;
      
      if (!isValidImageUrl(imageUrl)) {
        imageUrl = null;
        noImageCount++;
        
        if (item.image) {
          console.log(`⚠️  Removed invalid image: ${item.image.substring(0, 60)}...`);
        }
      } else {
        validImageCount++;
      }
      
      return {
        id: item.id || index,
        title: item.headline,
        headline: item.headline, // เก็บไว้สำหรับ symbol detection
        source: item.source,
        timeAgo: getTimeAgo(item.datetime),
        category: getCategoryName(item.category),
        url: item.url,
        image: imageUrl,
        summary: item.summary,
        datetime: item.datetime
      };
    });
    
    // 🆕 Detect symbols ถ้า query param ระบุ
    if (shouldDetect === 'true') {
      console.log('🔍 Detecting symbols in news...');
      formattedNews = symbolDetector.detectSymbolsForArticles(formattedNews);
      
      // นับจำนวนข่าวที่มี symbols
      const newsWithSymbols = formattedNews.filter(n => n.symbols && n.symbols.length > 0).length;
      console.log(`✅ Detected symbols in ${newsWithSymbols}/${formattedNews.length} articles`);
    }
    
    console.log(`✅ Formatted ${formattedNews.length} news (${validImageCount} with images, ${noImageCount} without images)`);
    
    res.json({
      success: true,
      count: formattedNews.length,
      stats: {
        withImages: validImageCount,
        withoutImages: noImageCount,
        withSymbols: shouldDetect === 'true' 
          ? formattedNews.filter(n => n.symbols && n.symbols.length > 0).length 
          : undefined
      },
      data: formattedNews
    });
    
  } catch (error) {
    console.error('❌ Error fetching news:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch news',
      error: error.message
    });
  }
});

// 🆕 GET /api/news/symbols/trending - ดึง trending symbols
router.get('/symbols/trending', async (req, res) => {
  try {
    const { limit = 10, days = 1 } = req.query;
    
    console.log(`📊 Fetching trending symbols - limit: ${limit}, days: ${days}`);
    
    // ดึงข่าวล่าสุด
    const news = await finnhubService.getMarketNews('general');
    
    // หา trending symbols
    const trending = symbolDetector.getTrendingSymbols(news, parseInt(limit));
    
    console.log(`✅ Found ${trending.length} trending symbols`);
    
    res.json({
      success: true,
      count: trending.length,
      data: trending
    });
    
  } catch (error) {
    console.error('❌ Error fetching trending symbols:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trending symbols',
      error: error.message
    });
  }
});

// 🆕 GET /api/news/by-symbol/:symbol - ดึงข่าวที่เกี่ยวข้องกับ symbol
router.get('/by-symbol/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { limit = 20, days = 7 } = req.query;
    
    console.log(`📊 Fetching news for symbol: ${symbol}`);
    
    // ดึงข่าวทั่วไป
    const generalNews = await finnhubService.getMarketNews('general');
    
    // Filter ข่าวที่มี symbol นี้
    const filteredNews = symbolDetector.filterArticlesBySymbol(generalNews, symbol);
    
    // ดึงข่าวเฉพาะบริษัท (Company News API)
    const dateRange = finnhubService.getDateRange(parseInt(days));
    const companyNews = await finnhubService.getCompanyNews(
      symbol.toUpperCase(), 
      dateRange.from, 
      dateRange.to
    );
    
    // รวมข่าว และตัดซ้ำ
    const allNews = [...filteredNews, ...companyNews];
    const uniqueNews = Array.from(
      new Map(allNews.map(item => [item.id || item.headline, item])).values()
    );
    
    // จำกัดจำนวน
    const limitedNews = uniqueNews.slice(0, parseInt(limit));
    
    // Format
    const formattedNews = limitedNews.map((item, index) => ({
      id: item.id || index,
      title: item.headline,
      source: item.source,
      timeAgo: getTimeAgo(item.datetime),
      category: getCategoryName(item.category || 'company'),
      url: item.url,
      image: isValidImageUrl(item.image) ? item.image : null,
      summary: item.summary,
      datetime: item.datetime,
      symbol: symbol.toUpperCase(),
      symbols: [symbol.toUpperCase()]
    }));
    
    console.log(`✅ Found ${formattedNews.length} news for ${symbol}`);
    
    res.json({
      success: true,
      symbol: symbol.toUpperCase(),
      count: formattedNews.length,
      data: formattedNews
    });
    
  } catch (error) {
    console.error('❌ Error fetching news by symbol:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch news by symbol',
      error: error.message
    });
  }
});

// 🆕 GET /api/news/summary/symbols - สรุป symbols ในข่าวล่าสุด
router.get('/summary/symbols', async (req, res) => {
  try {
    console.log('📊 Generating symbol summary from recent news');
    
    const news = await finnhubService.getMarketNews('general');
    const summary = symbolDetector.generateSymbolSummary(news);
    
    console.log(`✅ Generated summary for ${summary.length} symbols`);
    
    res.json({
      success: true,
      count: summary.length,
      data: summary
    });
    
  } catch (error) {
    console.error('❌ Error generating symbol summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate symbol summary',
      error: error.message
    });
  }
});

// GET /api/news/company/:symbol - ดึงข่าวของบริษัท (เดิม)
router.get('/company/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { days = 30 } = req.query;
    
    const dateRange = finnhubService.getDateRange(parseInt(days));
    
    console.log(`📊 Fetching ${symbol} news from ${dateRange.from} to ${dateRange.to}`);
    
    const news = await finnhubService.getCompanyNews(symbol, dateRange.from, dateRange.to);
    
    let validImageCount = 0;
    let noImageCount = 0;
    
    const formattedNews = news.map((item, index) => {
      let imageUrl = item.image;
      
      if (!isValidImageUrl(imageUrl)) {
        imageUrl = null;
        noImageCount++;
      } else {
        validImageCount++;
      }
      
      return {
        id: item.id || index,
        title: item.headline,
        source: item.source,
        timeAgo: getTimeAgo(item.datetime),
        category: 'Company News',
        url: item.url,
        image: imageUrl,
        summary: item.summary,
        datetime: item.datetime,
        symbol: symbol.toUpperCase(),
        symbols: [symbol.toUpperCase()] // 🆕 เพิ่ม symbols array
      };
    });
    
    console.log(`✅ ${symbol}: ${formattedNews.length} news (${validImageCount} with images, ${noImageCount} without)`);
    
    res.json({
      success: true,
      symbol: symbol.toUpperCase(),
      count: formattedNews.length,
      dateRange,
      stats: {
        withImages: validImageCount,
        withoutImages: noImageCount
      },
      data: formattedNews
    });
    
  } catch (error) {
    console.error('❌ Error fetching company news:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch company news',
      error: error.message
    });
  }
});

// GET /api/stocks/quote/:symbol - ดึงราคาหุ้น
router.get('/quote/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    
    console.log(`💰 Fetching quote for ${symbol}`);
    
    const quote = await finnhubService.getStockQuote(symbol);
    
    res.json({
      success: true,
      symbol: symbol.toUpperCase(),
      data: {
        current: quote.c,
        open: quote.o,
        high: quote.h,
        low: quote.l,
        previousClose: quote.pc,
        change: quote.d,
        changePercent: quote.dp,
        timestamp: quote.t
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching quote:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stock quote',
      error: error.message
    });
  }
});

// GET /api/stocks/search - ค้นหาหุ้น
router.get('/search', async (req, res) => {
  try {
    const { q: query } = req.query;
    
    if (!query || query.length < 1) {
      return res.json({
        success: true,
        count: 0,
        results: []
      });
    }
    
    console.log(`🔍 Searching stocks: ${query}`);
    
    const searchResults = await finnhubService.searchSymbol(query);
    
    res.json({
      success: true,
      count: searchResults.count || 0,
      results: searchResults.result || []
    });
    
  } catch (error) {
    console.error('❌ Error searching stocks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search stocks',
      error: error.message
    });
  }
});

// Helper function: แปลง timestamp เป็น "time ago"
function getTimeAgo(timestamp) {
  const seconds = Math.floor((Date.now() / 1000) - timestamp);
  
  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60
  };

  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);
    if (interval >= 1) {
      return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
    }
  }
  
  return 'just now';
}

// Helper function: แปลงชื่อ category
function getCategoryName(category) {
  const categoryMap = {
    'company': 'Company News',
    'general': 'Market News',
    'forex': 'Forex',
    'crypto': 'Cryptocurrency',
    'merger': 'Mergers & Acquisitions'
  };
  
  return categoryMap[category] || 'News';
}

export default router;