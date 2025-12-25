import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import connectDB from './config/database';
import errorHandler from './middleware/errorHandler';
import env from './config/env';

// Environment variables are validated in env.ts

// Route imports
import authRoutes from './routes/authRoutes';
import productRoutes from './routes/productRoutes';
import orderRoutes from './routes/orderRoutes';
import designRoutes from './routes/designRoutes';
import adminRoutes from './routes/adminRoutes';
import cartRoutes from './routes/cartRoutes';
import userPreferencesRoutes from './routes/userPreferencesRoutes';
import reviewRoutes from './routes/reviewRoutes';
import contactRoutes from './routes/contactRoutes';
import notificationRoutes from './routes/notificationRoutes';
import favoriteRoutes from './routes/favoriteRoutes';
import studioProductRoutes from './routes/studioProductRoutes';

const app: Application = express();

// Security middleware
app.use(helmet());

// CORS - Secure configuration supporting Web and Mobile apps
const corsOptions = {
  origin: function (origin: string | undefined, callback: Function) {
    // Allow requests with no origin (mobile apps, Capacitor, Postman, etc.)
    // Mobile apps typically don't send an origin header
    if (!origin) {
      // In development, always allow
      if (env.nodeEnv === 'development') {
        return callback(null, true);
      }
      // In production, allow mobile apps (they don't have origin)
      // This is safe because mobile apps use the same API and authentication
      return callback(null, true);
    }
    
    const allowedOrigins = [
      env.frontendUrl,
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'capacitor://localhost', // Capacitor iOS
      'ionic://localhost',     // Ionic/Capacitor
      'http://localhost',      // Local development
      'https://localhost',     // Local HTTPS development
    ];
    
    // In development, allow localhost origins and any local network IPs
    if (env.nodeEnv === 'development') {
      if (origin.includes('localhost') || 
          origin.includes('127.0.0.1') || 
          origin.includes('192.168.') || 
          origin.includes('10.0.') ||
          origin.includes('capacitor://') ||
          origin.includes('ionic://')) {
        return callback(null, true);
      }
    }
    
    // In production, check against allowed origins
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      // Log blocked origin for debugging
      if (env.nodeEnv === 'development') {
        console.warn('⚠️  CORS: Blocked origin:', origin);
      }
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Authorization'],
  maxAge: 86400, // 24 hours
};

app.use(cors(corsOptions));

// Rate limiting - Different limits for different endpoints
// More lenient in development, stricter in production
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: env.nodeEnv === 'development' ? 100 : 10, // 100 attempts in dev, 10 in production
  message: {
    success: false,
    message: 'Too many login attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many login attempts, please try again later.',
    });
  },
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: env.nodeEnv === 'development' ? 1000 : 100, // 1000 requests in dev, 100 in production
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/', apiLimiter);

// Cookie parser
app.use(cookieParser());

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Logging
if (env.nodeEnv === 'development') {
  app.use(morgan(':method :url :status :response-time ms'));
}

// Health check
app.get('/health', (_req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.status(200).json({
    success: true,
    message: 'Server is running',
    database: dbStatus,
    timestamp: new Date().toISOString(),
  });
});

// Database connection check middleware (for API routes only)
app.use('/api', (req, res, next) => {
  if (req.path === '/health') {
    return next();
  }
  
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message: 'Database connection not available. Please try again later.',
      error: 'Database disconnected',
    });
  }
  
  next();
});

mongoose.connection.on('error', (err) => {
  if (err.message?.includes('timeout')) {
    console.warn('⚠️  MongoDB connection timeout:', err.message);
  } else {
    console.error('❌ MongoDB Error:', err);
  }
});

mongoose.connection.on('disconnected', () => {
  const isIntentional = (mongoose.connection as any)._intentionalDisconnect;
  if (!isIntentional) {
    console.warn('⚠️  MongoDB disconnected. Mongoose will attempt to reconnect automatically.');
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/designs', designRoutes);
app.use('/api/studio-products', studioProductRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/user-preferences', userPreferencesRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/favorites', favoriteRoutes);

// 404 handler
app.use((req, res) => {
  // Log the missing route for debugging
  if (process.env.NODE_ENV === 'development') {
    console.warn('⚠️  Route not found:', {
      method: req.method,
      path: req.path,
      url: req.url,
      originalUrl: req.originalUrl,
    });
  }
  
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path,
    method: req.method,
  });
});

// Error handler
app.use(errorHandler);

// Start server only after database connection is established
const startServer = async () => {
  try {
    // Wait for database connection before starting server
    await connectDB();
    
    // Verify connection is ready
    if (mongoose.connection.readyState !== 1) {
      throw new Error(`Database connection not ready. Current state: ${mongoose.connection.readyState} (0=disconnected, 1=connected, 2=connecting, 3=disconnecting)`);
    }
    
    // Additional verification - test database access
    try {
      const dbName = mongoose.connection.name;
      console.log(`✅ Database connection verified: ${dbName}`);
      console.log(`✅ Connection state: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Not Connected'}`);
    } catch (verifyError: any) {
      console.warn('⚠️  Database verification warning:', verifyError.message);
    }
    
    const server = app.listen(env.port, () => {
      console.log('');
      console.log('🚀 ========================================');
      console.log(`🚀 Server running in ${env.nodeEnv} mode`);
      console.log(`🚀 Server listening on port ${env.port}`);
      console.log(`🚀 API URL: http://localhost:${env.port}/api`);
      console.log('🚀 ========================================');
      console.log('');
    });
    
    // Increase timeout for file uploads (Cloudinary uploads can take time)
    server.timeout = 180000; // 3 minutes
    server.keepAliveTimeout = 65000; // 65 seconds
    server.headersTimeout = 66000; // 66 seconds (must be > keepAliveTimeout)
    
    server.on('error', async (err: NodeJS.ErrnoException) => {
      // Close database connection before exiting
      if (mongoose.connection.readyState === 1) {
        console.log('');
        console.log('🔄 Closing database connection...');
        try {
          // Mark as intentional disconnect to prevent reconnection messages
          (mongoose.connection as any)._intentionalDisconnect = true;
          // Close connection
          await mongoose.connection.close(false);
          console.log('✅ Database connection closed');
        } catch (closeError: any) {
          console.warn('⚠️  Error closing database connection:', closeError.message);
        }
      }
      
      if (err.code === 'EADDRINUSE') {
        console.error('');
        console.error('❌ ========================================');
        console.error(`❌ Port ${env.port} is already in use!`);
        console.error('❌ ========================================');
        console.error('');
        console.error('⚠️  Note: Database connection was successful, but server cannot start');
        console.error('⚠️  Another process is already using port', env.port);
        console.error('');
        console.error('💡 Solutions:');
        console.error('');
        console.error('   Option 1: Stop the process using port', env.port);
        console.error('');
        console.error('   On Windows:');
        console.error(`     1. Find the process: netstat -ano | findstr :${env.port}`);
        console.error('     2. Kill the process: taskkill /PID <PID> /F');
        console.error('     Or use this one-liner:');
        console.error(`        for /f "tokens=5" %a in ('netstat -ano ^| findstr :${env.port}') do taskkill /F /PID %a`);
        console.error('');
        console.error('   On Linux/Mac:');
        console.error(`     lsof -ti:${env.port} | xargs kill -9`);
        console.error('');
        console.error('   Option 2: Change the port in .env file');
        console.error(`     Change PORT=5000 to PORT=5001 (or any other available port)`);
        console.error('');
        console.error('   Option 3: Use a different terminal/process');
        console.error('     Make sure you closed any previous server instances');
        console.error('');
        console.error('❌ ========================================');
        console.error('');
        process.exit(1);
      } else {
        console.error('❌ Server error:', err);
        process.exit(1);
      }
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err: Error) => {
      console.error('❌ Unhandled Rejection:', err.message);
      server.close(() => process.exit(1));
    });

    // Handle SIGTERM
    process.on('SIGTERM', () => {
      console.log('👋 SIGTERM received, shutting down gracefully');
      server.close(() => {
        console.log('✅ Process terminated');
      });
    });
  } catch (error: any) {
    // Close database connection if it was opened
    if (mongoose.connection.readyState === 1) {
      console.log('');
      console.log('🔄 Closing database connection...');
      try {
        // Mark as intentional disconnect to prevent reconnection messages
        (mongoose.connection as any)._intentionalDisconnect = true;
        // Close connection
        await mongoose.connection.close(false);
        console.log('✅ Database connection closed');
      } catch (closeError: any) {
        console.warn('⚠️  Error closing database connection:', closeError.message);
      }
    }
    
    console.error('');
    console.error('❌ ========================================');
    console.error('❌ Failed to start server');
    console.error('❌ ========================================');
    console.error('');
    console.error('❌ Reason:', error.message);
    console.error('');
    
    // Check if it's a database connection error
    if (error.message.includes('MongoDB') || error.message.includes('database') || error.message.includes('connection')) {
      console.error('🔍 Issue: Database connection failed');
      console.error('');
      console.error('💡 Make sure:');
      console.error('   1. ✅ MongoDB Atlas is running');
      console.error('   2. ✅ MONGODB_URI is correct in .env file');
      console.error('   3. ✅ Your IP is whitelisted in Network Access');
      console.error('   4. ✅ Internet connection is working');
      console.error('');
      console.error('📖 Check MONGODB_SETUP.md for detailed instructions');
    } else {
      console.error('💡 Make sure:');
      console.error('   1. MongoDB is running');
      console.error('   2. MONGODB_URI is correct in your .env file');
      console.error('   3. Your network connection is stable');
    }
    console.error('');
    console.error('❌ ========================================');
    console.error('');
    process.exit(1);
  }
};

// Start the server
startServer();

export default app;
