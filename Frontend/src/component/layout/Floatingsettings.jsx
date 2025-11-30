import { useState, useRef, useEffect } from 'react';
import { Settings, User, Bell, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useWatchlist } from '../../context/WatchlistContext';

const FloatingSettings = () => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  
  // ✅ อ่านจาก Context เท่านั้น
  const { isLinked, linkedUser } = useWatchlist();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="fixed bottom-6 right-6 z-50" ref={menuRef}>
      {/* Menu Popup */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-72 bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden mb-2 animate-slideUp">
          {/* Header - สีเขียวถ้า linked, สีเทาถ้า guest */}
          <div className={`p-4 text-white ${
            isLinked 
              ? 'bg-gradient-to-r from-green-500 to-green-600' 
              : 'bg-gradient-to-r from-gray-500 to-gray-600'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-lg">บัญชี</h3>
              <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* User Info */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <User className="w-6 h-6" />
              </div>
              <div>
                {isLinked && linkedUser ? (
                  <>
                    <p className="font-medium">@{linkedUser.username}</p>
                    <p className="text-xs text-white/80 flex items-center gap-1">
                      <Bell className="w-3 h-3" />
                      เชื่อมต่อแล้ว
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-medium">Guest Mode</p>
                    <p className="text-xs text-white/80">ยังไม่ได้เชื่อม Telegram</p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="p-2">
            <button
              onClick={() => {
                navigate('/settings');
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 rounded-lg transition-colors text-left"
            >
              <Settings className="w-5 h-5 text-gray-600" />
              <div>
                <p className="font-medium text-gray-900">การตั้งค่า</p>
                <p className="text-xs text-gray-500">
                  {isLinked ? 'จัดการการเชื่อมต่อ' : 'เชื่อม Telegram เพื่อ Sync'}
                </p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`group relative w-14 h-14 rounded-full shadow-lg transition-all duration-300 ${
          isLinked
            ? 'bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
            : 'bg-gradient-to-br from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800'
        } ${isOpen ? 'scale-95' : 'hover:scale-110'}`}
      >
        {/* Status Dot - แสดงเฉพาะตอน linked */}
        {isLinked && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full animate-pulse"></div>
        )}

        {/* Icon */}
        <div className="w-full h-full flex items-center justify-center text-white">
          {isOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Settings className="w-6 h-6 transition-transform group-hover:rotate-90" />
          )}
        </div>

        {/* Tooltip */}
        {!isOpen && (
          <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            การตั้งค่า
            <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
          </div>
        )}
      </button>
    </div>
  );
};

export default FloatingSettings;