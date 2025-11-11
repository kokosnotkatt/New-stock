import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

class SymbolDetector {
  constructor() {
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
      ['V', 'Visa'],
      ['MA', 'Mastercard'],
      
      // Tech
      ['INTC', 'Intel'],
      ['CSCO', 'Cisco'],
      ['ORCL', 'Oracle'],
      ['IBM', 'IBM'],
      ['CRM', 'Salesforce'],
      ['ADBE', 'Adobe'],
      
      // Others
      ['DIS', 'Disney'],
      ['NFLX', 'Netflix'],
      ['PYPL', 'PayPal'],
      ['UBER', 'Uber'],
      ['LYFT', 'Lyft'],
      ['ABNB', 'Airbnb'],
      ['COIN', 'Coinbase'],
      ['SQ', 'Block'],
      ['SHOP', 'Shopify'],
      
      // Retail
      ['WMT', 'Walmart'],
      ['TGT', 'Target'],
      ['COST', 'Costco'],
      ['HD', 'Home Depot'],
      
      // Crypto-related
      ['MSTR', 'MicroStrategy'],
      
      // Auto
      ['F', 'Ford'],
      ['GM', 'General Motors'],
      ['RIVN', 'Rivian'],
      ['LCID', 'Lucid'],
      
      // Energy
      ['XOM', 'Exxon Mobil'],
      ['CVX', 'Chevron']
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
      ['MicroStrategy', 'MSTR'],
      ['JPMorgan Chase', 'JPM'],
      ['Bank of America', 'BAC'],
      ['Goldman Sachs', 'GS'],
      ['Morgan Stanley', 'MS']
    ]);
  }

  /**
   * หา symbols จากข้อความข่าว
   */
  detectSymbols(article) {
    const { headline = '', summary = '', title = '' } = article;
    const text = `${headline} ${title} ${summary}`.toLowerCase();
    const detectedSymbols = new Set();

    // 1. ตรวจหา symbols ที่มี $ นำหน้า
    const dollarSymbols = text.match(/\$[A-Z]{1,5}/gi);
    if (dollarSymbols) {
      dollarSymbols.forEach(symbol => {
        detectedSymbols.add(symbol.substring(1).toUpperCase());
      });
    }

    // 2. ตรวจหา symbols ในวงเล็บ
    const bracketSymbols = text.match(/\([A-Z]{1,5}\)/g);
    if (bracketSymbols) {
      bracketSymbols.forEach(match => {
        const symbol = match.replace(/[()]/g, '');
        if (this.isValidSymbol(symbol)) {
          detectedSymbols.add(symbol);
        }
      });
    }

    // 3. ตรวจหาชื่อบริษัท
    for (const [companyName, symbol] of this.companyNameMap.entries()) {
      const regex = new RegExp(`\\b${companyName}\\b`, 'i');
      if (regex.test(text)) {
        detectedSymbols.add(symbol);
      }
    }

    // 4. ตรวจหา popular symbols
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
   * ตรวจสอบว่า symbol valid หรือไม่
   */
  isValidSymbol(symbol) {
    if (!symbol || symbol.length < 1 || symbol.length > 5) {
      return false;
    }
    
    if (!/^[A-Z]+$/.test(symbol)) {
      return false;
    }
    
    if (this.popularStocks.has(symbol)) {
      return true;
    }
    
    return true;
  }

  /**
   * Batch detect symbols
   */
  detectSymbolsForArticles(articles) {
    const results = articles.map(article => ({
      ...article,
      symbols: this.detectSymbols(article)
    }));
    
    return results;
  }

  /**
   * ค้นหาข่าวที่เกี่ยวข้องกับ symbol
   */
  filterArticlesBySymbol(articles, symbol) {
    const symbolUpper = symbol.toUpperCase();
    
    return articles.filter(article => {
      const detectedSymbols = this.detectSymbols(article);
      return detectedSymbols.includes(symbolUpper);
    });
  }

  /**
   * หา trending symbols
   */
  getTrendingSymbols(articles, limit = 10) {
    const symbolCount = new Map();
    
    articles.forEach(article => {
      const symbols = this.detectSymbols(article);
      symbols.forEach(symbol => {
        symbolCount.set(symbol, (symbolCount.get(symbol) || 0) + 1);
      });
    });
    
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
   * ดึงชื่อบริษัทจาก symbol
   */
  getCompanyName(symbol) {
    const symbolUpper = symbol.toUpperCase();
    
    if (this.popularStocks.has(symbolUpper)) {
      return this.popularStocks.get(symbolUpper);
    }
    
    if (this.symbolCache.has(symbolUpper)) {
      return this.symbolCache.get(symbolUpper);
    }
    
    for (const [companyName, sym] of this.companyNameMap.entries()) {
      if (sym === symbolUpper) {
        return companyName;
      }
    }
    
    return symbolUpper;
  }

  /**
   * สร้าง summary
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
          headline: article.headline || article.title,
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