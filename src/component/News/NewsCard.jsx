// component/News/NewsCard.jsx - Optimized with React.memo
import React from 'react';

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
      'Breaking News': 'bg-yellow-100 text-yellow-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const handleClick = () => {
    onClick?.(article);
  };

  return (
    <div 
      className="p-6 hover:bg-gray-50 transition-colors cursor-pointer group"
      onClick={handleClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
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
          
          <h4 className="font-semibold text-gray-900 mb-2 leading-tight group-hover:text-blue-600 transition-colors">
            {article.title}
          </h4>
          
          <div className="flex items-center text-sm text-gray-500">
            <span className="font-medium">{article.source}</span>
          </div>
        </div>
        
        <div className="ml-4 flex-shrink-0">
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
}, (prevProps, nextProps) => {
  // Custom comparison for memo optimization
  return (
    prevProps.article.id === nextProps.article.id &&
    prevProps.article.title === nextProps.article.title &&
    prevProps.article.score === nextProps.article.score
  );
});

NewsCard.displayName = 'NewsCard';

export default NewsCard;