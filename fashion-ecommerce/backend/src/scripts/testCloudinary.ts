






import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import path from 'path';


const parentEnvPath = path.resolve(__dirname, '../../../.env.local');
dotenv.config({ path: parentEnvPath });

const backendEnvLocalPath = path.resolve(__dirname, '../../.env.local');
dotenv.config({ path: backendEnvLocalPath });

dotenv.config();


const cloudName = (process.env.CLOUDINARY_CLOUD_NAME || '').trim();
const apiKey = (process.env.CLOUDINARY_API_KEY || '').trim();
const apiSecret = (process.env.CLOUDINARY_API_SECRET || '').trim();

console.log('');
console.log('☁️  Cloudinary Connection Test');
console.log('☁️  ========================================');
console.log('');


if (!cloudName || !apiKey || !apiSecret) {
  console.error('❌ Missing Cloudinary credentials!');
  console.log('');
  console.log('Please set the following in your .env.local file:');
  console.log('  CLOUDINARY_CLOUD_NAME=your_cloud_name');
  console.log('  CLOUDINARY_API_KEY=your_api_key');
  console.log('  CLOUDINARY_API_SECRET=your_api_secret');
  console.log('');
  process.exit(1);
}

console.log(`✅ Cloud Name: ${cloudName}`);
console.log(`✅ API Key: ${apiKey ? 'Set (' + apiKey.length + ' chars)' : 'Not set'}`);
console.log(`✅ API Secret: ${apiSecret ? 'Set (' + apiSecret.length + ' chars)' : 'Not set'}`);
console.log('');


cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
});


console.log('Testing Cloudinary connection...');
console.log('');

cloudinary.api.ping()
  .then((result: any) => {
    console.log('✅ SUCCESS! Cloudinary connection is working!');
    console.log('');
    console.log('Response:', JSON.stringify(result, null, 2));
    console.log('');
    console.log('☁️  ========================================');
    console.log('');
    process.exit(0);
  })
  .catch((error: any) => {
    console.error('❌ FAILED! Cloudinary connection error:');
    console.error('');
    console.error('Error:', error.message);
    console.error('');
    
    if (error.message.includes('Invalid cloud_name')) {
      console.error('💡 SOLUTION:');
      console.error('   1. Go to https://console.cloudinary.com/');
      console.error('   2. Check your Dashboard for the exact Cloud Name');
      console.error('   3. Copy it EXACTLY (case-sensitive, no spaces)');
      console.error('   4. Update CLOUDINARY_CLOUD_NAME in your .env.local file');
      console.error('   5. Restart your backend server');
      console.error('');
    } else if (error.message.includes('Invalid API Key')) {
      console.error('💡 SOLUTION:');
      console.error('   1. Go to https://console.cloudinary.com/');
      console.error('   2. Go to Settings → Product environment credentials');
      console.error('   3. Copy the API Key EXACTLY');
      console.error('   4. Update CLOUDINARY_API_KEY in your .env.local file');
      console.error('');
    } else if (error.message.includes('Invalid API Secret')) {
      console.error('💡 SOLUTION:');
      console.error('   1. Go to https://console.cloudinary.com/');
      console.error('   2. Go to Settings → Product environment credentials');
      console.error('   3. Copy the API Secret EXACTLY');
      console.error('   4. Update CLOUDINARY_API_SECRET in your .env.local file');
      console.error('');
    }
    
    console.log('☁️  ========================================');
    console.log('');
    process.exit(1);
  });
