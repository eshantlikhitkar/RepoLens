require('dotenv').config();

const env = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/repolens',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID || '',
  GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET || '',
  GITHUB_CALLBACK_URL: process.env.GITHUB_CALLBACK_URL || 'http://localhost:5000/api/auth/github/callback',
  JWT_SECRET: process.env.JWT_SECRET || 'repolens-jwt-secret-replace-in-production-key-382910',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || 'repolens-encryption-key-32-byte-secret!',
  // AI Keys
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || process.env.AI_API_KEY || '',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  AI_PROVIDER: process.env.AI_PROVIDER || (process.env.GEMINI_API_KEY || process.env.AI_API_KEY ? 'gemini' : process.env.OPENAI_API_KEY ? 'openai' : 'mock'),
  EMBEDDING_PROVIDER: process.env.EMBEDDING_PROVIDER || (process.env.GEMINI_API_KEY || process.env.AI_API_KEY ? 'gemini' : process.env.OPENAI_API_KEY ? 'openai' : 'local'),
};

module.exports = env;
