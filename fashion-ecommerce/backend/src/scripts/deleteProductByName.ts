/**
 * Delete Product by Name
 * 
 * This script deletes a product from the database by name.
 * Run with: npx ts-node src/scripts/deleteProductByName.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Product from '../models/Product';
import { deleteFromCloudinary } from '../config/cloudinary';
import connectDB from '../config/database';

// Load environment variables
const parentEnvPath = path.resolve(__dirname, '../../../.env.local');
dotenv.config({ path: parentEnvPath });

const backendEnvLocalPath = path.resolve(__dirname, '../../.env.local');
dotenv.config({ path: backendEnvLocalPath });

dotenv.config();

const productName = 'Quarter-Zip Polo Shirt';

async function deleteProductByName() {
  try {
    // Connect to database
    await connectDB();
    console.log('✅ Connected to database');

    // Find product by name
    const product = await Product.findOne({ 
      name: { $regex: productName, $options: 'i' } // Case-insensitive search
    });

    if (!product) {
      console.log(`❌ Product "${productName}" not found`);
      process.exit(1);
    }

    console.log(`📦 Found product: ${product.name} (ID: ${product._id})`);

    // Delete images from Cloudinary
    if (product.image && product.image.includes('cloudinary.com')) {
      console.log('🗑️  Deleting main image from Cloudinary...');
      await deleteFromCloudinary(product.image);
    }
    
    if (product.images && product.images.length > 0) {
      console.log(`🗑️  Deleting ${product.images.length} additional images from Cloudinary...`);
      for (const img of product.images) {
        if (img.includes('cloudinary.com')) {
          await deleteFromCloudinary(img);
        }
      }
    }

    // Delete product from database
    await Product.findByIdAndDelete(product._id);
    console.log(`✅ Product "${product.name}" deleted successfully`);

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

deleteProductByName();
