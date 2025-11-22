import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";

import { corsOptions } from "./config/cors.js";
import { validateEnv } from "./config/validateEnv.js";
import { apiLimiter, authLimiter } from "./middleware/rateLimiter.js";
import { errorLogger } from "./middleware/errorLogger.js";
import newsRoutes from "./routes/news.js";
import stocksRoutes from "./routes/stocks.js";
import authRoutes from "./routes/auth.js";

console.log(" API Key:", process.env.FINNHUB_API_KEY);
console.log(
  " All env vars:",
  Object.keys(process.env).filter((k) => k.includes("FINNHUB"))
);
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

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Server is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/news", apiLimiter, newsRoutes);
app.use("/api/stocks", apiLimiter, stocksRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.use(errorLogger);

app.use((err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || "Internal server error";

  res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

app.listen(PORT, () => {
  console.log(`\n Server running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`JWT configured\n`);
});

process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled Promise Rejection:", err);
  process.exit(1);
});
