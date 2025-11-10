// component/common/LanguageSwitcher.jsx - ปุ่มสลับภาษา
import { Languages } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const LanguageSwitcher = ({ variant = 'default' }) => {
  const { language, toggleLanguage } = useLanguage();

  // Variant: default - แสดงแบบเต็ม
  if (variant === 'default') {
    return (
      <button
        onClick={toggleLanguage}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
        title={language === 'th' ? 'Switch to English' : 'เปลี่ยนเป็นภาษาไทย'}
      >
        <Languages className="w-5 h-5 text-gray-600" />
        <span className="font-medium text-gray-700">
          {language === 'th' ? 'ไทย' : 'EN'}
        </span>
      </button>
    );
  }

  // Variant: minimal - แสดงแบบเล็ก
  if (variant === 'minimal') {
    return (
      <button
        onClick={toggleLanguage}
        className="flex items-center justify-center w-10 h-10 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
        title={language === 'th' ? 'Switch to English' : 'เปลี่ยนเป็นภาษาไทย'}
      >
        <span className="font-bold text-gray-700">
          {language === 'th' ? 'TH' : 'EN'}
        </span>
      </button>
    );
  }

  // Variant: icon - แสดงแค่ไอคอน
  if (variant === 'icon') {
    return (
      <button
        onClick={toggleLanguage}
        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        title={language === 'th' ? 'Switch to English' : 'เปลี่ยนเป็นภาษาไทย'}
      >
        <Languages className="w-6 h-6 text-gray-600" />
      </button>
    );
  }

  // Variant: toggle - แสดงแบบ toggle switch
  if (variant === 'toggle') {
    return (
      <button
        onClick={toggleLanguage}
        className="relative inline-flex items-center h-10 rounded-full w-20 bg-gray-200 hover:bg-gray-300 transition-colors"
        title={language === 'th' ? 'Switch to English' : 'เปลี่ยนเป็นภาษาไทย'}
      >
        <span
          className={`inline-block w-9 h-9 transform transition-transform bg-white rounded-full shadow-md flex items-center justify-center font-bold text-xs ${
            language === 'th' ? 'translate-x-0.5' : 'translate-x-10'
          }`}
        >
          {language === 'th' ? 'TH' : 'EN'}
        </span>
        <span className={`absolute text-xs font-medium ${
          language === 'th' ? 'right-2 text-gray-600' : 'left-2 text-gray-600'
        }`}>
          {language === 'th' ? 'EN' : 'TH'}
        </span>
      </button>
    );
  }

  return null;
};

export default LanguageSwitcher;