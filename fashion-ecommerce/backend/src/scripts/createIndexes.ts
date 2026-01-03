






import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Product from '../models/Product';
import connectDB from '../config/database';


const parentEnvPath = path.resolve(__dirname, '../../../.env.local');
dotenv.config({ path: parentEnvPath });

const backendEnvLocalPath = path.resolve(__dirname, '../../.env.local');
dotenv.config({ path: backendEnvLocalPath });

dotenv.config();

async function createIndexes() {
  try {
    
    await connectDB();
    console.log('✅ Connected to database');

    console.log('📊 Creating indexes...');

    
    const collection = Product.collection;

    
    console.log('\n📋 Current indexes before cleanup:');
    const existingIndexes = await collection.indexes();
    existingIndexes.forEach((index: any) => {
      console.log(`  - ${index.name}:`, JSON.stringify(index.key));
    });

    
    console.log('\n🗑️  Dropping all indexes except _id...');
    try {
      
      const indexesToDrop = existingIndexes
        .filter((idx: any) => idx.name !== '_id_')
        .map((idx: any) => idx.name);
      
      if (indexesToDrop.length > 0) {
        for (const indexName of indexesToDrop) {
          try {
            await collection.dropIndex(indexName);
            console.log(`  ✅ Dropped index: ${indexName}`);
          } catch (dropError: any) {
            if (dropError.code !== 27) { 
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

    
    console.log('\n📊 Creating optimized indexes (3 indexes only)...');
    const indexes: any[] = [
      
      { active: 1, createdAt: -1 },
      
      
      { active: 1, gender: 1, createdAt: -1 },
      
      
      { active: 1, featured: 1, createdAt: -1 },
    ];

    for (const indexSpec of indexes) {
      try {
        await collection.createIndex(indexSpec, { background: true });
        console.log(`✅ Created index:`, JSON.stringify(indexSpec));
      } catch (error: any) {
        if (error.code === 85) {
          
          console.log(`⚠️  Index already exists:`, JSON.stringify(indexSpec));
        } else if (error.code === 86) {
          
          console.log(`ℹ️  Index already exists:`, JSON.stringify(indexSpec));
        } else {
          console.error(`❌ Failed to create index:`, JSON.stringify(indexSpec), error.message);
        }
      }
    }

    
    
    















    
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
