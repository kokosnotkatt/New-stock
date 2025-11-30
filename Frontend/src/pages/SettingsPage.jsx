// pages/SettingsPage.jsx - ✅ FIXED: Timer Memory Leaks
import { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  CheckCircle, 
  Clock, 
  RefreshCw, 
  Link as LinkIcon, 
  HelpCircle,
  Cloud,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { useWatchlist } from '../context/WatchlistContext';
import { useLanguage } from '../context/LanguageContext';

const SettingsPage = () => {
  const [linkCode, setLinkCode] = useState(null);
  const [linkStatus, setLinkStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  
  const { sessionId, isLinked, linkedUser, reloadWatchlist } = useWatchlist();
  const { t } = useLanguage();

  // ✅ FIXED: ใช้ ref เพื่อเก็บ interval IDs สำหรับ cleanup
  const countdownIntervalRef = useRef(null);
  const statusCheckIntervalRef = useRef(null);
  const statusTimeoutRef = useRef(null);

  // ✅ FIXED: Cleanup ทุก intervals เมื่อ component unmount
  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
      if (statusCheckIntervalRef.current) {
        clearInterval(statusCheckIntervalRef.current);
      }
      if (statusTimeoutRef.current) {
        clearTimeout(statusTimeoutRef.current);
      }
    };
  }, []);

  // ✅ FIXED: Countdown timer with proper cleanup
  useEffect(() => {
    // ล้าง interval เก่า
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }

    if (timeLeft > 0 && linkStatus === 'pending') {
      countdownIntervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(countdownIntervalRef.current);
            setLinkStatus('expired');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    // Cleanup
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [timeLeft, linkStatus]);

  const generateLinkCode = async () => {
    if (!sessionId) return;
    
    setLoading(true);
    
    try {
      const response = await fetch('http://localhost:5001/api/telegram/generate-link-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setLinkCode(data.code);
        setTimeLeft(data.expiresIn);
        setLinkStatus('pending');
        checkLinkStatus(data.code);
      }
    } catch (error) {
      console.error('Error:', error);
      alert(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIXED: Status checking with proper cleanup
  const checkLinkStatus = async (code) => {
    // ล้าง intervals และ timeouts เก่า
    if (statusCheckIntervalRef.current) {
      clearInterval(statusCheckIntervalRef.current);
    }
    if (statusTimeoutRef.current) {
      clearTimeout(statusTimeoutRef.current);
    }

    statusCheckIntervalRef.current = setInterval(async () => {
      try {
        const codeRes = await fetch(`http://localhost:5001/api/telegram/check-link-status/${code}`);
        const codeData = await codeRes.json();

        if (codeData.linked) {
          const sessionRes = await fetch(`http://localhost:5001/api/telegram/check-session-link/${sessionId}`);
          const sessionData = await sessionRes.json();
          
          if (sessionData.success && sessionData.linked) {
            setLinkStatus('linked');
            
            // ล้าง interval
            if (statusCheckIntervalRef.current) {
              clearInterval(statusCheckIntervalRef.current);
            }
            
            reloadWatchlist();
            
            // Reset state หลังจาก 3 วินาที
            setTimeout(() => {
              setLinkCode(null);
              setLinkStatus(null);
            }, 3000);
          }
        } else if (codeData.expired) {
          setLinkStatus('expired');
          if (statusCheckIntervalRef.current) {
            clearInterval(statusCheckIntervalRef.current);
          }
        }
      } catch (error) {
        console.error('Error checking status:', error);
      }
    }, 2000);

    // ✅ FIXED: Auto cleanup หลัง 5 นาที
    statusTimeoutRef.current = setTimeout(() => {
      if (statusCheckIntervalRef.current) {
        clearInterval(statusCheckIntervalRef.current);
      }
    }, 5 * 60 * 1000);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTelegramLink = () => {
    const botUsername = import.meta.env.VITE_TELEGRAM_BOT_USERNAME || 'your_stock_news_bot';
    return `https://t.me/${botUsername}?start=link_${linkCode}`;
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-3 flex items-center justify-center gap-3">
          {t('settings.pageTitle')}
        </h1>
        <p className="text-gray-500">{t('settings.pageSubtitle')}</p>
      </div>

      {/* Main Action Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        <div className="p-8">
          
          {/* กรณีเชื่อมต่อแล้ว */}
          {isLinked && linkedUser ? (
            <div className="flex flex-col items-center justify-center py-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-green-900 mb-1">{t('settings.connectedSuccess')}</h2>
              <p className="text-gray-600 mb-6">@{linkedUser.username}</p>
              <div className="px-4 py-2 bg-green-50 text-green-700 text-sm rounded-full font-medium">
                {t('settings.syncAuto')}
              </div>
            </div>
          ) : (
            /* กรณีขอยังไม่เชื่อมต่อ หรือ กำลังเชื่อมต่อ */
            <>
              {!linkCode ? (
                // State 1: ปุ่มกดเชื่อมต่อ
                <div className="text-center py-6">
                  <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <LinkIcon className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">
                    {t('settings.connectTitle')}
                  </h3>
                  <button
                    onClick={generateLinkCode}
                    disabled={loading}
                    className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-300 transition-all font-medium flex items-center justify-center mx-auto gap-2 shadow-lg shadow-blue-200"
                  >
                    {loading ? (
                      <><RefreshCw className="w-5 h-5 animate-spin" /> {t('settings.generating')}</>
                    ) : (
                      t('settings.connectBtn')
                    )}
                  </button>
                </div>
              ) : (
                // State 2: แสดง QR Code
                <div className="flex flex-col md:flex-row gap-8 items-center justify-center">
                  <div className="bg-white p-4 rounded-xl border-2 border-blue-100 shadow-inner">
                    <QRCodeSVG value={getTelegramLink()} size={180} level="H" />
                  </div>
                  
                  <div className="flex-1 text-center md:text-left">
                    <p className="text-sm text-gray-500 mb-2">{t('settings.linkCode')}</p>
                    <div className="text-4xl font-bold text-gray-900 tracking-wider mb-2 font-mono">
                      {linkCode}
                    </div>
                    <div className="flex items-center gap-2 text-orange-500 text-sm font-medium mb-6 justify-center md:justify-start">
                      <Clock className="w-4 h-4" />
                      <span>{t('settings.expiresIn', { time: formatTime(timeLeft) })}</span>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-900">{t('settings.howTo')}</p>
                      <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                        <li>{t('settings.step1')}</li>
                        <li>{t('settings.step2')}</li>
                        <li>{t('settings.step3')} <code className="bg-gray-100 px-2 py-0.5 rounded text-blue-600">/link {linkCode}</code></li>
                      </ol>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Info Section */}
      <div className="bg-blue-50/50 rounded-2xl p-8 border border-blue-100">
        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-blue-600" />
          {t('settings.whyConnect')}
        </h3>

        <div className="space-y-6">
          {/* Item 1 */}
          <div className="flex gap-4">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm shrink-0 text-blue-600">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">{t('settings.benefit1Title')}</h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                {t('settings.benefit1Desc')}
              </p>
            </div>
          </div>

          {/* Item 2 */}
          <div className="flex gap-4">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm shrink-0 text-blue-600">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">{t('settings.benefit2Title')}</h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                {t('settings.benefit2Desc')}
              </p>
            </div>
          </div>

          {/* Item 3 */}
          <div className="flex gap-4">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm shrink-0 text-blue-600">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">{t('settings.benefit3Title')}</h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                {t('settings.benefit3Desc')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;