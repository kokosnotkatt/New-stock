// context/LanguageContext.jsx - แปลเฉพาะ UI
import { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

// 🎯 แปลเฉพาะข้อความ UI - ข่าวยังเป็นภาษาเดิม
const translations = {
  en: {
    nav: {
      home: 'Home',
      search: 'Search',
      watchlist: 'Watchlist'
    },
    header: {
      signIn: 'Sign In',
      signUp: 'Sign Up'
    },
    home: {
      latestNews: 'Latest News',
      realTimeUpdates: 'Real-time updates',
      trendingStocks: 'Trending Stocks',
      marketStatus: 'Market Status',
      status: 'Status',
      open: 'Open',
      closed: 'Closed',
      tradingHours: 'Trading Hours',
      quickLinks: 'Quick Links'
    },
    search: {
      placeholder: 'Search for stocks, news, topics...',
      filters: 'Filters',
      resultsFor: 'results for',
      noResults: 'No results found',
      clearSearch: 'Clear search',
      loadMore: 'Load More',
      loading: 'Loading...'
    },
    detail: {
      back: 'Back',
      share: 'Share',
      bookmark: 'Bookmark',
      relatedStocks: 'Related Stocks',
      relatedNews: 'Related News',
      readFullArticle: 'Read Full Article',
      source: 'Source'
    },
    watchlist: {
      title: 'Watchlist News',
      description: 'Latest news from your watchlist stocks',
      noStocks: 'No stocks in watchlist',
      retry: 'Retry'
    },
    common: {
      loading: 'Loading...',
      error: 'Error',
      refresh: 'Refresh'
    }
  },
  th: {
    nav: {
      home: 'หน้าแรก',
      search: 'ค้นหา',
      watchlist: 'รายการติดตาม'
    },
    header: {
      signIn: 'เข้าสู่ระบบ',
      signUp: 'สมัครสมาชิก'
    },
    home: {
      latestNews: 'ข่าวล่าสุด',
      realTimeUpdates: 'อัพเดทแบบเรียลไทม์',
      trendingStocks: 'หุ้นยอดนิยม',
      marketStatus: 'สถานะตลาด',
      status: 'สถานะ',
      open: 'เปิด',
      closed: 'ปิด',
      tradingHours: 'เวลาซื้อขาย',
      quickLinks: 'ลิงก์ด่วน'
    },
    search: {
      placeholder: 'ค้นหาหุ้น, ข่าว, หัวข้อ...',
      filters: 'ตัวกรอง',
      resultsFor: 'ผลลัพธ์สำหรับ',
      noResults: 'ไม่พบผลลัพธ์',
      clearSearch: 'ล้างการค้นหา',
      loadMore: 'โหลดเพิ่ม',
      loading: 'กำลังโหลด...'
    },
    detail: {
      back: 'กลับ',
      share: 'แชร์',
      bookmark: 'บุ๊คมาร์ก',
      relatedStocks: 'หุ้นที่เกี่ยวข้อง',
      relatedNews: 'ข่าวที่เกี่ยวข้อง',
      readFullArticle: 'อ่านบทความเต็ม',
      source: 'แหล่งที่มา'
    },
    watchlist: {
      title: 'ข่าวหุ้นติดตาม',
      description: 'ข่าวสารล่าสุดจากหุ้นในรายการติดตามของคุณ',
      noStocks: 'ไม่มีหุ้นในรายการติดตาม',
      retry: 'ลองอีกครั้ง'
    },
    common: {
      loading: 'กำลังโหลด...',
      error: 'ข้อผิดพลาด',
      refresh: 'รีเฟรช'
    }
  }
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem('app_language');
    return saved || 'th'; // Default: Thai
  });

  useEffect(() => {
    localStorage.setItem('app_language', language);
    document.documentElement.lang = language;
    console.log('✅ Language changed to:', language);
  }, [language]);

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'th' ? 'en' : 'th');
  };

  const t = (key) => {
    const keys = key.split('.');
    let value = translations[language];
    
    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        console.warn(`Translation not found: ${key}`);
        return key;
      }
    }
    
    return value || key;
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};