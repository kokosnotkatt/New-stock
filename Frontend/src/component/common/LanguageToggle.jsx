import { useLanguage } from '../../context/LanguageContext';

const LanguageToggle = () => {
    const { language, toggleLanguage } = useLanguage();
    const isEnglish = language === 'en';

    return (
        <button
            onClick={toggleLanguage}
            className="relative inline-flex items-center h-7 w-14 rounded-full transition-all duration-300 focus:outline-none focus:ring-1 focus:ring-green-500 focus:ring-offset-2 overflow-hidden group"
            style={{
                background: isEnglish
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
            }}
            title={isEnglish ? 'Switch to Thai' : 'เปลี่ยนเป็นภาษาอังกฤษ'}
        >
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>

            <span
                className="absolute w-5 h-5 bg-white rounded-full shadow-lg transform transition-all duration-500 ease-out flex items-center justify-center"
                style={{
                   
                    left: isEnglish ? '3px' : 'calc(100% - 26px)',
                    transform: isEnglish ? 'rotate(0deg)' : 'rotate(360deg)'
                }}
            >
                <span className={`
                    text-[10px] font-bold 
                    ${isEnglish ? 'text-blue-600' : 'text-yellow-500'}
                `}>
                    {isEnglish ? 'EN' : 'TH'}
                </span>
            </span>

            <span className="absolute inset-0 rounded-full opacity-0 group-active:opacity-100 group-active:animate-ripple bg-white"></span>
        </button>
    );
};

const style = document.createElement('style');
style.textContent = `
  @keyframes ripple {
    0% {
      transform: scale(0);
      opacity: 0.5;
    }
    100% {
      transform: scale(2);
      opacity: 0;
    }
  }

  @keyframes bounce-slow {
    0%, 100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.1);
    }
  }

  .animate-ripple {
    animation: ripple 0.6s ease-out;
  }

  .animate-bounce-slow {
    animation: bounce-slow 2s infinite;
  }

  /* Hover effects */
  button:hover span:first-child {
    transform: scale(1.05);
  }
`;

if (!document.head.querySelector('style[data-language-toggle]')) {
    style.setAttribute('data-language-toggle', 'true');
    document.head.appendChild(style);
}

export default LanguageToggle;