// Frontend/src/component/News/SymbolBadges.jsx
import React from 'react';
import { TrendingUp, Heart } from 'lucide-react';
import { useWatchlist } from '../../context/WatchlistContext';

const SymbolBadges = ({ symbols, onSymbolClick, showTrend = false, showWatchlistButton = true }) => {
  const { isInWatchlist, addToWatchlist, removeFromWatchlist } = useWatchlist();

  if (!symbols || symbols.length === 0) {
    return null;
  }

  const handleClick = (symbol, e) => {
    e.stopPropagation();
    if (onSymbolClick) {
      onSymbolClick(symbol);
    }
  };

  const handleWatchlistToggle = (symbol, e) => {
    e.stopPropagation();
    
    if (isInWatchlist(symbol)) {
      removeFromWatchlist(symbol);
    } else {
      addToWatchlist(symbol);
    }
  };

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {symbols.map((symbol, index) => {
        const inWatchlist = isInWatchlist(symbol);
        
        return (
          <div
            key={`${symbol}-${index}`}
            className="inline-flex items-center gap-1.5"
          >
            <button
              onClick={(e) => handleClick(symbol, e)}
              className="group inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 border border-green-200 rounded-full transition-all duration-200 hover:shadow-sm"
            >
              <span className="text-sm font-bold text-green-700 group-hover:text-green-800">
                {symbol}
              </span>
              
              {showTrend && (
                <TrendingUp className="w-3.5 h-3.5 text-green-600" />
              )}
            </button>

            {/* Watchlist Toggle Button */}
            {showWatchlistButton && (
              <button
                onClick={(e) => handleWatchlistToggle(symbol, e)}
                className={`p-1.5 rounded-full transition-all duration-200 ${
                  inWatchlist
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-200 text-gray-400 hover:bg-gray-300 hover:text-gray-600'
                }`}
                title={inWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
              >
                <Heart
                  className={`w-3.5 h-3.5 ${inWatchlist ? 'fill-current' : ''}`}
                />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default SymbolBadges;