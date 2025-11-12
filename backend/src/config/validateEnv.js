export function validateEnv() {
  const required = [
    'PORT',
    'NODE_ENV',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(
      `❌ Missing required environment variables:\n${missing.map(k => `  - ${k}`).join('\n')}`
    );
  }

  // Validate JWT secrets in production
  if (process.env.NODE_ENV === 'production') {
    if (process.env.JWT_SECRET.length < 32) {
      throw new Error('JWT_SECRET must be at least 32 characters in production');
    }
    if (process.env.JWT_REFRESH_SECRET.length < 32) {
      throw new Error('JWT_REFRESH_SECRET must be at least 32 characters in production');
    }
  }

  console.log('✅ Environment variables validated');
}