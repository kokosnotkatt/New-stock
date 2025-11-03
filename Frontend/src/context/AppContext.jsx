import { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('Home');
  const [watchlist, setWatchlist] = useState([
    { symbol: 'AAPL', hasAlert: true, hasRedDot: false },
    { symbol: 'TSLA', hasAlert: true, hasRedDot: true }
  ]);
  const [recentSearches, setRecentSearches] = useState([
    'Apple earnings', 
    'Tesla stock', 
    'Fed rate'
  ]);

  const addToWatchlist = (symbol) => {
    if (!watchlist.find(item => item.symbol === symbol)) {
      setWatchlist(prev => [...prev, { 
        symbol, 
        hasAlert: false, 
        hasRedDot: false 
      }]);
    }
  };

  const removeFromWatchlist = (symbol) => {
    setWatchlist(prev => prev.filter(item => item.symbol !== symbol));
  };

  const toggleAlert = (symbol) => {
    setWatchlist(prev => prev.map(item =>
      item.symbol === symbol 
        ? { ...item, hasAlert: !item.hasAlert }
        : item
    ));
  };

  const addRecentSearch = (query) => {
    if (query.trim()) {
      setRecentSearches(prev => {
        const filtered = prev.filter(s => s !== query);
        return [query, ...filtered].slice(0, 5);
      });
    }
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
  };

  return (
    <AppContext.Provider value={{
      searchQuery,
      setSearchQuery,
      activeTab,
      setActiveTab,
      watchlist,
      addToWatchlist,
      removeFromWatchlist,
      toggleAlert,
      recentSearches,
      addRecentSearch,
      clearRecentSearches
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};