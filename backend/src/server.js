import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import newsRoutes from "./routes/news.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:5173",
      "http://localhost:5174",
    ],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

app.use("/api/news", newsRoutes);
app.use("/api/stocks", newsRoutes); 

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.use((err, req, res, next) => {
  console.error(" Server Error:", err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
   Backend Server Started          
   Port: ${PORT}                    
   URL: http://localhost:${PORT}    
   API: http://localhost:${PORT}/api
  `);
  console.log("   GET  /health");
  console.log("   GET  /api/news");
  console.log("   GET  /api/news/company/:symbol");
  console.log("   GET  /api/stocks/quote/:symbol");
  console.log("   GET  /api/stocks/search?q=...\n");
});

process.on("unhandledRejection", (err) => {
  console.error(" Unhandled Promise Rejection:", err);
  process.exit(1);
});
