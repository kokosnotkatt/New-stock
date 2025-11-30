import TelegramBot from 'node-telegram-bot-api';

class TelegramService {
  constructor() {
    this.token = process.env.TELEGRAM_BOT_TOKEN;
    this.chatId = process.env.TELEGRAM_CHAT_ID;
    this.userLanguages = new Map();
    // ลบ this.aiAnalysisCache ออก เพราะไม่ต้องการเก็บ cache แล้ว

    if (!this.token) {
      console.warn('TELEGRAM_BOT_TOKEN not set');
      this.bot = null;
      return;
    }

    try {
      this.bot = new TelegramBot(this.token, { polling: true });
      this.loadUserLanguages();
      this.setupCommands();
      console.log('Telegram Bot initialized');
    } catch (error) {
      console.error('Failed to initialize Telegram Bot:', error);
      this.bot = null;
    }
  }

  async loadUserLanguages() {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');

      const langPath = path.join(process.cwd(), 'data', 'user_languages.json');

      try {
        const data = await fs.readFile(langPath, 'utf-8');
        const languages = JSON.parse(data);
        this.userLanguages = new Map(Object.entries(languages));
        console.log(`Loaded ${this.userLanguages.size} user language preferences`);
      } catch (error) {
        console.log('No user language preferences found, using defaults');
      }
    } catch (error) {
      console.error('Error loading user languages:', error);
    }
  }

  async saveUserLanguages() {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');

      const langPath = path.join(process.cwd(), 'data', 'user_languages.json');
      const languages = Object.fromEntries(this.userLanguages);

      await fs.mkdir(path.join(process.cwd(), 'data'), { recursive: true });
      await fs.writeFile(langPath, JSON.stringify(languages, null, 2));

      console.log('Saved user language preferences');
    } catch (error) {
      console.error('Error saving user languages:', error);
    }
  }

  getUserLanguage(userId) {
    return this.userLanguages.get(userId.toString()) || 'th';
  }

  async setUserLanguage(userId, language) {
    this.userLanguages.set(userId.toString(), language);
    await this.saveUserLanguages();
  }

  // --- แก้ไขตรงนี้: ตัดระบบ Cache ออก เรียก API ตรงๆ เลย ---
  getOrFetchAnalysis(symbol, language) {
    console.log(`Fetching fresh AI analysis for ${symbol} (${language})`);
    // เรียก analyzeStockAPI โดยตรงเพื่อให้คิดใหม่ทุกครั้ง
    return this.analyzeStockAPI(symbol, language);
  }

  getHelpMessage(lang = 'th') {
    if (lang === 'en') {
      return `
*Stock News Bot - Help*

*Language Commands:*
/th - Switch to Thai
/en - Switch to English

*Commands:*
/help - Show this help message
/watchlist - View your watchlist
/add <symbol> - Add stock to watchlist
/remove <symbol> - Remove stock from watchlist
/news <symbol> - Get latest news with full content
/analyze <symbol> - AI analysis of a stock
/latest - Get latest news from your watchlist
/link <code> - Link Telegram with Web app

*Examples:*
/add AAPL
/news NVDA
/analyze GOOGL

*Note:* All commands work in both Thai and English, case-insensitive.
Current language: English
      `.trim();
    }

    return `
*Stock News Bot - คำสั่งทั้งหมด*

*คำสั่งเปลี่ยนภาษา:*
/th - เปลี่ยนเป็นภาษาไทย
/en - เปลี่ยนเป็นภาษาอังกฤษ

*คำสั่งที่ใช้ได้:*
/help - แสดงคำสั่งทั้งหมด
/watchlist - ดู Watchlist ของคุณ
/add <symbol> - เพิ่มหุ้นเข้า Watchlist
/remove <symbol> - ลบหุ้นออกจาก Watchlist
/news <symbol> - ดูข่าวล่าสุดพร้อมเนื้อหาเต็ม
/analyze <symbol> - วิเคราะห์หุ้นด้วย AI
/latest - ดูข่าวล่าสุดจาก Watchlist
/link <code> - เชื่อมต่อ Telegram กับ Web

*ตัวอย่าง:*
/add AAPL
/news NVDA
/analyze GOOGL

*หมายเหตุ:* คำสั่งใช้ได้ทั้งภาษาไทยและอังกฤษ ไม่สนพิมพ์ใหญ่เล็ก
ภาษาปัจจุบัน: ไทย
    `.trim();
  }

  setupCommands() {
    if (!this.bot) return;

    this.bot.onText(/\/th$/i, async (msg) => {
      const chatId = msg.chat.id;
      const userId = msg.from.id;

      await this.setUserLanguage(userId, 'th');
      this.bot.sendMessage(chatId, 'เปลี่ยนภาษาเป็นภาษาไทยแล้ว\n\nใช้ /help เพื่อดูคำสั่งทั้งหมด');
    });

    this.bot.onText(/\/en$/i, async (msg) => {
      const chatId = msg.chat.id;
      const userId = msg.from.id;

      await this.setUserLanguage(userId, 'en');
      this.bot.sendMessage(chatId, 'Language changed to English\n\nUse /help to see all commands');
    });

    this.bot.onText(/\/start/i, (msg) => {
      const chatId = msg.chat.id;
      const userId = msg.from.id;
      const lang = this.getUserLanguage(userId);
      this.bot.sendMessage(chatId, this.getHelpMessage(lang), { parse_mode: 'Markdown' });
    });

    this.bot.onText(/\/help/i, (msg) => {
      const chatId = msg.chat.id;
      const userId = msg.from.id;
      const lang = this.getUserLanguage(userId);
      this.bot.sendMessage(chatId, this.getHelpMessage(lang), { parse_mode: 'Markdown' });
    });

    this.bot.onText(/\/(watchlist|รายการหุ้น|ดูรายการ)/i, async (msg) => {
      const chatId = msg.chat.id;
      const userId = msg.from.id;
      const lang = this.getUserLanguage(userId);

      try {
        const watchlist = await this.getWatchlist(userId);

        if (watchlist.length === 0) {
          const message = lang === 'en'
            ? 'Watchlist is empty\nUse /add AAPL to add stocks'
            : 'Watchlist ว่างเปล่า\nใช้ /add AAPL เพื่อเพิ่มหุ้น';
          this.bot.sendMessage(chatId, message);
          return;
        }

        const stockList = watchlist.map((stock, i) =>
          `${i + 1}. ${stock.symbol} ${stock.alertEnabled ? '[Alert ON]' : '[Alert OFF]'}`
        ).join('\n');

        const header = lang === 'en'
          ? `*Your Watchlist (${watchlist.length} stocks)*`
          : `*Watchlist ของคุณ (${watchlist.length} หุ้น)*`;

        this.bot.sendMessage(chatId, `${header}\n\n${stockList}`, {
          parse_mode: 'Markdown'
        });
      } catch (error) {
        console.error('Error fetching watchlist:', error);
        const message = lang === 'en' ? 'An error occurred' : 'เกิดข้อผิดพลาด';
        this.bot.sendMessage(chatId, message);
      }
    });

    this.bot.onText(/\/(add|เพิ่ม|เพิ่มหุ้น)\s+(.+)/i, async (msg, match) => {
      const chatId = msg.chat.id;
      const userId = msg.from.id;
      const symbol = match[2].trim().toUpperCase();
      const lang = this.getUserLanguage(userId);

      try {
        const loadingMsg = lang === 'en'
          ? `Adding ${symbol}...`
          : `กำลังเพิ่ม ${symbol}...`;
        this.bot.sendMessage(chatId, loadingMsg);

        const result = await this.addToWatchlist(symbol, userId);

        if (result.success) {
          const successMsg = lang === 'en'
            ? `Added ${symbol} to your watchlist!`
            : `เพิ่ม ${symbol} เข้า Watchlist แล้ว!`;
          this.bot.sendMessage(chatId, successMsg);
        } else {
          const errorMsg = lang === 'en'
            ? `Stock ${symbol} not found`
            : `ไม่พบข้อมูลหุ้น ${symbol}`;
          this.bot.sendMessage(chatId, errorMsg);
        }
      } catch (error) {
        console.error('Error adding stock:', error);
        const message = lang === 'en' ? 'An error occurred' : 'เกิดข้อผิดพลาด';
        this.bot.sendMessage(chatId, message);
      }
    });

    this.bot.onText(/\/(remove|ลบ|ลบหุ้น)\s+(.+)/i, async (msg, match) => {
      const chatId = msg.chat.id;
      const userId = msg.from.id;
      const symbol = match[2].trim().toUpperCase();
      const lang = this.getUserLanguage(userId);

      try {
        const result = await this.removeFromWatchlist(symbol, userId);

        if (result.success) {
          const successMsg = lang === 'en'
            ? `Removed ${symbol} from your watchlist`
            : `ลบ ${symbol} ออกจาก Watchlist แล้ว`;
          this.bot.sendMessage(chatId, successMsg);
        } else {
          const errorMsg = lang === 'en'
            ? `${symbol} is not in your watchlist`
            : `ไม่มี ${symbol} ใน Watchlist`;
          this.bot.sendMessage(chatId, errorMsg);
        }
      } catch (error) {
        console.error('Error removing stock:', error);
        const message = lang === 'en' ? 'An error occurred' : 'เกิดข้อผิดพลาด';
        this.bot.sendMessage(chatId, message);
      }
    });

    this.bot.onText(/\/(news|ข่าว|ข่าวหุ้น)\s+(.+)/i, async (msg, match) => {
      const chatId = msg.chat.id;
      const userId = msg.from.id;
      const symbol = match[2].trim().toUpperCase();
      const lang = this.getUserLanguage(userId);

      try {
        const loadingMsg = lang === 'en'
          ? `Fetching news for ${symbol}...`
          : `กำลังดึงข่าว ${symbol}...`;
        this.bot.sendMessage(chatId, loadingMsg);

        const news = await this.getStockNews(symbol, 3, lang);

        if (news.length === 0) {
          const noNewsMsg = lang === 'en'
            ? `No news found for ${symbol}`
            : `ไม่มีข่าวสำหรับ ${symbol}`;
          this.bot.sendMessage(chatId, noNewsMsg);
          return;
        }

        await this.sendFullNewsMessages(chatId, symbol, news, lang);
      } catch (error) {
        console.error('Error fetching news:', error);
        const message = lang === 'en' ? 'An error occurred' : 'เกิดข้อผิดพลาด';
        this.bot.sendMessage(chatId, message);
      }
    });

    this.bot.onText(/\/(analyze|วิเคราะห์|วิเคราะห์หุ้น)\s+(.+)/i, async (msg, match) => {
      const chatId = msg.chat.id;
      const userId = msg.from.id;
      const symbol = match[2].trim().toUpperCase();
      const lang = this.getUserLanguage(userId);

      try {
        const loadingMsg = lang === 'en'
          ? `Analyzing ${symbol} with AI...`
          : `กำลังวิเคราะห์ ${symbol} ด้วย AI...`;
        this.bot.sendMessage(chatId, loadingMsg);

        const analysis = await this.getOrFetchAnalysis(symbol, lang);

        if (analysis) {
          this.bot.sendMessage(chatId, analysis, { parse_mode: 'Markdown' });
        } else {
          const errorMsg = lang === 'en'
            ? 'Unable to analyze'
            : 'ไม่สามารถวิเคราะห์ได้';
          this.bot.sendMessage(chatId, errorMsg);
        }
      } catch (error) {
        console.error('Error analyzing stock:', error);
        const message = lang === 'en' ? 'An error occurred' : 'เกิดข้อผิดพลาด';
        this.bot.sendMessage(chatId, message);
      }
    });

    this.bot.onText(/\/(latest|ล่าสุด|ข่าวล่าสุด)/i, async (msg) => {
      const chatId = msg.chat.id;
      const userId = msg.from.id;
      const lang = this.getUserLanguage(userId);

      try {
        const loadingMsg = lang === 'en'
          ? 'Fetching latest news...'
          : 'กำลังดึงข่าวล่าสุด...';
        this.bot.sendMessage(chatId, loadingMsg);

        const watchlist = await this.getWatchlist(userId);

        if (watchlist.length === 0) {
          const message = lang === 'en'
            ? 'Watchlist is empty'
            : 'Watchlist ว่างเปล่า';
          this.bot.sendMessage(chatId, message);
          return;
        }

        for (const stock of watchlist.slice(0, 5)) {
          const news = await this.getStockNews(stock.symbol, 1, lang);
          if (news.length > 0) {
            await this.sendFullNewsMessages(chatId, stock.symbol, news, lang);
          }
        }
      } catch (error) {
        console.error('Error fetching latest news:', error);
        const message = lang === 'en' ? 'An error occurred' : 'เกิดข้อผิดพลาด';
        this.bot.sendMessage(chatId, message);
      }
    });

    this.bot.onText(/\/(link|เชื่อม|เชื่อมต่อ)\s+(.+)/i, async (msg, match) => {
      const chatId = msg.chat.id;
      const userId = msg.from.id;
      const username = msg.from.username || msg.from.first_name || 'User';
      const code = match[2].trim().toUpperCase();
      const lang = this.getUserLanguage(userId);

      try {
        console.log(`Link attempt: User ${userId} (${username}) with code ${code}`);

        const result = await this.linkUserWithCode(userId, username, code);

        if (result.success) {
          const successMsg = lang === 'en' ? `
Account linked successfully!

Username: ${username}
Your Watchlist will now sync with Web

You can now:
- Add/remove stocks in Telegram -> See in Web
- Add/remove stocks in Web -> See in Telegram

Use /watchlist to view your watchlist` : `
เชื่อมบัญชีสำเร็จ!

Username: ${username}
Watchlist ของคุณจะ sync กับ Web แล้ว

ตอนนี้คุณสามารถ:
- เพิ่ม/ลบหุ้นใน Telegram -> เห็นใน Web
- เพิ่ม/ลบหุ้นใน Web -> เห็นใน Telegram

ใช้ /watchlist เพื่อดู Watchlist ของคุณ`;
          this.bot.sendMessage(chatId, successMsg, { parse_mode: 'Markdown' });
        } else {
          const errorMsg = lang === 'en' ? `
Invalid or expired code

Please:
1. Go to Settings page on Web
2. Click "Generate New Code"
3. Send /link [CODE] again

Note: Code expires in 5 minutes` : `
Code ไม่ถูกต้องหรือหมดอายุแล้ว

กรุณา:
1. ไปที่หน้า Settings ใน Web
2. กด "สร้าง Code ใหม่"
3. ส่ง /link [CODE] อีกครั้ง

หมายเหตุ: Code มีอายุ 5 นาที`;
          this.bot.sendMessage(chatId, errorMsg);
        }
      } catch (error) {
        console.error('Error linking user:', error);
        const message = lang === 'en'
          ? 'An error occurred, please try again'
          : 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง';
        this.bot.sendMessage(chatId, message);
      }
    });

    this.bot.onText(/\/myid/i, (msg) => {
      const chatId = msg.chat.id;
      const userId = msg.from.id;
      const username = msg.from.username || msg.from.first_name || 'User';
      const lang = this.getUserLanguage(userId);

      const message = lang === 'en' ? `
*Your Information*

User ID: \`${userId}\`
Username: ${username}
Chat ID: \`${chatId}\`
Language: English

For debugging purposes` : `
*ข้อมูลของคุณ*

User ID: \`${userId}\`
Username: ${username}
Chat ID: \`${chatId}\`
ภาษา: ไทย

ใช้สำหรับ debug`;

      this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    });
  }

  async sendFullNewsMessages(chatId, symbol, newsArray, lang = 'th') {
    for (const article of newsArray) {
      const message = this.formatFullNewsMessage(symbol, article, lang);

      try {
        await this.bot.sendMessage(chatId, message, {
          parse_mode: 'Markdown',
          disable_web_page_preview: false
        });

        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error('Error sending news message:', error);
        try {
          const plainMessage = this.stripMarkdown(message);
          await this.bot.sendMessage(chatId, plainMessage);
        } catch (fallbackError) {
          console.error('Fallback also failed:', fallbackError);
        }
      }
    }
  }

  formatFullNewsMessage(symbol, article, lang = 'th') {
    const date = new Date(article.datetime * 1000).toLocaleString(lang === 'en' ? 'en-US' : 'th-TH');
    const headline = article.headline || article.title || 'No headline';
    const summary = article.summary || '';
    const url = article.url || '';
    const source = article.source || 'Unknown';

    const timeLabel = lang === 'en' ? 'Time' : 'เวลา';
    const sourceLabel = lang === 'en' ? 'Source' : 'แหล่งที่มา';
    const readMoreLabel = lang === 'en' ? 'Read full article' : 'อ่านบทความเต็ม';

    let content = `*${symbol} News*\n\n`;
    content += `*${this.escapeMarkdown(headline)}*\n\n`;

    if (summary && summary.length > 0) {
      content += `${this.escapeMarkdown(summary)}\n\n`;
    }

    content += `${sourceLabel}: ${this.escapeMarkdown(source)}\n`;
    content += `${timeLabel}: ${date}\n`;

    if (url) {
      content += `\n[${readMoreLabel}](${url})`;
    }

    return content;
  }

  escapeMarkdown(text) {
    if (!text) return '';
    return text
      .replace(/'/g, "\\'")
      .replace(/"/g, '\\"')
      .replace(/\\/g, '\\\\')
      .replace(/_/g, '\\_')
      .replace(/\*/g, '\\*')
      .replace(/\[/g, '\\[')
      .replace(/\]/g, '\\]')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)')
      .replace(/~/g, '\\~')
      .replace(/`/g, '\\`')
      .replace(/>/g, '\\>')
      .replace(/#/g, '\\#')
      .replace(/\+/g, '\\+')
      .replace(/-/g, '\\-')
      .replace(/=/g, '\\=')
      .replace(/\|/g, '\\|')
      .replace(/\{/g, '\\{')
      .replace(/\}/g, '\\}')
      .replace(/\./g, '\\.')
      .replace(/!/g, '\\!');
  }

  stripMarkdown(text) {
    return text
      .replace(/\*/g, '')
      .replace(/_/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/`/g, '');
  }

  async sendNewsNotification(symbol, newsArray) {
    if (!this.bot || !this.chatId) return;

    try {
      await this.sendFullNewsMessages(this.chatId, symbol, newsArray, 'th');
      console.log(`Sent ${newsArray.length} news for ${symbol}`);
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  async linkUserWithCode(userId, username, code) {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');

      const linkCodesPath = path.join(process.cwd(), 'data', 'link_codes.json');

      let linkCodes = {};
      try {
        const data = await fs.readFile(linkCodesPath, 'utf-8');
        linkCodes = JSON.parse(data);
      } catch (error) {
        linkCodes = {};
      }

      const linkData = linkCodes[code];

      if (!linkData) {
        console.log(`Code ${code} not found`);
        return { success: false, message: 'Code not found' };
      }

      if (linkData.linked) {
        console.log(`Code ${code} already used`);
        return { success: false, message: 'Code already used' };
      }

      if (Date.now() > linkData.expiresAt) {
        console.log(`Code ${code} expired`);
        return { success: false, message: 'Code expired' };
      }

      linkData.userId = userId;
      linkData.username = username;
      linkData.linked = true;
      linkData.linkedAt = Date.now();

      linkCodes[code] = linkData;
      await fs.writeFile(linkCodesPath, JSON.stringify(linkCodes, null, 2));

      const mappingPath = path.join(process.cwd(), 'data', 'session_user_mapping.json');
      let mapping = {};

      try {
        const data = await fs.readFile(mappingPath, 'utf-8');
        mapping = JSON.parse(data);
      } catch (error) {
        mapping = {};
      }

      mapping[linkData.sessionId] = {
        userId: userId,
        username: username,
        linkedAt: Date.now()
      };

      await fs.writeFile(mappingPath, JSON.stringify(mapping, null, 2));

      console.log(`Linked: Session ${linkData.sessionId} -> User ${userId} (${username})`);

      return { success: true, userId, sessionId: linkData.sessionId };

    } catch (error) {
      console.error('Error linking user:', error);
      return { success: false, message: error.message };
    }
  }

  async getWatchlist(sessionIdOrUserId = null) {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');

      if (!sessionIdOrUserId) {
        const filePath = path.join(process.cwd(), 'data', 'watchlist.json');
        try {
          const data = await fs.readFile(filePath, 'utf-8');
          return JSON.parse(data);
        } catch (error) {
          return [];
        }
      }

      let userId = null;

      if (typeof sessionIdOrUserId === 'number') {
        userId = sessionIdOrUserId;
      } else {
        userId = await this.getUserIdFromSession(sessionIdOrUserId);
      }

      if (userId) {
        const filename = `watchlist_user_${userId}.json`;
        const filePath = path.join(process.cwd(), 'data', filename);

        try {
          const data = await fs.readFile(filePath, 'utf-8');
          return JSON.parse(data);
        } catch (error) {
          return [];
        }
      }

      const filename = `watchlist_${sessionIdOrUserId}.json`;
      const filePath = path.join(process.cwd(), 'data', filename);

      try {
        const data = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(data);
      } catch (error) {
        return [];
      }
    } catch (error) {
      console.error('Error reading watchlist:', error);
      return [];
    }
  }

  async saveWatchlist(watchlist, sessionIdOrUserId = null) {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');

      let userId = null;
      let filename;

      if (!sessionIdOrUserId) {
        filename = 'watchlist.json';
      } else if (typeof sessionIdOrUserId === 'number') {
        userId = sessionIdOrUserId;
        filename = `watchlist_user_${userId}.json`;
      } else {
        userId = await this.getUserIdFromSession(sessionIdOrUserId);

        if (userId) {
          filename = `watchlist_user_${userId}.json`;
        } else {
          filename = `watchlist_${sessionIdOrUserId}.json`;
        }
      }

      const filePath = path.join(process.cwd(), 'data', filename);
      await fs.mkdir(path.join(process.cwd(), 'data'), { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(watchlist, null, 2));

      console.log(`Saved watchlist to: ${filename}`);

      return true;
    } catch (error) {
      console.error('Error saving watchlist:', error);
      return false;
    }
  }

  async getUserIdFromSession(sessionId) {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');

      const mappingPath = path.join(process.cwd(), 'data', 'session_user_mapping.json');

      try {
        const data = await fs.readFile(mappingPath, 'utf-8');
        const mapping = JSON.parse(data);
        return mapping[sessionId]?.userId || null;
      } catch (error) {
        return null;
      }
    } catch (error) {
      console.error('Error getting userId from session:', error);
      return null;
    }
  }

  async addToWatchlist(symbol, sessionIdOrUserId = null) {
    try {
      const newsCheck = await this.getStockNews(symbol, 1);

      if (newsCheck.length === 0) {
        return { success: false, message: 'Stock not found' };
      }

      const watchlist = await this.getWatchlist(sessionIdOrUserId);

      if (watchlist.some(stock => stock.symbol === symbol)) {
        return { success: false, message: 'Already in watchlist' };
      }

      watchlist.push({
        symbol: symbol,
        addedAt: new Date().toISOString(),
        alertEnabled: true
      });

      await this.saveWatchlist(watchlist, sessionIdOrUserId);
      return { success: true };
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      return { success: false, message: error.message };
    }
  }

  async removeFromWatchlist(symbol, sessionIdOrUserId = null) {
    try {
      const watchlist = await this.getWatchlist(sessionIdOrUserId);
      const index = watchlist.findIndex(stock => stock.symbol === symbol);

      if (index === -1) {
        return { success: false, message: 'Not in watchlist' };
      }

      watchlist.splice(index, 1);
      await this.saveWatchlist(watchlist, sessionIdOrUserId);
      return { success: true };
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      return { success: false, message: error.message };
    }
  }

  async getStockNews(symbol, limit = 3, language = 'th') {
    try {
      const fetch = (await import('node-fetch')).default;
      const response = await fetch(
        `http://localhost:5001/api/news/by-symbol/${symbol}?limit=${limit}&language=${language}`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching news:', error);
      return [];
    }
  }

  async analyzeStockAPI(symbol, language = 'th') {
    try {
      const fetch = (await import('node-fetch')).default;

      const news = await this.getStockNews(symbol, 1, language);

      if (news.length === 0) {
        return null;
      }

      const article = news[0];

      const response = await fetch('http://localhost:5001/api/news/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          article: {
            id: article.id,
            headline: article.headline || article.title,
            title: article.headline || article.title,
            summary: article.summary || '',
            source: article.source,
            symbols: [symbol]
          },
          language: language
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.analysis) {
        const analysis = data.analysis;

        const sentiment = this.escapeMarkdown(analysis.sentimentLabel || analysis.sentiment || 'N/A');
        const score = analysis.sentimentScore || 'N/A';
        const summary = this.escapeMarkdown(analysis.summary || (language === 'en' ? 'No data' : 'ไม่มีข้อมูล'));
        const impact = this.escapeMarkdown(analysis.impact || (language === 'en' ? 'Unknown' : 'ไม่ทราบ'));
        const risk = this.escapeMarkdown(analysis.riskLevel || 'medium');

        if (language === 'en') {
          return `*AI Analysis: ${symbol}*\n\n*Sentiment:* ${sentiment}\n*Score:* ${score}/100\n\n*Summary:*\n${summary}\n\n*Impact:*\n${impact}\n\n*Risk Level:* ${risk}\n\n_Powered by Gemini AI_`;
        }

        return `*AI Analysis: ${symbol}*\n\n*Sentiment:* ${sentiment}\n*Score:* ${score}/100\n\n*สรุป:*\n${summary}\n\n*ผลกระทบ:*\n${impact}\n\n*ระดับความเสี่ยง:* ${risk}\n\n_Powered by Gemini AI_`;
      }

      return null;
    } catch (error) {
      console.error('Error analyzing stock:', error);
      return null;
    }
  }
}

export default new TelegramService();