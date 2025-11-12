import { useState, useEffect, useRef } from 'react';
import ImageWithFallback from "../common/ImageWithFallback";

const BannerSlider = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const hasFetched = useRef(false); // ✅ ป้องกัน double fetch

  useEffect(() => {
    // ✅ Fetch เพียงครั้งเดียว
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchCNBCNews();
    }
  }, []);

  const fetchCNBCNews = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('http://localhost:5001/api/news?limit=50&category=general');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        const cnbcNews = data.data
          .filter(article => 
            article.source?.toLowerCase().includes('cnbc') && 
            article.image
          )
          .slice(0, 5)
          .map((article, index) => ({
            id: article.id || index,
            title: article.title,
            description: article.summary || article.title,
            image: article.image,
            alt: article.title,
            gradient: getGradientByIndex(index),
            url: article.url,
            source: article.source
          }));
        
        console.log('📰 Found', cnbcNews.length, 'CNBC news with images');
        
        if (cnbcNews.length > 0) {
          setSlides(cnbcNews);
        } else {
          console.warn('⚠️ No CNBC news found, using fallback slides');
          setSlides(getFallbackSlides());
        }
      } else {
        throw new Error('Failed to fetch news');
      }
    } catch (err) {
      console.error('❌ Error fetching CNBC news:', err);
      setError(err.message);
      setSlides(getFallbackSlides());
    } finally {
      setLoading(false);
    }
  };

  const getGradientByIndex = (index) => {
    const gradients = [
      'from-blue-600 to-blue-800',
      'from-cyan-600 to-blue-700',
      'from-indigo-600 to-blue-800',
      'from-blue-500 to-purple-700',
      'from-sky-600 to-blue-800'
    ];
    return gradients[index % gradients.length];
  };

  const getFallbackSlides = () => [
    {
      id: 1,
      title: "CNBC Market News",
      description: "Stay updated with the latest market trends and financial news from CNBC.",
      image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=400&fit=crop",
      alt: "CNBC Market News",
      gradient: "from-blue-600 to-blue-800",
      source: "CNBC"
    },
    {
      id: 2,
      title: "Business & Finance",
      description: "Get expert analysis and insights on business trends from CNBC's top analysts.",
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop",
      alt: "Business & Finance",
      gradient: "from-cyan-600 to-blue-700",
      source: "CNBC"
    },
    {
      id: 3,
      title: "Stock Market Updates",
      description: "Real-time updates and breaking news about the stock market from CNBC.",
      image: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&h=400&fit=crop",
      alt: "Stock Market Updates",
      gradient: "from-indigo-600 to-blue-800",
      source: "CNBC"
    }
  ];

  useEffect(() => {
    if (isAutoPlay && slides.length > 1) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isAutoPlay, slides.length]);

  const nextSlide = () => {
    if (slides.length > 0) {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
      setIsAutoPlay(false);
    }
  };

  const prevSlide = () => {
    if (slides.length > 0) {
      setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
      setIsAutoPlay(false);
    }
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
    setIsAutoPlay(false);
  };

  const handleSlideClick = (slide) => {
    if (slide.url) {
      window.open(slide.url, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="relative w-full h-80 bg-gray-200 rounded-lg overflow-hidden shadow-lg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading CNBC news...</p>
        </div>
      </div>
    );
  }

  if (slides.length === 0) {
    return (
      <div className="relative w-full h-80 bg-gray-200 rounded-lg overflow-hidden shadow-lg flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No CNBC news available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-80 bg-gray-100 rounded-lg overflow-hidden shadow-lg">
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-60 hover:bg-opacity-80 text-white p-2 rounded-sm transition-all z-20"
        aria-label="Previous slide"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-60 hover:bg-opacity-80 text-white p-2 rounded-sm transition-all z-20"
        aria-label="Next slide"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      <div
        className="flex h-full transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className="min-w-full h-full relative cursor-pointer group"
            onClick={() => handleSlideClick(slide)}
          >
            <div className="absolute inset-0">
              <ImageWithFallback
                src={slide.image}
                alt={slide.alt}
                className="w-full h-full object-cover"
                fallbackGradient={slide.gradient}
                priority={index === 0}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent text-white p-6">
              <div className="mb-2">
                <span className="inline-block bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded">
                  {slide.source}
                </span>
              </div>

              <h2 className="text-2xl font-bold mb-3 leading-tight drop-shadow-lg">
                {slide.title}
              </h2>
              <p className="text-sm leading-relaxed line-clamp-2 drop-shadow-md">
                {slide.description}
              </p>
              
              {slide.url && (
                <div className="mt-3 flex items-center text-sm text-white/90 hover:text-white transition-colors">
                  <span>Read more on CNBC</span>
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              )}
            </div>

            {currentSlide === index && isAutoPlay && slides.length > 1 && (
              <div className="absolute bottom-0 left-0 h-1 bg-blue-500 animate-progress"></div>
            )}
          </div>
        ))}
      </div>

      {slides.length > 1 && (
        <div className="absolute bottom-28 left-1/2 transform -translate-x-1/2 flex space-x-2 z-20">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`transition-all duration-300 ${
                index === currentSlide
                  ? 'w-6 h-2 bg-white rounded-full'
                  : 'w-2 h-2 bg-white bg-opacity-50 hover:bg-white hover:bg-opacity-75 rounded-full'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      <div className="absolute top-4 right-4 bg-black bg-opacity-60 text-white text-xs px-3 py-1 rounded-full z-20">
        {currentSlide + 1} / {slides.length}
      </div>

      {error && (
        <div className="absolute top-4 left-4 z-30">
          <div className="bg-yellow-500 text-white text-xs px-2 py-1 rounded">
            Using fallback content
          </div>
        </div>
      )}
    </div>
  );
};

const style = document.createElement('style');
style.textContent = `
  @keyframes progress {
    from { width: 0%; }
    to { width: 100%; }
  }
  
  .animate-progress {
    animation: progress 5s linear;
  }
`;

if (!document.head.querySelector('style[data-banner-progress]')) {
  style.setAttribute('data-banner-progress', 'true');
  document.head.appendChild(style);
}

export default BannerSlider;