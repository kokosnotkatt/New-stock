import { useState } from 'react';
import { Trash2, TrendingUp, TrendingDown } from 'lucide-react';

const WatchlistPage = () => {
  const [watchlist, setWatchlist] = useState([
    { 
      symbol: 'CPALL', 
      name: 'CP ALL', 
      sector: 'Retail', 
      price: '221.10', 
      change: '+3.25%', 
      changeValue: '+6.95',
      positive: true, 
      eps: '5.2', 
      pe: '18.5',
      marketCap: '725B'
    },
    { 
      symbol: 'PTT', 
      name: 'PTT Public Company', 
      sector: 'Energy', 
      price: '38.50', 
      change: '-1.15%',
      changeValue: '-0.45',
      positive: false, 
      eps: '2.8', 
      pe: '13.8',
      marketCap: '1.2T'
    },
    { 
      symbol: 'KBANK', 
      name: 'Kasikornbank', 
      sector: 'Banking', 
      price: '152.00', 
      change: '+2.10%',
      changeValue: '+3.13',
      positive: true, 
      eps: '8.9', 
      pe: '17.1',
      marketCap: '456B'
    }
  ]);

  const removeFromWatchlist = (symbol) => {
    if (window.confirm(`Remove ${symbol} from watchlist?`)) {
      setWatchlist(watchlist.filter(stock => stock.symbol !== symbol));
    }
  };

  const totalValue = watchlist.reduce((sum, stock) => sum + parseFloat(stock.price), 0);
  const positiveStocks = watchlist.filter(stock => stock.positive).length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-3xl font-bold text-gray-900">My Watchlist</h2>
          <span className="px-4 py-2 bg-blue-100 text-blue-700 font-semibold rounded-lg">
            {watchlist.length} stock{watchlist.length !== 1 ? 's' : ''}
          </span>
        </div>
        
        {/* Summary Stats */}
        {watchlist.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
              <p className="text-gray-600 text-sm mb-1">Total Stocks</p>
              <p className="text-2xl font-bold text-gray-900">{watchlist.length}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
              <p className="text-gray-600 text-sm mb-1">Positive</p>
              <p className="text-2xl font-bold text-green-600">{positiveStocks}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
              <p className="text-gray-600 text-sm mb-1">Negative</p>
              <p className="text-2xl font-bold text-red-600">{watchlist.length - positiveStocks}</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Watchlist Items */}
      {watchlist.length > 0 ? (
        <div className="space-y-4">
          {watchlist.map((stock) => (
            <div
              key={stock.symbol}
              className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-all duration-200 overflow-hidden"
            >
              <div className="p-6">
                {/* Header Section */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-2xl font-bold text-gray-900">{stock.symbol}</h3>
                      <span className="px-3 py-1 text-xs font-semibold text-blue-600 bg-blue-100 rounded-full">
                        {stock.sector}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-3">{stock.name}</p>
                    <div className="flex items-baseline gap-3">
                      <p className="text-2xl font-bold text-gray-900">THB {stock.price}</p>
                      <div className={`flex items-center gap-1 text-sm font-semibold ${stock.positive ? 'text-green-600' : 'text-red-600'}`}>
                        {stock.positive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        <span>{stock.change}</span>
                        <span className="text-xs">({stock.changeValue})</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Metrics Section */}
                <div className="grid grid-cols-3 gap-4 py-4 border-t border-b border-gray-200">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">EPS</p>
                    <p className="text-lg font-semibold text-gray-900">{stock.eps}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">P/E Ratio</p>
                    <p className="text-lg font-semibold text-gray-900">{stock.pe}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Market Cap</p>
                    <p className="text-lg font-semibold text-gray-900">{stock.marketCap}</p>
                  </div>
                </div>

                {/* Actions Section */}
                <div className="flex gap-3 mt-4">
                  <button className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors">
                    View Details
                  </button>
                  <button
                    onClick={() => removeFromWatchlist(stock.symbol)}
                    className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-medium rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <div className="text-7xl mb-4">📊</div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Your Watchlist is Empty</h3>
          <p className="text-gray-600 mb-6">Start adding stocks to track their performance</p>
          <button className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors">
            Browse Stocks
          </button>
        </div>
      )}
    </div>
  );
};

export default WatchlistPage;