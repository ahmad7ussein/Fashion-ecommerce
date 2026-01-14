"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const parentEnvPath = path_1.default.resolve(__dirname, '../../../.env.local');
dotenv_1.default.config({ path: parentEnvPath });
const backendEnvLocalPath = path_1.default.resolve(__dirname, '../../.env.local');
dotenv_1.default.config({ path: backendEnvLocalPath });
dotenv_1.default.config();
const requiredEnvVars = [
    'MONGODB_URI',
    'JWT_SECRET',
];
const recommendedEnvVars = [
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
    'GOOGLE_CLIENT_ID',
];
requiredEnvVars.forEach((varName) => {
    if (!process.env[varName]) {
        throw new Error(`Missing required environment variable: ${varName}`);
    }
});
exports.env = {
    mongodbUri: process.env.MONGODB_URI,
    jwtSecret: process.env.JWT_SECRET,
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
    googleClientId: process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    cloudinary: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: process.env.CLOUDINARY_API_KEY,
        apiSecret: process.env.CLOUDINARY_API_SECRET,
    },
};
if (process.env.NODE_ENV === 'development') {
    console.log('');
    console.log('📋 Environment Configuration:');
    console.log('📋 ========================================');
    console.log(`  ✅ NODE_ENV: ${exports.env.nodeEnv}`);
    console.log(`  ✅ PORT: ${exports.env.port}`);
    console.log(`  ✅ FRONTEND_URL: ${exports.env.frontendUrl}`);
    console.log(`  ${exports.env.mongodbUri ? '✅' : '❌'} MONGODB_URI: ${exports.env.mongodbUri ? 'Set' : 'Missing'}`);
    if (exports.env.mongodbUri) {
        const isAtlas = exports.env.mongodbUri.includes('mongodb+srv://') || exports.env.mongodbUri.includes('mongodb.net');
        const uriPreview = exports.env.mongodbUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@').substring(0, 60) + '...';
        console.log(`     Type: ${isAtlas ? 'MongoDB Atlas (Cloud)' : 'Local MongoDB'}`);
        console.log(`     Preview: ${uriPreview}`);
    }
    console.log(`  ${exports.env.jwtSecret ? '✅' : '❌'} JWT_SECRET: ${exports.env.jwtSecret ? 'Set' : 'Missing'}`);
    console.log(`  ✅ JWT_EXPIRE: ${exports.env.jwtExpire}`);
    console.log('📋 ========================================');
    console.log('');
}
exports.default = exports.env;
