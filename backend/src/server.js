import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";

import { corsOptions } from "./config/cors.js";
import { validateEnv } from "./config/validateEnv.js";
import { apiLimiter } from "./middleware/rateLimiter.js";
import newsRoutes from "./routes/news.js";
import stocksRoutes from "./routes/stocks.js";

// Telegram Bot
import telegramRoutes from './routes/telegram.js';
import telegramService from './services/telegramService.js';
import newsChecker from './jobs/newsChecker.js';

// Log API Keys (masked)
console.log("FINNHUB_API_KEY:", process.env.FINNHUB_API_KEY ? `${process.env.FINNHUB_API_KEY.substring(0, 10)}...` : 'NOT SET');
console.log("GEMINI_API_KEY:", process.env.GEMINI_API_KEY ? `${process.env.GEMINI_API_KEY.substring(0, 10)}...` : 'NOT SET');
console.log("TELEGRAM_BOT_TOKEN:", process.env.TELEGRAM_BOT_TOKEN ? `${process.env.TELEGRAM_BOT_TOKEN.substring(0, 20)}...` : 'NOT SET');

try {
  validateEnv();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5001;

app.use(helmet());
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Server is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    features: {
      finnhub: !!process.env.FINNHUB_API_KEY,
      geminiAI: !!process.env.GEMINI_API_KEY,
      translation: !!process.env.GOOGLE_TRANSLATE_API_KEY,
      telegramBot: !!process.env.TELEGRAM_BOT_TOKEN
    }
  });
});

// API Routes
app.use("/api/news", apiLimiter, newsRoutes);
app.use("/api/stocks", apiLimiter, stocksRoutes);
app.use('/api/telegram', telegramRoutes); // Telegram routes

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Error handler
app.use((err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || "Internal server error";

  console.error(`[${new Date().toISOString()}] Error:`, {
    message: err.message,
    status: status,
    path: req.path,
    method: req.method,
  });

  res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

app.listen(PORT, () => {
  console.log(`\nServer running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`\nAPI Endpoints:`);
  console.log(`   GET  /api/news              - Fetch news`);
  console.log(`   POST /api/news/translate    - Translate news`);
  console.log(`   POST /api/news/analyze      - AI Analysis`);
  console.log(`   GET  /api/news/ai/status    - AI Status`);
  console.log(`   GET  /api/stocks/quote/:symbol - Stock quote`);
  console.log(`   GET  /api/telegram/watchlist - Telegram watchlist\n`);
  
  // Start Telegram Bot
  if (process.env.TELEGRAM_BOT_TOKEN) {
    newsChecker.start();
    console.log('Telegram Bot is ready');
    console.log('Commands: /start, /watchlist, /add, /remove, /news, /analyze, /latest');
    console.log('Auto notifications: Every 30 minutes\n');
  } else {
    console.warn('Telegram Bot disabled (no token)\n');
  }
});

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Promise Rejection:", err);
  process.exit(1);
});