import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext';

const FALLBACK_IMAGES = {
  'Stock Analysis': 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=400&fit=crop',
  'AI Technology': 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=400&fit=crop',
  'Market Trends': 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&h=400&fit=crop',
  'Cryptocurrency': 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=800&h=400&fit=crop',
  'Tech Stocks': 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop',
  'Company News': 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=400&fit=crop',
  'Business': 'https://images.unsplash.com/photo-1664575602554-2087b04935a5?w=800&h=400&fit=crop',
  'Breaking News': 'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=800&h=400&fit=crop',
  'Market News': 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop',
  'Technology': 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=400&fit=crop',
  'Forex': 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=400&fit=crop',
  'Mergers & Acquisitions': 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=400&fit=crop',
  'Innovation': 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=400&fit=crop',
  'Emerging Tech': 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&h=400&fit=crop',
};

const DEFAULT_FALLBACK = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&h=400&fit=crop';

const ImageWithFallback = ({ 
  src, 
  alt, 
  className = "", 
  category = null, 
  lazy = true,
  threshold = 0.1,
  rootMargin = "50px",
  srcSet = null,
  sizes = null,
  priority = false
}) => {
  const [imgSrc, setImgSrc] = useState(lazy && !priority ? null : src);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(!lazy || priority);
  const imgRef = useRef(null);
  const observerRef = useRef(null);
  const { t } = useLanguage();

  const getFallbackImage = () => {
    if (category && FALLBACK_IMAGES[category]) {
      return FALLBACK_IMAGES[category];
    }
    return DEFAULT_FALLBACK;
  };

  useEffect(() => {
    if (!lazy || priority) {
      setImgSrc(src);
      return;
    }

    const options = { threshold, rootMargin };
    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setIsInView(true);
          setImgSrc(src);
          if (observerRef.current && entry.target) {
            observerRef.current.unobserve(entry.target);
          }
        }
      });
    }, options);

    const currentImgRef = imgRef.current;
    if (currentImgRef) {
      observerRef.current.observe(currentImgRef);
    }

    return () => {
      if (observerRef.current && currentImgRef) {
        observerRef.current.unobserve(currentImgRef);
      }
    };
  }, [src, lazy, priority, threshold, rootMargin]);

  const handleError = (e) => {
    console.error(' Image load error:', { src, alt, error: e.type });
    
    // ✅ ลอง fallback image แทน gradient
    const fallbackImg = getFallbackImage();
    if (imgSrc !== fallbackImg) {
      console.log(' Trying fallback image:', fallbackImg);
      setImgSrc(fallbackImg);
      setHasError(false);
    } else {
      // ถ้า fallback ก็โหลดไม่ได้ ให้แสดง placeholder
      setHasError(true);
      setIsLoading(false);
    }
  };

  const handleLoad = () => {
    console.log(' Image loaded:', imgSrc);
    setIsLoading(false);
  };

  if (hasError) {
    return (
      <div 
        ref={imgRef}
        className={`bg-gray-100 flex items-center justify-center ${className}`}
        role="img"
        aria-label={alt || t('imageFallback.placeholder')}
      >
        <svg 
          className="w-10 h-10 text-gray-400 opacity-75" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth="2" 
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
          />
        </svg>
      </div>
    );
  }

  if (!isInView || !imgSrc) {
    return (
      <div 
        ref={imgRef}
        className={`animate-pulse bg-gray-200 ${className}`}
        role="img"
        aria-label={t('imageFallback.loading', { alt: alt || '' })}
      />
    );
  }

  return (
    <>
      {isLoading && (
        <div className={`animate-pulse bg-gray-200 ${className} absolute`} />
      )}
      <picture>
        {imgSrc && !imgSrc.includes('.svg') && (
          <source 
            type="image/webp" 
            srcSet={srcSet || imgSrc.replace(/\.(jpg|jpeg|png)$/i, '.webp')}
            sizes={sizes}
          />
        )}
        
        <img 
          ref={imgRef}
          src={imgSrc}
          srcSet={srcSet}
          sizes={sizes}
          alt={alt}
          className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
          onLoad={handleLoad}
          onError={handleError}
          loading={lazy && !priority ? "lazy" : "eager"}
          decoding="async"
          fetchPriority={priority ? "high" : "auto"}
        />
      </picture>
    </>
  );
};

export default ImageWithFallback;