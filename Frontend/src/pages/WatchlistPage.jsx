import { useState, useEffect } from 'react'; 
import { Bell } from "lucide-react";
import { useApp } from "../context/AppContext";
import ImageWithFallback from "../component/common/ImageWithFallback";

const WatchlistPage = () => {
  const { watchlist, toggleAlert } = useApp();
  const [newsArticles, setNewsArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (watchlist.length > 0) {
      fetchWatchlistNews();
    } else {
      setNewsArticles([]);
      setLoading(false);
    }
  }, [watchlist.map(w => w.symbol).join(',')]); 

  const fetchWatchlistNews = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const newsPromises = watchlist.map(stock => 
        fetch(`http://localhost:5001/api/news/company/${stock.symbol}?days=7`)
          .then(res => res.json())
          .catch(err => {
            console.error(`Error fetching ${stock.symbol}:`, err);
            return { success: false, data: [] };
          })
      );
      
      const results = await Promise.all(newsPromises);
      
      const allNews = results
        .filter(result => result.success)
        .flatMap(result => result.data)
        .sort((a, b) => b.datetime - a.datetime)
        .slice(0, 10);
      
      setNewsArticles(allNews);
      
      if (allNews.length === 0) {
        setError('No news available for your watchlist stocks');
      }
    } catch (error) {
      console.error('Error fetching watchlist news:', error);
      setError('Failed to load news. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-200">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-2">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-900">ข่าวหุ้นติดตาม</h2>
              <p className="text-sm text-gray-600 mt-1">
                ข่าวสารล่าสุดจากหุ้นในรายการติดตามของคุณ
                {watchlist.length > 0 && (
                  <span className="ml-2 text-green-600 font-medium">
                    ({watchlist.length} หุ้น)
                  </span>
                )}
              </p>
            </div>

            {loading ? (
              <div className="bg-white rounded-lg p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading news from {watchlist.length} stocks...</p>
              </div>
            ) : error ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                <p className="text-yellow-700">{error}</p>
                <button 
                  onClick={fetchWatchlistNews}
                  className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                   Retry
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {newsArticles.length > 0 ? (
                  newsArticles.map((article, index) => (
                    <div 
                      key={`${article.id}-${index}`}
                      className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => window.open(article.url, '_blank')}
                    >
                      <div className="p-5">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span className="font-medium text-gray-700">
                              {article.symbol || article.source}
                            </span>
                            <span>•</span>
                            <span>{article.timeAgo}</span>
                          </div>
                        </div>

                        <h3 className="text-xl font-bold text-gray-900 mb-3 leading-snug hover:text-green-600 transition-colors">
                          {article.title}
                        </h3>

                        {article.image && (
                          <div className="mb-3 rounded-lg overflow-hidden">
                            <ImageWithFallback
                              src={article.image}
                              alt={article.title}
                              className="w-full h-48 object-cover"
                            />
                          </div>
                        )}

                        {article.summary && (
                          <p className="text-sm text-gray-700 leading-relaxed mb-3">
                            {article.summary}
                          </p>
                        )}

                        <div className="flex gap-2 flex-wrap">
                          <span className="px-3 py-1 bg-gray-900 text-white text-xs rounded-full font-medium">
                            {article.category}
                          </span>
                          {article.symbol && (
                            <span className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                              {article.symbol}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : watchlist.length === 0 ? (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                    <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">ไม่มีหุ้นในรายการติดตาม</h3>
                    <p className="text-gray-600">เพิ่มหุ้นในรายการติดตามเพื่อรับข่าวสารล่าสุด</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                    <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">ไม่พบข่าวล่าสุด</h3>
                    <p className="text-gray-600">ลองเพิ่มหุ้นอื่นในรายการติดตาม</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 sticky top-20">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
                <Bell className="w-5 h-5 text-green-600" /> 
                <span className="text-sm text-gray-600">การแจ้งเตือน</span>
              </div>

              {watchlist.length > 0 ? (
                <div className="space-y-3">
                  {watchlist.map((stock) => (
                    <div 
                      key={stock.symbol}
                      className="flex items-center justify-between py-2"
                    >
                      <div className="flex items-center gap-2">
                        {stock.hasRedDot && (
                          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                        )}
                        <span className="text-base font-semibold text-gray-900">
                          {stock.symbol}
                        </span>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleAlert(stock.symbol);
                        }}
                        className="group"
                        aria-label={`Toggle alert for ${stock.symbol}`}
                      >
                        <Bell 
                          className={`w-5 h-5 transition-colors ${
                            stock.hasAlert 
                              ? 'text-green-600 fill-green-600' 
                              : 'text-gray-300 hover:text-gray-400'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">ไม่มีหุ้นในรายการติดตาม</p>
                  <button 
                    className="mt-4 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
                    onClick={() => alert('Feature coming soon!')}
                  >
                    เพิ่มหุ้นติดตาม
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WatchlistPage;