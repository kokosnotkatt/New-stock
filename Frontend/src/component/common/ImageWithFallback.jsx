// component/common/ImageWithFallback.jsx - Optimized with Intersection Observer
import { useState, useEffect, useRef } from 'react';

const ImageWithFallback = ({ 
  src, 
  alt, 
  className = "", 
  fallbackType = "gradient",
  fallbackGradient = "from-blue-500 to-purple-600",
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

  useEffect(() => {
    // Skip intersection observer if not lazy loading or priority image
    if (!lazy || priority) {
      setImgSrc(src);
      return;
    }

    // Setup Intersection Observer for lazy loading
    const options = {
      threshold,
      rootMargin
    };

    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setIsInView(true);
          setImgSrc(src);
          
          // Disconnect observer after image is in view
          if (observerRef.current && entry.target) {
            observerRef.current.unobserve(entry.target);
          }
        }
      });
    }, options);

    // Start observing
    const currentImgRef = imgRef.current;
    if (currentImgRef) {
      observerRef.current.observe(currentImgRef);
    }

    // Cleanup
    return () => {
      if (observerRef.current && currentImgRef) {
        observerRef.current.unobserve(currentImgRef);
      }
    };
  }, [src, lazy, priority, threshold, rootMargin]);

  const handleError = (e) => {
    console.error('🖼️ Image load error:', {
      src,
      alt,
      error: e.type
    });
    
    setHasError(true);
    setIsLoading(false);
    
    // Try alternative image formats if available
    if (src && src.includes('.webp')) {
      const fallbackSrc = src.replace('.webp', '.jpg');
      console.log('🔄 Trying fallback format:', fallbackSrc);
      setImgSrc(fallbackSrc);
      setHasError(false);
      setIsLoading(true);
    }
  };

  const handleLoad = () => {
    console.log('✅ Image loaded:', src);
    setIsLoading(false);
  };

  // Render fallback if error
  if (hasError) {
    console.warn('⚠️ Showing fallback gradient for:', alt);
    return (
      <div 
        ref={imgRef}
        className={`bg-gradient-to-br ${fallbackGradient} flex items-center justify-center ${className}`}
        role="img"
        aria-label={alt || "Image placeholder"}
      >
        <svg 
          className="w-12 h-12 text-white opacity-50" 
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

  // Render placeholder before image loads
  if (!isInView || !imgSrc) {
    return (
      <div 
        ref={imgRef}
        className={`animate-pulse bg-gray-200 ${className}`}
        role="img"
        aria-label={`Loading ${alt || "image"}`}
      />
    );
  }

  return (
    <>
      {isLoading && (
        <div className={`animate-pulse bg-gray-200 ${className} absolute`} />
      )}
      <picture>
        {/* WebP source for modern browsers */}
        {src && !src.includes('.svg') && (
          <source 
            type="image/webp" 
            srcSet={srcSet || src.replace(/\.(jpg|jpeg|png)$/i, '.webp')}
            sizes={sizes}
          />
        )}
        
        {/* Original format fallback */}
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