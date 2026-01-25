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
async function checkIndexes() {
    try {
        await (0, database_1.default)();
        console.log(' Connected to database\n');
        console.log(' Checking indexes...\n');
        const collection = Product_1.default.collection;
        const existingIndexes = await collection.indexes();
        console.log(` Found ${existingIndexes.length} indexes:\n`);
        existingIndexes.forEach((index) => {
            const indexName = index.name;
            const indexKey = JSON.stringify(index.key);
            const isTextIndex = indexName.includes('text');
            console.log(`  ${isTextIndex ? '' : ''} ${indexName}: ${indexKey}`);
        });
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
        console.log('\n Checking required indexes...\n');
        let missingIndexes = [];
        for (const requiredIndex of requiredIndexes) {
            const indexKeyStr = JSON.stringify(requiredIndex);
            const exists = existingIndexes.some((idx) => {
                const existingKeyStr = JSON.stringify(idx.key);
                return existingKeyStr === indexKeyStr;
            });
            if (exists) {
                console.log(`   ${indexKeyStr}`);
            }
            else {
                console.log(`   MISSING: ${indexKeyStr}`);
                missingIndexes.push(requiredIndex);
            }
        }
        const hasTextIndex = existingIndexes.some((idx) => idx.name.includes('text') ||
            (idx.key && typeof idx.key.name === 'string' && idx.key.name === 'text'));
        if (hasTextIndex) {
            console.log(`   Text search index exists`);
        }
        else {
            console.log(`   MISSING: Text search index`);
            missingIndexes.push({ name: 'text', nameAr: 'text', description: 'text', descriptionAr: 'text' });
        }
        if (missingIndexes.length > 0) {
            console.log(`\n  Found ${missingIndexes.length} missing indexes!`);
            console.log(' Run: node src/scripts/createIndexes.js\n');
            process.exit(1);
        }
        else {
            console.log('\n All required indexes are present!\n');
            console.log(' Testing sample query...');
            const testStartTime = Date.now();
            const testQuery = Product_1.default.find({ active: true, gender: 'Men' })
                .sort({ createdAt: -1 })
                .limit(10)
                .lean()
                .maxTimeMS(5000);
            try {
                const testResults = await testQuery;
                const testTime = Date.now() - testStartTime;
                console.log(` Test query completed in ${testTime}ms (found ${testResults.length} products)`);
                if (testTime > 1000) {
                    console.log('  Query is slower than expected. Indexes may not be used properly.');
                }
            }
            catch (testError) {
                console.error(' Test query failed:', testError.message);
            }
            process.exit(0);
        }
    }
    catch (error) {
        console.error(' Error:', error.message);
        process.exit(1);
    }
}
checkIndexes();
