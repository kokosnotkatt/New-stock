// Frontend/src/pages/SearchPage.jsx
import { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Filter, X, TrendingUp, Clock } from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';
import { SkeletonCard } from '../component/common/Loading';
import { useLanguage } from '../context/LanguageContext'; // 1. Import

const NewsCard = lazy(() => import('../component/News/NewsCard'));

const SearchPage = () => {
  const navigate = useNavigate();
  const { t } = useLanguage(); // 2. เรียกใช้ t
  const [searchParams, setSearchParams] = useSearchParams();
  
  const symbolFromUrl = searchParams.get('symbol') || '';
  
  const [searchQuery, setSearchQuery] = useState(symbolFromUrl);
  const [filters, setFilters] = useState({
    category: 'all',
    timeRange: 'all',
    sortBy: 'relevance'
  });
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [recentSearches, setRecentSearches] = useState([]); // (ใช้ Local State)
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  
  // 3. ย้าย Array มาไว้ใน useMemo เพื่อให้แปลภาษาได้
  const categories = useMemo(() => [
    { value: 'all', label: t('search.catAll') },
    { value: 'stocks', label: t('search.catStocks') },
    { value: 'ai', label: t('search.catAI') },
    { value: 'market', label: t('search.catMarket') },
    { value: 'crypto', label: t('search.catCrypto') },
    { value: 'tech', label: t('search.catTech') }
  ], [t]);
  
  const timeRanges = useMemo(() => [
    { value: 'all', label: t('search.timeAll') },
    { value: 'today', label: t('search.timeToday') },
    { value: 'week', label: t('search.timeWeek') },
    { value: 'month', label: t('search.timeMonth') },
    { value: 'year', label: t('search.timeYear') }
  ], [t]);
  
  const sortOptions = useMemo(() => [
    { value: 'relevance', label: t('search.sortRelevance') },
    { value: 'recent', label: t('search.sortRecent') },
    { value: 'popular', label: t('search.sortPopular') }
  ], [t]);

  // (useEffect sync URL ... เหมือนเดิม)
  useEffect(() => {
    if (searchQuery) {
      setSearchParams({ symbol: searchQuery });
    } else {
      setSearchParams({});
    }
  }, [searchQuery, setSearchParams]);

  // 4. (อัปเดต) ใช้ t() ใน Error
  const performSearch = useCallback(async (query, currentFilters, pageNum = 1) => {
    if (!query.trim() && currentFilters.category === 'all') {
      setSearchResults([]);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // ( Logic การ fetch ... เหมือนเดิม)
      // ...
      const response = await fetch(
        `http://localhost:5001/api/news?limit=20&category=${currentFilters.category}&detectSymbols=true`
      );
      const data = await response.json();
      
      if (data.success) {
        const filtered = data.data.filter(item => 
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          item.summary?.toLowerCase().includes(query.toLowerCase()) ||
          (item.symbols && item.symbols.some(s => s.toLowerCase().includes(query.toLowerCase())))
        );
        
        if (pageNum === 1) {
          setSearchResults(filtered);
        } else {
          setSearchResults(prev => [...prev, ...filtered]);
        }
        
        setHasMore(pageNum < 5); // (Mock limit)
        
        if (query.trim() && pageNum === 1) {
          setRecentSearches(prev => {
            const filtered = prev.filter(s => s !== query);
            return [query, ...filtered].slice(0, 5);
          });
        }
      } else {
        setError(t('common.error')); // <-- ใช้ t()
      }
      
    } catch (err) {
      setError(t('common.error')); // <-- ใช้ t()
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [t]); // 5. เพิ่ม t เป็น dependency

  useEffect(() => {
    if (debouncedSearchQuery) {
      setPage(1);
      performSearch(debouncedSearchQuery, filters, 1);
    } else {
      setSearchResults([]);
    }
  }, [debouncedSearchQuery, filters, performSearch]);

  const filteredResults = useMemo(() => {
    // ... (Logic การ filter ... เหมือนเดิม)
    return searchResults; // (ปรับ logic นี้ตามต้องการ)
  }, [searchResults, filters]);

  const handleFilterChange = useCallback((filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
    setPage(1);
  }, []);

  const handleLoadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      performSearch(debouncedSearchQuery, filters, nextPage);
    }
  }, [page, isLoading, hasMore, debouncedSearchQuery, filters, performSearch]);

  const handleRecentSearchClick = useCallback((query) => {
    setSearchQuery(query);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setPage(1);
    setSearchParams({});
  }, [setSearchParams]);

  const handleNewsClick = (article) => {
    console.log('Navigating to news detail:', article.id);
    navigate(`/news/${article.id}`);
  };

  const handleSymbolClick = (symbol) => {
    setSearchQuery(symbol);
  };

  return (
    <div className="min-h-screen bg-gray-200">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Search Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('search.placeholder')} // 6. ใช้ t()
                  className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-700 focus:border-transparent"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    onClick={handleClearSearch}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label="Clear search"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Filter className="w-5 h-5" />
              <span>{t('search.filters')}</span> {/* 6. ใช้ t() */}
              {Object.values(filters).some(v => v !== 'all' && v !== 'relevance') && (
                <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">
                  Active
                </span>
              )}
            </button>
          </div>
          
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  {/* 6. ใช้ t() */}
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('search.catAll')}</label>
                  <select
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('search.timeAll')}</label>
                  <select
                    value={filters.timeRange}
                    onChange={(e) => handleFilterChange('timeRange', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    {timeRanges.map(range => (
                      <option key={range.value} value={range.value}>{range.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('search.sortRelevance')}</label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    {sortOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {searchQuery && (
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  {isLoading && page === 1 ? (
                    t('search.searching') 
                  ) : (
                    <>
                      {filteredResults.length} {t('search.resultsFor')} "{searchQuery}"
                      {filters.category !== 'all' && ` in ${filters.category}`}
                    </>
                  )}
                </h2>
              </div>
            )}
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}
            
            <div className="space-y-4">
              {isLoading && page === 1 ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-lg p-6 border border-gray-200">
                    <SkeletonCard />
                  </div>
                ))
              ) : filteredResults.length > 0 ? (
                <Suspense fallback={<SkeletonCard />}>
                  {filteredResults.map((result) => (
                    <div key={result.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                      <NewsCard
                        article={result}
                        onClick={handleNewsClick}
                        onSymbolClick={handleSymbolClick}
                      />
                    </div>
                  ))}
                </Suspense>
              ) : searchQuery && !isLoading ? (
                <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                  <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('search.noResults')}</h3>
                  <p className="text-gray-600 mb-4">{t('search.noResultsDesc')}</p>
                  <button
                    onClick={handleClearSearch}
                    className="text-green-600 hover:text-green-700 font-medium"
                  >
                    {t('search.clearSearch')}
                  </button>
                </div>
              ) : !searchQuery && recentSearches.length === 0 ? (
                <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                  <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('search.placeholder')}</h3>
                  <p className="text-gray-600">{t('search.placeholder2')}</p>
                </div>
              ) : null}
              
              {filteredResults.length > 0 && hasMore && (
                <div className="text-center py-4">
                  <button
                    onClick={handleLoadMore}
                    disabled={isLoading}
                    className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        {t('search.loading')}
                      </div>
                    ) : (
                      t('search.loadMore')
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
          
          <div className="lg:col-span-1">
            {recentSearches.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-gray-500" />
                    <h3 className="font-semibold text-gray-900">{t('search.recentSearches')}</h3>
                  </div>
                  <button
                    onClick={() => setRecentSearches([])}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    {t('search.clear')}
                  </button>
                </div>
                <div className="space-y-2">
                  {recentSearches.map((search, index) => (
                    <button
                      key={index}
                      onClick={() => handleRecentSearchClick(search)}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      {search}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-green-500" />
                <h3 className="font-semibold text-gray-900">{t('search.trendingTopics')}</h3>
              </div>
              <div className="flex gap-2 flex-wrap">
                {['NVIDIA', 'AI Stocks', 'Fed Rate', 'Tesla', 'Cryptocurrency'].map((topic, index) => (
                  <button
                    key={index}
                    onClick={() => setSearchQuery(topic)}
                    className="px-3 py-1 bg-gray-100 text-gray-800 text-sm rounded-full font-medium hover:bg-gray-200 transition-colors"
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchPage;