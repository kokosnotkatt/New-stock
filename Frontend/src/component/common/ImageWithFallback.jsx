// component/common/ImageWithFallback.jsx - (Cleaned Up Version)
import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext'; // 1. (เพิ่ม) Import

const ImageWithFallback = ({ 
  src, 
  alt, 
  className = "", 
  // fallbackGradient, // (ลบ Prop นี้)
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
  const { t } = useLanguage(); // 2. (เพิ่ม) เรียกใช้ t()

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
    console.error('🖼️ Image load error:', { src, alt, error: e.type });
    setHasError(true);
    setIsLoading(false);
    
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

  // 3. (แก้ไข) Render fallback if error
  if (hasError) {
    console.warn('⚠️ Showing fallback gradient for:', alt);
    return (
      <div 
        ref={imgRef}
        // เปลี่ยนจาก Gradient เป็น bg-gray-100
        className={`bg-gray-100 flex items-center justify-center ${className}`}
        role="img"
        aria-label={alt || t('imageFallback.placeholder')} // (เพิ่ม t())
      >
        <svg 
          // เปลี่ยนสีไอคอนเป็น text-gray-400
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

  // 4. (เหมือนเดิม) Render placeholder before image loads
  if (!isInView || !imgSrc) {
    return (
      <div 
        ref={imgRef}
        className={`animate-pulse bg-gray-200 ${className}`}
        role="img"
        aria-label={t('imageFallback.loading', { alt: alt || '' })} // (เพิ่ม t())
      />
    );
  }

  // 5. (เหมือนเดิม) Render รูปภาพ
  return (
    <>
      {isLoading && (
        <div className={`animate-pulse bg-gray-200 ${className} absolute`} />
      )}
      <picture>
        {src && !src.includes('.svg') && (
          <source 
            type="image/webp" 
            srcSet={srcSet || src.replace(/\.(jpg|jpeg|png)$/i, '.webp')}
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