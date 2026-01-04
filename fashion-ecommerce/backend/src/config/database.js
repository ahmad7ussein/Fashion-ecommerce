"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = __importDefault(require("./env"));
const connectDB = async () => {
    try {
        const mongoURI = env_1.default.mongodbUri;
        const isAtlas = mongoURI.includes('mongodb+srv://') || mongoURI.includes('mongodb.net');
        const options = {
            maxPoolSize: isAtlas ? 15 : 5,
            minPoolSize: isAtlas ? 3 : 1,
            serverSelectionTimeoutMS: isAtlas ? 20000 : 10000,
            socketTimeoutMS: isAtlas ? 45000 : 20000,
            connectTimeoutMS: isAtlas ? 20000 : 10000,
            retryWrites: true,
            retryReads: true,
            heartbeatFrequencyMS: 5000,
            maxIdleTimeMS: 60000,
            bufferCommands: false,
            monitorCommands: false,
        };
        console.log('');
        console.log('🔄 ========================================');
        console.log(isAtlas ? '🔄 Attempting to connect to MongoDB Atlas...' : '🔄 Attempting to connect to local MongoDB...');
        console.log('🔄 ========================================');
        console.log(`📍 Connection String: ${mongoURI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);
        console.log('⏳ Connecting...');
        console.log('');
        await mongoose_1.default.connect(mongoURI, options);
        if (mongoose_1.default.connection.readyState !== 1) {
            throw new Error('Connection established but readyState is not 1 (Connected)');
        }
        try {
            if (mongoose_1.default.connection.db) {
                await mongoose_1.default.connection.db.admin().ping();
                console.log('✅ Database ping successful');
            }
        }
        catch (pingError) {
            console.warn('⚠️  Database ping failed, but connection seems active');
        }
        console.log('');
        console.log('✅ ========================================');
        console.log('✅ MongoDB Connected Successfully!');
        console.log('✅ ========================================');
        console.log(`📊 Database Name: ${mongoose_1.default.connection.name}`);
        console.log(`🔌 Connection State: ${mongoose_1.default.connection.readyState === 1 ? 'Connected ✅' : 'Not Connected ❌'}`);
        if (isAtlas) {
            console.log(`☁️  Cloud: MongoDB Atlas`);
            console.log(`🌍 Region/Host: ${mongoose_1.default.connection.host}`);
        }
        else {
            console.log(`🖥️  Host: ${mongoose_1.default.connection.host}:${mongoose_1.default.connection.port || 'N/A'}`);
        }
        console.log(`👥 Connection Pool: ${mongoose_1.default.connection.readyState === 1 ? 'Ready ✅' : 'Not Ready ❌'}`);
        console.log(`📈 Max Pool Size: ${options.maxPoolSize}`);
        console.log(`📉 Min Pool Size: ${options.minPoolSize}`);
        console.log('✅ ========================================');
        console.log('');
    }
    catch (error) {
        console.error('');
        console.error('❌ ========================================');
        console.error('❌ Database Connection Failed');
        console.error('❌ ========================================');
        console.error('');
        console.error(`❌ Error Type: ${error.name}`);
        console.error(`❌ Error Message: ${error.message}`);
        console.error('');
        if (error.stack) {
            console.error('📋 Technical Details:');
            console.error(error.stack.split('\n').slice(0, 5).join('\n'));
            console.error('');
        }
        if (error.message.includes('authentication failed') || error.message.includes('Authentication failed')) {
            console.error('💡 Tip: Check your username and password in MONGODB_URI');
            console.error('   Make sure the credentials in your connection string are correct');
        }
        else if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
            console.error('💡 Tip: Check your cluster URL in MONGODB_URI');
            console.error('   Verify the hostname in your connection string is correct');
        }
        else if (error.message.includes('IP not whitelisted') ||
            error.message.includes('whitelist') ||
            error.message.includes('not on your Atlas cluster') ||
            error.message.includes('access the database from an IP')) {
            console.error('');
            console.error('🔒 ========================================');
            console.error('🔒 Network Access Issue');
            console.error('🔒 ========================================');
            console.error('');
            console.error('❌ Problem: Your IP address is not whitelisted in MongoDB Atlas');
            console.error('');
            console.error('💡 Solution - السماح لجميع IPs:');
            console.error('');
            console.error('   1️⃣  اذهب إلى MongoDB Atlas Dashboard: https://cloud.mongodb.com/');
            console.error('');
            console.error('   2️⃣  اضغط على "Network Access" من القائمة الجانبية');
            console.error('');
            console.error('   3️⃣  اضغط على "Add IP Address"');
            console.error('');
            console.error('   4️⃣  اختر "Allow Access from Anywhere"');
            console.error('         أو اكتب يدوياً: 0.0.0.0/0');
            console.error('');
            console.error('   5️⃣  اضغط "Confirm"');
            console.error('');
            console.error('   6️⃣  انتظر دقيقة أو دقيقتين ثم أعد تشغيل الخادم');
            console.error('');
            console.error('   ℹ️  ملاحظة: تأكد من أن قاعدة البيانات محمية بكلمة مرور قوية.');
            console.error('');
            console.error('🔒 ========================================');
            console.error('');
        }
        else if (error.message.includes('timeout') || error.message.includes('timed out')) {
            console.error('💡 Tip: Check your internet connection and MongoDB Atlas status');
            console.error('   - Verify your internet connection is working');
            console.error('   - Check if MongoDB Atlas is accessible');
            console.error('   - Try increasing timeout values in database.js');
        }
        else if (error.message.includes('bad auth') || error.message.includes('badAuth')) {
            console.error('💡 Tip: Authentication credentials are incorrect');
            console.error('   Check your username and password in MONGODB_URI');
        }
        else {
            console.error('💡 General Tips:');
            console.error('   1. Verify MONGODB_URI is set correctly in your .env file');
            console.error('   2. Check if MongoDB Atlas cluster is running');
            console.error('   3. Verify network access settings in MongoDB Atlas');
            console.error('   4. Check your internet connection');
        }
        console.error('');
        console.error('❌ ========================================');
        console.error('');
        throw error;
    }
};
mongoose_1.default.connection.on('connected', () => {
    console.log(' Mongoose connected to MongoDB');
});
mongoose_1.default.connection.on('disconnected', () => {
    const isIntentional = mongoose_1.default.connection._intentionalDisconnect;
    if (!isIntentional) {
        console.log('  MongoDB Disconnected');
        console.log(' Attempting to reconnect...');
    }
    else {
        mongoose_1.default.connection._intentionalDisconnect = false;
    }
});
mongoose_1.default.connection.on('error', (err) => {
    console.error(' MongoDB Error:', err);
});
mongoose_1.default.connection.on('reconnected', () => {
    console.log(' MongoDB Reconnected');
});
process.on('SIGINT', async () => {
    await mongoose_1.default.connection.close();
    console.log(' MongoDB connection closed through app termination');
    process.exit(0);
});
exports.default = connectDB;
