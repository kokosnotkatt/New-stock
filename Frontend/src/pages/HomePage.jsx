// Frontend/src/pages/HomePage.jsx - With Navigation (No Modal)
import { useNavigate } from 'react-router-dom';
import BannerSlider from '../component/Banner/BannerSlider';
import NewsList from '../component/News/NewsList';
import TrendingSymbols from '../component/News/TrendingSymbols';

const HomePage = () => {
  const navigate = useNavigate();

  const handleNewsClick = (article) => {
    console.log('Navigating to news detail:', article.id);
    // Navigate to detail page
    navigate(`/news/${article.id}`);
  };

  const handleSymbolClick = (symbol) => {
    console.log('Filtering by symbol:', symbol);
    // Navigate to search page with symbol filter
    navigate(`/search?symbol=${symbol}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 bg-gray-200">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content - ข่าว */}
        <div className="lg:col-span-2 space-y-8">
          {/* Banner Slider */}
          <BannerSlider />
          
          {/* Latest News */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold text-gray-900">Latest News</h3>
              <span className="text-sm text-gray-500">Real-time updates</span>
            </div>
            
            <NewsList 
              onNewsClick={handleNewsClick}
              onSymbolClick={handleSymbolClick}
            />
          </div>
        </div>

        {/* Sidebar - Trending & Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Trending Symbols Widget */}
          <TrendingSymbols 
            onSymbolClick={handleSymbolClick}
            limit={8}
          />
          
          {/* Market Status Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Market Status</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Status</span>
                <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                  Open
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Trading Hours</span>
                <span className="text-sm font-medium text-gray-900">9:30 AM - 4:00 PM EST</span>
              </div>
              <div className="pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  Market data is delayed by 15 minutes
                </p>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Quick Links</h3>
            <div className="space-y-2">
              {[
                { name: 'Market Overview', href: '#' },
                { name: 'Economic Calendar', href: '#' },
                { name: 'Earnings Reports', href: '#' },
                { name: 'IPO Calendar', href: '#' }
              ].map(link => (
                <a
                  key={link.name}
                  href={link.href}
                  className="block text-sm text-gray-600 hover:text-green-600 hover:bg-gray-50 rounded px-2 py-1.5 transition-colors"
                >
                  {link.name}
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