
const NewsList = ({ onNewsClick }) => {
  const newsArticles = [
    {
      id: 1,
      title: "Prediction: This Will Be The Next $4 Trillion-Dollar Stock",
      source: "Motley Fool",
      timeAgo: "24 hours ago",
      category: "Stock Analysis",
      url: "/news/prediction-4-trillion-dollar-stock"
    },
    {
      id: 2,
      title: "Prediction: This Magnificent Artificial Intelligence (AI) Stock Will Be the Most Valuable Company in the World by 2035 (Hint: It's Not Nvidia or Microsoft)",
      source: "Motley Fool",
      timeAgo: "24 hours ago",
      category: "AI Technology",
      url: "/news/ai-stock-most-valuable-company-2035"
    },
    {
      id: 3,
      title: "10 Stock Splits Investors Could See Happen in 2026",
      source: "Motley Fool",
      timeAgo: "3 hours ago",
      category: "Market Trends",
      url: "/news/10-stock-splits-2026"
    },
    {
      id: 4,
      title: "This Artificial Intelligence (AI) Stock Has Big Tech Partnerships and Big Potential",
      source: "Motley Fool",
      timeAgo: "3 hours ago",
      category: "AI Technology",
      url: "/news/ai-stock-big-tech-partnerships"
    },
    {
      id: 5,
      title: "Here's Why Nvidia Once Nearly Doubled in the First Half of 2025",
      source: "Motley Fool",
      timeAgo: "yesterday",
      category: "Tech Stocks",
      url: "/news/nvidia-doubled-first-half-2025"
    },
    {
      id: 6,
      title: "Tesla's Revolutionary Battery Technology Could Change Everything",
      source: "Tech Insider",
      timeAgo: "2 hours ago",
      category: "Innovation",
      url: "/news/tesla-battery-technology-revolution"
    },
    {
      id: 7,
      title: "The Rise of Quantum Computing: What Investors Need to Know",
      source: "Investment Weekly",
      timeAgo: "5 hours ago",
      category: "Emerging Tech",
      url: "/news/quantum-computing-investors-guide"
    }
  ];

  const handleNewsClick = (article) => {
    if (onNewsClick) {
      onNewsClick(article);
    } else {
      // Default behavior - log to console or navigate
      console.log('Navigating to:', article.url);
      // In a real app, you would use React Router here:
      // navigate(article.url);
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Stock Analysis': 'bg-blue-100 text-blue-800',
      'AI Technology': 'bg-purple-100 text-purple-800',
      'Market Trends': 'bg-green-100 text-green-800',
      'Tech Stocks': 'bg-orange-100 text-orange-800',
      'Innovation': 'bg-red-100 text-red-800',
      'Emerging Tech': 'bg-indigo-100 text-indigo-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <h3 className="text-xl font-semibold text-gray-900">All News</h3>
      </div>
      
      <div className="divide-y divide-gray-200">
        {newsArticles.map((article) => (
          <div 
            key={article.id} 
            className="p-6 hover:bg-gray-50 transition-colors cursor-pointer group"
            onClick={() => handleNewsClick(article)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(article.category)}`}>
                    {article.category}
                  </span>
                  <span className="text-xs text-gray-500">•</span>
                  <span className="text-xs text-gray-500">{article.timeAgo}</span>
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
        ))}
      </div>
    </div>
  );
};

export default NewsList;