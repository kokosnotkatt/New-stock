// Frontend/src/pages/NewsDetailPage.jsx - Full Page Version with Data Fetching
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  ExternalLink, 
  Clock, 
  TrendingUp,
  Share2,
  Bookmark,
  Eye,
  Building2,
  Home
} from 'lucide-react';
import ImageWithFallback from '../component/common/ImageWithFallback';
import SymbolBadges from '../component/News/SymbolBadges';
import NewsCard from '../component/News/NewsCard';

const NewsDetailPage = () => {
  const { newsId } = useParams(); // ดึง ID จาก URL
  const navigate = useNavigate();
  
  const [article, setArticle] = useState(null);
  const [relatedNews, setRelatedNews] = useState([]);
  const [stockPrices, setStockPrices] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookmarked, setBookmarked] = useState(false);

  // ✅ Fetch article data เมื่อ component mount
  useEffect(() => {
    fetchArticleData();
    window.scrollTo(0, 0); // Scroll to top
  }, [newsId]);

  // ✅ Fetch related content เมื่อมี article
  useEffect(() => {
    if (article && article.symbols && article.symbols.length > 0) {
      fetchRelatedContent();
      fetchStockPrices();
    }
  }, [article]);

  const fetchArticleData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📰 Fetching article:', newsId);
      
      // Option 1: ถ้ามี endpoint เฉพาะ
      // const response = await fetch(`http://localhost:5001/api/news/${newsId}`);
      
      // Option 2: ดึงจาก general news แล้วหา ID
      const response = await fetch('http://localhost:5001/api/news?limit=100&detectSymbols=true');
      const data = await response.json();
      
      if (data.success) {
        // หาข่าวที่ตรงกับ ID
        const foundArticle = data.data.find(item => String(item.id) === String(newsId));
        
        if (foundArticle) {
          setArticle(foundArticle);
          console.log('✅ Article found:', foundArticle.title);
        } else {
          setError('Article not found');
          console.error('❌ Article not found with ID:', newsId);
        }
      } else {
        setError('Failed to fetch article');
      }
    } catch (err) {
      console.error('❌ Error fetching article:', err);
      setError('Failed to load article. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedContent = async () => {
    if (!article.symbols || article.symbols.length === 0) return;

    try {
      const mainSymbol = article.symbols[0];
      console.log('🔍 Fetching related news for:', mainSymbol);
      
      const response = await fetch(
        `http://localhost:5001/api/news/by-symbol/${mainSymbol}?limit=5`
      );
      const data = await response.json();
      
      if (data.success) {
        // กรองข่าวปัจจุบันออก
        const filtered = data.data.filter(item => String(item.id) !== String(newsId));
        setRelatedNews(filtered.slice(0, 4));
        console.log(`✅ Found ${filtered.length} related articles`);
      }
    } catch (error) {
      console.error('Error fetching related news:', error);
    }
  };

  const fetchStockPrices = async () => {
    if (!article.symbols || article.symbols.length === 0) return;

    try {
      const prices = {};
      console.log('💰 Fetching prices for:', article.symbols);
      
      for (const symbol of article.symbols) {
        try {
          const response = await fetch(
            `http://localhost:5001/api/stocks/quote/${symbol}`
          );
          const data = await response.json();
          
          if (data.success) {
            prices[symbol] = data.data;
          }
        } catch (err) {
          console.error(`Error fetching price for ${symbol}:`, err);
        }
      }
      
      setStockPrices(prices);
      console.log('✅ Stock prices loaded:', Object.keys(prices).length);
    } catch (error) {
      console.error('Error fetching stock prices:', error);
    }
  };

  const handleSymbolClick = (symbol) => {
    navigate(`/search?symbol=${symbol}`);
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          text: article.summary,
          url: shareUrl
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.log('Share cancelled or failed');
        }
      }
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(shareUrl);
      alert('Link copied to clipboard!');
    }
  };

  const handleBookmark = () => {
    setBookmarked(!bookmarked);
    // TODO: Save to backend/localStorage
    console.log('Bookmark toggled:', !bookmarked);
  };

  const handleReadOriginal = () => {
    if (article && article.url) {
      window.open(article.url, '_blank');
    }
  };

  const handleRelatedNewsClick = (relatedArticle) => {
    // Navigate to new article detail page
    navigate(`/news/${relatedArticle.id}`);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-200 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading article...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !article) {
    return (
      <div className="min-h-screen bg-gray-200 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Article Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'The article you are looking for does not exist.'}</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-3 rounded-lg transition-colors"
          >
            <Home className="w-5 h-5" />
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-200">
      <div className="max-w-5xl mx-auto">
        {/* Header - Sticky */}
        <div className="sticky top-0 bg-white border-b border-gray-200 z-20 shadow-sm">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Back</span>
              </button>

              <div className="flex items-center gap-3">
                <Link
                  to="/"
                  className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  title="Home"
                >
                  <Home className="w-5 h-5" />
                </Link>
                
                <button
                  onClick={handleShare}
                  className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  title="Share"
                >
                  <Share2 className="w-5 h-5" />
                </button>
                
                <button
                  onClick={handleBookmark}
                  className={`p-2 rounded-lg transition-colors ${
                    bookmarked 
                      ? 'text-green-600 bg-green-50' 
                      : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
                  }`}
                  title="Bookmark"
                >
                  <Bookmark className={`w-5 h-5 ${bookmarked ? 'fill-current' : ''}`} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white">
          {/* Featured Image */}
          {article.image && (
            <div className="relative h-96 bg-gray-100">
              <ImageWithFallback
                src={article.image}
                alt={article.title}
                className="w-full h-full object-cover"
                priority={true}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
            </div>
          )}

          {/* Article Content */}
          <div className="px-4 sm:px-6 lg:px-8 py-8">
            {/* Metadata */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <span className={`inline-block px-3 py-1.5 rounded-full text-sm font-medium ${
                article.category === 'Company News' 
                  ? 'bg-sky-100 text-sky-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}>
                {article.category}
              </span>
              
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Clock className="w-4 h-4" />
                <span>{article.timeAgo}</span>
              </div>
              
              {article.source && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Building2 className="w-4 h-4" />
                  <span className="font-medium">{article.source}</span>
                </div>
              )}
            </div>

            {/* Title */}
            <h1 className="text-4xl font-bold text-gray-900 mb-6 leading-tight">
              {article.title}
            </h1>

            {/* Stock Symbols & Prices Section */}
            {article.symbols && article.symbols.length > 0 && (
              <div className="mb-8 p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <h3 className="text-lg font-bold text-gray-900">
                    Related Stocks ({article.symbols.length})
                  </h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {article.symbols.map(symbol => (
                    <button
                      key={symbol}
                      onClick={() => handleSymbolClick(symbol)}
                      className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-all cursor-pointer text-left group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-sm">
                              {symbol.substring(0, 2)}
                            </span>
                          </div>
                          
                          <div>
                            <h4 className="text-xl font-bold text-gray-900 group-hover:text-green-600 transition-colors">
                              {symbol}
                            </h4>
                            <p className="text-xs text-gray-500">
                              Click to view news
                            </p>
                          </div>
                        </div>

                        {stockPrices[symbol] && (
                          <div className="text-right">
                            <div className="text-xl font-bold text-gray-900">
                              ${stockPrices[symbol].current?.toFixed(2)}
                            </div>
                            <div className={`text-sm font-medium ${
                              stockPrices[symbol].changePercent >= 0 
                                ? 'text-green-600' 
                                : 'text-red-600'
                            }`}>
                              {stockPrices[symbol].changePercent >= 0 ? '+' : ''}
                              {stockPrices[symbol].changePercent?.toFixed(2)}%
                            </div>
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Summary */}
            {article.summary && (
              <div className="mb-8">
                <p className="text-xl text-gray-700 leading-relaxed">
                  {article.summary}
                </p>
              </div>
            )}

            {/* Read Original Button */}
            <div className="mb-8 pb-8 border-b border-gray-200">
              <button
                onClick={handleReadOriginal}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold px-8 py-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-3 shadow-lg shadow-green-500/30"
              >
                <span>Read Full Article on {article.source}</span>
                <ExternalLink className="w-5 h-5" />
              </button>
              <p className="text-center text-sm text-gray-500 mt-3">
                This will open the original article in a new tab
              </p>
            </div>

            {/* Related News Section */}
            {relatedNews.length > 0 && (
              <div className="mt-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Eye className="w-6 h-6 text-green-600" />
                  Related News ({relatedNews.length})
                </h3>
                
                <div className="grid grid-cols-1 gap-4">
                  {relatedNews.map(item => (
                    <div 
                      key={item.id}
                      className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleRelatedNewsClick(item)}
                    >
                      <NewsCard
                        article={item}
                        onClick={() => handleRelatedNewsClick(item)}
                        onSymbolClick={(symbol) => navigate(`/search?symbol=${symbol}`)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 sm:px-6 lg:px-8 py-6 bg-gray-50 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-4">
                <span>Source: {article.source}</span>
                <span>•</span>
                <span>{article.timeAgo}</span>
              </div>
              
              <button
                onClick={handleReadOriginal}
                className="text-green-600 hover:text-green-700 font-medium flex items-center gap-1"
              >
                View Original
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsDetailPage;