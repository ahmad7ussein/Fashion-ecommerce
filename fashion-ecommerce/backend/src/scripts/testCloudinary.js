"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cloudinary_1 = require("cloudinary");
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const parentEnvPath = path_1.default.resolve(__dirname, '../../../.env.local');
dotenv_1.default.config({ path: parentEnvPath });
const backendEnvLocalPath = path_1.default.resolve(__dirname, '../../.env.local');
dotenv_1.default.config({ path: backendEnvLocalPath });
dotenv_1.default.config();
const cloudName = (process.env.CLOUDINARY_CLOUD_NAME || '').trim();
const apiKey = (process.env.CLOUDINARY_API_KEY || '').trim();
const apiSecret = (process.env.CLOUDINARY_API_SECRET || '').trim();
console.log('');
console.log('  Cloudinary Connection Test');
console.log('  ========================================');
console.log('');
if (!cloudName || !apiKey || !apiSecret) {
    console.error(' Missing Cloudinary credentials!');
    console.log('');
    console.log('Please set the following in your .env.local file:');
    console.log('  CLOUDINARY_CLOUD_NAME=your_cloud_name');
    console.log('  CLOUDINARY_API_KEY=your_api_key');
    console.log('  CLOUDINARY_API_SECRET=your_api_secret');
    console.log('');
    process.exit(1);
}
console.log(` Cloud Name: ${cloudName}`);
console.log(` API Key: ${apiKey ? 'Set (' + apiKey.length + ' chars)' : 'Not set'}`);
console.log(` API Secret: ${apiSecret ? 'Set (' + apiSecret.length + ' chars)' : 'Not set'}`);
console.log('');
cloudinary_1.v2.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
});
console.log('Testing Cloudinary connection...');
console.log('');
cloudinary_1.v2.api.ping()
    .then((result) => {
    console.log(' SUCCESS! Cloudinary connection is working!');
    console.log('');
    console.log('Response:', JSON.stringify(result, null, 2));
    console.log('');
    console.log('  ========================================');
    console.log('');
    process.exit(0);
})
    .catch((error) => {
    console.error(' FAILED! Cloudinary connection error:');
    console.error('');
    console.error('Error:', error.message);
    console.error('');
    if (error.message.includes('Invalid cloud_name')) {
        console.error(' SOLUTION:');
        console.error('   1. Go to https://console.cloudinary.com/');
        console.error('   2. Check your Dashboard for the exact Cloud Name');
        console.error('   3. Copy it EXACTLY (case-sensitive, no spaces)');
        console.error('   4. Update CLOUDINARY_CLOUD_NAME in your .env.local file');
        console.error('   5. Restart your backend server');
        console.error('');
    }
    else if (error.message.includes('Invalid API Key')) {
        console.error(' SOLUTION:');
        console.error('   1. Go to https://console.cloudinary.com/');
        console.error('   2. Go to Settings → Product environment credentials');
        console.error('   3. Copy the API Key EXACTLY');
        console.error('   4. Update CLOUDINARY_API_KEY in your .env.local file');
        console.error('');
    }
    else if (error.message.includes('Invalid API Secret')) {
        console.error(' SOLUTION:');
        console.error('   1. Go to https://console.cloudinary.com/');
        console.error('   2. Go to Settings → Product environment credentials');
        console.error('   3. Copy the API Secret EXACTLY');
        console.error('   4. Update CLOUDINARY_API_SECRET in your .env.local file');
        console.error('');
    }
    console.log('  ========================================');
    console.log('');
    process.exit(1);
});
