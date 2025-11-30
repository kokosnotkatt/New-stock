// context/AppContext.jsx - Simplified (ลบ watchlist ออก)
import { createContext, useContext, useState } from 'react';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('Home');
  
  const [recentSearches, setRecentSearches] = useState([
    'Apple earnings', 
    'Tesla stock', 
    'Fed rate'
  ]);

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