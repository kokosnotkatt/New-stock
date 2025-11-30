// backend/src/config/validateEnv.js
export function validateEnv() {
  const required = [
    'PORT',
    'NODE_ENV',
    'FINNHUB_API_KEY'
  ];

  const optional = [
    'GEMINI_API_KEY'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(
      ` Missing required environment variables:\n${missing.map(k => `  - ${k}`).join('\n')}`
    );
  }

  // Check Finnhub API Key
  if (!process.env.FINNHUB_API_KEY || process.env.FINNHUB_API_KEY === 'your_finnhub_api_key_here') {
    console.warn('  Warning: FINNHUB_API_KEY is not properly configured!');
  }

  // Check Gemini API Key
  if (!process.env.GEMINI_API_KEY) {
    console.warn('  Warning: GEMINI_API_KEY not set. AI Analysis feature will not work.');
  }

  console.log(' Environment variables validated');
  console.log(`   - PORT: ${process.env.PORT}`);
  console.log(`   - NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`   - FINNHUB_API_KEY: ${process.env.FINNHUB_API_KEY ? '✓ Set' : '✗ Not set'}`);
  console.log(`   - GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? '✓ Set' : '✗ Not set'}`);
}