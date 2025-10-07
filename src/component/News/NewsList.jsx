import NewsCard from './NewsCard';

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
      console.log('Navigating to:', article.url);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <h3 className="text-xl font-semibold text-gray-900">All News</h3>
      </div>
      
      <div className="divide-y divide-gray-200">
        {newsArticles.map((article) => (
          <NewsCard 
            key={article.id} 
            article={article} 
            onClick={handleNewsClick}
          />
        ))}
      </div>
    </div>
  );
};

export default NewsList;