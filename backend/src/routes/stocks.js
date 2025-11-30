import express from 'express';

const router = express.Router();

// GET /api/stocks/quote/:symbol - ดึงราคาหุ้น
router.get('/quote/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    
    console.log(`💰 Fetching quote for ${symbol}`);
    
    const quote = await yahooFinanceService.getStockQuote(symbol);
    
    res.json({
      success: true,
      symbol: symbol.toUpperCase(),
      data: {
        current: quote.current,
        open: quote.open,
        high: quote.high,
        low: quote.low,
        previousClose: quote.previousClose,
        change: quote.change,
        changePercent: quote.changePercent,
        volume: quote.volume,
        marketCap: quote.marketCap,
        fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh,
        fiftyTwoWeekLow: quote.fiftyTwoWeekLow,
        timestamp: quote.timestamp
      }
    });
    
  } catch (error) {
    console.error(' Error fetching quote:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stock quote',
      error: error.message
    });
  }
});

// GET /api/stocks/batch - ดึงราคาหลายหุ้นพร้อมกัน
router.get('/batch', async (req, res) => {
  try {
    const { symbols } = req.query;
    
    if (!symbols) {
      return res.status(400).json({
        success: false,
        message: 'Symbols parameter is required'
      });
    }
    
    const symbolList = symbols.split(',').map(s => s.trim());
    
    console.log(` Fetching batch quotes for: ${symbolList.join(', ')}`);
    
    const quotes = await yahooFinanceService.getBatchQuotes(symbolList);
    
    res.json({
      success: true,
      count: quotes.length,
      data: quotes
    });
    
  } catch (error) {
    console.error(' Error fetching batch quotes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch batch quotes',
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
    
    console.log(` Searching stocks: ${query}`);
    
    const searchResults = await yahooFinanceService.searchSymbol(query);
    
    res.json({
      success: true,
      count: searchResults.count || 0,
      results: searchResults.result || []
    });
    
  } catch (error) {
    console.error(' Error searching stocks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search stocks',
      error: error.message
    });
  }
});

// GET /api/stocks/profile/:symbol - ดึงข้อมูลบริษัท
router.get('/profile/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    
    console.log(` Fetching profile for ${symbol}`);
    
    const profile = await yahooFinanceService.getCompanyProfile(symbol);
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Company profile not found'
      });
    }
    
    res.json({
      success: true,
      symbol: symbol.toUpperCase(),
      data: profile
    });
    
  } catch (error) {
    console.error(' Error fetching profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch company profile',
      error: error.message
    });
  }
});

// GET /api/stocks/history/:symbol - ดึงข้อมูล Historical
router.get('/history/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { range = '1mo', interval = '1d' } = req.query;
    
    console.log(` Fetching historical data for ${symbol} (${range}, ${interval})`);
    
    const history = await yahooFinanceService.getHistoricalData(symbol, range, interval);
    
    res.json({
      success: true,
      symbol: symbol.toUpperCase(),
      range,
      interval,
      count: history.length,
      data: history
    });
    
  } catch (error) {
    console.error(' Error fetching historical data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch historical data',
      error: error.message
    });
  }
});

// GET /api/stocks/trending - ดึงหุ้นยอดนิยม
router.get('/trending', async (req, res) => {
  try {
    console.log(' Fetching trending stocks');
    
    const trending = await yahooFinanceService.getTrendingStocks();
    
    res.json({
      success: true,
      count: trending.length,
      data: trending
    });
    
  } catch (error) {
    console.error(' Error fetching trending stocks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trending stocks',
      error: error.message
    });
  }
});

// GET /api/stocks/indices - ดึงดัชนีตลาด
router.get('/indices', async (req, res) => {
  try {
    console.log(' Fetching market indices');
    
    const indices = await yahooFinanceService.getMarketIndices();
    
    res.json({
      success: true,
      count: indices.length,
      data: indices
    });
    
  } catch (error) {
    console.error(' Error fetching market indices:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch market indices',
      error: error.message
    });
  }
});

export default router;