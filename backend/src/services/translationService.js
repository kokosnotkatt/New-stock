// backend/src/services/translationService.js
import { Translate } from '@google-cloud/translate/build/src/v2/index.js';

class TranslationService {
  constructor() {
    this.apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
    this.translate = null;
    this.cache = new Map();
    this.cacheTimeout = 24 * 60 * 60 * 1000; // 24 hours
    
    if (this.apiKey) {
      this.initialize();
    } else {
      console.warn('⚠️ GOOGLE_TRANSLATE_API_KEY not set - Translation disabled');
    }
  }

  initialize() {
    try {
      this.translate = new Translate({ key: this.apiKey });
      console.log('✅ Google Cloud Translation initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Translation:', error.message);
    }
  }

  /**
   * แปลข้อความ
   */
  async translateText(text, targetLang, sourceLang = 'en') {
    if (!text || text.trim().length === 0) return text;
    if (!this.translate) {
      console.warn('Translation service not initialized');
      return text;
    }

    // Check cache
    const cacheKey = `${sourceLang}-${targetLang}-${text.substring(0, 50)}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const [translation] = await this.translate.translate(text, targetLang);
      
      // Cache result
      this.setCache(cacheKey, translation);
      
      return translation;
    } catch (error) {
      console.error('❌ Translation error:', error.message);
      return text; // Return original if failed
    }
  }

  /**
   * แปลข่าวหลายตัว (Batch)
   */
  async translateNews(articles, targetLang) {
    const sourceLang = targetLang === 'th' ? 'en' : 'th';
    console.log(`🌐 Translating ${articles.length} articles: ${sourceLang} → ${targetLang} (Google Translate)`);

    if (!this.translate) {
      console.warn('Translation service not initialized - returning original articles');
      return articles;
    }

    const results = [];
    
    // แปลทีละ batch (10 ตัวต่อครั้ง) เพื่อเร็วขึ้น
    const batchSize = 10;
    for (let i = 0; i < articles.length; i += batchSize) {
      const batch = articles.slice(i, i + batchSize);
      
      const translatedBatch = await Promise.all(
        batch.map(async (article) => {
          try {
            // แปลเฉพาะ headline (ไม่แปล summary เพื่อความเร็ว)
            const translatedHeadline = await this.translateText(
              article.headline || article.title, 
              targetLang, 
              sourceLang
            );

            return {
              ...article,
              headline: translatedHeadline,
              title: translatedHeadline,
              // summary: ไม่แปล summary เพื่อความเร็ว
              originalHeadline: article.headline || article.title,
              originalSummary: article.summary,
              translatedTo: targetLang
            };
          } catch (error) {
            console.error(`❌ Failed to translate article ${article.id}:`, error.message);
            return article;
          }
        })
      );

      results.push(...translatedBatch);
      
      console.log(`✅ Progress: ${Math.min(i + batchSize, articles.length)}/${articles.length}`);
    }

    console.log(`✅ Translated ${results.length} articles`);
    return results;
  }

  /**
   * แปลข่าวตัวเดียว
   */
  async translateSingleArticle(article, targetLang) {
    const sourceLang = targetLang === 'th' ? 'en' : 'th';

    if (!this.translate) {
      return article;
    }

    try {
      const [translatedHeadline, translatedSummary] = await Promise.all([
        this.translateText(article.headline || article.title, targetLang, sourceLang),
        article.summary ? this.translateText(article.summary, targetLang, sourceLang) : Promise.resolve('')
      ]);

      return {
        ...article,
        headline: translatedHeadline,
        title: translatedHeadline,
        summary: translatedSummary || article.summary,
        originalHeadline: article.headline || article.title,
        originalSummary: article.summary,
        translatedTo: targetLang
      };
    } catch (error) {
      console.error('❌ Translation error:', error.message);
      return article;
    }
  }

  /**
   * Cache management
   */
  getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  setCache(key, data) {
    this.cache.set(key, { data, timestamp: Date.now() });
    
    // Limit cache size
    if (this.cache.size > 1000) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }

  clearCache() {
    this.cache.clear();
    console.log('🗑️ Translation cache cleared');
  }

  getCacheStats() {
    return {
      size: this.cache.size,
      maxSize: 1000
    };
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * ตรวจสอบ API status
   */
  async checkStatus() {
    if (!this.translate) {
      return { status: 'error', message: 'Not initialized' };
    }

    try {
      await this.translate.translate('test', 'th');
      return { status: 'ok', message: 'Google Translation is working' };
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }
}

const translationService = new TranslationService();
export default translationService;