/**
 * Check MongoDB Indexes for Products
 * 
 * This script verifies that all required indexes exist in the database.
 * Run with: npx ts-node src/scripts/checkIndexes.ts
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

async function checkIndexes() {
  try {
    // Connect to database
    await connectDB();
    console.log('✅ Connected to database\n');

    console.log('📊 Checking indexes...\n');

    // Get collection
    const collection = Product.collection;

    // Get all existing indexes
    const existingIndexes = await collection.indexes();
    
    console.log(`📋 Found ${existingIndexes.length} indexes:\n`);
    
    existingIndexes.forEach((index: any) => {
      const indexName = index.name;
      const indexKey = JSON.stringify(index.key);
      const isTextIndex = indexName.includes('text');
      console.log(`  ${isTextIndex ? '🔍' : '📌'} ${indexName}: ${indexKey}`);
    });

    // Required indexes (from Product.ts)
    const requiredIndexes = [
      { active: 1, createdAt: -1 },
      { active: 1, featured: -1, createdAt: -1 },
      { active: 1, price: 1 },
      { active: 1, price: -1 },
      { active: 1, gender: 1, createdAt: -1 },
      { active: 1, gender: 1, featured: -1 },
      { active: 1, gender: 1, price: 1 },
      { active: 1, gender: 1, price: -1 },
      { active: 1, inCollection: 1, createdAt: -1 },
      { active: 1, onSale: 1, price: 1 },
      { active: 1, category: 1, gender: 1, createdAt: -1 },
    ];

    console.log('\n🔍 Checking required indexes...\n');
    
    let missingIndexes: any[] = [];
    
    for (const requiredIndex of requiredIndexes) {
      const indexKeyStr = JSON.stringify(requiredIndex);
      const exists = existingIndexes.some((idx: any) => {
        const existingKeyStr = JSON.stringify(idx.key);
        return existingKeyStr === indexKeyStr;
      });
      
      if (exists) {
        console.log(`  ✅ ${indexKeyStr}`);
      } else {
        console.log(`  ❌ MISSING: ${indexKeyStr}`);
        missingIndexes.push(requiredIndex);
      }
    }

    // Check text index
    const hasTextIndex = existingIndexes.some((idx: any) => 
      idx.name.includes('text') || 
      (idx.key && typeof idx.key.name === 'string' && idx.key.name === 'text')
    );
    
    if (hasTextIndex) {
      console.log(`  ✅ Text search index exists`);
    } else {
      console.log(`  ❌ MISSING: Text search index`);
      missingIndexes.push({ name: 'text', nameAr: 'text', description: 'text', descriptionAr: 'text' });
    }

    if (missingIndexes.length > 0) {
      console.log(`\n⚠️  Found ${missingIndexes.length} missing indexes!`);
      console.log('💡 Run: npx ts-node src/scripts/createIndexes.ts\n');
      process.exit(1);
    } else {
      console.log('\n✅ All required indexes are present!\n');
      
      // Test a sample query
      console.log('🧪 Testing sample query...');
      const testStartTime = Date.now();
      const testQuery = Product.find({ active: true, gender: 'Men' })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean()
        .maxTimeMS(5000);
      
      try {
        const testResults = await testQuery;
        const testTime = Date.now() - testStartTime;
        console.log(`✅ Test query completed in ${testTime}ms (found ${testResults.length} products)`);
        
        if (testTime > 1000) {
          console.log('⚠️  Query is slower than expected. Indexes may not be used properly.');
        }
      } catch (testError: any) {
        console.error('❌ Test query failed:', testError.message);
      }
      
      process.exit(0);
    }
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkIndexes();
