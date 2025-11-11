// context/LanguageContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

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
    login: {
      welcome: 'Welcome back',
      signInContinue: 'Sign in to continue to your account',
      emailLabel: 'Email',
      emailPlaceholder: 'Enter your email',
      passwordLabel: 'Password',
      passwordPlaceholder: 'Enter your password',
      rememberMe: 'Remember me',
      forgotPassword: 'Forgot password?',
      signInBtn: 'Sign In',
      signingIn: 'Signing in...',
      or: 'or',
      continueWithGoogle: 'Continue with Google',
      continueWithLine: 'Continue with LINE',
      noAccount: "Don't have an account?",
      signUpLink: 'Sign up'
    },
    signup: {
      createAccount: 'Create account',
      joinUs: 'Join us to start tracking stocks',
      nameLabel: 'Full Name',
      namePlaceholder: 'Enter your name',
      emailLabel: 'Email',
      emailPlaceholder: 'Enter your email',
      passwordLabel: 'Password',
      passwordPlaceholder: 'Create a password',
      confirmPasswordLabel: 'Confirm Password',
      confirmPasswordPlaceholder: 'Confirm your password',
      agreeTo: 'I agree to the',
      terms: 'Terms of Service',
      and: 'and',
      privacy: 'Privacy Policy',
      createAccountBtn: 'Create Account',
      creatingAccount: 'Creating account...',
      haveAccount: 'Already have an account?',
      signInLink: 'Sign in'
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
      quickLinks: 'Quick Links',
      // (*** เพิ่ม 4 บรรทัดนี้ ***)
      linkMarketOverview: 'Market Overview',
      linkEconCalendar: 'Economic Calendar',
      linkEarningsReports: 'Earnings Reports',
      linkIpoCalendar: 'IPO Calendar'
    },
    search: {
      placeholder: 'Search stocks, news, ',
      placeholder2: 'or search for topics of interest' , 
      filters: 'Filters',
      resultsFor: 'results for',
      noResults: 'No results found',
      noResultsDesc: 'Try adjusting your search terms or filters',
      clearSearch: 'Clear search',
      loadMore: 'Load More',
      loading: 'Loading...',
      searching: 'Searching...',
      recentSearches: 'Recent Searches',
      trendingTopics: 'Trending Topics',
      clear: 'Clear',
      catAll: 'All Categories',
      catStocks: 'Stocks',
      catAI: 'AI Technology',
      catMarket: 'Market Trends',
      catCrypto: 'Cryptocurrency',
      catTech: 'Technology',
      timeAll: 'All Time',
      timeToday: 'Today',
      timeWeek: 'This Week',
      timeMonth: 'This Month',
      timeYear: 'This Year',
      sortRelevance: 'Most Relevant',
      sortRecent: 'Most Recent',
      sortPopular: 'Most Popular'
    },
    newsCard: {
      match: 'match'
    },
    trending: {
      title: 'Trending Stocks',
      error: 'Failed to load trending symbols',
      mentions: 'mentions',
      mention: 'mention',
      noTrending: 'No trending stocks found'
    },
    newsList: {
      loading: 'Loading news...',
      error: 'Failed to fetch news',
    },
    banner: {
      loading: 'Loading CNBC news...',
      noNews: 'No CNBC news available',
      readMore: 'Read more on CNBC',
      usingFallback: 'Using fallback content',
      fallback: {
        cnbcTitle: 'CNBC Market News',
        cnbcDesc: 'Stay updated with the latest market trends and financial news from CNBC.',
        bizTitle: 'Business & Finance',
        bizDesc: "Get expert analysis and insights on business trends from CNBC's top analysts.",
        stockTitle: 'Stock Market Updates',
        stockDesc: 'Real-time updates and breaking news about the stock market from CNBC.'
      }
    },
    detail: {
      back: 'Back',
      share: 'Share',
      bookmark: 'Bookmark',
      relatedStocks: 'Related Stocks',
      relatedNews: 'Related News',
      readFullArticle: 'Read Full Article',
      source: 'Source',
      viewOriginal: 'View Original',
      loading: 'Loading article...',
      notFoundTitle: 'Article Not Found',
      notFoundDesc: 'The article you are looking for does not exist.',
      backHome: 'Back to Home'
    },
    watchlist: {
      title: 'Watchlist News',
      description: 'Latest news from your watchlist stocks',
      alerts: 'Alerts',
      noNews: 'No news available for your watchlist stocks',
      noStocksInList: 'No stocks in watchlist',
      addStocksPrompt: 'Add stocks to your watchlist to see related news here',
      addStockBtn: 'Add Stock to Watchlist',
      loadingNews: 'Loading news from {count} stocks...',
      stocks: 'stocks'
    },
    langToggle: {
      titleEN: 'Switch to English',
      titleTH: 'เปลี่ยนเป็นภาษาไทย'
    },
    imageFallback: {
      placeholder: 'Image placeholder',
      loading: 'Loading image'
    },
    common: {
      loading: 'Loading...',
      error: 'Error',
      retry: 'Retry',
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
    login: {
      welcome: 'ยินดีต้อนรับกลับ',
      signInContinue: 'ลงชื่อเข้าใช้เพื่อเข้าสู่บัญชีของคุณ',
      emailLabel: 'อีเมล',
      emailPlaceholder: 'กรอกอีเมลของคุณ',
      passwordLabel: 'รหัสผ่าน',
      passwordPlaceholder: 'กรอกรหัสผ่านของคุณ',
      rememberMe: 'จดจำฉันไว้',
      forgotPassword: 'ลืมรหัสผ่าน?',
      signInBtn: 'เข้าสู่ระบบ',
      signingIn: 'กำลังเข้าสู่ระบบ...',
      or: 'หรือ',
      continueWithGoogle: 'เข้าสู่ระบบด้วย Google',
      continueWithLine: 'เข้าสู่ระบบด้วย LINE',
      noAccount: 'ยังไม่มีบัญชี?',
      signUpLink: 'สมัครสมาชิก'
    },
    signup: {
      createAccount: 'สร้างบัญชี',
      joinUs: 'เข้าร่วมกับเราเพื่อเริ่มติดตามหุ้น',
      nameLabel: 'ชื่อ-นามสกุล',
      namePlaceholder: 'กรอกชื่อของคุณ',
      emailLabel: 'อีเมล',
      emailPlaceholder: 'กรอกอีเมลของคุณ',
      passwordLabel: 'รหัสผ่าน',
      passwordPlaceholder: 'สร้างรหัสผ่าน',
      confirmPasswordLabel: 'ยืนยันรหัสผ่าน',
      confirmPasswordPlaceholder: 'ยืนยันรหัสผ่านอีกครั้ง',
      agreeTo: 'ฉันยอมรับ',
      terms: 'ข้อกำหนดในการให้บริการ',
      and: 'และ',
      privacy: 'นโยบายความเป็นส่วนตัว',
      createAccountBtn: 'สร้างบัญชี',
      creatingAccount: 'กำลังสร้างบัญชี...',
      haveAccount: 'มีบัญชีอยู่แล้ว?',
      signInLink: 'เข้าสู่ระบบ'
    },
    home: {
      latestNews: 'ข่าวล่าสุด',
      realTimeUpdates: 'อัปเดตแบบเรียลไทม์',
      trendingStocks: 'หุ้นยอดนิยม',
      marketStatus: 'สถานะตลาด',
      status: 'สถานะ',
      open: 'เปิด',
      closed: 'ปิด',
      tradingHours: 'เวลาซื้อขาย',
      quickLinks: 'ลิงก์ด่วน',
      linkMarketOverview: 'ภาพรวมตลาด',
      linkEconCalendar: 'ปฏิทินเศรษฐกิจ',
      linkEarningsReports: 'รายงานผลประกอบการ',
      linkIpoCalendar: 'ปฏิทิน IPO'
    },
    search: {
      placeholder: 'ค้นหาหุ้น ข่าว ', 
      placeholder2: 'หรือค้นหาหัวข้อที่น่าสนใจ',
      filters: 'ตัวกรอง',
      resultsFor: 'ผลลัพธ์สำหรับ',
      noResults: 'ไม่พบผลลัพธ์',
      noResultsDesc: 'ลองปรับคำค้นหาหรือตัวกรองของคุณ',
      clearSearch: 'ล้างการค้นหา',
      loadMore: 'โหลดเพิ่ม',
      loading: 'กำลังโหลด...',
      searching: 'กำลังค้นหา...',
      recentSearches: 'การค้นหาล่าสุด',
      trendingTopics: 'หัวข้อยอดนิยม',
      clear: 'ล้าง',
      catAll: 'ทุกหมวดหมู่',
      catStocks: 'หุ้น',
      catAI: 'เทคโนโลยี AI',
      catMarket: 'เทรนด์ตลาด',
      catCrypto: 'คริปโตเคอเรนซี',
      catTech: 'เทคโนโลยี',
      timeAll: 'ทุกเวลา',
      timeToday: 'วันนี้',
      timeWeek: 'สัปดาห์นี้',
      timeMonth: 'เดือนนี้',
      timeYear: 'ปีนี้',
      sortRelevance: 'เกี่ยวข้องที่สุด',
      sortRecent: 'ล่าสุด',
      sortPopular: 'ยอดนิยมที่สุด'
    },
    newsCard: {
      match: 'ตรงกัน'
    },
    trending: {
      title: 'หุ้นยอดนิยม',
      error: 'ไม่สามารถโหลดหุ้นยอดนิยมได้',
      mentions: 'ครั้ง',
      mention: 'ครั้ง',
      noTrending: 'ไม่พบหุ้นยอดนิยม'
    },
    newsList: {
      loading: 'กำลังโหลดข่าว...',
      error: 'ไม่สามารถดึงข้อมูลข่าวได้',
    },
    banner: {
      loading: 'กำลังโหลดข่าว CNBC...',
      noNews: 'ไม่มีข่าว CNBC ในขณะนี้',
      readMore: 'อ่านต่อที่ CNBC',
      usingFallback: 'กำลังใช้เนื้อหาสำรอง',
      fallback: {
        cnbcTitle: 'ข่าวตลาดจาก CNBC',
        cnbcDesc: 'ติดตามเทรนด์ตลาดและข่าวการเงินล่าสุดจาก CNBC',
        bizTitle: 'ธุรกิจและการเงิน',
        bizDesc: 'รับบทวิเคราะห์เชิงลึกเกี่ยวกับเทรนด์ธุรกิจจากนักวิเคราะห์ชั้นนำของ CNBC',
        stockTitle: 'อัปเดตตลาดหุ้น',
        stockDesc: 'ข่าวสารและอัปเดตตลาดหุ้นแบบเรียลไทม์จาก CNBC'
      }
    },
    detail: {
      back: 'กลับ',
      share: 'แชร์',
      bookmark: 'บุ๊คมาร์ก',
      relatedStocks: 'หุ้นที่เกี่ยวข้อง',
      relatedNews: 'ข่าวที่เกี่ยวข้อง',
      readFullArticle: 'อ่านบทความฉบับเต็ม',
      source: 'แหล่งที่มา',
      viewOriginal: 'ดูต้นฉบับ',
      loading: 'กำลังโหลดบทความ...',
      notFoundTitle: 'ไม่พบบทความ',
      notFoundDesc: 'ไม่พบบทความที่คุณกำลังค้นหา',
      backHome: 'กลับสู่หน้าแรก'
    },
    watchlist: {
      title: 'ข่าวหุ้นติดตาม',
      description: 'ข่าวสารล่าสุดจากหุ้นในรายการติดตามของคุณ',
      alerts: 'การแจ้งเตือน',
      noNews: 'ไม่มีข่าวสำหรับหุ้นในรายการติดตามของคุณ',
      noStocksInList: 'ไม่มีหุ้นในรายการติดตาม',
      addStocksPrompt: 'เพิ่มหุ้นในรายการติดตามเพื่อดูข่าวที่เกี่ยวข้องที่นี่',
      addStockBtn: 'เพิ่มหุ้นติดตาม',
      loadingNews: 'กำลังโหลดข่าวจาก {count} หุ้น...',
      stocks: 'หุ้น'
    },
    langToggle: {
      titleEN: 'Switch to English',
      titleTH: 'เปลี่ยนเป็นภาษาไทย'
    },
    imageFallback: {
      placeholder: 'ตัวยึดรูปภาพ',
      loading: 'กำลังโหลดรูปภาพ'
    },
    common: {
      loading: 'กำลังโหลด...',
      error: 'ข้อผิดพลาด',
      retry: 'ลองอีกครั้ง',
      refresh: 'รีเฟรช'
    }
  }
};


export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem('app_language');
    return saved || 'th'; 
  });

  useEffect(() => {
    localStorage.setItem('app_language', language);
    document.documentElement.lang = language;
    console.log(' Language changed to:', language);
  }, [language]);

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'th' ? 'en' : 'th');
  };

  const t = (key, params = {}) => {
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

    if (typeof value === 'string' && Object.keys(params).length > 0) {
      Object.keys(params).forEach(paramKey => {
        value = value.replace(`{${paramKey}}`, params[paramKey]);
      });
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