const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',')
  : [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:5174',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174'
    ];

console.log('🌐 CORS Allowed Origins:', allowedOrigins);

export const corsOptions = {
  origin: function (origin, callback) {
    // ✅ Allow requests with no origin (Postman, curl, server-to-server)
    if (!origin) {
      console.log('✅ CORS: No origin (Postman/curl)');
      return callback(null, true);
    }
    
    // ✅ Check if origin is allowed
    if (allowedOrigins.indexOf(origin) !== -1) {
      console.log('✅ CORS: Allowed origin:', origin);
      callback(null, true);
    } else {
      console.error('❌ CORS: Blocked origin:', origin);
      callback(new Error(`Not allowed by CORS. Origin: ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count'],
  maxAge: 86400, // 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 204
};