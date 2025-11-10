// Frontend/src/component/News/TrendingSymbols.jsx
import { useState, useEffect } from 'react';
import { TrendingUp, Activity } from 'lucide-react';

const TrendingSymbols = ({ onSymbolClick, limit = 8 }) => {
  const [trendingSymbols, setTrendingSymbols] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTrendingSymbols();
  }, [limit]);

  const fetchTrendingSymbols = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`http://localhost:5001/api/news/symbols/trending?limit=${limit}`);
      const data = await response.json();
      
      if (data.success) {
        setTrendingSymbols(data.data);
        console.log('📊 Trending symbols:', data.data);
      } else {
        setError('Failed to fetch trending symbols');
      }
    } catch (err) {
      console.error('❌ Error fetching trending symbols:', err);
      setError('Failed to load trending symbols');
    } finally {
      setLoading(false);
    }
  };

  const handleSymbolClick = (symbol) => {
    if (onSymbolClick) {
      onSymbolClick(symbol);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-green-500 animate-pulse" />
          <h3 className="font-semibold text-gray-900">Trending Stocks</h3>
        </div>
        <div className="space-y-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="animate-pulse flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                <div>
                  <div className="h-4 w-16 bg-gray-200 rounded mb-1"></div>
                  <div className="h-3 w-24 bg-gray-200 rounded"></div>
                </div>
              </div>
              <div className="h-5 w-8 bg-gray-200 rounded-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-gray-400" />
          <h3 className="font-semibold text-gray-900">Trending Stocks</h3>
        </div>
        <div className="text-center py-4">
          <p className="text-sm text-red-600">{error}</p>
          <button 
            onClick={fetchTrendingSymbols}
            className="mt-3 text-xs text-green-600 hover:text-green-700 font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
        <TrendingUp className="w-5 h-5 text-green-500" />
        <h3 className="font-semibold text-gray-900">Trending Stocks</h3>
        <Activity className="w-4 h-4 text-gray-400 ml-auto" />
      </div>
      
      {trendingSymbols.length > 0 ? (
        <div className="space-y-2">
          {trendingSymbols.map((item, index) => (
            <button
              key={item.symbol}
              onClick={() => handleSymbolClick(item.symbol)}
              className="w-full group hover:bg-gray-50 rounded-lg p-2 transition-colors flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                {/* Rank Badge */}
                <div className={`w-8 h-8 flex items-center justify-center rounded-lg font-bold text-sm ${
                  index === 0 
                    ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white' 
                    : index === 1
                    ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-white'
                    : index === 2
                    ? 'bg-gradient-to-br from-orange-300 to-orange-400 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {index + 1}
                </div>
                
                {/* Symbol & Name */}
                <div className="text-left">
                  <div className="font-bold text-gray-900 group-hover:text-green-600 transition-colors">
                    {item.symbol}
                  </div>
                  <div className="text-xs text-gray-500 truncate max-w-[120px]">
                    {item.name}
                  </div>
                </div>
              </div>
              
              {/* Mention Count Badge */}
              <div className="flex items-center gap-1">
                <span className="text-xs font-medium text-gray-600">
                  {item.count}
                </span>
                <span className="text-xs text-gray-400">
                  {item.count === 1 ? 'mention' : 'mentions'}
                </span>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No trending stocks found</p>
        </div>
      )}
      
      {/* Refresh Button */}
      <button
        onClick={fetchTrendingSymbols}
        className="w-full mt-4 pt-3 border-t border-gray-200 text-xs text-gray-500 hover:text-green-600 font-medium transition-colors flex items-center justify-center gap-1"
      >
        <Activity className="w-3.5 h-3.5" />
        Refresh
      </button>
    </div>
  );
};

export default TrendingSymbols;