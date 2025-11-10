// Frontend/src/component/News/SymbolBadges.jsx
import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

const SymbolBadges = ({ symbols, onSymbolClick, showTrend = false }) => {
  if (!symbols || symbols.length === 0) {
    return null;
  }

  const handleClick = (symbol, e) => {
    e.stopPropagation();
    if (onSymbolClick) {
      onSymbolClick(symbol);
    }
  };

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {symbols.map((symbol, index) => (
        <button
          key={`${symbol}-${index}`}
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
      ))}
    </div>
  );
};

export default SymbolBadges;