import express from 'express';
import finnhubService from '../services/finnhubService.js'; 
import symbolDetector from '../services/symbolDetector.js';
import { newsValidation, validate } from '../middleware/validation.js';

const router = express.Router();

// ✅ ฟังก์ชัน delay เพื่อหลีก rate limit
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Popular stocks for news
const POPULAR_STOCKS = ['AAPL', 'TSLA', 'NVDA', 'MSFT', 'GOOGL'];

router.get('/', newsValidation, validate, async (req, res) => {
  try {
    const { 
      category = 'general', 
      limit = 50, 
      detectSymbols: shouldDetect = 'true',
      language = 'both' 
    } = req.query;
    
    console.log(`📰 Fetching news - category: ${category}, limit: ${limit}`);
    
    let news = [];
    
    if (category === 'general' || category === 'stocks') {
      console.log(`📊 Fetching news from ${POPULAR_STOCKS.length} popular stocks...`);
      
      // ✅ ดึงทุกหุ้นพร้อม delay เพื่อหลีก rate limit
      for (const symbol of POPULAR_STOCKS) {
        try {
          const symbolNews = await finnhubService.getCompanyNews(symbol);
          news.push(...symbolNews);
          console.log(`  ✅ ${symbol}: ${symbolNews.length} articles`);
          
          // ✅ หน่วงเวลา 200ms ระหว่าง request
          await delay(200);
        } catch (err) {
          console.warn(`  ⚠️  ${symbol}: ${err.message}`);
        }
      }
      
      // Sort by date
      news.sort((a, b) => b.datetime - a.datetime);
      
      console.log(`✅ Total news from ${POPULAR_STOCKS.length} stocks: ${news.length} articles`);
      
    } else {
      news = await finnhubService.getNewsByCategory(category, 'en', 'US');
    }
    
    const limitedNews = news.slice(0, parseInt(limit));
    
    let validImageCount = 0;
    let noImageCount = 0;
    
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
        language: item.language || 'en',
        enriched: item.enriched,
        symbols: item.symbols || []
      };
    });
    
    if (shouldDetect === 'true') {
      console.log('🔍 Detecting symbols in news...');
      formattedNews = symbolDetector.detectSymbolsForArticles(formattedNews);
      
      const newsWithSymbols = formattedNews.filter(n => n.symbols && n.symbols.length > 0).length;
      console.log(`📊 Detected symbols in ${newsWithSymbols}/${formattedNews.length} articles`);
    }
    
    console.log(`✅ Formatted ${formattedNews.length} news`);
    
    res.json({
      success: true,
      count: formattedNews.length,
      stats: {
        withImages: validImageCount,
        withoutImages: noImageCount,
        enriched: formattedNews.filter(n => n.enriched).length,
        withSymbols: shouldDetect === 'true' 
          ? formattedNews.filter(n => n.symbols && n.symbols.length > 0).length 
          : undefined,
        languages: {
          th: 0, 
          en: formattedNews.length
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

router.get('/symbols/trending', async (req, res) => {
  try {
    const { limit = 8 } = req.query;
    
    console.log(`📊 Fetching trending symbols - limit: ${limit}`);
    
    // ✅ Sequential requests with delay
    let allNews = [];
    for (const symbol of POPULAR_STOCKS) {
      try {
        const news = await finnhubService.getCompanyNews(symbol);
        allNews.push(...news);
        await delay(200);
      } catch (err) {
        console.warn(`⚠️  ${symbol}:`, err.message);
      }
    }
    
    const trending = symbolDetector.getTrendingSymbols(allNews, parseInt(limit));
    
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

router.get('/by-symbol/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { limit = 10 } = req.query;
    
    console.log(`📰 Fetching news for symbol: ${symbol}`);
    
    let allNews = await finnhubService.getCompanyNews(symbol.toUpperCase());
    
    const limitedNews = allNews.slice(0, parseInt(limit));
    
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
      language: item.language || 'en',
      enriched: item.enriched
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

router.get('/summary/symbols', async (req, res) => {
  try {
    console.log('📊 Generating symbol summary from recent news');
    
    // Sequential requests with delay
    let allNews = [];
    for (const symbol of POPULAR_STOCKS) {
      try {
        const news = await finnhubService.getCompanyNews(symbol);
        allNews.push(...news);
        await delay(200);
      } catch (err) {
        console.warn(`⚠️  ${symbol}:`, err.message);
      }
    }
    
    const summary = symbolDetector.generateSymbolSummary(allNews);
    
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

router.get('/company/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { limit = 10 } = req.query;
    
    console.log(`📰 Fetching company news for ${symbol}`);
    
    let news = await finnhubService.getCompanyNews(symbol.toUpperCase());
    
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
      language: item.language || 'en',
      enriched: item.enriched
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