// backend/src/routes/news.js
import express from 'express';
import finnhubService from '../services/finnhubService.js'; 
import symbolDetector from '../services/symbolDetector.js';
import translationService from '../services/translationService.js'; // Google Translate API
import geminiService from '../services/geminiService.js'; // Gemini AI Analysis
import { newsValidation, validate } from '../middleware/validation.js';

const router = express.Router();

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const POPULAR_STOCKS = ['AAPL', 'TSLA', 'NVDA', 'MSFT', 'GOOGL'];

// =============================================
// 📰 GET /api/news - ดึงข่าวทั้งหมด
// =============================================
router.get('/', newsValidation, validate, async (req, res) => {
  try {
    const { 
      category = 'general', 
      limit = 50, 
      detectSymbols: shouldDetect = 'true',
      language = 'en'
    } = req.query;
    
    console.log(`📰 Fetching news - category: ${category}, limit: ${limit}, language: ${language}`);
    
    let news = [];
    
    if (category === 'general' || category === 'stocks') {
      for (const symbol of POPULAR_STOCKS) {
        try {
          const symbolNews = await finnhubService.getCompanyNews(symbol);
          news.push(...symbolNews);
          await delay(200);
        } catch (err) {
          console.warn(`  ⚠️ ${symbol}: ${err.message}`);
        }
      }
      news.sort((a, b) => b.datetime - a.datetime);
    } else {
      news = await finnhubService.getNewsByCategory(category, 'en', 'US');
    }
    
    const limitedNews = news.slice(0, parseInt(limit));
    
    let formattedNews = limitedNews.map((item, index) => ({
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
      language: 'en',
      symbols: item.symbols || []
    }));
    
    if (shouldDetect === 'true') {
      formattedNews = symbolDetector.detectSymbolsForArticles(formattedNews);
    }

    // ✅ แปลด้วย Google Translate API
    if (language === 'th') {
      formattedNews = await translationService.translateNews(formattedNews, 'th');
    }
    
    res.json({
      success: true,
      count: formattedNews.length,
      language: language,
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

// =============================================
// 🌐 POST /api/news/translate - แปลข่าว
// =============================================
router.post('/translate', async (req, res) => {
  try {
    const { articles, targetLang } = req.body;
    
    if (!articles || !Array.isArray(articles)) {
      return res.status(400).json({
        success: false,
        message: 'Articles array is required'
      });
    }

    if (!targetLang || !['th', 'en'].includes(targetLang)) {
      return res.status(400).json({
        success: false,
        message: 'targetLang must be "th" or "en"'
      });
    }

    console.log(`🌐 Translating ${articles.length} articles to ${targetLang}`);
    
    // ✅ ใช้ Google Translate API
    const translatedArticles = await translationService.translateNews(articles, targetLang);
    
    res.json({
      success: true,
      count: translatedArticles.length,
      targetLang,
      data: translatedArticles
    });
    
  } catch (error) {
    console.error('❌ Translation error:', error);
    res.status(500).json({
      success: false,
      message: 'Translation failed',
      error: error.message
    });
  }
});

// =============================================
// 🌐 POST /api/news/translate/single - แปลข่าวตัวเดียว
// =============================================
router.post('/translate/single', async (req, res) => {
  try {
    const { article, targetLang } = req.body;
    
    if (!article) {
      return res.status(400).json({
        success: false,
        message: 'Article is required'
      });
    }

    const translatedArticle = await translationService.translateSingleArticle(article, targetLang);
    
    res.json({
      success: true,
      data: translatedArticle
    });
    
  } catch (error) {
    console.error('❌ Translation error:', error);
    res.status(500).json({
      success: false,
      message: 'Translation failed',
      error: error.message
    });
  }
});

// =============================================
// 🤖 POST /api/news/analyze - วิเคราะห์ข่าวด้วย AI
// =============================================
router.post('/analyze', async (req, res) => {
  try {
    const { article, language = 'th' } = req.body;
    
    if (!article) {
      return res.status(400).json({
        success: false,
        message: 'Article is required'
      });
    }

    console.log(`🤖 Analyzing article: "${article.title?.substring(0, 50)}..."`);
    
    const analysis = await geminiService.analyzeNews(article, language);
    
    res.json({
      success: true,
      articleId: article.id,
      analysis
    });
    
  } catch (error) {
    console.error('❌ Analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Analysis failed',
      error: error.message
    });
  }
});

// =============================================
// 🤖 GET /api/news/ai/status - ตรวจสอบสถานะ AI
// =============================================
router.get('/ai/status', async (req, res) => {
  try {
    const geminiStatus = await geminiService.checkStatus();
    const translationStatus = await translationService.checkStatus();
    const translationStats = translationService.getCacheStats();
    
    res.json({
      success: true,
      gemini: geminiStatus,
      translation: {
        status: translationStatus,
        cache: translationStats
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// =============================================
// 📊 GET /api/news/symbols/trending - หุ้นยอดนิยม
// =============================================
router.get('/symbols/trending', async (req, res) => {
  try {
    const { limit = 8 } = req.query;
    
    let allNews = [];
    for (const symbol of POPULAR_STOCKS) {
      try {
        const news = await finnhubService.getCompanyNews(symbol);
        allNews.push(...news);
        await delay(200);
      } catch (err) {
        console.warn(`⚠️ ${symbol}:`, err.message);
      }
    }
    
    const trending = symbolDetector.getTrendingSymbols(allNews, parseInt(limit));
    
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

// =============================================
// 📰 GET /api/news/by-symbol/:symbol
// =============================================
router.get('/by-symbol/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { limit = 10, language = 'en' } = req.query;
    
    let allNews = await finnhubService.getCompanyNews(symbol.toUpperCase());
    const limitedNews = allNews.slice(0, parseInt(limit));
    
    let formattedNews = limitedNews.map((item, index) => ({
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
      language: 'en'
    }));

    // แปลถ้าต้องการภาษาไทย
    if (language === 'th') {
      formattedNews = await translationService.translateNews(formattedNews, 'th');
    }
    
    res.json({
      success: true,
      symbol: symbol.toUpperCase(),
      count: formattedNews.length,
      language,
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

// =============================================
// 📰 GET /api/news/company/:symbol
// =============================================
router.get('/company/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { limit = 10, language = 'en' } = req.query;
    
    let news = await finnhubService.getCompanyNews(symbol.toUpperCase());
    
    let formattedNews = news.slice(0, parseInt(limit)).map((item, index) => ({
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
      language: 'en'
    }));

    if (language === 'th') {
      formattedNews = await translationService.translateNews(formattedNews, 'th');
    }
    
    res.json({
      success: true,
      symbol: symbol.toUpperCase(),
      count: formattedNews.length,
      language,
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

// =============================================
// Helper function
// =============================================
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