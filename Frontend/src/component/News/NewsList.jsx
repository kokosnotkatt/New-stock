// 1. ⬇️ Import 'useLanguage' แทน 'LanguageContext' (และลบ 'useContext' ที่ไม่จำเป็น)
import { useState, useEffect } from 'react';
import NewsCard from './NewsCard';
import apiService from '../../services/apiService';
import { useLanguage } from '../../context/LanguageContext'; // (โปรดตรวจสอบ path)

const NewsList = ({ onNewsClick, onSymbolClick }) => {
  const [newsArticles, setNewsArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 2. ⬇️ เรียกใช้ hook 'useLanguage()'
  const { language } = useLanguage();

  useEffect(() => {
    fetchNews();
    // 3. ⬇️ สั่งให้ useEffect นี้ทำงานใหม่ (ดึงข่าวใหม่) ทุกครั้งที่ language เปลี่ยน
  }, [language]);

  const fetchNews = async () => {
    try {
      setLoading(true);
      setError(null);

      // 4. ⬇️ ส่ง category: 'stocks' และ language ปัจจุบัน ไปให้ apiService
      const data = await apiService.fetchNews({
        limit: 20,
        category: 'stocks',
        language: language // ส่ง 'th' หรือ 'en' ไป
      });

      if (data.success) {
        setNewsArticles(data.data);
        // 5. ⬇️ ปรับ Log ให้เห็นภาษาที่ดึงมา
        console.log(`✅ Loaded STOCK news (${language}):`, data.data.length);
        console.log('📊 Stats:', data.stats);

        const newsWithSymbols = data.data.filter(n => n.symbols && n.symbols.length > 0);
        console.log(`🔍 Found ${newsWithSymbols.length} articles with detected symbols`);

        if (newsWithSymbols.length > 0) {
          console.log('📰 Sample article with symbols:', {
            title: newsWithSymbols[0].title,
            symbols: newsWithSymbols[0].symbols
          });
        }
      } else {
        // 6. ⬇️ ใช้ข้อความจาก t() ถ้ามี (หรือใช้จากไฟล์ context)
        setError(data.message || 'Failed to fetch news');
      }
    } catch (err) {
      setError(err.message || 'Error connecting to server');
      console.error('❌ Error fetching news:', err);
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent mx-auto"></div>
        {/* 7. ⬇️ (Optional) ใช้ t() สำหรับข้อความ Loading */}
        <p className="mt-4 text-gray-600">Loading news...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-700">{error}</p>
        <button
          onClick={fetchNews}
          className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          {/* 8. ⬇️ (Optional) ใช้ t() สำหรับปุ่ม Retry */}
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
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

      {newsArticles.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-gray-600">No news available</p>
        </div>
      )}
    </div>
  );
};

export default NewsList;