// Frontend/src/services/apiService.js
import axios from "axios";

class ApiService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || "http://localhost:5001/api";
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000;
    this.translationCache = new Map(); // Cache สำหรับ translation
    this.requestQueue = new Map();
    this.retryCount = 3;
    this.retryDelay = 1000;

    axios.defaults.baseURL = this.baseURL;
    axios.defaults.timeout = 30000; // เพิ่ม timeout เป็น 30 วินาที สำหรับ translation

    this.setupInterceptors();
  }

  setupInterceptors() {
    axios.interceptors.request.use(
      (config) => {
        config.metadata = { startTime: new Date() };
        return config;
      },
      (error) => Promise.reject(error)
    );

    axios.interceptors.response.use(
      (response) => {
        if (import.meta.env.DEV) {
          const duration = new Date() - response.config.metadata.startTime;
          console.log(`[API] ${response.config.method.toUpperCase()} ${response.config.url} - ${duration}ms`);
        }
        return response;
      },
      (error) => this.handleError(error)
    );
  }

  async handleError(error) {
    if (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK') {
      const config = error.config;
      if (!config.retry) config.retry = 0;
      if (config.retry < this.retryCount) {
        config.retry++;
        await this.sleep(this.retryDelay * Math.pow(2, config.retry - 1));
        return axios(config);
      }
    }

    if (error.response) {
      const { status, data } = error.response;
      return Promise.reject({
        message: data.message || 'An error occurred',
        code: status,
        status
      });
    }
    
    return Promise.reject({
      message: error.message || 'Network error',
      code: 'NETWORK_ERROR'
    });
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // =============================================
  // 📰 News API
  // =============================================
  
  async fetchNews(params = {}) {
    const { page = 1, limit = 20, category = "stocks", language = "en" } = params;
    const cacheKey = `news-${category}-${limit}-${language}`;

    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      console.log('✅ Cache hit:', cacheKey);
      return cached.data;
    }

    try {
      const response = await axios.get('/news', {
        params: { page, limit, category, language }
      });
      
      // Cache result
      this.cache.set(cacheKey, {
        data: response.data,
        timestamp: Date.now()
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // =============================================
  // 🌐 Translation API
  // =============================================

  /**
   * แปลข่าวหลายตัว
   */
  async translateNews(articles, targetLang) {
    // Check cache for each article
    const cachedArticles = [];
    const uncachedArticles = [];

    articles.forEach(article => {
      const cacheKey = `translate-${article.id}-${targetLang}`;
      const cached = this.translationCache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        cachedArticles.push(cached.data);
      } else {
        uncachedArticles.push(article);
      }
    });

    console.log(`🌐 Translation: ${cachedArticles.length} cached, ${uncachedArticles.length} to translate`);

    // ถ้าทุกตัวอยู่ใน cache แล้ว
    if (uncachedArticles.length === 0) {
      return cachedArticles;
    }

    try {
      const response = await axios.post('/news/translate', {
        articles: uncachedArticles,
        targetLang
      });

      if (response.data.success) {
        // Cache translated articles
        response.data.data.forEach(article => {
          const cacheKey = `translate-${article.id}-${targetLang}`;
          this.translationCache.set(cacheKey, {
            data: article,
            timestamp: Date.now()
          });
        });

        // รวม cached + newly translated
        return [...cachedArticles, ...response.data.data];
      }

      throw new Error(response.data.message);
    } catch (error) {
      console.error('❌ Translation failed:', error);
      // Return original articles if translation fails
      return articles;
    }
  }

  /**
   * แปลข่าวตัวเดียว
   */
  async translateSingleArticle(article, targetLang) {
    const cacheKey = `translate-${article.id}-${targetLang}`;
    const cached = this.translationCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const response = await axios.post('/news/translate/single', {
        article,
        targetLang
      });

      if (response.data.success) {
        this.translationCache.set(cacheKey, {
          data: response.data.data,
          timestamp: Date.now()
        });
        return response.data.data;
      }

      throw new Error(response.data.message);
    } catch (error) {
      console.error('❌ Translation failed:', error);
      return article;
    }
  }

  // =============================================
  // 🤖 AI Analysis API
  // =============================================

  /**
   * วิเคราะห์ข่าวด้วย AI
   */
  async analyzeNews(article, language = 'th') {
    const cacheKey = `analyze-${article.id}-${language}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < 60 * 60 * 1000) { // 1 hour cache
      console.log('✅ AI Analysis cache hit');
      return cached.data;
    }

    try {
      const response = await axios.post('/news/analyze', {
        article,
        language
      });

      if (response.data.success) {
        this.cache.set(cacheKey, {
          data: response.data.analysis,
          timestamp: Date.now()
        });
        return response.data.analysis;
      }

      throw new Error(response.data.message);
    } catch (error) {
      console.error('❌ AI Analysis failed:', error);
      throw error;
    }
  }

  /**
   * ตรวจสอบสถานะ AI
   */
  async getAIStatus() {
    try {
      const response = await axios.get('/news/ai/status');
      return response.data;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // =============================================
  // 📊 Other APIs
  // =============================================

  async fetchTrendingSymbols(limit = 8) {
    try {
      const response = await axios.get('/news/symbols/trending', {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async fetchNewsBySymbol(symbol, limit = 10, language = 'en') {
    try {
      const response = await axios.get(`/news/by-symbol/${symbol}`, {
        params: { limit, language }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // =============================================
  // 🗑️ Cache Management
  // =============================================

  clearCache() {
    this.cache.clear();
    this.translationCache.clear();
    console.log('🗑️ All caches cleared');
  }

  clearTranslationCache() {
    this.translationCache.clear();
    console.log('🗑️ Translation cache cleared');
  }
}

export default new ApiService();