// pages/HomePage.jsx - ตัวอย่างการใช้ Translation
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import BannerSlider from '../component/Banner/BannerSlider';
import NewsList from '../component/News/NewsList';
import TrendingSymbols from '../component/News/TrendingSymbols';


const HomePage = () => {
  const navigate = useNavigate();
  const { t } = useLanguage(); // ✅ ใช้ Hook นี้

  const handleNewsClick = (article) => {
    console.log('Navigating to news detail:', article.id);
    navigate(`/news/${article.id}`);
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
              {/* ✅ แปลหัวข้อ */}
              <h3 className="text-2xl font-bold text-gray-900">
                {t('home.latestNews')}
              </h3>
              <span className="text-sm text-gray-500">
                {t('home.realTimeUpdates')}
              </span>
            </div>
            
            {/* ❌ ข่าวยังเป็นภาษาเดิมจาก API */}
            <NewsList 
              onNewsClick={handleNewsClick}
              onSymbolClick={handleSymbolClick}
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* ✅ แปลหัวข้อ */}
          <TrendingSymbols 
            onSymbolClick={handleSymbolClick}
            limit={8}
          />
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            {/* ✅ แปลหัวข้อ */}
            <h3 className="font-semibold text-gray-900 mb-4">
              {t('home.marketStatus')}
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">{t('home.status')}</span>
                <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                  {t('home.open')}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">{t('home.tradingHours')}</span>
                <span className="text-sm font-medium text-gray-900">9:30 AM - 4:00 PM EST</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">
              {t('home.quickLinks')}
            </h3>
            <div className="space-y-2">
              {[
                'Market Overview',
                'Economic Calendar',
                'Earnings Reports',
                'IPO Calendar'
              ].map(link => (
                <a
                  key={link}
                  href="#"
                  className="block text-sm text-gray-600 hover:text-green-600 hover:bg-gray-50 rounded px-2 py-1.5 transition-colors"
                >
                  {link}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;