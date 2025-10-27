// pages/SearchPage.jsx
import { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import { Search, Filter, X, TrendingUp, Clock } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useDebounce } from '../hooks/useDebounce';
import { SkeletonCard } from '../component/common/Loading';

// Lazy load heavy components
const NewsCard = lazy(() => import('../component/News/NewsCard'));

const SearchPage = () => {
  const { searchQuery, setSearchQuery, recentSearches, addRecentSearch, clearRecentSearches } = useApp();
  
  // Local state
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
  
  // Debounced search value
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  
  // Categories
  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'stocks', label: 'Stocks' },
    { value: 'ai', label: 'AI Technology' },
    { value: 'market', label: 'Market Trends' },
    { value: 'crypto', label: 'Cryptocurrency' },
    { value: 'tech', label: 'Technology' }
  ];
  
  // Time ranges
  const timeRanges = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'year', label: 'This Year' }
  ];
  
  // Sort options
  const sortOptions = [
    { value: 'relevance', label: 'Most Relevant' },
    { value: 'recent', label: 'Most Recent' },
    { value: 'popular', label: 'Most Popular' }
  ];

  // Mock search function (replace with actual API call)
  const performSearch = useCallback(async (query, currentFilters, pageNum = 1) => {
    if (!query.trim() && currentFilters.category === 'all') {
      setSearchResults([]);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock data (replace with actual API response)
      const mockResults = [
        {
          id: `${pageNum}-1`,
          title: `Search Result for "${query}" - Article ${(pageNum - 1) * 10 + 1}`,
          source: 'Tech News',
          timeAgo: '2 hours ago',
          category: 'Technology',
          score: 0.95,
          excerpt: `This article discusses ${query} in detail, covering various aspects and implications for the market.`
        },
        {
          id: `${pageNum}-2`,
          title: `Analysis: How ${query} is Changing the Industry`,
          source: 'Market Watch',
          timeAgo: '5 hours ago',
          category: 'Market Trends',
          score: 0.89,
          excerpt: `An in-depth analysis of ${query} and its impact on current market trends and future projections.`
        },
        {
          id: `${pageNum}-3`,
          title: `Breaking: Major Development in ${query}`,
          source: 'Financial Times',
          timeAgo: '1 day ago',
          category: 'Breaking News',
          score: 0.87,
          excerpt: `Latest updates and breaking news about ${query}, including expert opinions and market reactions.`
        }
      ];
      
      if (pageNum === 1) {
        setSearchResults(mockResults);
      } else {
        setSearchResults(prev => [...prev, ...mockResults]);
      }
      
      // Check if there are more results
      setHasMore(pageNum < 5); // Mock limit
      
      // Add to recent searches
      if (query.trim() && pageNum === 1) {
        addRecentSearch(query);
      }
      
    } catch (err) {
      setError('Failed to fetch search results. Please try again.');
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [addRecentSearch]);

  // Effect for debounced search
  useEffect(() => {
    if (debouncedSearchQuery) {
      setPage(1);
      performSearch(debouncedSearchQuery, filters, 1);
    } else {
      setSearchResults([]);
    }
  }, [debouncedSearchQuery, filters, performSearch]);

  // Memoized filtered results
  const filteredResults = useMemo(() => {
    let results = [...searchResults];
    
    // Apply category filter
    if (filters.category !== 'all') {
      results = results.filter(item => 
        item.category.toLowerCase().includes(filters.category.toLowerCase())
      );
    }
    
    // Apply sorting
    if (filters.sortBy === 'recent') {
      results.sort((a, b) => {
        // Convert timeAgo to comparable values
        const getTime = (timeStr) => {
          if (timeStr.includes('hour')) return parseInt(timeStr);
          if (timeStr.includes('day')) return parseInt(timeStr) * 24;
          return 999;
        };
        return getTime(a.timeAgo) - getTime(b.timeAgo);
      });
    } else if (filters.sortBy === 'popular') {
      results.sort((a, b) => (b.score || 0) - (a.score || 0));
    }
    
    return results;
  }, [searchResults, filters]);

  // Handle filter changes
  const handleFilterChange = useCallback((filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
    setPage(1);
  }, []);

  // Handle load more
  const handleLoadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      performSearch(debouncedSearchQuery, filters, nextPage);
    }
  }, [page, isLoading, hasMore, debouncedSearchQuery, filters, performSearch]);

  // Handle recent search click
  const handleRecentSearchClick = useCallback((query) => {
    setSearchQuery(query);
  }, [setSearchQuery]);

  // Clear search
  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setPage(1);
  }, [setSearchQuery]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Search Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for stocks, news, topics..."
                  className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            
            {/* Filter Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Filter className="w-5 h-5" />
              <span>Filters</span>
              {Object.values(filters).some(v => v !== 'all' && v !== 'relevance') && (
                <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded-full text-xs">
                  Active
                </span>
              )}
            </button>
          </div>
          
          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Time Range Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time Range
                  </label>
                  <select
                    value={filters.timeRange}
                    onChange={(e) => handleFilterChange('timeRange', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {timeRanges.map(range => (
                      <option key={range.value} value={range.value}>
                        {range.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Sort By */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sort By
                  </label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {sortOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content Area */}
          <div className="lg:col-span-2">
            {/* Search Results */}
            {searchQuery && (
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  {isLoading && page === 1 ? (
                    'Searching...'
                  ) : (
                    <>
                      {filteredResults.length} results for "{searchQuery}"
                      {filters.category !== 'all' && ` in ${filters.category}`}
                    </>
                  )}
                </h2>
              </div>
            )}
            
            {/* Error State */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}
            
            {/* Results List */}
            <div className="space-y-4">
              {isLoading && page === 1 ? (
                // Loading state
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-lg p-6 border border-gray-200">
                    <SkeletonCard />
                  </div>
                ))
              ) : filteredResults.length > 0 ? (
                // Results
                <Suspense fallback={<SkeletonCard />}>
                  {filteredResults.map((result) => (
                    <div key={result.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                      <NewsCard
                        article={{
                          ...result,
                          url: `/news/${result.id}`
                        }}
                        onClick={() => console.log('Navigate to:', result)}
                      />
                      {result.excerpt && (
                        <div className="px-6 pb-4 -mt-2">
                          <p className="text-sm text-gray-600">{result.excerpt}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </Suspense>
              ) : searchQuery && !isLoading ? (
                // No results
                <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                  <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No results found
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Try adjusting your search terms or filters
                  </p>
                  <button
                    onClick={handleClearSearch}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Clear search
                  </button>
                </div>
              ) : !searchQuery && recentSearches.length === 0 ? (
                // Empty state
                <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                  <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Start searching
                  </h3>
                  <p className="text-gray-600">
                    Enter keywords to search for stocks, news, and market trends
                  </p>
                </div>
              ) : null}
              
              {/* Load More Button */}
              {filteredResults.length > 0 && hasMore && (
                <div className="text-center py-4">
                  <button
                    onClick={handleLoadMore}
                    disabled={isLoading}
                    className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Loading...
                      </div>
                    ) : (
                      'Load More'
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-gray-500" />
                    <h3 className="font-semibold text-gray-900">Recent Searches</h3>
                  </div>
                  <button
                    onClick={clearRecentSearches}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Clear
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
            
            {/* Trending Topics */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-green-500" />
                <h3 className="font-semibold text-gray-900">Trending Topics</h3>
              </div>
              <div className="space-y-3">
                {['NVIDIA', 'AI Stocks', 'Fed Rate', 'Tesla', 'Cryptocurrency'].map((topic, index) => (
                  <button
                    key={index}
                    onClick={() => setSearchQuery(topic)}
                    className="flex items-center justify-between w-full text-left hover:bg-gray-50 p-2 rounded-lg transition-colors"
                  >
                    <span className="text-sm font-medium text-gray-700">{topic}</span>
                    <span className="text-xs text-gray-500">#{index + 1}</span>
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