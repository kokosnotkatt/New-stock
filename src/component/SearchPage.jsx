import { useState, useEffect } from 'react';
import { Search, TrendingUp, Clock, Filter, Calendar, Tag } from 'lucide-react';

const SearchPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [recentSearches, setRecentSearches] = useState(['Apple earnings', 'Tesla stock', 'Fed rate']);
  const [showFilters, setShowFilters] = useState(false);

  const newsData = [
    { 
      id: 1,
      title: 'Apple Announces Record Q4 Earnings, Stock Surges 5%',
      source: 'Bloomberg',
      category: 'Earnings Report',
      date: '2 hours ago',
      snippet: 'Apple Inc. reported better-than-expected quarterly earnings driven by strong iPhone sales...',
      stocks: ['AAPL'],
      image: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=400&h=250&fit=crop'
    },
    { 
      id: 2,
      title: 'Tesla Stock Drops 3% Following Production Miss',
      source: 'Reuters',
      category: 'Market News',
      date: '5 hours ago',
      snippet: 'Tesla shares fell in after-hours trading after the company reported production numbers below analyst expectations...',
      stocks: ['TSLA'],
      image: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=400&h=250&fit=crop'
    },
    { 
      id: 3,
      title: 'Federal Reserve Signals Potential Rate Cut in Q2',
      source: 'Financial Times',
      category: 'Economic Policy',
      date: '8 hours ago',
      snippet: 'Fed Chairman indicates possible interest rate reduction as inflation shows signs of cooling...',
      stocks: ['SPY', 'QQQ'],
      image: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=400&h=250&fit=crop'
    },
    { 
      id: 4,
      title: 'Microsoft Azure Revenue Grows 30% Year-Over-Year',
      source: 'CNBC',
      category: 'Earnings Report',
      date: '1 day ago',
      snippet: 'Microsoft cloud services continue strong growth trajectory, beating Wall Street estimates...',
      stocks: ['MSFT'],
      image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=250&fit=crop'
    },
    { 
      id: 5,
      title: 'Tech Stocks Rally as Inflation Data Comes in Below Expectations',
      source: 'Wall Street Journal',
      category: 'Market News',
      date: '1 day ago',
      snippet: 'Major tech indices surge following positive inflation report, with Nasdaq up 2.5%...',
      stocks: ['AAPL', 'MSFT', 'GOOGL', 'AMZN'],
      image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=250&fit=crop'
    },
    { 
      id: 6,
      title: 'Amazon Expands Same-Day Delivery to 50 More Cities',
      source: 'Bloomberg',
      category: 'Company News',
      date: '2 days ago',
      snippet: 'E-commerce giant continues logistics expansion in competitive delivery market...',
      stocks: ['AMZN'],
      image: 'https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?w=400&h=250&fit=crop'
    },
    { 
      id: 7,
      title: 'Google Announces New AI Features for Search',
      source: 'TechCrunch',
      category: 'Technology',
      date: '3 days ago',
      snippet: 'Alphabet unveils enhanced AI capabilities in search engine, intensifying competition...',
      stocks: ['GOOGL'],
      image: 'https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?w=400&h=250&fit=crop'
    },
    { 
      id: 8,
      title: 'Banking Sector Faces Headwinds as Loan Defaults Rise',
      source: 'Financial Times',
      category: 'Sector Analysis',
      date: '3 days ago',
      snippet: 'Major banks report increased loan loss provisions amid economic uncertainty...',
      stocks: ['JPM', 'BAC', 'WFC'],
      image: 'https://images.unsplash.com/photo-1541354329998-f4d9a9f9297f?w=400&h=250&fit=crop'
    }
  ];

  const trendingTopics = [
    { topic: 'AI Revolution', count: '1,234 articles' },
    { topic: 'Fed Rate Decision', count: '892 articles' },
    { topic: 'Tech Earnings', count: '756 articles' },
    { topic: 'EV Market', count: '543 articles' }
  ];

  const popularSearches = ['Apple earnings', 'Tesla news', 'Fed rate', 'Tech stocks', 'Bitcoin', 'Oil prices'];

  const categories = ['all', 'Market News', 'Earnings Report', 'Economic Policy', 'Company News', 'Technology', 'Sector Analysis'];

  const handleSearch = (query) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    setTimeout(() => {
      let filtered = newsData.filter(news => 
        news.title.toLowerCase().includes(query.toLowerCase()) ||
        news.snippet.toLowerCase().includes(query.toLowerCase()) ||
        news.category.toLowerCase().includes(query.toLowerCase()) ||
        news.stocks.some(stock => stock.toLowerCase().includes(query.toLowerCase()))
      );

      if (selectedCategory !== 'all') {
        filtered = filtered.filter(news => news.category === selectedCategory);
      }

      setSearchResults(filtered);
      setIsSearching(false);
    }, 300);
  };

  const addToRecentSearches = (query) => {
    setRecentSearches(prev => {
      const updated = [query, ...prev.filter(s => s !== query)].slice(0, 5);
      return updated;
    });
  };

  const handleNewsClick = () => {
    if (searchQuery) {
      addToRecentSearches(searchQuery);
    }
  };

  useEffect(() => {
    handleSearch(searchQuery);
  }, [selectedCategory]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold text-gray-900 mb-6">Search Stock News</h2>
      
      {/* Search Input with Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="relative mb-4">
          <input 
            type="text" 
            placeholder="Search news by keyword, company, or stock symbol..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full px-4 py-3 pl-12 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="absolute right-4 top-3 p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Filter className={`w-5 h-5 ${showFilters ? 'text-blue-600' : 'text-gray-400'}`} />
          </button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm font-semibold text-gray-700 mb-2">Filter by Category:</p>
            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === category
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category === 'all' ? 'All News' : category}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Show suggestions when no search query */}
      {!searchQuery && (
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Trending Topics */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-orange-600" />
              <h3 className="text-lg font-bold text-gray-900">Trending Topics</h3>
            </div>
            <div className="space-y-3">
              {trendingTopics.map(item => (
                <button
                  key={item.topic}
                  onClick={() => handleSearch(item.topic)}
                  className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors text-left"
                >
                  <span className="font-semibold text-gray-900">{item.topic}</span>
                  <span className="text-sm text-gray-500">{item.count}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Recent & Popular Searches */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-bold text-gray-900">Recent Searches</h3>
              </div>
              {recentSearches.length > 0 && (
                <button
                  onClick={() => setRecentSearches([])}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="space-y-2 mb-4">
              {recentSearches.length > 0 ? (
                recentSearches.map((search, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSearch(search)}
                    className="w-full flex items-center p-3 hover:bg-gray-50 rounded-lg transition-colors text-left"
                  >
                    <Clock className="w-4 h-4 text-gray-400 mr-3" />
                    <span className="font-medium text-gray-700">{search}</span>
                  </button>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No recent searches</p>
              )}
            </div>
            
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm font-semibold text-gray-700 mb-3">Popular Searches</p>
              <div className="flex flex-wrap gap-2">
                {popularSearches.map((search, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSearch(search)}
                    className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-full hover:bg-blue-100 transition-colors"
                  >
                    {search}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search Results */}
      {searchQuery && (
        <>
          {searchResults.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <p className="text-gray-600 font-medium">
                  {searchResults.length} article{searchResults.length !== 1 ? 's' : ''} found
                </p>
                {selectedCategory !== 'all' && (
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Clear filters
                  </button>
                )}
              </div>
              {searchResults.map((news) => (
                <div
                  key={news.id}
                  onClick={handleNewsClick}
                  className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-all duration-200 cursor-pointer hover:border-blue-300"
                >
                  <div className="md:flex">
                    <div className="md:w-64 h-48 md:h-auto">
                      <img 
                        src={news.image} 
                        alt={news.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-6 flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-3 py-1 text-xs font-semibold text-purple-600 bg-purple-100 rounded-full">
                          {news.category}
                        </span>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Calendar className="w-4 h-4" />
                          <span>{news.date}</span>
                        </div>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2 hover:text-blue-600">
                        {news.title}
                      </h3>
                      <p className="text-gray-600 mb-3 line-clamp-2">{news.snippet}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Tag className="w-4 h-4 text-gray-400" />
                          <div className="flex gap-2">
                            {news.stocks.map(stock => (
                              <span key={stock} className="px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded">
                                {stock}
                              </span>
                            ))}
                          </div>
                        </div>
                        <span className="text-sm text-gray-500 font-medium">{news.source}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : isSearching ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Searching news...</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No articles found</h3>
              <p className="text-gray-600 mb-4">Try different keywords or check the spelling</p>
              {selectedCategory !== 'all' && (
                <button
                  onClick={() => setSelectedCategory('all')}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Clear filters and try again
                </button>
              )}
            </div>
          )}
        </>
      )}

      {/* Empty state when no search */}
      {!searchQuery && (
        <div className="bg-white rounded-lg shadow-md p-12 text-center mt-6">
          <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Start Your Search</h3>
          <p className="text-gray-600">Search for stock news by keyword, company name, or stock symbol</p>
        </div>
      )}
    </div>
  );
};

export default SearchPage;