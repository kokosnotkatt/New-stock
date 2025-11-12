import rateLimit from 'express-rate-limit';

// General API rate limit - เพิ่มขึ้นสำหรับ development
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // เพิ่มเป็น 1000 ใน dev
  message: {
    success: false,
    message: 'Too many requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limit สำหรับ localhost ใน development
    if (process.env.NODE_ENV === 'development') {
      return req.ip === '::1' || req.ip === '127.0.0.1' || req.ip === '::ffff:127.0.0.1';
    }
    return false;
  }
});

// Auth endpoints rate limit
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 5 : 100, // เพิ่มใน dev
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message: 'Too many login attempts, please try again after 15 minutes.'
  }
});

// Search rate limit
export const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: process.env.NODE_ENV === 'production' ? 30 : 300, // เพิ่มใน dev
  message: {
    success: false,
    message: 'Too many search requests, please slow down.'
  }
});