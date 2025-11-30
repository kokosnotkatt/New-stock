import cron from 'node-cron';
import telegramService from '../services/telegramService.js';

class NewsChecker {
  constructor() {
    this.lastChecked = {};
    this.isRunning = false;
  }

  start() {
    if (this.isRunning) {
      console.log('  News checker already running');
      return;
    }

    // ตรวจสอบข่าวทุก 30 นาที
    cron.schedule('*/30 * * * *', async () => {
      await this.checkForNewNews();
    });

    // ตรวจสอบทันทีตอน start
    this.checkForNewNews();

    this.isRunning = true;
    console.log(' News checker started (every 30 minutes)');
  }

  async checkForNewNews() {
    try {
      console.log(' Checking for new news...');

      const watchlist = await telegramService.getWatchlist();

      if (watchlist.length === 0) {
        console.log(' Watchlist is empty');
        return;
      }

      for (const stock of watchlist) {
        // ข้ามถ้าปิดการแจ้งเตือน
        if (!stock.alertEnabled) continue;

        try {
          const news = await telegramService.getStockNews(stock.symbol, 5);

          if (news.length === 0) continue;

          // หาข่าวใหม่ (ที่ยังไม่เคยส่ง)
          const newNews = this.filterNewNews(stock.symbol, news);

          if (newNews.length > 0) {
            console.log(` Found ${newNews.length} new articles for ${stock.symbol}`);
            
            // ส่งแค่ข่าวล่าสุด 3 ข่าว
            await telegramService.sendNewsNotification(
              stock.symbol,
              newNews.slice(0, 3)
            );

            // อัพเดท lastChecked
            this.updateLastChecked(stock.symbol, news[0].datetime);
          }

          // Delay เพื่อไม่ให้เรียก API บ่อยเกินไป
          await this.delay(2000);
        } catch (error) {
          console.error(`Error checking ${stock.symbol}:`, error);
        }
      }

      console.log(' News check completed');
    } catch (error) {
      console.error('Error in news checker:', error);
    }
  }

  filterNewNews(symbol, newsArray) {
    const lastTime = this.lastChecked[symbol] || 0;

    return newsArray.filter(article => article.datetime > lastTime);
  }

  updateLastChecked(symbol, timestamp) {
    this.lastChecked[symbol] = timestamp;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  stop() {
    this.isRunning = false;
    console.log(' News checker stopped');
  }
}

export default new NewsChecker();