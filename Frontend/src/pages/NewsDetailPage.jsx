// pages/NewsDetailPage.jsx - Full Article Detail Page (NO Bookmark/Share)
import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { 
  X, 
  ExternalLink, 
  Calendar,
  Clock,
  TrendingUp,
  ChevronLeft
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import ImageWithFallback from '../component/common/ImageWithFallback';
import SymbolBadges from '../component/News/SymbolBadges';
import NewsCard from '../component/News/NewsCard';
import { LoadingSpinner } from '../component/common/Loading';

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

  // Fetch article if not in location state
  useEffect(() => {
    if (!article) {
      setError('Article not found');
      setLoading(false);
    } else {
      fetchRelatedNews();
    }
  }, [article]);

  const fetchRelatedNews = async () => {
    if (!article?.symbols || article.symbols.length === 0) return;

    try {
      setRelatedLoading(true);
      
      const symbol = article.symbols[0];
      const response = await fetch(`http://localhost:5001/api/news/by-symbol/${symbol}?limit=5&language=${language}`);
      const data = await response.json();

      if (data.success) {
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
            {t('detail.notFoundTitle') || 'Article Not Found'}
          </h2>
          <p className="text-gray-600 mb-6">
            {t('detail.notFoundDesc') || 'The article you are looking for could not be found.'}
          </p>
          <button
            onClick={handleClose}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            {t('detail.back') || 'Go Back'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header - Simple (Back + Close only) */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <button
            onClick={handleClose}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="font-medium">{t('detail.back') || 'Back'}</span>
          </button>

          <button
            onClick={handleClose}
            className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
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
                  showWatchlistButton={true}
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
                  <span>
                    {language === 'th' ? 'อ่านบทความฉบับเต็มที่' : 'Read Full Article on'} {article.source}
                  </span>
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
                {language === 'th' ? 'ข่าวที่เกี่ยวข้อง' : 'Related News'}
              </h2>
            </div>

            {relatedLoading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner size="md" />
              </div>
            ) : relatedNews.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {relatedNews.map((news, index) => (
                  <div
                    key={`${news.id}-${news.datetime}-${index}`}
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
                  {language === 'th' ? 'ไม่มีข่าวที่เกี่ยวข้อง' : 'No related news available'}
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