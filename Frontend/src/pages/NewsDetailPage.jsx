// pages/NewsDetailPage.jsx - Full Article Detail Page
import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { 
  X, 
  ExternalLink, 
  Calendar, 
  Share2, 
  Bookmark,
  Clock,
  TrendingUp,
  ChevronLeft
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import ImageWithFallback from '../component/common/ImageWithFallback';
import SymbolBadges from '../component/News/SymbolBadges';
import NewsCard from '../component/News/NewsCard';
import { LoadingSpinner } from '../component/common/Loading';
import apiService from '../services/apiService';

const NewsDetailPage = () => {
  const { newsId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { t, language } = useLanguage();

  // States
  const [article, setArticle] = useState(location.state?.article || null);
  const [relatedNews, setRelatedNews] = useState([]);
  const [loading, setLoading] = useState(!article);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [error, setError] = useState(null);
  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  // Fetch article if not in location state
  useEffect(() => {
    if (!article) {
      // In real app, fetch from API
      setError('Article not found');
      setLoading(false);
    } else {
      // Fetch related news
      fetchRelatedNews();
    }
  }, [article]);

  // Check if bookmarked
  useEffect(() => {
    if (article) {
      const bookmarks = JSON.parse(localStorage.getItem('bookmarked_news') || '[]');
      setBookmarked(bookmarks.some(b => b.id === article.id));
    }
  }, [article]);

  const fetchRelatedNews = async () => {
    if (!article?.symbols || article.symbols.length === 0) return;

    try {
      setRelatedLoading(true);
      
      // Fetch news for the first symbol
      const symbol = article.symbols[0];
      const response = await fetch(`http://localhost:5001/api/news/by-symbol/${symbol}?limit=5`);
      const data = await response.json();

      if (data.success) {
        // Filter out current article
        const filtered = data.data.filter(news => news.id !== article.id);
        setRelatedNews(filtered.slice(0, 4));
      }
    } catch (err) {
      console.error('Error fetching related news:', err);
    } finally {
      setRelatedLoading(false);
    }
  };

  const handleClose = () => {
    navigate(-1);
  };

  const handleSymbolClick = (symbol) => {
    navigate(`/search?symbol=${symbol}`);
  };

  const handleRelatedNewsClick = (relatedArticle) => {
    setArticle(relatedArticle);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    fetchRelatedNews();
  };

  const handleShare = (platform) => {
    const url = article.url || window.location.href;
    const text = article.title;

    const shareUrls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
      line: `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      copy: null
    };

    if (platform === 'copy') {
      navigator.clipboard.writeText(url);
      alert(t('news.linkCopied') || 'Link copied to clipboard!');
    } else {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    }

    setShareMenuOpen(false);
  };

  const handleBookmark = () => {
    const bookmarks = JSON.parse(localStorage.getItem('bookmarked_news') || '[]');
    
    if (bookmarked) {
      // Remove bookmark
      const filtered = bookmarks.filter(b => b.id !== article.id);
      localStorage.setItem('bookmarked_news', JSON.stringify(filtered));
      setBookmarked(false);
    } else {
      // Add bookmark
      bookmarks.push({
        id: article.id,
        title: article.title,
        url: article.url,
        image: article.image,
        timestamp: Date.now()
      });
      localStorage.setItem('bookmarked_news', JSON.stringify(bookmarks));
      setBookmarked(true);
    }
  };

  const formatDate = (datetime) => {
    if (!datetime) return '';
    const date = new Date(datetime * 1000);
    return date.toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
        <div className="bg-white rounded-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {t('news.notFound') || 'Article Not Found'}
          </h2>
          <p className="text-gray-600 mb-6">
            {t('news.notFoundDesc') || 'The article you are looking for could not be found.'}
          </p>
          <button
            onClick={handleClose}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            {t('news.goBack') || 'Go Back'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <button
            onClick={handleClose}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="font-medium">{t('news.back') || 'Back'}</span>
          </button>

          <div className="flex items-center gap-3">
            {/* Bookmark */}
            <button
              onClick={handleBookmark}
              className={`p-2 rounded-lg transition-colors ${
                bookmarked 
                  ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title={bookmarked ? t('news.removeBookmark') : t('news.addBookmark')}
            >
              <Bookmark className={`w-5 h-5 ${bookmarked ? 'fill-current' : ''}`} />
            </button>

            {/* Share */}
            <div className="relative">
              <button
                onClick={() => setShareMenuOpen(!shareMenuOpen)}
                className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                title={t('news.share') || 'Share'}
              >
                <Share2 className="w-5 h-5" />
              </button>

              {shareMenuOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShareMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <button
                      onClick={() => handleShare('facebook')}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-3"
                    >
                      <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center">
                        <span className="text-white text-xs font-bold">f</span>
                      </div>
                      Facebook
                    </button>
                    <button
                      onClick={() => handleShare('twitter')}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-3"
                    >
                      <div className="w-5 h-5 bg-sky-500 rounded flex items-center justify-center">
                        <span className="text-white text-xs font-bold">𝕏</span>
                      </div>
                      Twitter
                    </button>
                    <button
                      onClick={() => handleShare('line')}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-3"
                    >
                      <div className="w-5 h-5 bg-green-500 rounded flex items-center justify-center">
                        <span className="text-white text-xs font-bold">L</span>
                      </div>
                      LINE
                    </button>
                    <button
                      onClick={() => handleShare('linkedin')}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-3"
                    >
                      <div className="w-5 h-5 bg-blue-700 rounded flex items-center justify-center">
                        <span className="text-white text-xs font-bold">in</span>
                      </div>
                      LinkedIn
                    </button>
                    <hr className="my-2 border-gray-200" />
                    <button
                      onClick={() => handleShare('copy')}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      {t('news.copyLink') || 'Copy Link'}
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Close */}
            <button
              onClick={handleClose}
              className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              title={t('news.close') || 'Close'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <article className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Featured Image */}
          {article.image && (
            <div className="w-full h-96 relative">
              <ImageWithFallback
                src={article.image}
                alt={article.title}
                className="w-full h-full object-cover"
                priority={true}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            </div>
          )}

          {/* Article Header */}
          <div className="p-8">
            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
              {/* Source */}
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="font-semibold text-gray-900">{article.source}</span>
              </div>

              <span className="text-gray-300">•</span>

              {/* Date */}
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                {formatDate(article.datetime)}
              </div>

              {/* Reading Time */}
              {article.summary && (
                <>
                  <span className="text-gray-300">•</span>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    {Math.ceil(article.summary.length / 1000)} min read
                  </div>
                </>
              )}
            </div>

            {/* Category & Symbols */}
            <div className="flex flex-wrap items-center gap-2 mb-6">
              {article.category && (
                <span className="inline-block px-3 py-1 bg-gray-900 text-white text-xs font-medium rounded-full">
                  {article.category}
                </span>
              )}
              {article.symbols && article.symbols.length > 0 && (
                <SymbolBadges 
                  symbols={article.symbols}
                  onSymbolClick={handleSymbolClick}
                />
              )}
            </div>

            {/* Title */}
            <h1 className="text-4xl font-bold text-gray-900 leading-tight mb-6">
              {article.title || article.headline}
            </h1>

            {/* Summary/Content */}
            {article.summary && (
              <div className="prose prose-lg max-w-none mb-8">
                <p className="text-xl text-gray-700 leading-relaxed">
                  {article.summary}
                </p>
              </div>
            )}

            {/* Read Full Article Button */}
            {article.url && (
              <div className="pt-6 border-t border-gray-200">
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold rounded-lg transition-all shadow-lg shadow-green-500/30"
                >
                  <span>{t('news.readFullArticle') || 'Read Full Article on'} {article.source}</span>
                  <ExternalLink className="w-5 h-5" />
                </a>
              </div>
            )}
          </div>
        </article>

        {/* Related News */}
        {article.symbols && article.symbols.length > 0 && (
          <div className="mt-12">
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className="w-6 h-6 text-green-600" />
              <h2 className="text-2xl font-bold text-gray-900">
                {t('news.relatedNews') || 'Related News'}
              </h2>
            </div>

            {relatedLoading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner size="md" />
              </div>
            ) : relatedNews.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {relatedNews.map((news) => (
                  <div
                    key={news.id}
                    className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                  >
                    <NewsCard
                      article={news}
                      onClick={handleRelatedNewsClick}
                      onSymbolClick={handleSymbolClick}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                <p className="text-gray-600">
                  {t('news.noRelatedNews') || 'No related news available'}
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      <div className="h-16" />
    </div>
  );
};

export default NewsDetailPage;