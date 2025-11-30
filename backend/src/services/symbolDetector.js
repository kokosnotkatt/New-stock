import axios from 'axios';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

class SymbolDetector {
  constructor() {
    this.symbolCache = new Map();
    this.allStocks = new Map(); // 
    this.symbolToExchange = new Map(); 
    
    this.loadStocksFromCSV();
    
    this.popularStocks = new Set([
      'AAPL', 'MSFT', 'GOOGL', 'GOOG', 'AMZN', 'META', 'TSLA', 'NVDA', 'AMD',
      'JPM', 'BAC', 'WFC', 'GS', 'MS', 'V', 'MA',
      'INTC', 'CSCO', 'ORCL', 'IBM', 'CRM', 'ADBE',
      'DIS', 'NFLX', 'PYPL', 'UBER', 'LYFT', 'ABNB', 'COIN', 'SQ', 'SHOP',
      'WMT', 'TGT', 'COST', 'HD', 'MSTR', 'F', 'GM', 'RIVN', 'LCID',
      'XOM', 'CVX'
    ]);
    
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
   *  โหลดข้อมูลหุ้นจาก CSV
   */
  loadStocksFromCSV() {
    try {
      const csvPath = path.join(process.cwd(), 'data', 'completed_us_stock.csv');
      
      if (!fs.existsSync(csvPath)) {
        console.warn('  CSV file not found, using limited stock data');
        return;
      }

      const csvData = fs.readFileSync(csvPath, 'utf-8');
      const lines = csvData.split('\n');
      
      // ข้าม header
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const [fullSymbol, logoUrl] = line.split(',');
        if (!fullSymbol) continue;
        
        // แยก exchange:symbol
        const parts = fullSymbol.split(':');
        let symbol, exchange;
        
        if (parts.length === 2) {
          exchange = parts[0];
          symbol = parts[1];
        } else {
          symbol = fullSymbol;
          exchange = 'UNKNOWN';
        }
        
        // เก็บข้อมูล
        this.allStocks.set(symbol, {
          symbol: symbol,
          exchange: exchange,
          fullSymbol: fullSymbol,
          logoUrl: logoUrl?.trim()
        });
        
        this.symbolToExchange.set(fullSymbol, symbol);
      }
      
      console.log(` Loaded ${this.allStocks.size} stocks from CSV`);
      
    } catch (error) {
      console.error(' Error loading CSV:', error.message);
    }
  }

  /**
   *  หา symbols จากข้อความ (อัพเดทให้ตรวจจับได้มากขึ้น)
   */
  detectSymbols(article) {
    const { headline = '', summary = '', title = '' } = article;
    const text = `${headline} ${title} ${summary}`.toLowerCase();
    const detectedSymbols = new Set();

    // 1. ตรวจหา symbols ที่มี $ นำหน้า
    const dollarSymbols = text.match(/\$[A-Z]{1,5}/gi);
    if (dollarSymbols) {
      dollarSymbols.forEach(symbol => {
        const sym = symbol.substring(1).toUpperCase();
        if (this.isValidSymbol(sym)) {
          detectedSymbols.add(sym);
        }
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

    // 4. ตรวจหา popular symbols (ให้ priority สูง)
    for (const symbol of this.popularStocks) {
      const symbolRegex = new RegExp(`\\b${symbol}\\b`, 'i');
      
      if (symbolRegex.test(text)) {
        detectedSymbols.add(symbol);
      }
    }

    // 5.  ตรวจหา symbols อื่นๆ จาก CSV (ระวังการ match ที่ผิด)
    const words = text.match(/\b[A-Z]{2,5}\b/g);
    if (words) {
      words.forEach(word => {
        const upperWord = word.toUpperCase();
        if (this.allStocks.has(upperWord) && this.isValidSymbol(upperWord)) {
          // ตรวจสอบว่าไม่ใช่คำทั่วไป
          if (!this.isCommonWord(upperWord)) {
            detectedSymbols.add(upperWord);
          }
        }
      });
    }

    return Array.from(detectedSymbols);
  }

  /**
   * ✅ ตรวจสอบว่าเป็นคำทั่วไปหรือไม่ (เพื่อไม่ให้เข้าใจผิด)
   */
  isCommonWord(word) {
    const commonWords = new Set([
      'THE', 'AND', 'FOR', 'ARE', 'BUT', 'NOT', 'YOU', 'ALL', 'CAN', 'HER',
      'WAS', 'ONE', 'OUR', 'OUT', 'DAY', 'GET', 'HAS', 'HIM', 'HIS', 'HOW',
      'ITS', 'MAY', 'NEW', 'NOW', 'OLD', 'SEE', 'TWO', 'WAY', 'WHO', 'BOY',
      'DID', 'CAR', 'EAT', 'FAR', 'FUN', 'GOT', 'HOT', 'LET', 'PUT', 'RAN',
      'RED', 'RUN', 'SAT', 'SAY', 'SHE', 'SIT', 'TEN', 'TOP', 'TOO', 'TRY',
      'USE', 'VAN', 'WIN', 'YES', 'YET', 'AGO', 'AIR', 'ANY', 'ARM', 'ART',
      'ASK', 'BAD', 'BAG', 'BED', 'BIG', 'BOX', 'BUY', 'CUT', 'DIE', 'DOG',
      'DRY', 'END', 'EYE', 'FEW', 'FIT', 'FLY', 'GOD', 'GUN', 'HAD', 'HOT'
    ]);
    
    return commonWords.has(word);
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
    
    // ถ้าเป็น popular stock ให้ผ่านเลย
    if (this.popularStocks.has(symbol)) {
      return true;
    }
    
    // ถ้ามีใน CSV ให้ผ่าน
    if (this.allStocks.has(symbol)) {
      return true;
    }
    
    return false;
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
        name: this.getCompanyName(symbol)
      }));
    
    return sorted;
  }

  /**
   * ดึงชื่อบริษัทจาก symbol (อัพเดทให้ใช้ CSV)
   */
  getCompanyName(symbol) {
    const symbolUpper = symbol.toUpperCase();
    
    // ตรวจจาก CSV ก่อน
    if (this.allStocks.has(symbolUpper)) {
      const stock = this.allStocks.get(symbolUpper);
      return stock.fullSymbol; // คืน exchange:symbol
    }
    
    // ตรวจจาก cache
    if (this.symbolCache.has(symbolUpper)) {
      return this.symbolCache.get(symbolUpper);
    }
    
    // ตรวจจาก company name map
    for (const [companyName, sym] of this.companyNameMap.entries()) {
      if (sym === symbolUpper) {
        return companyName;
      }
    }
    
    return symbolUpper;
  }

  /**
   *  ดึงข้อมูลหุ้นจาก symbol
   */
  getStockInfo(symbol) {
    const symbolUpper = symbol.toUpperCase();
    
    if (this.allStocks.has(symbolUpper)) {
      return this.allStocks.get(symbolUpper);
    }
    
    return null;
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
          const stockInfo = this.getStockInfo(symbol);
          symbolData.set(symbol, {
            symbol,
            name: this.getCompanyName(symbol),
            exchange: stockInfo?.exchange || 'UNKNOWN',
            logoUrl: stockInfo?.logoUrl || null,
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