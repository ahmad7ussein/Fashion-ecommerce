"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const Product_1 = __importDefault(require("../models/Product"));
const database_1 = __importDefault(require("../config/database"));
const parentEnvPath = path_1.default.resolve(__dirname, '../../../.env.local');
dotenv_1.default.config({ path: parentEnvPath });
const backendEnvLocalPath = path_1.default.resolve(__dirname, '../../.env.local');
dotenv_1.default.config({ path: backendEnvLocalPath });
dotenv_1.default.config();
async function createIndexes() {
    try {
        await (0, database_1.default)();
        console.log('✅ Connected to database');
        console.log('📊 Creating indexes...');
        const collection = Product_1.default.collection;
        console.log('\n📋 Current indexes before cleanup:');
        const existingIndexes = await collection.indexes();
        existingIndexes.forEach((index) => {
            console.log(`  - ${index.name}:`, JSON.stringify(index.key));
        });
        console.log('\n🗑️  Dropping all indexes except _id...');
        try {
            const indexesToDrop = existingIndexes
                .filter((idx) => idx.name !== '_id_')
                .map((idx) => idx.name);
            if (indexesToDrop.length > 0) {
                for (const indexName of indexesToDrop) {
                    try {
                        await collection.dropIndex(indexName);
                        console.log(`  ✅ Dropped index: ${indexName}`);
                    }
                    catch (dropError) {
                        if (dropError.code !== 27) {
                            console.warn(`  ⚠️  Could not drop ${indexName}:`, dropError.message);
                        }
                    }
                }
            }
            else {
                console.log('  ℹ️  No indexes to drop');
            }
        }
        catch (error) {
            console.warn('⚠️  Error dropping indexes:', error.message);
        }
        console.log('\n📊 Creating optimized indexes (3 indexes only)...');
        const indexes = [
            { active: 1, createdAt: -1 },
            { active: 1, gender: 1, createdAt: -1 },
            { active: 1, featured: 1, createdAt: -1 },
        ];
        for (const indexSpec of indexes) {
            try {
                await collection.createIndex(indexSpec, { background: true });
                console.log(`✅ Created index:`, JSON.stringify(indexSpec));
            }
            catch (error) {
                if (error.code === 85) {
                    console.log(`⚠️  Index already exists:`, JSON.stringify(indexSpec));
                }
                else if (error.code === 86) {
                    console.log(`ℹ️  Index already exists:`, JSON.stringify(indexSpec));
                }
                else {
                    console.error(`❌ Failed to create index:`, JSON.stringify(indexSpec), error.message);
                }
            }
        }
        console.log('\n📋 Current indexes:');
        const allIndexes = await collection.indexes();
        allIndexes.forEach((index) => {
            console.log(`  - ${index.name}:`, JSON.stringify(index.key));
        });
        console.log('\n✅ Index creation completed!');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}
createIndexes();
