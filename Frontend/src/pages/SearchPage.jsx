// pages/SearchPage.jsx - FIXED: Race Condition + Language Change
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, X, Clock, TrendingUp, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { useDebounce } from '../hooks/useDebounce';
import NewsCard from '../component/News/NewsCard';
import TrendingSymbols from '../component/News/TrendingSymbols';
import { SkeletonCard } from '../component/common/Loading';
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
  const [translating, setTranslating] = useState(false);
  const [error, setError] = useState(null);

  // Filter states
  const [selectedSymbol, setSelectedSymbol] = useState(searchParams.get('symbol') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  
  // Debounce search query
  const debouncedSearchQuery = useDebounce(localSearchQuery, 500);

  const abortControllerRef = useRef(null);
  const prevLanguageRef = useRef(language);
  const originalArticlesRef = useRef([]);

  // Categories
  const categories = [
    { value: 'all', label: t('search.categories.all') || 'ทั้งหมด' },
    { value: 'stocks', label: t('search.categories.stocks') || 'หุ้น' },
    { value: 'ai', label: t('search.categories.ai') || 'AI & Tech' },
    { value: 'crypto', label: t('search.categories.crypto') || 'คริปโต' },
    { value: 'business', label: t('search.categories.business') || 'ธุรกิจ' },
  ];

  // Fetch news when category changes
  useEffect(() => {
    fetchNews();
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [selectedCategory]);

  // Translate when language changes
  useEffect(() => {
    if (prevLanguageRef.current !== language && originalArticlesRef.current.length > 0) {
      console.log(`Language changed: ${prevLanguageRef.current} -> ${language}`);
      prevLanguageRef.current = language;
      translateArticles();
    }
  }, [language]);

  // Update URL params
  useEffect(() => {
    const params = {};
    if (debouncedSearchQuery) params.q = debouncedSearchQuery;
    if (selectedSymbol) params.symbol = selectedSymbol;
    if (selectedCategory !== 'all') params.category = selectedCategory;

    setSearchParams(params);
  }, [debouncedSearchQuery, selectedSymbol, selectedCategory, setSearchParams]);

  // Filter articles
  useEffect(() => {
    let filtered = [...newsArticles];

    if (debouncedSearchQuery) {
      const query = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter(article =>
        article.title?.toLowerCase().includes(query) ||
        article.summary?.toLowerCase().includes(query) ||
        article.source?.toLowerCase().includes(query)
      );
    }

    if (selectedSymbol) {
      filtered = filtered.filter(article =>
        article.symbols?.some(s => s.toUpperCase() === selectedSymbol.toUpperCase())
      );
    }

    filtered.sort((a, b) => b.datetime - a.datetime);

    setFilteredArticles(filtered);
  }, [newsArticles, debouncedSearchQuery, selectedSymbol]);

  const fetchNews = async () => {
    try {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      setLoading(true);
      setError(null);

      const data = await apiService.fetchNews({
        limit: 50,
        category: selectedCategory === 'all' ? 'stocks' : selectedCategory,
        language: language,
        signal
      });

      if (signal.aborted) {
        console.log('Request was aborted');
        return;
      }

      if (data.success) {
        originalArticlesRef.current = data.data;
        setNewsArticles(data.data);
        console.log(`Loaded ${data.data.length} articles (${language})`);
      } else {
        setError(data.message || 'Failed to fetch news');
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('Request aborted');
        return;
      }
      
      setError(err.message || 'Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  const translateArticles = async () => {
    try {
      setTranslating(true);
      setError(null);

      console.log(`Translating ${originalArticlesRef.current.length} articles to ${language}...`);

      const translated = await apiService.translateNews(originalArticlesRef.current, language);
      setNewsArticles(translated);
      
      console.log(`Translated ${translated.length} articles to ${language}`);
    } catch (err) {
      console.error('Translation error:', err);
      setNewsArticles(originalArticlesRef.current);
      setError('Translation failed, showing original content');
    } finally {
      setTranslating(false);
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
    setSearchQuery('');
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      
      <div className="bg-white border-b border-gray-100 pt-10 pb-8 px-4 mb-8 shadow-sm">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
            {t('search.title')}
          </h1>
          
          <div className="relative max-w-2xl mx-auto group">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
              <Search className="h-6 w-6 text-gray-400 group-focus-within:text-green-600 transition-colors" />
            </div>
            <input
              type="text"
              value={localSearchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder={t('search.placeholder')}
              className="block w-full pl-14 pr-12 py-4 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-green-500 rounded-2xl text-lg shadow-sm hover:shadow-md focus:shadow-xl transition-all duration-300 outline-none placeholder:text-gray-400"
            />
            {localSearchQuery && (
              <button
                onClick={() => handleSearch('')}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap justify-center gap-2 pt-2">
            {categories.map(cat => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  selectedCategory === cat.value
                    ? 'bg-green-600 text-white shadow-lg shadow-green-200 scale-105'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-green-200 hover:text-green-700'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {selectedSymbol && (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-green-50 text-green-700 rounded-full text-sm font-medium border border-green-100 animate-fade-in">
              <TrendingUp className="w-4 h-4" />
              {t('search.resultsFor')} {selectedSymbol}
              <button
                onClick={() => setSelectedSymbol('')}
                className="ml-1 hover:bg-green-200 rounded-full p-0.5 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-lg font-semibold text-gray-800">
                {localSearchQuery || selectedSymbol 
                  ? `${t('search.results')} (${filteredArticles.length})`
                  : t('search.latestNews')
                }
              </h2>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                    <SkeletonCard />
                  </div>
                ))}
              </div>
            ) : translating ? (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">
                  {language === 'th' ? 'กำลังแปลข่าว...' : 'Translating news...'}
                </p>
              </div>
            ) : error && filteredArticles.length === 0 ? (
              <div className="bg-white border border-red-100 rounded-xl p-8 text-center shadow-sm">
                <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <X className="w-6 h-6 text-red-500" />
                </div>
                <h3 className="text-gray-900 font-medium mb-1">{t('common.error')}</h3>
                <p className="text-gray-500 text-sm mb-4">{error}</p>
                <button
                  onClick={fetchNews}
                  className="text-sm font-medium text-red-600 hover:text-red-700 underline"
                >
                  {t('common.retry')}
                </button>
              </div>
            ) : filteredArticles.length > 0 ? (
              <>
                {error && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                    {error}
                  </div>
                )}
                <div className="space-y-4">
                  {filteredArticles.map((article, index) => (
                    <div key={article.id || `news-${index}-${article.datetime}`}
                      className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group"
                    >
                      <NewsCard
                        article={article}
                        onClick={handleNewsClick}
                        onSymbolClick={handleSymbolClick}
                      />
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="bg-white rounded-xl border border-gray-100 p-12 text-center shadow-sm">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {t('search.noResults')}
                </h3>
                <p className="text-gray-500 mb-6 max-w-xs mx-auto text-sm">
                  {t('search.noResultsDesc')}
                </p>
                {(localSearchQuery || selectedSymbol || selectedCategory !== 'all') && (
                  <button
                    onClick={clearAllFilters}
                    className="px-6 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {t('search.clear')}
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="lg:col-span-1 space-y-6">
            
            {recentSearches.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-50 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-gray-500" />
                    {t('search.recentSearches')}
                  </h3>
                  <button
                    onClick={clearRecentSearches}
                    className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                  >
                    {t('search.clear')}
                  </button>
                </div>
                <div>
                  {recentSearches.map((search, index) => (
                    <button
                      key={index}
                      onClick={() => handleRecentSearchClick(search)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center justify-between group border-b border-gray-50 last:border-0"
                    >
                      <span className="text-sm text-gray-600 group-hover:text-green-700 transition-colors truncate">
                        {search}
                      </span>
                      <ArrowRight className="w-3 h-3 text-gray-300 group-hover:text-green-500 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <h3 className="font-semibold text-gray-900 text-sm">
                  {t('search.trendingTopics')}
                </h3>
              </div>
              <TrendingSymbols onSymbolClick={handleSymbolClick} limit={8} />
            </div>     
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchPage;