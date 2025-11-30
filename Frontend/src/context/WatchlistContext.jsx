import { createContext, useContext, useState, useEffect } from 'react';

const WatchlistContext = createContext();

export const useWatchlist = () => {
  const context = useContext(WatchlistContext);
  if (!context) {
    throw new Error('useWatchlist must be used within WatchlistProvider');
  }
  return context;
};

export const WatchlistProvider = ({ children }) => {
  const [watchlist, setWatchlist] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLinked, setIsLinked] = useState(false);
  const [linkedUser, setLinkedUser] = useState(null);

  // 1. สร้าง/ดึง sessionId
  useEffect(() => {
    let sid = localStorage.getItem('sessionId');
    if (!sid) {
      sid = crypto.randomUUID();
      localStorage.setItem('sessionId', sid);
      console.log('🆕 Created sessionId:', sid);
    } else {
      console.log('📝 Using sessionId:', sid);
    }
    setSessionId(sid);
    
    // โหลดข้อมูล
    loadAllData(sid);
  }, []);

  // 2. โหลดข้อมูลทั้งหมด
  const loadAllData = async (sid) => {
    if (!sid) {
      console.warn('⚠️ No sessionId');
      setLoading(false);
      return;
    }

    console.log(`📥 Loading data for session: ${sid}`);
    
    try {
      // A. ตรวจสอบ link status ก่อน
      const linkRes = await fetch(`http://localhost:5001/api/telegram/check-session-link/${sid}`);
      const linkData = await linkRes.json();

      console.log('📡 Link check response:', linkData);

      if (linkData.success && linkData.linked) {
        console.log(`🔗 Session linked to User ${linkData.userId} (@${linkData.username})`);
        setIsLinked(true);
        setLinkedUser({
          userId: linkData.userId,
          username: linkData.username,
          linkedAt: linkData.linkedAt
        });
      } else {
        console.log('👤 Guest Mode - not linked');
        setIsLinked(false);
        setLinkedUser(null);
      }

      // B. โหลด watchlist
      const watchlistRes = await fetch(`http://localhost:5001/api/telegram/watchlist?sessionId=${sid}`);
      const watchlistData = await watchlistRes.json();
      
      if (watchlistData.success) {
        console.log(`✅ Loaded ${watchlistData.data.length} stocks`);
        setWatchlist(watchlistData.data || []);
      } else {
        console.warn('⚠️ Failed to load watchlist');
        setWatchlist([]);
      }

    } catch (error) {
      console.error('❌ Error loading data:', error);
      setWatchlist([]);
      setIsLinked(false);
      setLinkedUser(null);
    } finally {
      setLoading(false);
    }
  };

  // 3. เพิ่มหุ้น
  const addToWatchlist = async (symbol) => {
    if (!sessionId) return { success: false, message: 'No session' };

    try {
      console.log(`➕ Adding ${symbol}...`);
      
      const response = await fetch('http://localhost:5001/api/telegram/watchlist/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol, sessionId })
      });

      const data = await response.json();
      
      if (data.success) {
        console.log(`✅ Added ${symbol}`);
        await loadAllData(sessionId); // Reload
      } else {
        console.warn(`⚠️ Failed to add ${symbol}:`, data.message);
      }
      
      return data;
    } catch (error) {
      console.error('❌ Error adding stock:', error);
      return { success: false, message: error.message };
    }
  };

  // 4. ลบหุ้น
  const removeFromWatchlist = async (symbol) => {
    if (!sessionId) return { success: false, message: 'No session' };

    try {
      console.log(`➖ Removing ${symbol}...`);
      
      const response = await fetch(
        `http://localhost:5001/api/telegram/watchlist/${symbol}?sessionId=${sessionId}`,
        { method: 'DELETE' }
      );

      const data = await response.json();
      
      if (data.success) {
        console.log(`✅ Removed ${symbol}`);
        await loadAllData(sessionId); // Reload
      } else {
        console.warn(`⚠️ Failed to remove ${symbol}:`, data.message);
      }
      
      return data;
    } catch (error) {
      console.error('❌ Error removing stock:', error);
      return { success: false, message: error.message };
    }
  };

  // 5. Toggle alert
  const toggleAlert = async (symbol) => {
    const updated = watchlist.map(stock => 
      stock.symbol === symbol 
        ? { ...stock, alertEnabled: !stock.alertEnabled }
        : stock
    );
    
    setWatchlist(updated); // Optimistic update
    
    try {
      await fetch('http://localhost:5001/api/telegram/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ watchlist: updated, sessionId })
      });
      console.log(`🔔 Toggled alert for ${symbol}`);
    } catch (error) {
      console.error('❌ Error toggling alert:', error);
      setWatchlist(watchlist); // Revert
    }
  };

  // 6. ตรวจสอบว่ามีหุ้นนี้หรือไม่
  const isInWatchlist = (symbol) => {
    return watchlist.some(stock => stock.symbol === symbol.toUpperCase());
  };

  // 7. Reload ทั้งหมด
  const reloadWatchlist = () => {
    console.log('🔄 Manual reload requested');
    if (sessionId) {
      loadAllData(sessionId);
    }
  };

  const value = {
    watchlist,
    sessionId,
    loading,
    isLinked,
    linkedUser,
    isInWatchlist,
    addToWatchlist,
    removeFromWatchlist,
    toggleAlert,
    reloadWatchlist
  };

  return (
    <WatchlistContext.Provider value={value}>
      {children}
    </WatchlistContext.Provider>
  );
};

export default WatchlistContext;