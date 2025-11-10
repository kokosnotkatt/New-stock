import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

class SymbolDetector {
  constructor() {
    this.apiKey = process.env.FINNHUB_API_KEY;
    this.baseURL = 'https://finnhub.io/api/v1';
    
    this.symbolCache = new Map();
    
    this.popularStocks = new Map([
      ['AAPL', 'Apple'],
      ['MSFT', 'Microsoft'],
      ['GOOGL', 'Google'],
      ['GOOG', 'Alphabet'],
      ['AMZN', 'Amazon'],
      ['META', 'Meta'],
      ['TSLA', 'Tesla'],
      ['NVDA', 'NVIDIA'],
      ['AMD', 'Advanced Micro Devices'],
      
      // Financial
      ['JPM', 'JPMorgan'],
      ['BAC', 'Bank of America'],
      ['WFC', 'Wells Fargo'],
      ['GS', 'Goldman Sachs'],
      ['MS', 'Morgan Stanley'],
      
      // Others
      ['DIS', 'Disney'],
      ['NFLX', 'Netflix'],
      ['PYPL', 'PayPal'],
      ['UBER', 'Uber'],
      ['LYFT', 'Lyft'],
      ['ABNB', 'Airbnb'],
      ['COIN', 'Coinbase'],
      
      // Retail
      ['WMT', 'Walmart'],
      ['TGT', 'Target'],
      ['COST', 'Costco'],
      
      // Crypto-related
      ['MSTR', 'MicroStrategy']
    ]);
    
    // Company name variations
    this.companyNameMap = new Map([
      ['Apple Inc.', 'AAPL'],
      ['Apple', 'AAPL'],
      ['Microsoft Corporation', 'MSFT'],
      ['Microsoft', 'MSFT'],
      ['Google', 'GOOGL'],
      ['Alphabet', 'GOOGL'],
      ['Amazon.com', 'AMZN'],
      ['Amazon', 'AMZN'],
      ['Meta Platforms', 'META'],
      ['Facebook', 'META'],
      ['Tesla Inc.', 'TSLA'],
      ['Tesla', 'TSLA'],
      ['NVIDIA Corporation', 'NVDA'],
      ['NVIDIA', 'NVDA'],
      ['Nvidia', 'NVDA'],
      ['Netflix', 'NFLX'],
      ['Disney', 'DIS'],
      ['PayPal', 'PYPL'],
      ['Uber Technologies', 'UBER'],
      ['Uber', 'UBER'],
      ['Coinbase', 'COIN'],
      ['MicroStrategy', 'MSTR']
    ]);
  }

  /**
   * หา symbols จากข้อความข่าว
   * @param {Object} article - ข่าวที่ต้องการตรวจสอบ
   * @returns {Array<string>} - Array of detected symbols
   */
  detectSymbols(article) {
    const { headline = '', summary = '' } = article;
    const text = `${headline} ${summary}`.toLowerCase();
    const detectedSymbols = new Set();

    // 1. ตรวจหา symbols ที่มี $ นำหน้า (เช่น $AAPL)
    const dollarSymbols = text.match(/\$[A-Z]{1,5}/gi);
    if (dollarSymbols) {
      dollarSymbols.forEach(symbol => {
        detectedSymbols.add(symbol.substring(1).toUpperCase());
      });
    }

    // 2. ตรวจหา symbols ในวงเล็บ (เช่น Apple (AAPL))
    const bracketSymbols = text.match(/\([A-Z]{1,5}\)/g);
    if (bracketSymbols) {
      bracketSymbols.forEach(match => {
        const symbol = match.replace(/[()]/g, '');
        if (this.isValidSymbol(symbol)) {
          detectedSymbols.add(symbol);
        }
      });
    }

    // 3. ตรวจหาชื่อบริษัทที่รู้จัก
    for (const [companyName, symbol] of this.companyNameMap.entries()) {
      const regex = new RegExp(`\\b${companyName}\\b`, 'i');
      if (regex.test(text)) {
        detectedSymbols.add(symbol);
      }
    }

    // 4. ตรวจหา popular symbols ที่อาจไม่มี $
    for (const [symbol, companyName] of this.popularStocks.entries()) {
      const symbolRegex = new RegExp(`\\b${symbol}\\b`, 'i');
      const nameRegex = new RegExp(`\\b${companyName}\\b`, 'i');
      
      if (symbolRegex.test(text) || nameRegex.test(text)) {
        detectedSymbols.add(symbol);
      }
    }

    return Array.from(detectedSymbols);
  }

  /**
   * ตรวจสอบว่า symbol นี้ valid หรือไม่
   */
  isValidSymbol(symbol) {
    // Symbol ทั่วไปมีความยาว 1-5 ตัวอักษร
    if (!symbol || symbol.length < 1 || symbol.length > 5) {
      return false;
    }
    
    // ต้องเป็นตัวอักษรทั้งหมด
    if (!/^[A-Z]+$/.test(symbol)) {
      return false;
    }
    
    // ตรวจสอบว่าเป็น symbol ที่รู้จักหรือไม่
    if (this.popularStocks.has(symbol)) {
      return true;
    }
    
    return true; // อนุญาตให้ผ่านไปก่อน
  }

  /**
   * Batch detect symbols สำหรับหลายข่าว
   */
  detectSymbolsForArticles(articles) {
    const results = articles.map(article => ({
      ...article,
      symbols: this.detectSymbols(article)
    }));
    
    return results;
  }

  /**
   * ค้นหาข่าวที่เกี่ยวข้องกับ symbol นั้นๆ
   */
  filterArticlesBySymbol(articles, symbol) {
    const symbolUpper = symbol.toUpperCase();
    
    return articles.filter(article => {
      const detectedSymbols = this.detectSymbols(article);
      return detectedSymbols.includes(symbolUpper);
    });
  }

  /**
   * หา trending symbols จากข่าว
   */
  getTrendingSymbols(articles, limit = 10) {
    const symbolCount = new Map();
    
    articles.forEach(article => {
      const symbols = this.detectSymbols(article);
      symbols.forEach(symbol => {
        symbolCount.set(symbol, (symbolCount.get(symbol) || 0) + 1);
      });
    });
    
    // Sort by frequency
    const sorted = Array.from(symbolCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([symbol, count]) => ({
        symbol,
        count,
        name: this.popularStocks.get(symbol) || symbol
      }));
    
    return sorted;
  }

  /**
   * ค้นหาข้อมูล symbol จาก Finnhub (สำหรับ symbol ที่ไม่รู้จัก)
   */
  async lookupSymbol(query) {
    try {
      const response = await axios.get(`${this.baseURL}/search`, {
        params: {
          q: query,
          token: this.apiKey
        }
      });
      
      if (response.data.count > 0) {
        const results = response.data.result.slice(0, 5);
        
        // เก็บเข้า cache
        results.forEach(result => {
          this.symbolCache.set(result.symbol, result.description);
        });
        
        return results;
      }
      
      return [];
    } catch (error) {
      console.error('❌ Symbol lookup error:', error.message);
      return [];
    }
  }

  /**
   * ตรวจสอบและเติมข้อมูล symbol ที่ขาดหาย
   */
  async enrichSymbolData(symbols) {
    const enriched = [];
    
    for (const symbol of symbols) {
      if (this.symbolCache.has(symbol)) {
        enriched.push({
          symbol,
          name: this.symbolCache.get(symbol)
        });
      } else if (this.popularStocks.has(symbol)) {
        enriched.push({
          symbol,
          name: this.popularStocks.get(symbol)
        });
      } else {
        // Lookup จาก API
        const results = await this.lookupSymbol(symbol);
        if (results.length > 0) {
          enriched.push({
            symbol,
            name: results[0].description
          });
        } else {
          enriched.push({
            symbol,
            name: symbol
          });
        }
      }
    }
    
    return enriched;
  }

  /**
   * สร้าง summary ของ symbols ที่พบในชุดข่าว
   */
  generateSymbolSummary(articles) {
    const symbolData = new Map();
    
    articles.forEach(article => {
      const symbols = this.detectSymbols(article);
      
      symbols.forEach(symbol => {
        if (!symbolData.has(symbol)) {
          symbolData.set(symbol, {
            symbol,
            name: this.popularStocks.get(symbol) || symbol,
            articles: [],
            mentionCount: 0
          });
        }
        
        const data = symbolData.get(symbol);
        data.articles.push({
          id: article.id,
          headline: article.headline,
          datetime: article.datetime
        });
        data.mentionCount++;
      });
    });
    
    return Array.from(symbolData.values())
      .sort((a, b) => b.mentionCount - a.mentionCount);
  }
}

export default new SymbolDetector();