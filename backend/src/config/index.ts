import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // Test Mode - enables mock data for testing without API keys
  // Set TEST_MODE=true in .env or NODE_ENV=development for automatic test mode
  testMode: process.env.TEST_MODE === 'true',

  // Database
  databaseUrl: process.env.DATABASE_URL || '',

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-change-me',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },

  // NZBN API
  nzbn: {
    apiUrl: (process.env.NZBN_API_URL || 'https://api.business.govt.nz/gateway/nzbn/v5').replace(/\/$/, ''),
    apiKey: process.env.NZBN_API_KEY || '',
  },

  // File Upload
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10),
    uploadDir: process.env.UPLOAD_DIR || './uploads',
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },

  // CORS - supports comma-separated origins
  corsOrigin: process.env.CORS_ORIGIN?.split(',').map(o => o.trim()) || ['http://localhost:3000'],
};

console.log(`Backend running in Test Mode: ${config.testMode}`); // Added log

export default config;
