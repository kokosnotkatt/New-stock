import axios from 'axios';

class YahooFinanceService {
  constructor() {
    this.baseURL = 'https://query1.finance.yahoo.com/v8/finance';
    this.chartURL = 'https://query1.finance.yahoo.com/v7/finance';
  }

  /**
   * ดึงข้อมูลราคาหุ้น
   */
  async getStockQuote(symbol) {
    try {
      const url = `${this.baseURL}/quote`;
      const response = await axios.get(url, {
        params: {
          symbols: symbol.toUpperCase()
        },
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0'
        }
      });

      const result = response.data.quoteResponse.result[0];
      
      if (!result) {
        throw new Error(`Symbol ${symbol} not found`);
      }

      return {
        symbol: result.symbol,
        name: result.longName || result.shortName,
        current: result.regularMarketPrice,
        previousClose: result.regularMarketPreviousClose,
        open: result.regularMarketOpen,
        high: result.regularMarketDayHigh,
        low: result.regularMarketDayLow,
        volume: result.regularMarketVolume,
        change: result.regularMarketChange,
        changePercent: result.regularMarketChangePercent,
        marketCap: result.marketCap,
        fiftyTwoWeekHigh: result.fiftyTwoWeekHigh,
        fiftyTwoWeekLow: result.fiftyTwoWeekLow,
        timestamp: result.regularMarketTime
      };
      
    } catch (error) {
      console.error(`❌ Yahoo Finance Quote Error for ${symbol}:`, error.message);
      throw error;
    }
  }

  /**
   * ดึงข้อมูลหลายหุ้นพร้อมกัน
   */
  async getBatchQuotes(symbols) {
    try {
      if (!symbols || symbols.length === 0) {
        return [];
      }

      const symbolsStr = symbols.map(s => s.toUpperCase()).join(',');
      const url = `${this.baseURL}/quote`;
      
      const response = await axios.get(url, {
        params: {
          symbols: symbolsStr
        },
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0'
        }
      });

      const results = response.data.quoteResponse.result || [];
      
      return results.map(result => ({
        symbol: result.symbol,
        name: result.longName || result.shortName,
        current: result.regularMarketPrice,
        previousClose: result.regularMarketPreviousClose,
        change: result.regularMarketChange,
        changePercent: result.regularMarketChangePercent,
        volume: result.regularMarketVolume,
        marketCap: result.marketCap
      }));
      
    } catch (error) {
      console.error('❌ Yahoo Finance Batch Quotes Error:', error.message);
      return [];
    }
  }

  /**
   * ค้นหาหุ้น
   */
  async searchSymbol(query) {
    try {
      const url = `${this.baseURL}/search`;
      
      const response = await axios.get(url, {
        params: {
          q: query,
          quotesCount: 10,
          newsCount: 0
        },
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0'
        }
      });

      const quotes = response.data.quotes || [];
      
      return {
        count: quotes.length,
        result: quotes.map(quote => ({
          symbol: quote.symbol,
          name: quote.longname || quote.shortname,
          exchange: quote.exchange,
          type: quote.quoteType
        }))
      };
      
    } catch (error) {
      console.error('❌ Yahoo Finance Search Error:', error.message);
      return { count: 0, result: [] };
    }
  }

  /**
   * ดึงข้อมูลบริษัท
   */
  async getCompanyProfile(symbol) {
    try {
      const url = `${this.baseURL}/quoteSummary/${symbol.toUpperCase()}`;
      
      const response = await axios.get(url, {
        params: {
          modules: 'assetProfile,summaryDetail'
        },
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0'
        }
      });

      const result = response.data.quoteSummary.result[0];
      const profile = result.assetProfile || {};
      const summary = result.summaryDetail || {};

      return {
        symbol: symbol.toUpperCase(),
        name: profile.longBusinessSummary,
        industry: profile.industry,
        sector: profile.sector,
        website: profile.website,
        description: profile.longBusinessSummary,
        employees: profile.fullTimeEmployees,
        marketCap: summary.marketCap?.raw,
        peRatio: summary.trailingPE?.raw,
        dividendYield: summary.dividendYield?.raw
      };
      
    } catch (error) {
      console.error(`❌ Yahoo Finance Profile Error for ${symbol}:`, error.message);
      return null;
    }
  }

  /**
   * ดึงข้อมูล Historical Data
   */
  async getHistoricalData(symbol, range = '1mo', interval = '1d') {
    try {
      const url = `${this.chartURL}/download/${symbol.toUpperCase()}`;
      
      // Calculate date range
      const period2 = Math.floor(Date.now() / 1000);
      let period1;
      
      switch(range) {
        case '1d': period1 = period2 - (24 * 60 * 60); break;
        case '5d': period1 = period2 - (5 * 24 * 60 * 60); break;
        case '1mo': period1 = period2 - (30 * 24 * 60 * 60); break;
        case '3mo': period1 = period2 - (90 * 24 * 60 * 60); break;
        case '6mo': period1 = period2 - (180 * 24 * 60 * 60); break;
        case '1y': period1 = period2 - (365 * 24 * 60 * 60); break;
        default: period1 = period2 - (30 * 24 * 60 * 60);
      }

      const response = await axios.get(url, {
        params: {
          period1,
          period2,
          interval,
          events: 'history'
        },
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0'
        }
      });

      // Parse CSV response
      const lines = response.data.split('\n');
      const headers = lines[0].split(',');
      const data = [];

      for (let i = 1; i < lines.length; i++) {
        if (!lines[i]) continue;
        
        const values = lines[i].split(',');
        const point = {};
        
        headers.forEach((header, index) => {
          point[header.trim()] = values[index];
        });
        
        data.push({
          date: point.Date,
          open: parseFloat(point.Open),
          high: parseFloat(point.High),
          low: parseFloat(point.Low),
          close: parseFloat(point.Close),
          volume: parseInt(point.Volume)
        });
      }

      return data;
      
    } catch (error) {
      console.error(`❌ Yahoo Finance Historical Data Error for ${symbol}:`, error.message);
      return [];
    }
  }

  /**
   * ดึงรายการหุ้นยอดนิยม
   */
  async getTrendingStocks() {
    try {
      const url = 'https://query1.finance.yahoo.com/v1/finance/trending/US';
      
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0'
        }
      });

      const quotes = response.data.finance.result[0].quotes || [];
      
      return quotes.map(quote => ({
        symbol: quote.symbol,
        name: quote.longName || quote.shortName,
        price: quote.regularMarketPrice,
        change: quote.regularMarketChange,
        changePercent: quote.regularMarketChangePercent
      }));
      
    } catch (error) {
      console.error('❌ Yahoo Finance Trending Error:', error.message);
      return [];
    }
  }

  /**
   * ดึงข้อมูลดัชนีตลาด
   */
  async getMarketIndices() {
    try {
      const indices = ['^GSPC', '^DJI', '^IXIC']; // S&P 500, Dow Jones, NASDAQ
      const quotes = await this.getBatchQuotes(indices);
      
      return quotes;
      
    } catch (error) {
      console.error('❌ Yahoo Finance Market Indices Error:', error.message);
      return [];
    }
  }
}

export default new YahooFinanceService();