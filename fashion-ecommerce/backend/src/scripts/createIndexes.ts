/**
 * Create MongoDB Indexes for Products
 * 
 * This script creates optimized indexes for product queries.
 * Run with: npx ts-node src/scripts/createIndexes.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Product from '../models/Product';
import connectDB from '../config/database';

// Load environment variables
const parentEnvPath = path.resolve(__dirname, '../../../.env.local');
dotenv.config({ path: parentEnvPath });

const backendEnvLocalPath = path.resolve(__dirname, '../../.env.local');
dotenv.config({ path: backendEnvLocalPath });

dotenv.config();

async function createIndexes() {
  try {
    // Connect to database
    await connectDB();
    console.log('✅ Connected to database');

    console.log('📊 Creating indexes...');

    // Get collection
    const collection = Product.collection;

    // List current indexes
    console.log('\n📋 Current indexes before cleanup:');
    const existingIndexes = await collection.indexes();
    existingIndexes.forEach((index: any) => {
      console.log(`  - ${index.name}:`, JSON.stringify(index.key));
    });

    // Drop ALL indexes except _id (required by MongoDB)
    console.log('\n🗑️  Dropping all indexes except _id...');
    try {
      // Get all index names except _id_
      const indexesToDrop = existingIndexes
        .filter((idx: any) => idx.name !== '_id_')
        .map((idx: any) => idx.name);
      
      if (indexesToDrop.length > 0) {
        for (const indexName of indexesToDrop) {
          try {
            await collection.dropIndex(indexName);
            console.log(`  ✅ Dropped index: ${indexName}`);
          } catch (dropError: any) {
            if (dropError.code !== 27) { // 27 = IndexNotFound
              console.warn(`  ⚠️  Could not drop ${indexName}:`, dropError.message);
            }
          }
        }
      } else {
        console.log('  ℹ️  No indexes to drop');
      }
    } catch (error: any) {
      console.warn('⚠️  Error dropping indexes:', error.message);
    }

    // Create ONLY the 3 required indexes
    console.log('\n📊 Creating optimized indexes (3 indexes only)...');
    const indexes: any[] = [
      // Index 1: Default listing (all active products, newest first)
      { active: 1, createdAt: -1 },
      
      // Index 2: Gender filter (active + gender, newest first)
      { active: 1, gender: 1, createdAt: -1 },
      
      // Index 3: Featured products (active + featured, newest first)
      { active: 1, featured: 1, createdAt: -1 },
    ];

    for (const indexSpec of indexes) {
      try {
        await collection.createIndex(indexSpec, { background: true });
        console.log(`✅ Created index:`, JSON.stringify(indexSpec));
      } catch (error: any) {
        if (error.code === 85) {
          // Index already exists with different options
          console.log(`⚠️  Index already exists:`, JSON.stringify(indexSpec));
        } else if (error.code === 86) {
          // Index already exists
          console.log(`ℹ️  Index already exists:`, JSON.stringify(indexSpec));
        } else {
          console.error(`❌ Failed to create index:`, JSON.stringify(indexSpec), error.message);
        }
      }
    }

    // Note: Text index removed - using regex search instead for simplicity
    // If text search is needed, uncomment below:
    /*
    try {
      await collection.createIndex(
        { name: 'text', nameAr: 'text', description: 'text', descriptionAr: 'text' },
        { background: true }
      );
      console.log(`✅ Created text index`);
    } catch (error: any) {
      if (error.code === 85 || error.code === 86) {
        console.log(`ℹ️  Text index already exists`);
      } else {
        console.error(`❌ Failed to create text index:`, error.message);
      }
    }
    */

    // List all indexes
    console.log('\n📋 Current indexes:');
    const allIndexes = await collection.indexes();
    allIndexes.forEach((index: any) => {
      console.log(`  - ${index.name}:`, JSON.stringify(index.key));
    });

    console.log('\n✅ Index creation completed!');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createIndexes();
