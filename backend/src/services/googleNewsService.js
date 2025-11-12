import axios from 'axios';
import xml2js from 'xml2js';

class GoogleNewsService {
  constructor() {
    this.baseURL = 'https://news.google.com/rss';
    this.parser = new xml2js.Parser();
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; 
  }

  /**
   * @param {string} query 
   * @param {string} language
   * @param {string} region 
   * @returns {Array}
   */
  async getNews(query = null, language = 'en', region = 'US') {
    try {
      const cacheKey = `${query}-${language}-${region}`;
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheTimeout) {
          console.log(` Using cached news for ${cacheKey}`);
          return cached.data;
        }
      }

      let url;
      
      const stockKeywords = language === 'th' 
        ? 'หุ้น OR ตลาดหุ้น OR หุ้นอเมริกา OR Wall Street OR NASDAQ OR S&P 500'
        : 'stocks OR stock market OR Wall Street OR NASDAQ OR S&P 500 OR trading OR shares';
      
      if (query) {
        url = `${this.baseURL}/search?q=${encodeURIComponent(query + ' ' + stockKeywords)}&hl=${language}&gl=${region}&ceid=${region}:${language}`;
      } else {
        url = `${this.baseURL}/search?q=${encodeURIComponent(stockKeywords)}&hl=${language}&gl=${region}&ceid=${region}:${language}`;
      }

      console.log(` Fetching Stock News: ${language.toUpperCase()}`);
      
      const response = await axios.get(url, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const result = await this.parser.parseStringPromise(response.data);
      
      if (!result.rss || !result.rss.channel || !result.rss.channel[0].item) {
        console.warn(' No news items found');
        return [];
      }

      const items = result.rss.channel[0].item;
      
      const articles = await Promise.all(items.map(async (item, index) => {
        const title = item.title?.[0] || 'Untitled';
        const link = item.link?.[0] || '';
        const pubDate = item.pubDate?.[0] || new Date().toISOString();
        const description = item.description?.[0] || '';
        const source = item.source?.[0]?._ || this.extractSource(title);
        
        let imageUrl = this.extractImageFromDescription(description);
        
        let cleanDescription = this.cleanDescription(description);
        
        const enrichedData = await this.enrichArticleData(link, title, cleanDescription, imageUrl);
        
        return {
          id: this.generateId(title, pubDate),
          headline: this.cleanTitle(title),
          title: this.cleanTitle(title),
          summary: enrichedData.summary || cleanDescription,
          source: source,
          url: link,
          image: enrichedData.image || imageUrl,
          datetime: new Date(pubDate).getTime() / 1000,
          pubDate: pubDate,
          category: this.categorizeNews(title, enrichedData.summary || cleanDescription),
          language: language,
          enriched: enrichedData.enriched
        };
      }));

      const stockNews = articles.filter(article => this.isStockRelated(article));

      console.log(` Fetched ${stockNews.length}/${articles.length} stock-related articles (${language})`);
      
      this.cache.set(cacheKey, {
        data: stockNews,
        timestamp: Date.now()
      });
      
      return stockNews;
      
    } catch (error) {
      console.error(' Google News Error:', error.message);
      throw new Error(`Failed to fetch Google News: ${error.message}`);
    }
  }

  /**
   */
  isStockRelated(article) {
    const text = `${article.title} ${article.summary}`.toLowerCase();
    
    const stockKeywords = [
      'stock', 'stocks', 'share', 'shares', 'trading', 'trader',
      'nasdaq', 'nyse', 'dow jones', 's&p 500', 'wall street',
      'market', 'equity', 'investor', 'investment',
      'earnings', 'revenue', 'profit', 'quarterly',
      'bullish', 'bearish', 'rally', 'sell-off',
      'ipo', 'dividend', 'portfolio', 'broker'
    ];
    
    const stockKeywordsTH = [
      'หุ้น', 'ตลาดหุ้น', 'หุ้นอเมริกา', 'หุ้นสหรัฐ',
      'นาสแด็ก', 'ดาวโจนส์', 'วอลล์สตรีท',
      'ผลประกอบการ', 'รายได้', 'กำไร',
      'นักลงทุน', 'การลงทุน', 'ซื้อขาย',
      'พอร์ต', 'พอร์ตโฟลิโอ', 'เปิดบัญชี'
    ];
    
    const allKeywords = [...stockKeywords, ...stockKeywordsTH];
    
    return allKeywords.some(keyword => text.includes(keyword));
  }

  /**
   */
  async enrichArticleData(url, title, existingSummary, existingImage) {
    try {
      if (existingSummary && existingSummary.length > 100 && existingImage) {
        return {
          summary: existingSummary,
          image: existingImage,
          enriched: false
        };
      }

      const response = await axios.get(url, {
        timeout: 5000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      
      let summary = existingSummary;
      if (!summary || summary.length < 50) {
        summary = 
          $('meta[property="og:description"]').attr('content') ||
          $('meta[name="description"]').attr('content') ||
          $('meta[name="twitter:description"]').attr('content') ||
          $('.article-content p').first().text() ||
          $('article p').first().text() ||
          existingSummary;
        
        if (summary) {
          summary = summary.trim().substring(0, 300);
        }
      }
      
      let image = existingImage;
      if (!image) {
        image = 
          $('meta[property="og:image"]').attr('content') ||
          $('meta[name="twitter:image"]').attr('content') ||
          $('article img').first().attr('src') ||
          $('.article-image img').first().attr('src');
        
        if (image && !image.startsWith('http')) {
          const baseUrl = new URL(url);
          image = new URL(image, baseUrl.origin).href;
        }
      }
      
      return {
        summary: summary || existingSummary,
        image: image || existingImage,
        enriched: true
      };
      
    } catch (error) {
      console.warn(` Could not enrich article: ${error.message}`);
      return {
        summary: existingSummary,
        image: existingImage,
        enriched: false
      };
    }
  }

  /**
   * ดึงข่าวหลายภาษา (ไทย + อังกฤษ)
   */
  async getMultiLanguageNews(query = null, limitPerLanguage = 25) {
    try {
      console.log(' Fetching multi-language news...');
      
      const [thaiNews, englishNews] = await Promise.allSettled([
        this.getNews(query, 'th', 'TH'),
        this.getNews(query, 'en', 'US')
      ]);

      let allNews = [];
      
      if (thaiNews.status === 'fulfilled') {
        allNews = [...allNews, ...thaiNews.value.slice(0, limitPerLanguage)];
      } else {
        console.warn(' Failed to fetch Thai news:', thaiNews.reason);
      }
      
      if (englishNews.status === 'fulfilled') {
        allNews = [...allNews, ...englishNews.value.slice(0, limitPerLanguage)];
      } else {
        console.warn(' Failed to fetch English news:', englishNews.reason);
      }

      // Sort by datetime
      allNews.sort((a, b) => b.datetime - a.datetime);
      
      const enrichedCount = allNews.filter(n => n.enriched).length;
      console.log(` Total news: ${allNews.length} (TH: ${thaiNews.status === 'fulfilled' ? thaiNews.value.length : 0}, EN: ${englishNews.status === 'fulfilled' ? englishNews.value.length : 0}, Enriched: ${enrichedCount})`);
      
      return allNews;
      
    } catch (error) {
      console.error(' Multi-language news error:', error);
      throw error;
    }
  }

  /**
   * ดึงข่าวตามหมวดหมู่
   */
  async getNewsByCategory(category, language = 'en', region = 'US') {
    const categoryQueries = {
      'business': 'business OR finance OR stocks OR market',
      'technology': 'technology OR tech OR innovation OR software',
      'stocks': 'stocks OR trading OR NYSE OR NASDAQ',
      'crypto': 'cryptocurrency OR bitcoin OR blockchain',
      'ai': 'artificial intelligence OR AI OR machine learning',
      'general': null
    };

    const query = categoryQueries[category] || categoryQueries['general'];
    return this.getNews(query, language, region);
  }

  /**
   * Helper: Clean title (remove source name)
   */
  cleanTitle(title) {
    // Remove "- Source Name" pattern
    return title.replace(/\s*-\s*[^-]*$/, '').trim();
  }

  /**
   * Helper: Extract source from title
   */
  extractSource(title) {
    const match = title.match(/\s*-\s*([^-]*)$/);
    return match ? match[1].trim() : 'Google News';
  }

  /**
   * Helper: Extract image from HTML description
   */
  extractImageFromDescription(description) {
    if (!description) return null;
    
    const imgRegex = /<img[^>]+src="([^">]+)"/i;
    const match = description.match(imgRegex);
    
    return match ? match[1] : null;
  }

  /**
   * Helper: Clean HTML from description
   */
  cleanDescription(description) {
    if (!description) return '';
    
    // Remove HTML tags
    let cleaned = description.replace(/<[^>]*>/g, '');
    
    // Decode HTML entities
    cleaned = cleaned
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/&hellip;/g, '...')
      .replace(/&mdash;/g, '—')
      .replace(/&ndash;/g, '–');
    
    // Remove extra whitespace
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    // ถ้าสั้นเกินไป ให้ return null
    if (cleaned.length < 20) {
      return null;
    }
    
    // Limit length but try to end at sentence
    if (cleaned.length > 300) {
      cleaned = cleaned.substring(0, 300);
      const lastPeriod = cleaned.lastIndexOf('.');
      const lastExclamation = cleaned.lastIndexOf('!');
      const lastQuestion = cleaned.lastIndexOf('?');
      const lastSentence = Math.max(lastPeriod, lastExclamation, lastQuestion);
      
      if (lastSentence > 100) {
        cleaned = cleaned.substring(0, lastSentence + 1);
      } else {
        cleaned = cleaned + '...';
      }
    }
    
    return cleaned || null;
  }

  /**
   * Helper: Generate unique ID
   */
  generateId(title, pubDate) {
    const str = `${title}-${pubDate}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Helper: Categorize news
   */
  categorizeNews(title, description) {
    const text = `${title} ${description}`.toLowerCase();
    
    const categories = [
      { 
        name: 'AI Technology', 
        keywords: ['ai', 'artificial intelligence', 'machine learning', 'neural network', 'chatgpt', 'openai', 'deepmind', 'ปัญญาประดิษฐ์', 'เอไอ']
      },
      { 
        name: 'Cryptocurrency', 
        keywords: ['crypto', 'bitcoin', 'ethereum', 'blockchain', 'binance', 'coinbase', 'nft', 'คริปโต', 'บิทคอยน์']
      },
      { 
        name: 'Stock Analysis', 
        keywords: ['stock', 'nasdaq', 'nyse', 'dow jones', 's&p 500', 'shares', 'equity', 'หุ้น', 'ตลาดหุ้น', 'หุ้นขึ้น', 'หุ้นลง']
      },
      { 
        name: 'Market Trends', 
        keywords: ['market', 'trading', 'investor', 'wall street', 'rally', 'bull market', 'bear market', 'ตลาด', 'การลงทุน', 'นักลงทุน']
      },
      { 
        name: 'Tech Stocks', 
        keywords: ['tech stock', 'technology company', 'tech sector', 'faang', 'magnificent seven', 'หุ้นเทค']
      },
      { 
        name: 'Company News', 
        keywords: ['earnings', 'revenue', 'profit', 'ceo', 'cfo', 'merger', 'acquisition', 'ผลประกอบการ', 'รายได้', 'กำไร']
      },
      { 
        name: 'Economic News', 
        keywords: ['fed', 'federal reserve', 'interest rate', 'inflation', 'gdp', 'unemployment', 'เฟด', 'อัตราดอกเบี้ย', 'เงินเฟ้อ']
      },
      { 
        name: 'Breaking News', 
        keywords: ['breaking', 'urgent', 'alert', 'just in', 'ด่วน', 'เร่งด่วน']
      },
    ];

    for (const category of categories) {
      if (category.keywords.some(keyword => text.includes(keyword))) {
        return category.name;
      }
    }

    return 'Market News';
  }

  /**
   * ค้นหาข่าวเฉพาะบริษัท/หุ้น
   */
  async searchCompanyNews(companyName, language = 'en', region = 'US') {
    return this.getNews(companyName, language, region);
  }
}

export default new GoogleNewsService();