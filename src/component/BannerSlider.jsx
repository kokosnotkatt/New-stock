import React, { useState, useEffect } from 'react';

const BannerSlider = () => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isAutoPlay, setIsAutoPlay] = useState(true);

    const slides = [
        {
            id: 1,
            title: "Microsoft Office 365",
            description: "Microsoft (MSFT) is a diversified stock that stands out with a strong business model, reliable revenues, and massive global presence. Founded in 1975 by Bill Gates and Paul Allen, it is a leader in cloud computing, artificial intelligence, and enterprise software.",
            image: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=400&fit=crop",
            alt: "Microsoft Office 365"
        },
        {
            id: 2,
            title: "Google Workspace",
            description: "Google Workspace offers a comprehensive suite of productivity tools designed for modern businesses. With cloud-based collaboration, real-time editing, and seamless integration across devices, it empowers teams to work efficiently from anywhere.",
            image: "https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?w=800&h=400&fit=crop",
            alt: "Google Workspace"
        },
        {
            id: 3,
            title: "Amazon Web Services",
            description: "AWS remains the leading cloud computing platform, offering scalable infrastructure solutions for businesses of all sizes. With continuous innovation in machine learning, serverless computing, and edge services, AWS maintains its position as the preferred choice for enterprise digital transformation.",
            image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=400&fit=crop",
            alt: "Amazon Web Services"
        }
    ];

    useEffect(() => {
        if (isAutoPlay) {
            const interval = setInterval(() => {
                setCurrentSlide((prev) => (prev + 1) % slides.length);
            }, 5000);
            return () => clearInterval(interval);
        }
    }, [isAutoPlay, slides.length]);

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
        setIsAutoPlay(false);
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
        setIsAutoPlay(false);
    };

    const goToSlide = (index) => {
        setCurrentSlide(index);
        setIsAutoPlay(false);
    };

    const getSlideBackground = (slideId) => {
        switch (slideId) {
            case 1:
                return 'from-blue-500 to-purple-600';
            case 2:
                return 'from-red-500 to-pink-600';
            case 3:
                return 'from-yellow-500 to-orange-600';
            default:
                return 'from-gray-500 to-gray-700';
        }
    };

    return (
        <div className="relative w-full h-80 bg-gray-100 rounded-lg overflow-hidden shadow-lg">
            <button
                onClick={prevSlide}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-60 hover:bg-opacity-80 text-white p-2 rounded-sm transition-all z-20"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
            </button>

            <button
                onClick={nextSlide}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-60 hover:bg-opacity-80 text-white p-2 rounded-sm transition-all z-20"
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
                        className="min-w-full h-full relative"
                    >
                        <div className="absolute inset-0">
                            <img 
                                src={slide.image} 
                                alt={slide.alt}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                    const parent = e.target.parentElement;
                                    parent.className = `absolute inset-0 bg-gradient-to-br ${getSlideBackground(slide.id)}`;
                                }}
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-40"></div>
                        </div>

                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white p-6">
                            <h2 className="text-xl font-bold mb-3 leading-tight">
                                {slide.title}
                            </h2>
                            <p className="text-sm leading-relaxed">
                                {slide.description}
                            </p>
                        </div>

                        {currentSlide === index && isAutoPlay && (
                            <div className="absolute bottom-0 left-0 h-1 bg-white animate-progress"></div>
                        )}
                    </div>
                ))}
            </div>

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
                    />
                ))}
            </div>
        </div>
    );
};

// Add CSS animations
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

export default BannerSlider