import express from 'express';
import finnhubService from '../services/finnhubService.js';

const router = express.Router();

// GET /api/news - ดึงข่าวล่าสุด
router.get('/', async (req, res) => {
  try {
    const { category = 'general', limit = 50 } = req.query;
    
    console.log(`📰 Fetching news - category: ${category}, limit: ${limit}`);
    
    const news = await finnhubService.getMarketNews(category);
    
    // จำกัดจำนวนข่าว
    const limitedNews = news.slice(0, parseInt(limit));
    
    // แปลงข้อมูลให้ตรงกับ format ของ Frontend
    const formattedNews = limitedNews.map((item, index) => ({
      id: item.id || index,
      title: item.headline,
      source: item.source,
      timeAgo: getTimeAgo(item.datetime),
      category: getCategoryName(item.category),
      url: item.url,
      image: item.image,
      summary: item.summary,
      datetime: item.datetime
    }));
    
    res.json({
      success: true,
      count: formattedNews.length,
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

// GET /api/news/company/:symbol - ดึงข่าวของบริษัท
router.get('/company/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { days = 30 } = req.query;
    
    const dateRange = finnhubService.getDateRange(parseInt(days));
    
    console.log(`📰 Fetching ${symbol} news from ${dateRange.from} to ${dateRange.to}`);
    
    const news = await finnhubService.getCompanyNews(symbol, dateRange.from, dateRange.to);
    
    // แปลงข้อมูลให้ตรงกับ format ของ Frontend
    const formattedNews = news.map((item, index) => ({
      id: item.id || index,
      title: item.headline,
      source: item.source,
      timeAgo: getTimeAgo(item.datetime),
      category: 'Company News',
      url: item.url,
      image: item.image,
      summary: item.summary,
      datetime: item.datetime,
      symbol: symbol.toUpperCase()
    }));
    
    res.json({
      success: true,
      symbol: symbol.toUpperCase(),
      count: formattedNews.length,
      dateRange,
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