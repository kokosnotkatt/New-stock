// Frontend/src/component/News/NewsCard.jsx
import React, { useState } from 'react';
import { Newspaper, Sparkles, Loader2 } from 'lucide-react';
import ImageWithFallback from '../common/ImageWithFallback'; 
import SymbolBadges from './SymbolBadges';
import AIAnalysisModal from './AIAnalysisModal';
import apiService from '../../services/apiService';
import { useLanguage } from '../../context/LanguageContext';

const NewsCard = React.memo(({ article, onClick, onSymbolClick }) => {
  const { language } = useLanguage();
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);

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

  const handleSymbolClick = (symbol) => {
    if (onSymbolClick) {
      onSymbolClick(symbol);
    }
  };

  // 🤖 AI Analysis handler
  const handleAIClick = async (e) => {
    e.stopPropagation(); // ไม่ให้ click ไปที่ card
    
    setShowAIModal(true);
    setAiError(null);
    
    // ถ้ามี analysis แล้ว ไม่ต้องโหลดใหม่
    if (aiAnalysis) {
      return;
    }

    setAiLoading(true);

    try {
      const analysis = await apiService.analyzeNews(article, language);
      setAiAnalysis(analysis);
    } catch (error) {
      console.error('AI Analysis error:', error);
      setAiError(error.message || 'Failed to analyze');
    } finally {
      setAiLoading(false);
    }
  };

  const closeAIModal = () => {
    setShowAIModal(false);
  };

  // AI Button Component
  const AIButton = () => (
    <button
      onClick={handleAIClick}
      className="absolute top-3 right-3 z-10 flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-xs font-medium rounded-full shadow-lg transition-all duration-200 hover:scale-105"
      title={language === 'th' ? 'วิเคราะห์ด้วย AI' : 'AI Analysis'}
    >
      {aiLoading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <Sparkles className="w-3.5 h-3.5" />
      )}
      <span>AI</span>
    </button>
  );

  // ✅ ถ้ามีรูป - Layout แบบเดิม
  if (article.image) {
    return (
      <>
        <div 
          className="p-6 hover:bg-gray-50 transition-colors cursor-pointer group relative"
          onClick={handleClick}
        >
          {/* 🤖 AI Button */}
          <AIButton />

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
                {article.translatedTo && (
                  <>
                    <span className="text-xs text-gray-500">•</span>
                    <span className="text-xs text-blue-500">🌐 {article.translatedTo.toUpperCase()}</span>
                  </>
                )}
              </div>
              
              <h4 className="text-lg font-semibold text-gray-900 mb-2 leading-tight group-hover:text-green-600 transition-colors pr-16">
                {article.title || article.headline}
              </h4>
              
              {article.summary && (
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                  {article.summary}
                </p>
              )}
              
              {article.symbols && article.symbols.length > 0 && (
                <SymbolBadges 
                  symbols={article.symbols} 
                  onSymbolClick={handleSymbolClick}
                />
              )}
              
              <div className="flex items-center text-sm text-gray-500 mt-2">
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

        {/* AI Modal */}
        <AIAnalysisModal
          isOpen={showAIModal}
          onClose={closeAIModal}
          analysis={aiAnalysis}
          loading={aiLoading}
          error={aiError}
          articleTitle={article.title || article.headline}
        />
      </>
    );
  }

  // ✅ ถ้าไม่มีรูป - Layout ปรับใหม่ (Text-First)
  return (
    <>
      <div 
        className="p-6 hover:bg-gray-50 transition-colors cursor-pointer group relative"
        onClick={handleClick}
      >
        {/* 🤖 AI Button */}
        <AIButton />

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
              {article.translatedTo && (
                <>
                  <span className="text-xs text-gray-500">•</span>
                  <span className="text-xs text-blue-500">🌐 {article.translatedTo.toUpperCase()}</span>
                </>
              )}
            </div>
            
            <h4 className="text-xl font-bold text-gray-900 mb-2 leading-snug group-hover:text-green-600 transition-colors pr-16">
              {article.title || article.headline}
            </h4>
            
            {article.summary && (
              <p className="text-base text-gray-700 mb-3 line-clamp-2 leading-relaxed">
                {article.summary}
              </p>
            )}
            
            {article.symbols && article.symbols.length > 0 && (
              <SymbolBadges 
                symbols={article.symbols} 
                onSymbolClick={handleSymbolClick}
              />
            )}
            
            <div className="flex items-center justify-between mt-3">
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

      {/* AI Modal */}
      <AIAnalysisModal
        isOpen={showAIModal}
        onClose={closeAIModal}
        analysis={aiAnalysis}
        loading={aiLoading}
        error={aiError}
        articleTitle={article.title || article.headline}
      />
    </>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.article.id === nextProps.article.id &&
    prevProps.article.title === nextProps.article.title &&
    prevProps.article.headline === nextProps.article.headline &&
    prevProps.article.translatedTo === nextProps.article.translatedTo
  );
});

NewsCard.displayName = 'NewsCard';

export default NewsCard;