import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

class FinnhubService {
  constructor() {
    this.apiKey = process.env.FINNHUB_API_KEY;
    this.baseURL = 'https://finnhub.io/api/v1';
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      params: {
        token: this.apiKey
      }
    });
  }

  async getMarketNews(category = 'general', minId = 0) {
    try {
      const response = await this.client.get('/news', {
        params: { category, minId }
      });
      return response.data;
    } catch (error) {
      console.error('❌ Finnhub API Error:', error.message);
      throw error;
    }
  }

  async getCompanyNews(symbol, from, to) {
    try {
      const response = await this.client.get('/company-news', {
        params: { symbol, from, to }
      });
      return response.data;
    } catch (error) {
      console.error('❌ Finnhub API Error:', error.message);
      throw error;
    }
  }

  async getStockQuote(symbol) {
    try {
      const response = await this.client.get('/quote', {
        params: { symbol }
      });
      return response.data;
    } catch (error) {
      console.error('❌ Finnhub API Error:', error.message);
      throw error;
    }
  }

  async searchSymbol(query) {
    try {
      const response = await this.client.get('/search', {
        params: { q: query }
      });
      return response.data;
    } catch (error) {
      console.error('❌ Finnhub API Error:', error.message);
      throw error;
    }
  }

  getDateRange(days = 7) {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days);

    return {
      from: from.toISOString().split('T')[0],
      to: to.toISOString().split('T')[0]
    };
  }
}

export default new FinnhubService();