import { Bell } from "lucide-react";
import { useApp } from "../context/AppContext";
import ImageWithFallback from "../component/common/ImageWithFallback";

const WatchlistPage = () => {
  const { watchlist, toggleAlert } = useApp();

  const newsArticles = [
    {
      id: 1,
      company: 'Apple Inc.',
      timeAgo: '8 hours ago',
      title: 'Will a Leadership Change Be Enough to Turn Apple Around?',
      description: "There's a leadership change at Apple (NASDAQ: AAPL). Longtime Chief Operating Officer Jeff Williams is retiring and will be replaced by Sabih Khan, the company's senior vice president of operations. The transition is scheduled to occur later this month, but will it help Apple stock turn around what's been a disappointing year?...",
      image: 'https://images.unsplash.com/photo-1611472173362-3f53dbd65d80?w=400&h=250&fit=crop',
      tags: ['iOS', 'อินเทอร์']
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column - News Feed */}
          <div className="lg:col-span-2">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-900">ข่าวหุ้นติดตาม</h2>
              <p className="text-sm text-gray-600 mt-1">ข่าวสารล่าสุดจากหุ้นในรายการติดตามของคุณ</p>
            </div>

            {/* News Card */}
            <div className="space-y-4">
              {newsArticles.length > 0 ? (
                newsArticles.map((article) => (
                  <div 
                    key={article.id}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <div className="p-5">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span className="font-medium text-gray-900">{article.company}</span>
                          <span>•</span>
                          <span>{article.timeAgo}</span>
                        </div>
                      </div>

                      {/* Title */}
                      <h3 className="text-base font-semibold text-gray-900 mb-3 leading-snug hover:text-blue-600 transition-colors">
                        {article.title}
                      </h3>

                      {/* Image */}
                      <div className="mb-3 rounded-lg overflow-hidden">
                        <ImageWithFallback
                          src={article.image}
                          alt={article.title}
                          className="w-full h-48 object-cover"
                        />
                      </div>

                      {/* Description */}
                      <p className="text-sm text-gray-700 leading-relaxed mb-3">
                        {article.description}
                      </p>

                      {/* Tags */}
                      <div className="flex gap-2 flex-wrap">
                        {article.tags.map((tag, index) => (
                          <span 
                            key={index}
                            className="px-3 py-1 bg-gray-900 text-white text-xs rounded-full font-medium"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                  <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">ไม่มีข่าวใหม่</h3>
                  <p className="text-gray-600">เพิ่มหุ้นในรายการติดตามเพื่อรับข่าวสารล่าสุด</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Watchlist Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 sticky top-20">
              {/* Header with Alert Icon */}
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
                <Bell className="w-5 h-5 text-yellow-500" />
                <span className="text-sm text-gray-600">การแจ้งเตือน</span>
              </div>

              {/* Watchlist Items */}
              {watchlist.length > 0 ? (
                <div className="space-y-3">
                  {watchlist.map((stock) => (
                    <div 
                      key={stock.symbol}
                      className="flex items-center justify-between py-2"
                    >
                      <div className="flex items-center gap-2">
                        {/* Red Dot Indicator */}
                        {stock.hasRedDot && (
                          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                        )}
                        
                        {/* Stock Symbol */}
                        <span className="text-base font-semibold text-gray-900">
                          {stock.symbol}
                        </span>
                      </div>

                      {/* Alert Bell Icon */}
                      <button
                        onClick={() => toggleAlert(stock.symbol)}
                        className="group"
                        aria-label={`Toggle alert for ${stock.symbol}`}
                      >
                        <Bell 
                          className={`w-5 h-5 transition-colors ${
                            stock.hasAlert 
                              ? 'text-yellow-500 fill-yellow-500' 
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
                  <button className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors">
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