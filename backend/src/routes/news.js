import express from 'express';
import googleNewsService from '../services/googleNewsService.js';
import yahooFinanceService from '../services/yahooFinanceService.js';
import symbolDetector from '../services/symbolDetector.js';

const router = express.Router();

// 🆕 GET /api/news - ดึงข่าวล่าสุดจาก Google News (ไทย + อังกฤษ)
router.get('/', async (req, res) => {
  try {
    const { 
      category = 'general', 
      limit = 50, 
      detectSymbols: shouldDetect = 'true',
      language = 'both' // 'th', 'en', 'both'
    } = req.query;
    
    console.log(`📰 Fetching news - category: ${category}, limit: ${limit}, lang: ${language}`);
    
    let news = [];
    
    if (language === 'both') {
      // ดึงข่าวทั้งไทยและอังกฤษ
      if (category === 'general') {
        news = await googleNewsService.getMultiLanguageNews(null, 25);
      } else {
        const [thNews, enNews] = await Promise.allSettled([
          googleNewsService.getNewsByCategory(category, 'th', 'TH'),
          googleNewsService.getNewsByCategory(category, 'en', 'US')
        ]);
        
        if (thNews.status === 'fulfilled') news = [...news, ...thNews.value];
        if (enNews.status === 'fulfilled') news = [...news, ...enNews.value];
        
        news.sort((a, b) => b.datetime - a.datetime);
      }
    } else {
      // ดึงข่าวภาษาเดียว
      const region = language === 'th' ? 'TH' : 'US';
      
      if (category === 'general') {
        news = await googleNewsService.getNews(null, language, region);
      } else {
        news = await googleNewsService.getNewsByCategory(category, language, region);
      }
    }
    
    const limitedNews = news.slice(0, parseInt(limit));
    
    let validImageCount = 0;
    let noImageCount = 0;
    
    // แปลงข้อมูลให้ตรงกับ format ของ Frontend
    let formattedNews = limitedNews.map((item, index) => {
      if (item.image) {
        validImageCount++;
      } else {
        noImageCount++;
      }
      
      return {
        id: item.id || index,
        title: item.headline || item.title,
        headline: item.headline || item.title,
        source: item.source,
        timeAgo: getTimeAgo(item.datetime),
        category: item.category,
        url: item.url,
        image: item.image,
        summary: item.summary,
        datetime: item.datetime,
        language: item.language
      };
    });
    
    // 🆕 Detect symbols ถ้า query param ระบุ
    if (shouldDetect === 'true') {
      console.log('🔍 Detecting symbols in news...');
      formattedNews = symbolDetector.detectSymbolsForArticles(formattedNews);
      
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
          : undefined,
        languages: {
          th: formattedNews.filter(n => n.language === 'th').length,
          en: formattedNews.filter(n => n.language === 'en').length
        }
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
    const { limit = 10 } = req.query;
    
    console.log(`📊 Fetching trending symbols - limit: ${limit}`);
    
    // ดึงข่าวล่าสุด
    const news = await googleNewsService.getMultiLanguageNews(null, 50);
    
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
    const { limit = 20, language = 'both' } = req.query;
    
    console.log(`📊 Fetching news for symbol: ${symbol} (${language})`);
    
    // ค้นหาชื่อบริษัทจาก symbol
    const companyInfo = symbolDetector.getCompanyName(symbol);
    const searchQuery = `${symbol} OR ${companyInfo}`;
    
    let allNews = [];
    
    if (language === 'both') {
      allNews = await googleNewsService.getMultiLanguageNews(searchQuery, 25);
    } else {
      const region = language === 'th' ? 'TH' : 'US';
      allNews = await googleNewsService.getNews(searchQuery, language, region);
    }
    
    // Filter ข่าวที่เกี่ยวข้องจริงๆ
    const filteredNews = symbolDetector.filterArticlesBySymbol(allNews, symbol);
    
    // จำกัดจำนวน
    const limitedNews = filteredNews.slice(0, parseInt(limit));
    
    // Format
    const formattedNews = limitedNews.map((item, index) => ({
      id: item.id || index,
      title: item.headline || item.title,
      source: item.source,
      timeAgo: getTimeAgo(item.datetime),
      category: item.category,
      url: item.url,
      image: item.image,
      summary: item.summary,
      datetime: item.datetime,
      symbol: symbol.toUpperCase(),
      symbols: [symbol.toUpperCase()],
      language: item.language
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
    
    const news = await googleNewsService.getMultiLanguageNews(null, 100);
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

// 🆕 GET /api/news/company/:symbol - ดึงข่าวของบริษัท
router.get('/company/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { limit = 20, language = 'both' } = req.query;
    
    console.log(`📊 Fetching company news for ${symbol}`);
    
    const companyInfo = symbolDetector.getCompanyName(symbol);
    const searchQuery = `${symbol} OR ${companyInfo}`;
    
    let news = [];
    
    if (language === 'both') {
      news = await googleNewsService.getMultiLanguageNews(searchQuery, parseInt(limit));
    } else {
      const region = language === 'th' ? 'TH' : 'US';
      news = await googleNewsService.getNews(searchQuery, language, region);
    }
    
    const formattedNews = news.slice(0, parseInt(limit)).map((item, index) => ({
      id: item.id || index,
      title: item.headline || item.title,
      source: item.source,
      timeAgo: getTimeAgo(item.datetime),
      category: item.category || 'Company News',
      url: item.url,
      image: item.image,
      summary: item.summary,
      datetime: item.datetime,
      symbol: symbol.toUpperCase(),
      symbols: [symbol.toUpperCase()],
      language: item.language
    }));
    
    console.log(`✅ ${symbol}: ${formattedNews.length} news`);
    
    res.json({
      success: true,
      symbol: symbol.toUpperCase(),
      count: formattedNews.length,
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

export default router;