import { useState, useEffect, useRef } from 'react';
import { Loader2, Plus, Trash2, Bell, ChevronUp, Search } from 'lucide-react';
import NewsCard from '../component/News/NewsCard';
import apiService from '../services/apiService';
import { useWatchlist } from '../context/WatchlistContext';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';

const WatchlistPage = () => {
  const { watchlist, removeFromWatchlist, toggleAlert, addToWatchlist } = useWatchlist(); // ✅ เพิ่ม addToWatchlist
  const { language } = useLanguage();
  const navigate = useNavigate();

  const [newSymbol, setNewSymbol] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stockNews, setStockNews] = useState({});
  const [loadingStocks, setLoadingStocks] = useState(new Set());
  const [expandedStocks, setExpandedStocks] = useState(new Set());
  
  // Autocomplete states
  const [allStocks, setAllStocks] = useState([]);
  const [filteredStocks, setFilteredStocks] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (watchlist.length > 0) {
      // ✅ Clear ข่าวเดิมเมื่อเปลี่ยนภาษา
      setStockNews({});
      fetchAllStockNews();
    } else {
      setLoading(false);
    }
  }, [watchlist, language]); // ✅ เพิ่ม dependency: language

  // Load stock symbols from CSV
  useEffect(() => {
    const loadStockSymbols = async () => {
      try {
        const response = await fetch('/data/completed_us_stock.csv');
        const text = await response.text();
        
        const lines = text.split('\n').slice(1); // Skip header
        const stocks = lines
          .filter(line => line.trim())
          .map(line => {
            const [symbol, logoUrl] = line.split(',');
            // Remove exchange prefix (NYSE:, NASDAQ:)
            const cleanSymbol = symbol.split(':')[1] || symbol;
            return {
              symbol: cleanSymbol.trim(),
              logoUrl: logoUrl?.trim() || '',
              fullSymbol: symbol.trim()
            };
          })
          .filter(stock => stock.symbol); // Remove empty
        
        setAllStocks(stocks);
        console.log(`✅ Loaded ${stocks.length} stock symbols`);
      } catch (error) {
        console.error('Error loading stock symbols:', error);
      }
    };
    
    loadStockSymbols();
  }, []);

  const fetchAllStockNews = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log(`📰 Fetching news for ${watchlist.length} stocks (${language})...`);
      
      // ✅ Fetch ข่าวทุกตัว (ไม่เช็ค cache เพราะภาษาเปลี่ยน)
      const newsPromises = watchlist.map(stock =>
        apiService.fetchNewsBySymbol(stock.symbol, 3, language)
      );
      
      const results = await Promise.all(newsPromises);
      
      // ✅ สร้าง newsMap ใหม่ทั้งหมด
      const newNewsMap = {};
      results.forEach((result, index) => {
        if (result.success) {
          newNewsMap[watchlist[index].symbol] = result.data;
        } else {
          newNewsMap[watchlist[index].symbol] = [];
        }
      });
      
      setStockNews(newNewsMap);
      
      // ✅ เปิดแสดงข่าวทั้งหมดเลย (auto-expand all)
      const allSymbols = watchlist.map(stock => stock.symbol);
      setExpandedStocks(new Set(allSymbols));
      
      console.log(`✅ Loaded news for ${watchlist.length} stocks`);
    } catch (err) {
      console.error('Error fetching watchlist news:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter stocks based on input
  const handleInputChange = (value) => {
    setNewSymbol(value);
    
    if (value.trim().length > 0) {
      const filtered = allStocks
        .filter(stock => 
          stock.symbol.toLowerCase().startsWith(value.toLowerCase())
        )
        .slice(0, 10); // Limit to 10 results
      
      setFilteredStocks(filtered);
      setShowDropdown(filtered.length > 0);
      setSelectedIndex(-1);
    } else {
      setShowDropdown(false);
      setFilteredStocks([]);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!showDropdown) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredStocks.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && filteredStocks[selectedIndex]) {
          selectStock(filteredStocks[selectedIndex].symbol);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Select stock from dropdown
  const selectStock = (symbol) => {
    setNewSymbol(symbol);
    setShowDropdown(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleStockNews = (symbol) => {
    setExpandedStocks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(symbol)) {
        newSet.delete(symbol);
      } else {
        newSet.add(symbol);
      }
      return newSet;
    });
  };

  const handleAddStock = async (e) => {
    e.preventDefault();
    
    const symbol = newSymbol.trim().toUpperCase();
    if (!symbol) return;
    
    if (watchlist.some(stock => stock.symbol === symbol)) {
      alert(language === 'th' ? 'มีหุ้นนี้อยู่แล้ว' : 'Stock already in watchlist');
      return;
    }
    
    setLoadingStocks(prev => new Set(prev).add(symbol));
    setNewSymbol(''); // Clear input
    
    try {
      // ✅ ใช้ addToWatchlist จาก Context (จะส่ง sessionId อัตโนมัติ)
      const result = await addToWatchlist(symbol);
      
      if (result.success) {
        // Reload watchlist
        setStockNews({});
        setLoading(true);
        
        // รอให้ Context reload เสร็จ
        setTimeout(() => {
          setLoading(false);
        }, 500);
      } else {
        alert(language === 'th' ? 'ไม่พบข้อมูลหุ้นนี้' : 'Stock not found');
      }
    } catch (error) {
      console.error('Error adding stock:', error);
      alert(language === 'th' ? 'เกิดข้อผิดพลาด' : 'Error adding stock');
    } finally {
      setLoadingStocks(prev => {
        const newSet = new Set(prev);
        newSet.delete(symbol);
        return newSet;
      });
    }
  };

  const handleRemoveStock = (symbol, e) => {
    e.stopPropagation();
    
    if (window.confirm(language === 'th' ? `ลบ ${symbol}?` : `Remove ${symbol}?`)) {
      removeFromWatchlist(symbol);
      setStockNews(prev => {
        const newNews = { ...prev };
        delete newNews[symbol];
        return newNews;
      });
      setExpandedStocks(prev => {
        const newSet = new Set(prev);
        newSet.delete(symbol);
        return newSet;
      });
    }
  };

  const handleToggleAlert = (symbol, e) => {
    e.stopPropagation();
    toggleAlert(symbol);
  };

  const handleNewsClick = (article) => {
    navigate('/news', { state: { selectedArticle: article } });
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Loader2 className="w-12 h-12 text-green-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">
            {language === 'th' ? 'กำลังโหลดข่าว...' : 'Loading news...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {language === 'th' ? 'ข่าวหุ้นติดตาม' : 'Watchlist News'}
        </h1>
        <p className="text-gray-600">
          {language === 'th' 
            ? `ข่าวสำคัญจากหุ้นที่คุณติดตาม (${watchlist.length} หุ้น)`
            : `Important news from your watchlist (${watchlist.length} stocks)`}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* News Content (2/3) */}
        <div className="lg:col-span-2 order-2 lg:order-1">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* แสดงข่าวของหุ้นที่เลือก */}
          {watchlist.map((stock) => {
            const isExpanded = expandedStocks.has(stock.symbol);
            const news = stockNews[stock.symbol] || [];

            if (!isExpanded) return null;

            return (
              <div key={stock.symbol} className="mb-6">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{stock.symbol}</h2>
                    <p className="text-sm text-gray-500">
                      {news.length} {language === 'th' ? 'ข่าว' : 'articles'}
                    </p>
                  </div>
                  <button
                    onClick={() => toggleStockNews(stock.symbol)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <ChevronUp className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  {news.length > 0 ? (
                    news.map((article, index) => (
                      <div
                        key={`${article.id}-${article.datetime}-${index}`}
                        className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                      >
                        <NewsCard
                          article={article}
                          onClick={handleNewsClick}
                          onSymbolClick={(symbol) => console.log('Symbol clicked:', symbol)}
                        />
                      </div>
                    ))
                  ) : (
                    <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                      <p className="text-gray-500">
                        {language === 'th' ? 'ไม่มีข่าว' : 'No news available'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Empty / No selection state */}
          {watchlist.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {language === 'th' ? 'ยังไม่มีหุ้นติดตาม' : 'No stocks in watchlist'}
              </h2>
              <p className="text-gray-600">
                {language === 'th' ? 'เพิ่มหุ้นทางด้านขวา' : 'Add stocks on the right'}
              </p>
            </div>
          ) : expandedStocks.size === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <p className="text-gray-600">
                {language === 'th' ? 'คลิกที่หุ้นเพื่อดูข่าว' : 'Click on a stock to view news'}
              </p>
            </div>
          ) : null}
        </div>

        {/* Sidebar - Watchlist (1/3) */}
        <div className="lg:col-span-1 order-1 lg:order-2">
          <div className="bg-white rounded-lg border border-gray-200 sticky top-4">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-green-600" />
                <h2 className="text-lg font-bold text-gray-900">
                  {language === 'th' ? 'การแจ้งเตือน' : 'Notifications'}
                </h2>
              </div>
              <button
                onClick={() => setIsAdding(!isAdding)}
                className="text-green-600 hover:text-green-700"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {/* Add Stock Form */}
            {isAdding && (
              <div className="p-4 border-b border-gray-200 bg-gray-50" ref={dropdownRef}>
                <form onSubmit={handleAddStock}>
                  <div className="relative">
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <input
                          ref={inputRef}
                          type="text"
                          value={newSymbol}
                          onChange={(e) => handleInputChange(e.target.value)}
                          onKeyDown={handleKeyDown}
                          placeholder="AAPL"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                          autoFocus
                          autoComplete="off"
                        />
                        {newSymbol && (
                          <Search className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
                        )}
                      </div>
                      <button
                        type="submit"
                        disabled={!newSymbol.trim()}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300"
                      >
                        {language === 'th' ? 'เพิ่ม' : 'Add'}
                      </button>
                    </div>

                    {/* Dropdown */}
                    {showDropdown && filteredStocks.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {filteredStocks.map((stock, index) => (
                          <div
                            key={stock.symbol}
                            onClick={() => selectStock(stock.symbol)}
                            className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors ${
                              index === selectedIndex
                                ? 'bg-green-50 text-green-700'
                                : 'hover:bg-gray-50'
                            }`}
                          >
                            {/* Logo */}
                            {stock.logoUrl && (
                              <img
                                src={stock.logoUrl}
                                alt={stock.symbol}
                                className="w-6 h-6 object-contain"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }}
                              />
                            )}
                            {/* Symbol */}
                            <div className="flex-1">
                              <div className="font-bold text-sm text-gray-900">
                                {stock.symbol}
                              </div>
                              <div className="text-xs text-gray-500">
                                {stock.fullSymbol}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </form>
              </div>
            )}

            {/* Stock List */}
            <div className="divide-y divide-gray-200">
              {watchlist.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-gray-500 text-sm">
                    {language === 'th' ? 'ยังไม่มีหุ้น' : 'No stocks yet'}
                  </p>
                  <button
                    onClick={() => setIsAdding(true)}
                    className="mt-4 text-green-600 hover:text-green-700 text-sm font-medium"
                  >
                    + {language === 'th' ? 'เพิ่มหุ้น' : 'Add stock'}
                  </button>
                </div>
              ) : (
                watchlist.map((stock) => {
                  const news = stockNews[stock.symbol] || [];
                  const isExpanded = expandedStocks.has(stock.symbol);
                  const isLoading = loadingStocks.has(stock.symbol);
                  const hasUnread = news.length > 0;

                  return (
                    <div
                      key={stock.symbol}
                      onClick={() => !isLoading && toggleStockNews(stock.symbol)}
                      className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                        isExpanded ? 'bg-green-50' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          {/* Status Dot */}
                          <div className="relative">
                            {hasUnread && !isExpanded ? (
                              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            ) : (
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            )}
                          </div>

                          {/* Symbol */}
                          <div className="flex-1">
                            <div className="font-bold text-gray-900">{stock.symbol}</div>
                            {news.length > 0 && (
                              <div className="text-xs text-gray-500">
                                {news.length} {language === 'th' ? 'ข่าว' : 'news'}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action Icons */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => handleToggleAlert(stock.symbol, e)}
                            className={`transition-colors ${
                              stock.alertEnabled ? 'text-green-600' : 'text-gray-300'
                            }`}
                          >
                            <Bell className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => handleRemoveStock(stock.symbol, e)}
                            className="text-gray-300 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WatchlistPage;