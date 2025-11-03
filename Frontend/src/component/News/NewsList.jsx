import { useState, useEffect } from 'react';
import NewsCard from './NewsCard';

const NewsList = ({ onNewsClick }) => {
  const [newsArticles, setNewsArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5001/api/news?limit=20');
      const data = await response.json();
      
      if (data.success) {
        setNewsArticles(data.data);
      } else {
        setError('Failed to fetch news');
      }
    } catch (err) {
      setError('Error connecting to server');
      console.error('Error fetching news:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNewsClick = (article) => {
    if (onNewsClick) {
      onNewsClick(article);
    } else {
      window.open(article.url, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading news...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-700">{error}</p>
        <button 
          onClick={fetchNews}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {newsArticles.map((article) => (
        <div 
          key={article.id} 
          className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
        >
          <NewsCard 
            article={article} 
            onClick={handleNewsClick}
          />
        </div>
      ))}
    </div>
  );
};

export default NewsList;