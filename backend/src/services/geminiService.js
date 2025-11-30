import { GoogleGenerativeAI } from '@google/generative-ai';

class GeminiService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.genAI = null;
    this.model = null;
    
    this.cache = new Map();
    this.translationCache = new Map();
    this.cacheTimeout = 60 * 60 * 1000; 
    
    this.requestQueue = [];
    this.isProcessing = false;
    this.lastRequestTime = 0;
    this.minDelay = 4000; 
    
    if (this.apiKey) {
      this.initialize();
    } else {
      console.warn('⚠️ GEMINI_API_KEY not set - AI features disabled');
    }
  }

  initialize() {
    try {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
      this.modelName = 'gemini-2.5-flash';
      this.model = this.genAI.getGenerativeModel({ model: this.modelName });
      console.log(' Gemini AI Service initialized (gemini-2.5-flash)');
    } catch (error) {
      console.error(' Failed to initialize Gemini:', error.message);
    }
  }

  async rateLimitedRequest(requestFn, maxRetries = 2) {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.minDelay) {
      const waitTime = this.minDelay - timeSinceLastRequest;
      console.log(` Rate limit: waiting ${waitTime}ms`);
      await this.sleep(waitTime);
    }

    this.lastRequestTime = Date.now();

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        if (error.status === 429) {
          if (attempt < maxRetries) {
            const retryDelay = 10000; // รอ 10 วินาที
            console.warn(` Rate limit hit (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${retryDelay}ms...`);
            await this.sleep(retryDelay);
            continue;
          } else {
            console.error(' Rate limit exceeded after retries');
            throw new Error('AI service is busy. Please try again in a moment.');
          }
        }
        throw error;
      }
    }
  }

  async translate(text, sourceLang, targetLang) {
    if (!text || text.trim().length === 0) return text;
    if (!this.model) throw new Error('Gemini not initialized');

    const cacheKey = `trans-${sourceLang}-${targetLang}-${this.hashString(text)}`;
    const cached = this.translationCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    const targetLanguage = targetLang === 'th' ? 'Thai' : 'English';
    const prompt = `Translate the following text to ${targetLanguage}. Only return the translated text, nothing else.

Text: ${text}`;

    try {
      const result = await this.rateLimitedRequest(async () => {
        return await this.model.generateContent(prompt);
      });
      
      const response = await result.response;
      const translatedText = response.text().trim();

      // Cache
      this.translationCache.set(cacheKey, { data: translatedText, timestamp: Date.now() });
      
      return translatedText;
    } catch (error) {
      console.error(' Translation error:', error.message);
      return text; // Return original if failed
    }
  }

  async translateNews(articles, targetLang) {
    const sourceLang = targetLang === 'th' ? 'en' : 'th';
    console.log(` Translating ${articles.length} articles: ${sourceLang} → ${targetLang} (Gemini)`);

    const results = [];
    
    for (const article of articles) {
      try {
        const translatedHeadline = await this.translate(
          article.headline || article.title, 
          sourceLang, 
          targetLang
        );

        results.push({
          ...article,
          headline: translatedHeadline,
          title: translatedHeadline,
          summary: article.summary, 
          originalHeadline: article.headline || article.title,
          originalSummary: article.summary,
          translatedTo: targetLang
        });

        if ((results.length % 3) === 0) {
          console.log(` Progress: ${results.length}/${articles.length}`);
        }
      } catch (error) {
        console.error(` Failed to translate article ${article.id}:`, error.message);
        results.push(article);
      }
    }

    console.log(` Translated ${results.length} articles`);
    return results;
  }

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
      console.error(' Translation error:', error.message);
      return article;
    }
  }
 
  async analyzeNews(article, language = 'th') {
    if (!this.model) {
      throw new Error('Gemini AI not initialized');
    }

    // Check cache
    const cacheKey = `analyze-${article.id}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      console.log(` Cache hit: AI analysis`);
      return cached.data;
    }

    console.log(` Analyzing: "${(article.title || article.headline)?.substring(0, 50)}..."`);

    const prompt = this.getBilingualPrompt(article);

    try {
      const result = await this.rateLimitedRequest(async () => {
        return await this.model.generateContent(prompt);
      });
      
      const response = await result.response;
      const text = response.text();

      const analysis = this.parseAnalysis(text, language);
      
      // Cache
      this.cache.set(cacheKey, { data: analysis, timestamp: Date.now() });

      console.log(` Analysis complete: ${analysis.sentiment}`);
      return analysis;

    } catch (error) {
      console.error(' Gemini API error:', error.message);
      throw error;
    }
  }

  getBilingualPrompt(article) {
    return `You are a professional investment analyst. Analyze this news and provide BOTH Thai and English summaries.

Title: ${article.headline || article.title}
Content: ${article.summary || 'No content'}
Source: ${article.source || 'Unknown'}
${article.symbols ? `Related stocks: ${article.symbols.join(', ')}` : ''}

Respond in JSON with BOTH languages:
{
  "sentiment": "positive" or "negative" or "neutral",
  "sentimentScore": number 0-100,
  "th": {
    "sentimentLabel": "ข่าวดี" or "ข่าวร้าย" or "ข่าวกลาง",
    "summary": "สรุปใจความสำคัญ 2-3 ประโยค",
    "impact": "ผลกระทบต่อราคาหุ้น",
    "recommendation": "คำแนะนำการลงทุน",
    "keyPoints": ["จุดสำคัญ 1", "จุดสำคัญ 2"]
  },
  "en": {
    "sentimentLabel": "Good News" or "Bad News" or "Neutral",
    "summary": "2-3 sentence summary",
    "impact": "Impact on stock price",
    "recommendation": "Investment recommendation",
    "keyPoints": ["Key point 1", "Key point 2"]
  },
  "riskLevel": "low" or "medium" or "high",
  "relatedSectors": ["Related sectors"]
}`;
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
      const rawAnalysis = JSON.parse(cleanText);
      
      const langData = rawAnalysis[language] || rawAnalysis.th;
      
      return {
        sentiment: rawAnalysis.sentiment,
        sentimentScore: rawAnalysis.sentimentScore,
        sentimentLabel: langData.sentimentLabel,
        summary: langData.summary,
        impact: langData.impact,
        recommendation: langData.recommendation,
        riskLevel: rawAnalysis.riskLevel,
        keyPoints: langData.keyPoints || [],
        relatedSectors: rawAnalysis.relatedSectors || [],
        language,
        translations: {
          th: rawAnalysis.th,
          en: rawAnalysis.en
        },
        analyzedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error(' Failed to parse AI response');
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

  async translate(text, sourceLang, targetLang) {
    if (!text || text.trim().length === 0) return text;

    // Check translation cache
    const cacheKey = `translate-${sourceLang}-${targetLang}-${text.substring(0, 50)}`;
    const cached = this.translationCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const langMap = {
        'th': 'Thai',
        'en': 'English'
      };

      const prompt = `Translate from ${langMap[sourceLang]} to ${langMap[targetLang]}.

RULES:
- Return ONLY the translated text
- No explanations
- Preserve tone

Text: ${text}`;

      const result = await this.rateLimitedRequest(async () => {
        return await this.model.generateContent(prompt);
      });
      
      const response = await result.response;
      const translated = response.text().trim();

      this.translationCache.set(cacheKey, {
        data: translated,
        timestamp: Date.now()
      });

      return translated;
    } catch (error) {
      console.error(' Translation error:', error.message);
      return text;
    }
  }

  async translateBatch(texts, sourceLang, targetLang) {
    if (!texts || texts.length === 0) return [];

    const cacheKey = `batch-${sourceLang}-${targetLang}-${texts.join('|').substring(0, 100)}`;
    const cached = this.translationCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      console.log(' Using cached batch translation');
      return cached.data;
    }

    try {
      const langMap = {
        'th': 'Thai',
        'en': 'English'
      };

      const textsJson = texts.map((text, index) => ({
        id: index,
        text: text || ''
      }));

      const prompt = `Translate from ${langMap[sourceLang]} to ${langMap[targetLang]}.

CRITICAL RULES:
1. Return a valid JSON array with EXACT same structure
2. Each object: {"id": number, "translated": "text"}
3. NO markdown, NO code blocks, NO extra text
4. Preserve tone and meaning

Input:
${JSON.stringify(textsJson, null, 2)}

Output (JSON array only):`;

      const result = await this.rateLimitedRequest(async () => {
        return await this.model.generateContent(prompt);
      });
      
      const response = await result.response;
      let responseText = response.text().trim();

      responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const translations = JSON.parse(responseText);

      const results = new Array(texts.length).fill('');
      translations.forEach(item => {
        if (item.id !== undefined && item.translated !== undefined) {
          results[item.id] = item.translated;
        }
      });

      this.translationCache.set(cacheKey, {
        data: results,
        timestamp: Date.now()
      });

      return results;
    } catch (error) {
      console.error(' Batch translation error:', error.message);
      return texts;
    }
  }
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
    console.log(' All caches cleared');
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * ตรวจสอบ API status
   */
  async checkStatus() {
    try {
      const testResult = await this.model.generateContent('Hello');
      return { 
        status: 'ok', 
        message: 'Gemini API is working',
        model: this.modelName 
      };
    } catch (error) {
      return { 
        status: 'error', 
        message: error.message 
      };
    }
  }
}

const geminiService = new GeminiService();
export default geminiService;