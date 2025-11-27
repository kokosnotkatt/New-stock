// Frontend/src/component/News/NewsList.jsx
import { useState, useEffect, useRef } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import NewsCard from './NewsCard';
import apiService from '../../services/apiService';
import { useLanguage } from '../../context/LanguageContext';

const NewsList = ({ onNewsClick, onSymbolClick }) => {
  const [newsArticles, setNewsArticles] = useState([]);
  const [originalArticles, setOriginalArticles] = useState([]); // เก็บข่าวต้นฉบับ
  const [loading, setLoading] = useState(true);
  const [translating, setTranslating] = useState(false);
  const [error, setError] = useState(null);
  const { language, t } = useLanguage();
  const prevLanguageRef = useRef(language);
  const isFirstLoad = useRef(true);

  // โหลดข่าวครั้งแรก
  useEffect(() => {
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      fetchNews();
    }
  }, []);

  // เมื่อเปลี่ยนภาษา ให้แปลข่าว
  useEffect(() => {
    if (prevLanguageRef.current !== language && originalArticles.length > 0) {
      console.log(`🌐 Language changed: ${prevLanguageRef.current} → ${language}`);
      prevLanguageRef.current = language;
      translateNews();
    }
  }, [language]);

  // ดึงข่าวจาก API
  const fetchNews = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await apiService.fetchNews({
        limit: 20,
        category: 'stocks',
        language: 'en' // ดึงข่าวภาษาอังกฤษเสมอ
      });

      if (data.success) {
        setOriginalArticles(data.data); // เก็บต้นฉบับ
        
        // ถ้าภาษาปัจจุบันเป็นไทย ให้แปลเลย
        if (language === 'th') {
          await translateNewsData(data.data);
        } else {
          setNewsArticles(data.data);
        }
        
        console.log(`✅ Loaded ${data.data.length} news articles`);
      } else {
        setError(data.message || 'Failed to fetch news');
      }
    } catch (err) {
      setError(err.message || 'Error connecting to server');
      console.error('❌ Error fetching news:', err);
    } finally {
      setLoading(false);
    }
  };

  // แปลข่าว
  const translateNews = async () => {
    if (originalArticles.length === 0) return;

    // ถ้าเป็นภาษาอังกฤษ ใช้ต้นฉบับ
    if (language === 'en') {
      setNewsArticles(originalArticles);
      return;
    }

    await translateNewsData(originalArticles);
  };

  // แปลข่าวจริงๆ
  const translateNewsData = async (articles) => {
    try {
      setTranslating(true);
      console.log(`🌐 Translating ${articles.length} articles to ${language}...`);

      const translatedArticles = await apiService.translateNews(articles, language);
      setNewsArticles(translatedArticles);
      
      console.log(`✅ Translation complete`);
    } catch (err) {
      console.error('❌ Translation error:', err);
      // ถ้าแปลไม่ได้ ใช้ต้นฉบับ
      setNewsArticles(originalArticles);
    } finally {
      setTranslating(false);
    }
  };

  const handleNewsClick = (article) => {
    if (onNewsClick) {
      onNewsClick(article);
    } else {
      window.open(article.url, '_blank');
    }
  };

  const handleSymbolClick = (symbol) => {
    console.log('Symbol clicked:', symbol);
    if (onSymbolClick) {
      onSymbolClick(symbol);
    }
  };

  const handleRefresh = () => {
    fetchNews();
  };

  // Loading state
  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <Loader2 className="w-12 h-12 text-green-500 animate-spin mx-auto" />
        <p className="mt-4 text-gray-600">{t('common.loading')}</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-700">{error}</p>
        <button
          onClick={handleRefresh}
          className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          {t('common.retry')}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Translating indicator */}
      {translating && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
          <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
          <span className="text-blue-700">
            {language === 'th' ? 'กำลังแปลข่าวเป็นภาษาไทย...' : 'Translating to English...'}
          </span>
        </div>
      )}

      {/* News list */}
      {newsArticles.map((article) => (
        <div
          key={article.id}
          className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
        >
          <NewsCard
            article={article}
            onClick={handleNewsClick}
            onSymbolClick={handleSymbolClick}
          />
        </div>
      ))}

      {/* Empty state */}
      {newsArticles.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-gray-600">
            {language === 'th' ? 'ไม่มีข่าว' : 'No news available'}
          </p>
          <button
            onClick={handleRefresh}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2 mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            {t('common.refresh')}
          </button>
        </div>
      )}
    </div>
  );
};

export default NewsList;