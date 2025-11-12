// pages/HomePage.jsx
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import BannerSlider from '../component/Banner/BannerSlider';
import NewsList from '../component/News/NewsList';
import TrendingSymbols from '../component/News/TrendingSymbols';

const HomePage = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleNewsClick = (article) => {
    console.log('Navigating to news detail:', article.id);
    navigate(`/news/${article.id}`, { state: { article } });
  };
  const handleSymbolClick = (symbol) => {
    console.log('Filtering by symbol:', symbol);
    navigate(`/search?symbol=${symbol}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 bg-gray-200">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          <BannerSlider />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold text-gray-900">
                {t('home.latestNews')}
              </h3>
              <span className="text-sm text-gray-500">
                {t('home.realTimeUpdates')}
              </span>
            </div>

            <NewsList
              onNewsClick={handleNewsClick}
              onSymbolClick={handleSymbolClick}
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <TrendingSymbols
            onSymbolClick={handleSymbolClick}
            limit={8}
          />
        </div>
      </div>
    </div>
  );
};

export default HomePage;