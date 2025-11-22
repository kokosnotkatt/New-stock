import axios from 'axios';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv'; 

dotenv.config();

class FinnhubService {
  constructor() {
    this.apiKey = process.env.FINNHUB_API_KEY;
    this.baseURL = 'https://finnhub.io/api/v1';
    this.cache = new Map();
    this.cacheTimeout = 30 * 60 * 1000; // 30 minutes (เพิ่มเป็น 30 นาที)
    
    // ✅ Rate limiting - Enhanced
    this.requestQueue = [];
    this.isProcessingQueue = false;
    this.requestsThisMinute = 0;
    this.lastRequestTime = 0;
    this.minuteResetTime = Date.now();
    
    // Free tier: 60 calls/minute
    this.maxRequestsPerMinute = 50; // เหลือ buffer 10 calls
    this.minRequestInterval = 1200; // 1.2 วินาที (50 calls/min = safe)
    
    this.validateApiKey();
  }

  validateApiKey() {
    if (!this.apiKey || this.apiKey === 'your_finnhub_api_key_here') {
      console.error('\n❌ FINNHUB API KEY NOT CONFIGURED!');
      console.error('📝 Get your key: https://finnhub.io/register\n');
      return false;
    }
    console.log(`✅ Finnhub API Key: ${this.apiKey.substring(0, 10)}...`);
    return true;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * ⭐ Request Queue System
   */
  async queueRequest(requestFn) {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({ requestFn, resolve, reject });
      this.processQueue();
    });
  }

  async processQueue() {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.requestQueue.length > 0) {
      const now = Date.now();

      // Reset counter every minute
      if (now - this.minuteResetTime > 60000) {
        console.log(`🔄 Rate limit reset. Used ${this.requestsThisMinute}/60 calls last minute`);
        this.requestsThisMinute = 0;
        this.minuteResetTime = now;
      }

      // Check if we're at the limit
      if (this.requestsThisMinute >= this.maxRequestsPerMinute) {
        const waitTime = 60000 - (now - this.minuteResetTime);
        console.warn(`⚠️  Rate limit reached (${this.requestsThisMinute}/${this.maxRequestsPerMinute}). Waiting ${Math.ceil(waitTime/1000)}s...`);
        await this.sleep(waitTime);
        this.requestsThisMinute = 0;
        this.minuteResetTime = Date.now();
      }

      // Wait between requests
      const timeSinceLastRequest = now - this.lastRequestTime;
      if (timeSinceLastRequest < this.minRequestInterval) {
        await this.sleep(this.minRequestInterval - timeSinceLastRequest);
      }

      // Process next request
      const { requestFn, resolve, reject } = this.requestQueue.shift();

      try {
        const result = await requestFn();
        this.lastRequestTime = Date.now();
        this.requestsThisMinute++;
        resolve(result);
      } catch (error) {
        reject(error);
      }
    }

    this.isProcessingQueue = false;
  }

  /**
   * ⭐ Enhanced scrapeImage with error handling
   */
  async scrapeImage(url, title) {
    try {
      const response = await axios.get(url, {
        timeout: 5000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      
      let image = 
        $('meta[property="og:image"]').attr('content') ||
        $('meta[property="og:image:url"]').attr('content') ||
        $('meta[name="twitter:image"]').attr('content') ||
        null;
      
      if (image && !image.startsWith('http')) {
        try {
          const baseUrl = new URL(url);
          image = new URL(image, baseUrl.origin).href;
        } catch (e) {
          image = null;
        }
      }
      
      return image;
      
    } catch (error) {
      return null;
    }
  }

  /**
   * ⭐ Get Market News
   */
  async getMarketNews(category = 'general', limit = 20) {
    try {
      const cacheKey = `market-${category}-${limit}`;
      
      // Check cache first
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheTimeout) {
          console.log(`✅ Cache hit: market-${category} (${cached.data.length} articles)`);
          return cached.data;
        }
      }

      console.log(`📰 Fetching Market News from Finnhub (${category})...`);

      // Use queue system
      const response = await this.queueRequest(async () => {
        return axios.get(`${this.baseURL}/news`, {
          params: {
            category: category,
            token: this.apiKey
          },
          timeout: 10000
        });
      });

      if (!response.data || response.data.length === 0) {
        console.warn(`⚠️  No ${category} news from Finnhub`);
        return [];
      }

      const articles = response.data.slice(0, limit).map((item, index) => ({
        id: this.generateId(item.headline, item.datetime),
        headline: item.headline,
        title: item.headline,
        summary: item.summary || item.headline,
        source: item.source || 'Finnhub',
        url: item.url,
        image: item.image,
        datetime: item.datetime,
        pubDate: new Date(item.datetime * 1000).toISOString(),
        category: this.categorizeNews(item.headline, item.summary || ''),
        language: 'en',
        enriched: !!item.image,
        symbols: item.related ? [item.related] : []
      }));

      console.log(`✅ Fetched ${articles.length} ${category} articles`);

      // Cache result
      this.cache.set(cacheKey, {
        data: articles,
        timestamp: Date.now()
      });

      return articles;

    } catch (error) {
      console.error(`❌ Finnhub Market News Error:`, error.message);
      
      if (error.response?.status === 401) {
        console.error('🔑 Invalid API Key!');
      } else if (error.response?.status === 429) {
        console.error('⚠️  Rate limit! (Should not happen with queue system)');
      }
      
      return [];
    }
  }

  /**
   * ⭐ Get Company News
   */
  async getCompanyNews(symbol, fromDate = null, toDate = null) {
    try {
      const cacheKey = `company-${symbol}-${fromDate}-${toDate}`;
      
      // Check cache
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheTimeout) {
          console.log(`✅ Cache hit: ${symbol} (${cached.data.length} articles)`);
          return cached.data;
        }
      }

      console.log(`📰 API call: Company News for ${symbol}`);

      // Default dates (last 7 days)
      if (!fromDate) {
        const from = new Date();
        from.setDate(from.getDate() - 7);
        fromDate = from.toISOString().split('T')[0];
      }
      
      if (!toDate) {
        toDate = new Date().toISOString().split('T')[0];
      }

      // Use queue system
      const response = await this.queueRequest(async () => {
        return axios.get(`${this.baseURL}/company-news`, {
          params: {
            symbol: symbol.toUpperCase(),
            from: fromDate,
            to: toDate,
            token: this.apiKey
          },
          timeout: 10000
        });
      });

      if (!response.data || response.data.length === 0) {
        console.warn(`⚠️  No news for ${symbol}`);
        return [];
      }

      const articles = response.data.slice(0, 20).map((item) => ({
        id: this.generateId(item.headline, item.datetime),
        headline: item.headline,
        title: item.headline,
        summary: item.summary || item.headline,
        source: item.source || 'Finnhub',
        url: item.url,
        image: item.image,
        datetime: item.datetime,
        pubDate: new Date(item.datetime * 1000).toISOString(),
        category: this.categorizeNews(item.headline, item.summary || ''),
        language: 'en',
        enriched: !!item.image,
        symbol: symbol.toUpperCase(),
        symbols: [symbol.toUpperCase()]
      }));

      console.log(`✅ ${symbol}: ${articles.length} articles`);

      // Cache result
      this.cache.set(cacheKey, {
        data: articles,
        timestamp: Date.now()
      });

      return articles;

    } catch (error) {
      console.error(`❌ ${symbol}:`, error.response?.status || error.message);
      return [];
    }
  }

  async getNews(query = null, language = 'en', region = 'US') {
    if (query && /^[A-Z]{1,5}$/.test(query)) {
      return this.getCompanyNews(query);
    }
    return this.getMarketNews('general', 20);
  }

  async getMultiLanguageNews(query = null, limit = 25) {
    console.log('📰 Fetching news from Finnhub...');
    const articles = await this.getMarketNews('general', limit);
    console.log(`✅ Total: ${articles.length} articles`);
    return articles;
  }

  async getNewsByCategory(category, language = 'en', region = 'US') {
    const categoryMap = {
      'general': 'general',
      'stocks': 'general',
      'business': 'general',
      'technology': 'tech',
      'crypto': 'crypto',
      'forex': 'forex',
      'merger': 'merger'
    };

    const finnhubCategory = categoryMap[category] || 'general';
    return this.getMarketNews(finnhubCategory, 20);
  }

  async searchCompanyNews(companyName, language = 'en', region = 'US') {
    return this.getCompanyNews(companyName);
  }

  generateId(title, timestamp) {
    const str = `${title}-${timestamp}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  categorizeNews(title, description) {
    const text = `${title} ${description}`.toLowerCase();

    const categories = [
      { name: 'AI Technology', keywords: ['ai', 'artificial intelligence', 'machine learning'] },
      { name: 'Cryptocurrency', keywords: ['crypto', 'bitcoin', 'ethereum', 'blockchain'] },
      { name: 'Stock Analysis', keywords: ['stock', 'nasdaq', 'nyse', 's&p 500'] },
      { name: 'Market Trends', keywords: ['market', 'trading', 'investor'] },
      { name: 'Tech Stocks', keywords: ['tech stock', 'technology company'] },
      { name: 'Company News', keywords: ['earnings', 'revenue', 'profit', 'ceo'] },
      { name: 'Economic News', keywords: ['fed', 'interest rate', 'inflation'] },
    ];

    for (const category of categories) {
      if (category.keywords.some(keyword => text.includes(keyword))) {
        return category.name;
      }
    }

    return 'Market News';
  }
}

export default new FinnhubService();