import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
// Try to load from parent directory .env.local first (for SMTP_USER, SMTP_PASS, etc.)
const parentEnvPath = path.resolve(__dirname, '../../../.env.local');
dotenv.config({ path: parentEnvPath });

// Then load from backend/.env.local (overrides parent if exists)
const backendEnvLocalPath = path.resolve(__dirname, '../../.env.local');
dotenv.config({ path: backendEnvLocalPath });

// Finally load from backend/.env (default)
dotenv.config();

// Required environment variables
const requiredEnvVars = [
  'MONGODB_URI',
  'JWT_SECRET',
];

// Optional but recommended for production
const recommendedEnvVars = [
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'GOOGLE_CLIENT_ID',
];

// Validate required environment variables
requiredEnvVars.forEach((varName) => {
  if (!process.env[varName]) {
    throw new Error(`Missing required environment variable: ${varName}`);
  }
});

// Export validated environment variables
export const env = {
  mongodbUri: process.env.MONGODB_URI!,
  jwtSecret: process.env.JWT_SECRET!,
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  jwtExpire: process.env.JWT_EXPIRE || '7d',
  gmailUser: process.env.GMAIL_USER,
  gmailAppPassword: process.env.GMAIL_APP_PASSWORD,
  smtpUser: process.env.SMTP_USER,
  smtpPass: process.env.SMTP_PASS,
  smtpFrom: process.env.SMTP_FROM,
  smtpHost: process.env.SMTP_HOST,
  smtpPort: process.env.SMTP_PORT,
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },
};

// Log environment info (without sensitive data)
if (process.env.NODE_ENV === 'development') {
  console.log('');
  console.log('📋 Environment Configuration:');
  console.log('📋 ========================================');
  console.log(`  ✅ NODE_ENV: ${env.nodeEnv}`);
  console.log(`  ✅ PORT: ${env.port}`);
  console.log(`  ✅ FRONTEND_URL: ${env.frontendUrl}`);
  console.log(`  ${env.mongodbUri ? '✅' : '❌'} MONGODB_URI: ${env.mongodbUri ? 'Set' : 'Missing'}`);
  if (env.mongodbUri) {
    // Show connection type without exposing credentials
    const isAtlas = env.mongodbUri.includes('mongodb+srv://') || env.mongodbUri.includes('mongodb.net');
    const uriPreview = env.mongodbUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@').substring(0, 60) + '...';
    console.log(`     Type: ${isAtlas ? 'MongoDB Atlas (Cloud)' : 'Local MongoDB'}`);
    console.log(`     Preview: ${uriPreview}`);
  }
  console.log(`  ${env.jwtSecret ? '✅' : '❌'} JWT_SECRET: ${env.jwtSecret ? 'Set' : 'Missing'}`);
  console.log(`  ✅ JWT_EXPIRE: ${env.jwtExpire}`);
  console.log('📋 ========================================');
  console.log('');
}

export default env;
