// Frontend/src/component/News/AIAnalysisModal.jsx
import { useState } from 'react';
import { X, TrendingUp, TrendingDown, Minus, AlertTriangle, Lightbulb, Target, Loader2 } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const AIAnalysisModal = ({ isOpen, onClose, analysis, loading, error, articleTitle }) => {
  const { t, language } = useLanguage();

  if (!isOpen) return null;

  // Sentiment icon และสี
  const getSentimentDisplay = (sentiment, score) => {
    switch (sentiment) {
      case 'positive':
        return {
          icon: <TrendingUp className="w-6 h-6" />,
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          borderColor: 'border-green-200',
          label: language === 'th' ? '📈 ข่าวดี' : '📈 Positive'
        };
      case 'negative':
        return {
          icon: <TrendingDown className="w-6 h-6" />,
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          borderColor: 'border-red-200',
          label: language === 'th' ? '📉 ข่าวร้าย' : '📉 Negative'
        };
      default:
        return {
          icon: <Minus className="w-6 h-6" />,
          color: 'text-gray-600',
          bgColor: 'bg-gray-100',
          borderColor: 'border-gray-200',
          label: language === 'th' ? '➖ ข่าวกลาง' : '➖ Neutral'
        };
    }
  };

  // Risk level display
  const getRiskDisplay = (riskLevel) => {
    switch (riskLevel) {
      case 'low':
        return {
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          label: language === 'th' ? 'ความเสี่ยงต่ำ' : 'Low Risk'
        };
      case 'high':
        return {
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          label: language === 'th' ? 'ความเสี่ยงสูง' : 'High Risk'
        };
      default:
        return {
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100',
          label: language === 'th' ? 'ความเสี่ยงปานกลาง' : 'Medium Risk'
        };
    }
  };

  const sentimentDisplay = analysis ? getSentimentDisplay(analysis.sentiment, analysis.sentimentScore) : null;
  const riskDisplay = analysis ? getRiskDisplay(analysis.riskLevel) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-blue-600">
          <div className="flex items-center gap-2 text-white">
            <span className="text-2xl">🤖</span>
            <h2 className="font-bold text-lg">
              {language === 'th' ? 'AI วิเคราะห์ข่าว' : 'AI Analysis'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/20 transition-colors text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Article Title */}
          {articleTitle && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">
                {language === 'th' ? 'วิเคราะห์ข่าว:' : 'Analyzing:'}
              </p>
              <p className="font-medium text-gray-900 line-clamp-2">{articleTitle}</p>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-12 h-12 text-purple-600 animate-spin mb-4" />
              <p className="text-gray-600">
                {language === 'th' ? 'กำลังวิเคราะห์...' : 'Analyzing...'}
              </p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <p className="text-red-600 font-medium mb-2">
                {language === 'th' ? 'เกิดข้อผิดพลาด' : 'Analysis Failed'}
              </p>
              <p className="text-gray-600 text-sm text-center">{error}</p>
            </div>
          )}

          {/* Analysis Result */}
          {analysis && !loading && !error && (
            <div className="space-y-5">
              {/* Sentiment Card */}
              <div className={`p-4 rounded-xl ${sentimentDisplay.bgColor} ${sentimentDisplay.borderColor} border`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">
                    {language === 'th' ? 'ประเภทข่าว' : 'Sentiment'}
                  </span>
                  <span className={`text-2xl font-bold ${sentimentDisplay.color}`}>
                    {analysis.sentimentScore}/100
                  </span>
                </div>
                <div className={`flex items-center gap-2 ${sentimentDisplay.color}`}>
                  {sentimentDisplay.icon}
                  <span className="font-bold text-lg">{sentimentDisplay.label}</span>
                </div>
                
                {/* Score Bar */}
                <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${
                      analysis.sentiment === 'positive' ? 'bg-green-500' :
                      analysis.sentiment === 'negative' ? 'bg-red-500' : 'bg-gray-400'
                    }`}
                    style={{ width: `${analysis.sentimentScore}%` }}
                  />
                </div>
              </div>

              {/* Summary */}
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-blue-800">
                    {language === 'th' ? 'สรุป' : 'Summary'}
                  </span>
                </div>
                <p className="text-gray-700">{analysis.summary}</p>
              </div>

              {/* Impact */}
              <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                  <span className="font-medium text-purple-800">
                    {language === 'th' ? 'ผลกระทบต่อตลาด' : 'Market Impact'}
                  </span>
                </div>
                <p className="text-gray-700">{analysis.impact}</p>
              </div>

              {/* Recommendation */}
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="w-5 h-5 text-amber-600" />
                  <span className="font-medium text-amber-800">
                    {language === 'th' ? '💡 คำแนะนำการลงทุน' : '💡 Investment Advice'}
                  </span>
                </div>
                <p className="text-gray-700">{analysis.recommendation}</p>
              </div>

              {/* Risk Level */}
              <div className={`p-4 rounded-xl ${riskDisplay.bgColor} border`}>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-700">
                    {language === 'th' ? 'ระดับความเสี่ยง' : 'Risk Level'}
                  </span>
                  <span className={`font-bold ${riskDisplay.color}`}>
                    ⚠️ {riskDisplay.label}
                  </span>
                </div>
              </div>

              {/* Key Points */}
              {analysis.keyPoints && analysis.keyPoints.length > 0 && (
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <p className="font-medium text-gray-800 mb-3">
                    {language === 'th' ? '📌 จุดสำคัญ' : '📌 Key Points'}
                  </p>
                  <ul className="space-y-2">
                    {analysis.keyPoints.map((point, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-green-600 mt-1">•</span>
                        <span className="text-gray-700">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Related Sectors */}
              {analysis.relatedSectors && analysis.relatedSectors.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {analysis.relatedSectors.map((sector, index) => (
                    <span 
                      key={index}
                      className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-sm"
                    >
                      {sector}
                    </span>
                  ))}
                </div>
              )}

              {/* Disclaimer */}
              <div className="p-3 bg-gray-100 rounded-lg text-xs text-gray-500 text-center">
                {language === 'th' 
                  ? '⚠️ ข้อมูลนี้เป็นเพียงการวิเคราะห์จาก AI ไม่ใช่คำแนะนำการลงทุน กรุณาศึกษาข้อมูลเพิ่มเติมก่อนตัดสินใจ'
                  : '⚠️ This is AI analysis only, not investment advice. Please do your own research before making decisions.'
                }
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIAnalysisModal;