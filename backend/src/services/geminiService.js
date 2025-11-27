// backend/src/services/geminiService.js
import { GoogleGenerativeAI } from '@google/generative-ai';

class GeminiService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.genAI = null;
    this.model = null;
    
    this.cache = new Map();
    this.translationCache = new Map();
    this.cacheTimeout = 60 * 60 * 1000; // 1 hour
    
    if (this.apiKey) {
      this.initialize();
    } else {
      console.warn('⚠️ GEMINI_API_KEY not set - AI features disabled');
    }
  }

  initialize() {
    try {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
      // ✅ ใช้ Gemini 2.5 Flash (stable version)
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      console.log('✅ Gemini AI Service initialized (gemini-2.5-flash)');
    } catch (error) {
      console.error('❌ Failed to initialize Gemini:', error.message);
    }
  }

  // =============================================
  // 🌐 TRANSLATION (ใช้ Gemini แทน LibreTranslate)
  // =============================================

  /**
   * แปลข้อความ
   */
  async translate(text, sourceLang, targetLang) {
    if (!text || text.trim().length === 0) return text;
    if (!this.model) throw new Error('Gemini not initialized');

    // Check cache
    const cacheKey = `trans-${sourceLang}-${targetLang}-${this.hashString(text)}`;
    const cached = this.translationCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    const targetLanguage = targetLang === 'th' ? 'Thai' : 'English';
    const prompt = `Translate the following text to ${targetLanguage}. Only return the translated text, nothing else.

Text: ${text}`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const translatedText = response.text().trim();

      // Cache
      this.translationCache.set(cacheKey, { data: translatedText, timestamp: Date.now() });
      
      return translatedText;
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
    console.log(`🌐 Translating ${articles.length} articles: ${sourceLang} → ${targetLang} (Gemini)`);

    const results = [];
    
    for (const article of articles) {
      try {
        // แปลทีละตัว เพื่อไม่ให้ rate limit
        const [translatedHeadline, translatedSummary] = await Promise.all([
          this.translate(article.headline || article.title, sourceLang, targetLang),
          this.translate(article.summary || '', sourceLang, targetLang)
        ]);

        results.push({
          ...article,
          headline: translatedHeadline,
          title: translatedHeadline,
          summary: translatedSummary,
          originalHeadline: article.headline || article.title,
          originalSummary: article.summary,
          translatedTo: targetLang
        });

        // หน่วงเวลาเล็กน้อยเพื่อไม่ให้ rate limit
        await this.sleep(150);
      } catch (error) {
        console.error(`❌ Failed to translate article ${article.id}:`, error.message);
        results.push(article);
      }
    }

    console.log(`✅ Translated ${results.length} articles`);
    return results;
  }

  /**
   * แปลข่าวตัวเดียว
   */
  async translateSingleArticle(article, targetLang) {
    const sourceLang = targetLang === 'th' ? 'en' : 'th';

    try {
      const [translatedHeadline, translatedSummary] = await Promise.all([
        this.translate(article.headline || article.title, sourceLang, targetLang),
        this.translate(article.summary || '', sourceLang, targetLang)
      ]);

      return {
        ...article,
        headline: translatedHeadline,
        title: translatedHeadline,
        summary: translatedSummary,
        originalHeadline: article.headline || article.title,
        originalSummary: article.summary,
        translatedTo: targetLang
      };
    } catch (error) {
      console.error('❌ Translation error:', error.message);
      return article;
    }
  }

  // =============================================
  // 🤖 AI ANALYSIS
  // =============================================

  /**
   * วิเคราะห์ข่าวด้วย AI
   */
  async analyzeNews(article, language = 'th') {
    if (!this.model) {
      throw new Error('Gemini AI not initialized');
    }

    // Check cache
    const cacheKey = `analyze-${article.id}-${language}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      console.log(`✅ Cache hit: AI analysis`);
      return cached.data;
    }

    console.log(`🤖 Analyzing: "${(article.title || article.headline)?.substring(0, 50)}..."`);

    const prompt = language === 'th' 
      ? this.getThaiPrompt(article)
      : this.getEnglishPrompt(article);

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const analysis = this.parseAnalysis(text, language);
      
      // Cache
      this.cache.set(cacheKey, { data: analysis, timestamp: Date.now() });

      console.log(`✅ Analysis complete: ${analysis.sentiment}`);
      return analysis;

    } catch (error) {
      console.error('❌ Gemini API error:', error.message);
      throw error;
    }
  }

  getThaiPrompt(article) {
    return `คุณเป็นนักวิเคราะห์การลงทุนมืออาชีพ กรุณาวิเคราะห์ข่าวต่อไปนี้:

หัวข้อ: ${article.headline || article.title}
เนื้อหา: ${article.summary || 'ไม่มีเนื้อหา'}
แหล่งที่มา: ${article.source || 'Unknown'}
${article.symbols ? `หุ้นที่เกี่ยวข้อง: ${article.symbols.join(', ')}` : ''}

ตอบเป็น JSON เท่านั้น:
{
  "sentiment": "positive" หรือ "negative" หรือ "neutral",
  "sentimentScore": ตัวเลข 0-100,
  "sentimentLabel": "ข่าวดี" หรือ "ข่าวร้าย" หรือ "ข่าวกลาง",
  "summary": "สรุปใจความสำคัญ 2-3 ประโยค",
  "impact": "ผลกระทบต่อราคาหุ้น",
  "recommendation": "คำแนะนำการลงทุน",
  "riskLevel": "low" หรือ "medium" หรือ "high",
  "keyPoints": ["จุดสำคัญ 1", "จุดสำคัญ 2"],
  "relatedSectors": ["อุตสาหกรรมที่เกี่ยวข้อง"]
}`;
  }

  getEnglishPrompt(article) {
    return `You are a professional investment analyst. Analyze this news:

Title: ${article.headline || article.title}
Content: ${article.summary || 'No content'}
Source: ${article.source || 'Unknown'}
${article.symbols ? `Related stocks: ${article.symbols.join(', ')}` : ''}

Respond in JSON only:
{
  "sentiment": "positive" or "negative" or "neutral",
  "sentimentScore": number 0-100,
  "sentimentLabel": "Good News" or "Bad News" or "Neutral",
  "summary": "2-3 sentence summary",
  "impact": "Impact on stock price",
  "recommendation": "Investment recommendation",
  "riskLevel": "low" or "medium" or "high",
  "keyPoints": ["Key point 1", "Key point 2"],
  "relatedSectors": ["Related sectors"]
}`;
  }

  parseAnalysis(text, language) {
    try {
      let cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const analysis = JSON.parse(cleanText);
      return { ...analysis, language, analyzedAt: new Date().toISOString() };
    } catch (error) {
      console.error('❌ Failed to parse AI response');
      return {
        sentiment: 'neutral',
        sentimentScore: 50,
        sentimentLabel: language === 'th' ? 'ไม่สามารถวิเคราะห์ได้' : 'Unable to analyze',
        summary: language === 'th' ? 'ไม่สามารถวิเคราะห์ข่าวนี้ได้' : 'Unable to analyze',
        impact: language === 'th' ? 'ไม่ทราบ' : 'Unknown',
        recommendation: language === 'th' ? 'ควรศึกษาเพิ่มเติม' : 'Further research needed',
        riskLevel: 'medium',
        keyPoints: [],
        relatedSectors: [],
        language,
        analyzedAt: new Date().toISOString(),
        parseError: true
      };
    }
  }

  // =============================================
  // 🔧 UTILITIES
  // =============================================

  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async checkStatus() {
    if (!this.model) {
      return { status: 'error', message: 'Not initialized' };
    }
    try {
      const result = await this.model.generateContent('Say OK');
      return { status: 'ok', message: 'Gemini AI is working' };
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }

  getCacheStats() {
    return {
      analysisCache: this.cache.size,
      translationCache: this.translationCache.size
    };
  }

  clearCache() {
    this.cache.clear();
    this.translationCache.clear();
    console.log('🗑️ All caches cleared');
  }
}

const geminiService = new GeminiService();
export default geminiService;