import express from 'express';
import finnhubService from '../services/finnhubService.js';

const router = express.Router();

// GET /api/news - ดึงข่าวล่าสุด
router.get('/', async (req, res) => {
  try {
    const { category = 'general', limit = 10 } = req.query;
    
    console.log(`📰 กำลังดึงข่าว category: ${category}`);
    
    const news = await finnhubService.getMarketNews(category);
    
    // จำกัดจำนวนข่าว
    const limitedNews = news.slice(0, parseInt(limit));
    
    res.json({
      success: true,
      count: limitedNews.length,
      data: limitedNews
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
    const { days = 7 } = req.query;
    
    // คำนวณวันที่
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - parseInt(days));
    
    const fromStr = from.toISOString().split('T')[0];
    const toStr = to.toISOString().split('T')[0];
    
    console.log(`📰 กำลังดึงข่าว ${symbol} จาก ${fromStr} ถึง ${toStr}`);
    
    const news = await finnhubService.getCompanyNews(symbol, fromStr, toStr);
    
    res.json({
      success: true,
      symbol: symbol.toUpperCase(),
      count: news.length,
      dateRange: { from: fromStr, to: toStr },
      data: news
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

export default router;