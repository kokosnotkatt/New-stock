import React from 'react';
import { Newspaper } from 'lucide-react';
import ImageWithFallback from '../common/ImageWithFallback'; 

const NewsCard = React.memo(({ article, onClick }) => {
  const getCategoryColor = (category) => {
    const colors = {
      'Stock Analysis': 'bg-blue-100 text-blue-800',
      'AI Technology': 'bg-purple-100 text-purple-800',
      'Market Trends': 'bg-green-100 text-green-800',
      'Tech Stocks': 'bg-orange-100 text-orange-800',
      'Innovation': 'bg-red-100 text-red-800',
      'Emerging Tech': 'bg-indigo-100 text-indigo-800',
      'Technology': 'bg-cyan-100 text-cyan-800',
      'Breaking News': 'bg-yellow-100 text-yellow-800',
      'Market News': 'bg-emerald-100 text-emerald-800',
      'Company News': 'bg-sky-100 text-sky-800',
      'Forex': 'bg-violet-100 text-violet-800',
      'Cryptocurrency': 'bg-amber-100 text-amber-800',
      'Mergers & Acquisitions': 'bg-rose-100 text-rose-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const handleClick = () => {
    onClick?.(article);
  };

  // ✅ ถ้ามีรูป - Layout แบบเดิม
  if (article.image) {
    return (
      <div 
        className="p-6 hover:bg-gray-50 transition-colors cursor-pointer group"
        onClick={handleClick}
      >
        <div className="flex items-start justify-between gap-5">
          <ImageWithFallback
            src={article.image}
            alt={article.title}
            className="w-32 h-32 object-cover rounded-lg flex-shrink-0"
            fallbackType="gradient"
          />

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(article.category)}`}>
                {article.category}
              </span>
              <span className="text-xs text-gray-500">•</span>
              <span className="text-xs text-gray-500">{article.timeAgo}</span>
            </div>
            
            <h4 className="text-lg font-semibold text-gray-900 mb-2 leading-tight group-hover:text-green-600 transition-colors">
              {article.title}
            </h4>
            
            {article.summary && (
              <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                {article.summary}
              </p>
            )}
            
            <div className="flex items-center text-sm text-gray-500">
              <span className="font-medium">{article.source}</span>
            </div>
          </div>
          
          <div className="ml-4 flex-shrink-0 self-center">
            <svg 
              className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </div>
      </div>
    );
  }

  // ✅ ถ้าไม่มีรูป - Layout ปรับใหม่ (Text-First)
  return (
    <div 
      className="p-6 hover:bg-gray-50 transition-colors cursor-pointer group"
      onClick={handleClick}
    >
      <div className="flex items-start gap-4">
        {/* Icon สำหรับข่าวไม่มีรูป */}
        <div className="w-10 h-10 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:from-green-100 group-hover:to-emerald-100 transition-colors">
          <Newspaper className="w-5 h-5 text-green-600" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(article.category)}`}>
              {article.category}
            </span>
            <span className="text-xs text-gray-500">•</span>
            <span className="text-xs text-gray-500">{article.timeAgo}</span>
            {article.score && (
              <>
                <span className="text-xs text-gray-500">•</span>
                <span className="text-xs text-gray-500">
                  {(article.score * 100).toFixed(0)}% match
                </span>
              </>
            )}
          </div>
          
          {/* Title ใหญ่ขึ้นเมื่อไม่มีรูป */}
          <h4 className="text-xl font-bold text-gray-900 mb-2 leading-snug group-hover:text-green-600 transition-colors">
            {article.title}
          </h4>
          
          {/* Summary เด่นขึ้น */}
          {article.summary && (
            <p className="text-base text-gray-700 mb-3 line-clamp-2 leading-relaxed">
              {article.summary}
            </p>
          )}
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">{article.source}</span>
            <svg 
              className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.article.id === nextProps.article.id &&
    prevProps.article.title === nextProps.article.title &&
    prevProps.article.score === nextProps.article.score &&
    prevProps.article.image === nextProps.article.image
  );
});

NewsCard.displayName = 'NewsCard';

export default NewsCard;