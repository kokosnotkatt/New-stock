// Frontend/src/component/News/NewsList.jsx - ✅ FIXED: Translation Performance
import { useState, useEffect, useRef } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import NewsCard from './NewsCard';
import apiService from '../../services/apiService';
import { useLanguage } from '../../context/LanguageContext';

const NewsList = ({ onNewsClick, onSymbolClick }) => {
  const [newsArticles, setNewsArticles] = useState([]);
  const [originalArticles, setOriginalArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [translating, setTranslating] = useState(false); // ✅ แยก state
  const [error, setError] = useState(null);
  const { language, t } = useLanguage();
  const prevLanguageRef = useRef(language);
  const isFirstLoad = useRef(true);

  // ✅ โหลดข่าวครั้งแรกเท่านั้น
  useEffect(() => {
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      fetchNews();
    }
  }, []);

  // ✅ เมื่อเปลี่ยนภาษา -> แปลข่าวที่มีอยู่ (ไม่ fetch ใหม่)
  useEffect(() => {
    if (prevLanguageRef.current !== language && !isFirstLoad.current && originalArticles.length > 0) {
      console.log(`🌐 Language changed: ${prevLanguageRef.current} → ${language}`);
      prevLanguageRef.current = language;
      translateArticles();
    }
  }, [language]);

  // ✅ ฟังก์ชันดึงข่าว (เรียกครั้งเดียวตอนโหลด)
  const fetchNews = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await apiService.fetchNews({
        limit: 10,
        category: 'stocks',
        language: language // ใช้ภาษาปัจจุบัน
      });

      if (data.success) {
        setOriginalArticles(data.data);
        setNewsArticles(data.data);
        console.log(`✅ Loaded ${data.data.length} news articles (${language})`);
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

  // ✅ ฟังก์ชันแปลข่าว (ใช้ข่าวที่มีอยู่)
  const translateArticles = async () => {
    try {
      setTranslating(true);
      setError(null);

      console.log(`🔄 Translating ${originalArticles.length} articles to ${language}...`);

      const translated = await apiService.translateNews(originalArticles, language);
      setNewsArticles(translated);
      
      console.log(`✅ Translated ${translated.length} articles to ${language}`);
    } catch (err) {
      console.error('❌ Translation error:', err);
      // ถ้าแปลไม่ได้ ให้ใช้ข่าวต้นฉบับ
      setNewsArticles(originalArticles);
      setError('Translation failed, showing original content');
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

  // ✅ Loading state - แสดงตอนโหลดข่าวครั้งแรก
  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <Loader2 className="w-12 h-12 text-green-500 animate-spin mx-auto" />
        <p className="mt-4 text-gray-600">{t('common.loading')}</p>
      </div>
    );
  }

  // ✅ Translating state - แสดงตอนแปลภาษา
  if (translating) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto" />
        <p className="mt-4 text-gray-600">
          {language === 'th' ? 'กำลังแปลข่าว...' : 'Translating news...'}
        </p>
      </div>
    );
  }

  // Error state
  if (error && newsArticles.length === 0) {
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
      {/* ✅ แสดง warning ถ้าแปลไม่สำเร็จ */}
      {error && newsArticles.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
          ⚠️ {error}
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