import express from 'express';
import telegramService from '../services/telegramService.js';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const router = express.Router();

// ✅ POST /api/telegram/generate-link-code - สร้าง code สำหรับ link
router.post('/generate-link-code', async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'sessionId is required'
      });
    }
    
    // สร้าง code 6 ตัว
    const code = crypto.randomBytes(3).toString('hex').toUpperCase();
    
    const linkData = {
      code: code,
      sessionId: sessionId,
      createdAt: Date.now(),
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 นาที
      linked: false,
      userId: null,
      username: null
    };
    
    // บันทึก link code
    const linkCodesPath = path.join(process.cwd(), 'data', 'link_codes.json');
    let linkCodes = {};
    
    try {
      const data = await fs.readFile(linkCodesPath, 'utf-8');
      linkCodes = JSON.parse(data);
    } catch (error) {
      linkCodes = {};
    }
    
    linkCodes[code] = linkData;
    
    await fs.mkdir(path.join(process.cwd(), 'data'), { recursive: true });
    await fs.writeFile(linkCodesPath, JSON.stringify(linkCodes, null, 2));
    
    console.log(` Generated link code: ${code} for session ${sessionId}`);
    
    res.json({
      success: true,
      code: code,
      expiresIn: 300, // 5 minutes in seconds
      botUsername: process.env.TELEGRAM_BOT_USERNAME || 'your_bot'
    });
    
  } catch (error) {
    console.error('Error generating link code:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

//  GET /api/telegram/check-link-status/:code - ตรวจสอบสถานะการ link
router.get('/check-link-status/:code', async (req, res) => {
  try {
    const { code } = req.params;
    
    const linkCodesPath = path.join(process.cwd(), 'data', 'link_codes.json');
    
    let linkCodes = {};
    try {
      const data = await fs.readFile(linkCodesPath, 'utf-8');
      linkCodes = JSON.parse(data);
    } catch (error) {
      return res.json({
        success: false,
        linked: false,
        message: 'Code not found'
      });
    }
    
    const linkData = linkCodes[code];
    
    if (!linkData) {
      return res.json({
        success: false,
        linked: false,
        message: 'Code not found'
      });
    }
    
    if (linkData.linked) {
      return res.json({
        success: true,
        linked: true,
        userId: linkData.userId,
        username: linkData.username,
        linkedAt: linkData.linkedAt
      });
    }
    
    if (Date.now() > linkData.expiresAt) {
      return res.json({
        success: false,
        linked: false,
        expired: true,
        message: 'Code expired'
      });
    }
    
    res.json({
      success: true,
      linked: false,
      expiresAt: linkData.expiresAt
    });
    
  } catch (error) {
    console.error('Error checking link status:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// GET /api/telegram/watchlist - ดึง watchlist
router.get('/watchlist', async (req, res) => {
  try {
    const { sessionId } = req.query; 
    const watchlist = await telegramService.getWatchlist(sessionId);
    res.json({ success: true, data: watchlist });
  } catch (error) {
    console.error('Error fetching watchlist:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/telegram/watchlist - บันทึก watchlist ทั้งหมด
router.post('/watchlist', async (req, res) => {
  try {
    const { watchlist, sessionId } = req.body; 
    await telegramService.saveWatchlist(watchlist, sessionId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving watchlist:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/telegram/watchlist/add - เพิ่มหุ้น
router.post('/watchlist/add', async (req, res) => {
  try {
    const { symbol, sessionId } = req.body; 
    const result = await telegramService.addToWatchlist(symbol, sessionId);
    res.json(result);
  } catch (error) {
    console.error('Error adding stock:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/telegram/watchlist/:symbol - ลบหุ้น
router.delete('/watchlist/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { sessionId } = req.query; 
    const result = await telegramService.removeFromWatchlist(symbol, sessionId);
    res.json(result);
  } catch (error) {
    console.error('Error removing stock:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/telegram/check-session-link/:sessionId - ตรวจสอบว่า session นี้ link แล้วหรือยัง
router.get('/check-session-link/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const mappingPath = path.join(process.cwd(), 'data', 'session_user_mapping.json');
    
    try {
      const data = await fs.readFile(mappingPath, 'utf-8');
      const mapping = JSON.parse(data);
      
      const userInfo = mapping[sessionId];
      
      if (userInfo && userInfo.userId) {
        return res.json({
          success: true,
          linked: true,
          userId: userInfo.userId,
          username: userInfo.username,
          linkedAt: userInfo.linkedAt
        });
      }
    } catch (error) {
    }
    
    res.json({
      success: true,
      linked: false
    });
    
  } catch (error) {
    console.error('Error checking session link:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// POST /api/telegram/unlink-session - ยกเลิกการเชื่อม
router.post('/unlink-session', async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'sessionId is required'
      });
    }
    
    const mappingPath = path.join(process.cwd(), 'data', 'session_user_mapping.json');
    
    let mapping = {};
    try {
      const data = await fs.readFile(mappingPath, 'utf-8');
      mapping = JSON.parse(data);
    } catch (error) {
    }
    
    if (mapping[sessionId]) {
      delete mapping[sessionId];
      await fs.writeFile(mappingPath, JSON.stringify(mapping, null, 2));
      
      console.log(`🔓 Unlinked session: ${sessionId}`);
      
      return res.json({
        success: true,
        message: 'Session unlinked'
      });
    }
    
    res.json({
      success: false,
      message: 'Session not found'
    });
    
  } catch (error) {
    console.error('Error unlinking session:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;