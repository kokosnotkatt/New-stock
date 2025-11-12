import axios from 'axios';
import xml2js from 'xml2js';
import cacheService from './cacheService.js';

class GoogleNewsService {
  constructor() {
    this.baseURL = 'https://news.google.com/rss';
    this.parser = new xml2js.Parser();
  }

  async getNews(query = null, language = 'en', region = 'US') {
    // Check cache
    const cacheKey = `news-${query}-${language}-${region}`;
    const cached = cacheService.get(cacheKey);
    if (cached) {
      console.log(`✅ Cache hit: ${cacheKey}`);
      return cached;
    }

    try {
      let url;
      
      if (query) {
        url = `${this.baseURL}/search?q=${encodeURIComponent(query)}&hl=${language}&gl=${region}&ceid=${region}:${language}`;
      } else {
        url = `${this.baseURL}?hl=${language}&gl=${region}&ceid=${region}:${language}`;
      }

      console.log(`📰 Fetching Google News: ${url}`);
      
      const response = await axios.get(url, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const result = await this.parser.parseStringPromise(response.data);
      
      if (!result.rss || !result.rss.channel || !result.rss.channel[0].item) {
        console.warn('⚠️ No news items found');
        return [];
      }

      const items = result.rss.channel[0].item;
      
      const articles = items.map((item, index) => {
        const title = item.title?.[0] || 'Untitled';
        const link = item.link?.[0] || '';
        const pubDate = item.pubDate?.[0] || new Date().toISOString();
        const description = item.description?.[0] || '';
        const source = item.source?.[0]?._ || this.extractSource(title);
        
        const imageUrl = this.extractImageFromDescription(description);
        const cleanDescription = this.cleanDescription(description);
        
        return {
          id: this.generateId(title, pubDate),
          headline: this.cleanTitle(title),
          title: this.cleanTitle(title),
          summary: cleanDescription,
          source: source,
          url: link,
          image: imageUrl,
          datetime: new Date(pubDate).getTime() / 1000,
          pubDate: pubDate,
          category: this.categorizeNews(title, cleanDescription),
          language: language
        };
      });

      // Cache result
      cacheService.set(cacheKey, articles);
      console.log(`✅ Cached: ${cacheKey}`);

      console.log(`✅ Fetched ${articles.length} articles from Google News (${language})`);
      return articles;
      
    } catch (error) {
      console.error('❌ Google News Error:', error.message);
      throw new Error(`Failed to fetch Google News: ${error.message}`);
    }
  }

  async getMultiLanguageNews(query = null, limitPerLanguage = 25) {
    const cacheKey = `multi-${query}-${limitPerLanguage}`;
    const cached = cacheService.get(cacheKey);
    if (cached) {
      console.log(`✅ Cache hit: ${cacheKey}`);
      return cached;
    }

    try {
      console.log('🌐 Fetching multi-language news...');
      
      const [thaiNews, englishNews] = await Promise.allSettled([
        this.getNews(query, 'th', 'TH'),
        this.getNews(query, 'en', 'US')
      ]);

      let allNews = [];
      
      if (thaiNews.status === 'fulfilled') {
        allNews = [...allNews, ...thaiNews.value.slice(0, limitPerLanguage)];
      } else {
        console.warn('⚠️ Failed to fetch Thai news:', thaiNews.reason);
      }
      
      if (englishNews.status === 'fulfilled') {
        allNews = [...allNews, ...englishNews.value.slice(0, limitPerLanguage)];
      } else {
        console.warn('⚠️ Failed to fetch English news:', englishNews.reason);
      }

      allNews.sort((a, b) => b.datetime - a.datetime);
      
      cacheService.set(cacheKey, allNews);
      console.log(`✅ Cached: ${cacheKey}`);
      
      console.log(`✅ Total news: ${allNews.length}`);
      
      return allNews;
      
    } catch (error) {
      console.error('❌ Multi-language news error:', error);
      throw error;
    }
  }

  // ... rest of methods remain the same
  
  cleanTitle(title) {
    return title.replace(/\s*-\s*[^-]*$/, '').trim();
  }

  extractSource(title) {
    const match = title.match(/\s*-\s*([^-]*)$/);
    return match ? match[1].trim() : 'Google News';
  }

  extractImageFromDescription(description) {
    if (!description) return null;
    const imgRegex = /<img[^>]+src="([^">]+)"/i;
    const match = description.match(imgRegex);
    return match ? match[1] : null;
  }

  cleanDescription(description) {
    if (!description) return '';
    let cleaned = description.replace(/<[^>]*>/g, '');
    cleaned = cleaned
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/&nbsp;/g, ' ');
    cleaned = cleaned.trim().substring(0, 200);
    return cleaned || null;
  }

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

  categorizeNews(title, description) {
    const text = `${title} ${description}`.toLowerCase();
    
    const categories = [
      { name: 'AI Technology', keywords: ['ai', 'artificial intelligence', 'machine learning', 'neural network'] },
      { name: 'Cryptocurrency', keywords: ['crypto', 'bitcoin', 'ethereum', 'blockchain'] },
      { name: 'Stock Analysis', keywords: ['stock', 'nasdaq', 'nyse', 'dow jones', 's&p 500'] },
      { name: 'Market Trends', keywords: ['market', 'trading', 'investor', 'wall street'] },
      { name: 'Tech Stocks', keywords: ['tech stock', 'technology company', 'tech sector'] },
      { name: 'Company News', keywords: ['company', 'corporation', 'ceo', 'earnings'] },
    ];

    for (const category of categories) {
      if (category.keywords.some(keyword => text.includes(keyword))) {
        return category.name;
      }
    }

    return 'Market News';
  }

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

  async searchCompanyNews(companyName, language = 'en', region = 'US') {
    return this.getNews(companyName, language, region);
  }
}

export default new GoogleNewsService();