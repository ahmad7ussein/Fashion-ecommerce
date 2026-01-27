"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const compression_1 = __importDefault(require("compression"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const http_1 = __importDefault(require("http"));
const mongoose_1 = __importDefault(require("mongoose"));
const socket_io_1 = require("socket.io");
const database_1 = __importDefault(require("./config/database"));
const errorHandler_1 = __importDefault(require("./middleware/errorHandler"));
const env_1 = __importDefault(require("./config/env"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const productRoutes_1 = __importDefault(require("./routes/productRoutes"));
const orderRoutes_1 = __importDefault(require("./routes/orderRoutes"));
const designRoutes_1 = __importDefault(require("./routes/designRoutes"));
const adminRoutes_1 = __importDefault(require("./routes/adminRoutes"));
const cartRoutes_1 = __importDefault(require("./routes/cartRoutes"));
const userPreferencesRoutes_1 = __importDefault(require("./routes/userPreferencesRoutes"));
const reviewRoutes_1 = __importDefault(require("./routes/reviewRoutes"));
const contactRoutes_1 = __importDefault(require("./routes/contactRoutes"));
const notificationRoutes_1 = __importDefault(require("./routes/notificationRoutes"));
const favoriteRoutes_1 = __importDefault(require("./routes/favoriteRoutes"));
const studioProductRoutes_1 = __importDefault(require("./routes/studioProductRoutes"));
const featureControlRoutes_1 = __importDefault(require("./routes/featureControlRoutes"));
const staffChatRoutes_1 = __importDefault(require("./routes/staffChatRoutes"));
const paymentRoutes_1 = __importDefault(require("./routes/paymentRoutes"));
const diagnosticRoutes_1 = __importDefault(require("./routes/diagnosticRoutes"));
const accountDeletionRoutes_1 = __importDefault(require("./routes/accountDeletionRoutes"));
const staffChatSocket_1 = __importDefault(require("./socket/staffChatSocket"));
const app = (0, express_1.default)();
app.use((0, helmet_1.default)());
const allowedOrigins = [
    env_1.default.frontendUrl,
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'capacitor://localhost',
    'ionic://localhost',
    'http://localhost',
    'https://localhost',
];
const isAllowedOrigin = (origin) => {
    if (!origin) {
        return true;
    }
    if (env_1.default.nodeEnv === 'development') {
        if (origin.includes('localhost') ||
            origin.includes('127.0.0.1') ||
            origin.includes('192.168.') ||
            origin.includes('10.0.') ||
            origin.includes('capacitor://') ||
            origin.includes('ionic://')) {
            return true;
        }
    }
    return allowedOrigins.indexOf(origin) !== -1;
};
const corsOptions = {
    origin: function (origin, callback) {
        if (isAllowedOrigin(origin)) {
            return callback(null, true);
        }
        if (env_1.default.nodeEnv === 'development') {
            console.warn('Warning: CORS blocked origin:', origin);
        }
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Authorization'],
    maxAge: 86400,
};
const socketCorsOptions = {
    origin: function (origin, callback) {
        if (isAllowedOrigin(origin)) {
            return callback(null, true);
        }
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST'],
};
app.use((0, cors_1.default)(corsOptions));
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: env_1.default.nodeEnv === 'development' ? 100 : 10,
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
const apiLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: env_1.default.nodeEnv === 'development' ? 1000 : 100,
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/', apiLimiter);
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json({ limit: '25mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '25mb' }));
app.use((0, compression_1.default)());
app.use((req, res, next) => {
    const json = res.json.bind(res);
    res.json = (data) => {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        return json(data);
    };
    next();
});
if (env_1.default.nodeEnv === 'development') {
    app.use((0, morgan_1.default)(':method :url :status :response-time ms'));
}
app.get('/health', (_req, res) => {
    const dbStatus = mongoose_1.default.connection.readyState === 1 ? 'connected' : 'disconnected';
    res.status(200).json({
        success: true,
        message: 'Server is running',
        database: dbStatus,
        timestamp: new Date().toISOString(),
    });
});
app.use('/api', (req, res, next) => {
    if (req.path === '/health') {
        return next();
    }
    if (mongoose_1.default.connection.readyState !== 1) {
        return res.status(503).json({
            success: false,
            message: 'Database connection not available. Please try again later.',
            error: 'Database disconnected',
        });
    }
    next();
});
mongoose_1.default.connection.on('error', (err) => {
    if (err.message?.includes('timeout')) {
        console.warn('  MongoDB connection timeout:', err.message);
    }
    else {
        console.error(' MongoDB Error:', err);
    }
});
mongoose_1.default.connection.on('disconnected', () => {
    const isIntentional = mongoose_1.default.connection._intentionalDisconnect;
    if (!isIntentional) {
        console.warn('  MongoDB disconnected. Mongoose will attempt to reconnect automatically.');
    }
});
app.use('/api/auth', authRoutes_1.default);
app.use('/api/products', productRoutes_1.default);
app.use('/api/orders', orderRoutes_1.default);
app.use('/api/designs', designRoutes_1.default);
app.use('/api/studio-products', studioProductRoutes_1.default);
app.use('/api/admin', adminRoutes_1.default);
app.use('/api/cart', cartRoutes_1.default);
app.use('/api/user-preferences', userPreferencesRoutes_1.default);
app.use('/api/reviews', reviewRoutes_1.default);
app.use('/api/contact', contactRoutes_1.default);
app.use('/api/notifications', notificationRoutes_1.default);
app.use('/api/favorites', favoriteRoutes_1.default);
app.use('/api/feature-controls', featureControlRoutes_1.default);
app.use('/api/staff-chat', staffChatRoutes_1.default);
app.use('/api/payments', paymentRoutes_1.default);
app.use('/api/diagnostics', diagnosticRoutes_1.default);
app.use('/api/account-deletions', accountDeletionRoutes_1.default);
app.use((req, res) => {
    if (process.env.NODE_ENV === 'development') {
        console.warn('  Route not found:', {
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
app.use(errorHandler_1.default);
const startServer = async () => {
    try {
        await (0, database_1.default)();
        if (mongoose_1.default.connection.readyState !== 1) {
            throw new Error(`Database connection not ready. Current state: ${mongoose_1.default.connection.readyState} (0=disconnected, 1=connected, 2=connecting, 3=disconnecting)`);
        }
        try {
            const dbName = mongoose_1.default.connection.name;
            console.log(` Database connection verified: ${dbName}`);
            console.log(` Connection state: ${mongoose_1.default.connection.readyState === 1 ? 'Connected' : 'Not Connected'}`);
        }
        catch (verifyError) {
            console.warn('  Database verification warning:', verifyError.message);
        }
        const server = http_1.default.createServer(app);
        let isShuttingDown = false;
        const handleShutdown = (signal) => {
            if (isShuttingDown)
                return;
            isShuttingDown = true;
            process.env.SERVER_SHUTTING_DOWN = 'true';
            console.log(`dY\`< ${signal} received, shutting down gracefully`);
            server.close(async () => {
                if (mongoose_1.default.connection.readyState === 1) {
                    try {
                        mongoose_1.default.connection._intentionalDisconnect = true;
                        await mongoose_1.default.connection.close(false);
                        console.log('Гo. Database connection closed');
                    }
                    catch (closeError) {
                        console.warn('Гs Л,?  Error closing database connection:', closeError.message);
                    }
                }
                console.log('Гo. Process terminated');
                process.exit(0);
            });
            setTimeout(() => {
                console.warn('  Forced shutdown after timeout');
                process.exit(1);
            }, 10000);
        };
        const io = new socket_io_1.Server(server, { cors: socketCorsOptions });
        (0, staffChatSocket_1.default)(io);
        server.listen(env_1.default.port, () => {
            console.log('');
            console.log('dYs? ========================================');
            console.log(`dYs? Server running in ${env_1.default.nodeEnv} mode`);
            console.log(`dYs? Server listening on port ${env_1.default.port}`);
            console.log(`dYs? API URL: http://localhost:${env_1.default.port}/api`);
            console.log('dYs? ========================================');
            console.log('');
        });
        server.timeout = 180000;
        server.keepAliveTimeout = 65000;
        server.headersTimeout = 66000;
        server.on('error', async (err) => {
            if (mongoose_1.default.connection.readyState === 1) {
                console.log('');
                console.log(' Closing database connection...');
                try {
                    mongoose_1.default.connection._intentionalDisconnect = true;
                    await mongoose_1.default.connection.close(false);
                    console.log(' Database connection closed');
                }
                catch (closeError) {
                    console.warn('  Error closing database connection:', closeError.message);
                }
            }
            if (err.code === 'EADDRINUSE') {
                console.error('');
                console.error(' ========================================');
                console.error(` Port ${env_1.default.port} is already in use!`);
                console.error(' ========================================');
                console.error('');
                console.error('  Note: Database connection was successful, but server cannot start');
                console.error('  Another process is already using port', env_1.default.port);
                console.error('');
                console.error(' Solutions:');
                console.error('');
                console.error('   Option 1: Stop the process using port', env_1.default.port);
                console.error('');
                console.error('   On Windows:');
                console.error(`     1. Find the process: netstat -ano | findstr :${env_1.default.port}`);
                console.error('     2. Kill the process: taskkill /PID <PID> /F');
                console.error('     Or use this one-liner:');
                console.error(`        for /f "tokens=5" %a in ('netstat -ano ^| findstr :${env_1.default.port}') do taskkill /F /PID %a`);
                console.error('');
                console.error('   On Linux/Mac:');
                console.error(`     lsof -ti:${env_1.default.port} | xargs kill -9`);
                console.error('');
                console.error('   Option 2: Change the port in .env file');
                console.error(`     Change PORT=5000 to another available port`);
                console.error('');
                console.error('   Option 3: Use a different terminal/process');
                console.error('     Make sure you closed any previous server instances');
                console.error('');
                console.error(' ========================================');
                console.error('');
                process.exit(1);
            }
            else {
                console.error(' Server error:', err);
                process.exit(1);
            }
        });
        process.on('unhandledRejection', (err) => {
            console.error(' Unhandled Rejection:', err.message);
            server.close(() => process.exit(1));
        });
        process.on('SIGINT', () => handleShutdown('SIGINT'));
        process.on('SIGTERM', () => handleShutdown('SIGTERM'));
    }
    catch (error) {
        if (mongoose_1.default.connection.readyState === 1) {
            console.log('');
            console.log(' Closing database connection...');
            try {
                mongoose_1.default.connection._intentionalDisconnect = true;
                await mongoose_1.default.connection.close(false);
                console.log(' Database connection closed');
            }
            catch (closeError) {
                console.warn('  Error closing database connection:', closeError.message);
            }
        }
        console.error('');
        console.error(' ========================================');
        console.error(' Failed to start server');
        console.error(' ========================================');
        console.error('');
        console.error(' Reason:', error.message);
        console.error('');
        if (error.message.includes('MongoDB') || error.message.includes('database') || error.message.includes('connection')) {
            console.error(' Issue: Database connection failed');
            console.error('');
            console.error(' Make sure:');
            console.error('   1.  MongoDB Atlas is running');
            console.error('   2.  MONGODB_URI is correct in .env file');
            console.error('   3.  Your IP is whitelisted in Network Access');
            console.error('   4.  Internet connection is working');
            console.error('');
            console.error(' Check MONGODB_SETUP.md for detailed instructions');
        }
        else {
            console.error(' Make sure:');
            console.error('   1. MongoDB is running');
            console.error('   2. MONGODB_URI is correct in your .env file');
            console.error('   3. Your network connection is stable');
        }
        console.error('');
        console.error(' ========================================');
        console.error('');
        process.exit(1);
    }
};
startServer();
exports.default = app;
