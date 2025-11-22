// pages/SearchPage.jsx - Full-Featured Search Page
import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Filter, X, Clock, TrendingUp, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { useDebounce } from '../hooks/useDebounce';
import NewsCard from '../component/News/NewsCard';
import TrendingSymbols from '../component/News/TrendingSymbols';
import { LoadingSpinner, SkeletonCard } from '../component/common/Loading';
import apiService from '../services/apiService';

const SearchPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { searchQuery, setSearchQuery, recentSearches, addRecentSearch, clearRecentSearches } = useApp();
  const { t, language } = useLanguage();

  // States
  const [localSearchQuery, setLocalSearchQuery] = useState(searchParams.get('q') || searchQuery || '');
  const [newsArticles, setNewsArticles] = useState([]);
  const [filteredArticles, setFilteredArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Filter states
  const [selectedSymbol, setSelectedSymbol] = useState(searchParams.get('symbol') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'recent');
  const [showFilters, setShowFilters] = useState(false);

  // Debounce search query
  const debouncedSearchQuery = useDebounce(localSearchQuery, 500);

  // Categories
  const categories = [
    { value: 'all', label: t('search.categories.all') || 'All' },
    { value: 'stocks', label: t('search.categories.stocks') || 'Stocks' },
    { value: 'ai', label: t('search.categories.ai') || 'AI Technology' },
    { value: 'crypto', label: t('search.categories.crypto') || 'Cryptocurrency' },
    { value: 'business', label: t('search.categories.business') || 'Business' },
    { value: 'technology', label: t('search.categories.technology') || 'Technology' }
  ];

  // Sort options
  const sortOptions = [
    { value: 'recent', label: t('search.sort.recent') || 'Most Recent' },
    { value: 'oldest', label: t('search.sort.oldest') || 'Oldest First' },
    { value: 'relevant', label: t('search.sort.relevant') || 'Most Relevant' }
  ];

  // Fetch news on mount or when filters change
  useEffect(() => {
    fetchNews();
  }, [language, selectedCategory]);

  // Update URL params when filters change
  useEffect(() => {
    const params = {};
    if (debouncedSearchQuery) params.q = debouncedSearchQuery;
    if (selectedSymbol) params.symbol = selectedSymbol;
    if (selectedCategory !== 'all') params.category = selectedCategory;
    if (sortBy !== 'recent') params.sort = sortBy;
    
    setSearchParams(params);
  }, [debouncedSearchQuery, selectedSymbol, selectedCategory, sortBy, setSearchParams]);

  // Filter and sort articles
  useEffect(() => {
    let filtered = [...newsArticles];

    // Filter by search query
    if (debouncedSearchQuery) {
      const query = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter(article => 
        article.title?.toLowerCase().includes(query) ||
        article.summary?.toLowerCase().includes(query) ||
        article.source?.toLowerCase().includes(query)
      );
    }

    // Filter by symbol
    if (selectedSymbol) {
      filtered = filtered.filter(article => 
        article.symbols?.some(s => s.toUpperCase() === selectedSymbol.toUpperCase())
      );
    }

    // Sort articles
    switch (sortBy) {
      case 'recent':
        filtered.sort((a, b) => b.datetime - a.datetime);
        break;
      case 'oldest':
        filtered.sort((a, b) => a.datetime - b.datetime);
        break;
      case 'relevant':
        // Simple relevance: articles with images and symbols rank higher
        filtered.sort((a, b) => {
          const scoreA = (a.image ? 1 : 0) + (a.symbols?.length || 0);
          const scoreB = (b.image ? 1 : 0) + (b.symbols?.length || 0);
          return scoreB - scoreA;
        });
        break;
      default:
        break;
    }

    setFilteredArticles(filtered);
  }, [newsArticles, debouncedSearchQuery, selectedSymbol, sortBy]);

  const fetchNews = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await apiService.fetchNews({
        limit: 50,
        category: selectedCategory === 'all' ? 'stocks' : selectedCategory,
        language: language
      });

      if (data.success) {
        setNewsArticles(data.data);
        console.log('✅ Loaded news for search:', data.data.length);
      } else {
        setError(data.message || 'Failed to fetch news');
      }
    } catch (err) {
      setError(err.message || 'Error connecting to server');
      console.error('❌ Error fetching news:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query) => {
    setLocalSearchQuery(query);
    if (query.trim()) {
      addRecentSearch(query);
      setSearchQuery(query);
    }
  };

  const handleRecentSearchClick = (query) => {
    setLocalSearchQuery(query);
    setSearchQuery(query);
  };

  const handleSymbolClick = (symbol) => {
    setSelectedSymbol(symbol);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNewsClick = (article) => {
    navigate(`/news/${article.id}`, { state: { article } });
  };

  const clearAllFilters = () => {
    setLocalSearchQuery('');
    setSelectedSymbol('');
    setSelectedCategory('all');
    setSortBy('recent');
    setSearchQuery('');
  };

  const hasActiveFilters = localSearchQuery || selectedSymbol || selectedCategory !== 'all' || sortBy !== 'recent';

  return (
    <div className="min-h-screen bg-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Search Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Search className="w-6 h-6 text-green-600" />
            <h1 className="text-2xl font-bold text-gray-900">
              {t('search.title') || 'Search News'}
            </h1>
          </div>

          {/* Search Input */}
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={localSearchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder={t('search.placeholder') || 'Search by keyword, company, or symbol...'}
              className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
            />
            {localSearchQuery && (
              <button
                onClick={() => handleSearch('')}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Symbol Filter */}
            {selectedSymbol && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                <TrendingUp className="w-4 h-4" />
                {selectedSymbol}
                <button
                  onClick={() => setSelectedSymbol('')}
                  className="ml-1 hover:bg-green-200 rounded-full p-0.5 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>

            {/* Sort Filter */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>

            {/* Mobile Filters Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors"
            >
              <Filter className="w-4 h-4" />
              {t('search.filters') || 'Filters'}
            </button>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="ml-auto flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                <X className="w-4 h-4" />
                {t('search.clearFilters') || 'Clear all'}
              </button>
            )}
          </div>

          {/* Active Filters Summary */}
          {hasActiveFilters && (
            <div className="mt-3 pt-3 border-t border-gray-200 text-sm text-gray-600">
              {t('search.showing') || 'Showing'} <span className="font-semibold text-gray-900">{filteredArticles.length}</span> {t('search.results') || 'results'}
              {localSearchQuery && <span> {t('search.for') || 'for'} "<span className="font-semibold text-gray-900">{localSearchQuery}</span>"</span>}
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* News Results */}
          <div className="lg:col-span-2 space-y-4">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="bg-white rounded-lg border border-gray-200 p-6">
                    <SkeletonCard />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <X className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {t('search.error') || 'Error loading news'}
                </h3>
                <p className="text-red-700 mb-4">{error}</p>
                <button
                  onClick={fetchNews}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  {t('common.retry') || 'Retry'}
                </button>
              </div>
            ) : filteredArticles.length > 0 ? (
              filteredArticles.map((article) => (
                <div
                  key={article.id}
                  className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  <NewsCard
                    article={article}
                    onClick={handleNewsClick}
                    onSymbolClick={handleSymbolClick}
                  />
                </div>
              ))
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {t('search.noResults') || 'No results found'}
                </h3>
                <p className="text-gray-600 mb-6">
                  {localSearchQuery 
                    ? (t('search.noResultsFor') || `No news found for "${localSearchQuery}"`)
                    : (t('search.trySearching') || 'Try searching for a company or keyword')
                  }
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={clearAllFilters}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    {t('search.clearFilters') || 'Clear filters'}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-gray-600" />
                    <h3 className="font-semibold text-gray-900">
                      {t('search.recentSearches') || 'Recent Searches'}
                    </h3>
                  </div>
                  <button
                    onClick={clearRecentSearches}
                    className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {t('search.clear') || 'Clear'}
                  </button>
                </div>
                <div className="space-y-2">
                  {recentSearches.map((search, index) => (
                    <button
                      key={index}
                      onClick={() => handleRecentSearchClick(search)}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 group"
                    >
                      <Search className="w-4 h-4 text-gray-400 group-hover:text-green-600 transition-colors" />
                      <span className="text-sm text-gray-700 group-hover:text-green-600 transition-colors truncate">
                        {search}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Trending Symbols */}
            <TrendingSymbols onSymbolClick={handleSymbolClick} limit={8} />

            {/* Quick Tips */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-gray-900">
                  {t('search.tips') || 'Search Tips'}
                </h3>
              </div>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">•</span>
                  <span>{t('search.tip1') || 'Use company names or stock symbols'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">•</span>
                  <span>{t('search.tip2') || 'Filter by category for better results'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">•</span>
                  <span>{t('search.tip3') || 'Click symbols to see related news'}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchPage;