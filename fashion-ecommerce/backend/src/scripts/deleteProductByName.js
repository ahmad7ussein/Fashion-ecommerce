"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const Product_1 = __importDefault(require("../models/Product"));
const cloudinary_1 = require("../config/cloudinary");
const database_1 = __importDefault(require("../config/database"));
const parentEnvPath = path_1.default.resolve(__dirname, '../../../.env.local');
dotenv_1.default.config({ path: parentEnvPath });
const backendEnvLocalPath = path_1.default.resolve(__dirname, '../../.env.local');
dotenv_1.default.config({ path: backendEnvLocalPath });
dotenv_1.default.config();
const productName = 'Quarter-Zip Polo Shirt';
async function deleteProductByName() {
    try {
        await (0, database_1.default)();
        console.log(' Connected to database');
        const product = await Product_1.default.findOne({
            name: { $regex: productName, $options: 'i' }
        });
        if (!product) {
            console.log(` Product "${productName}" not found`);
            process.exit(1);
        }
        console.log(` Found product: ${product.name} (ID: ${product._id})`);
        if (product.image && product.image.includes('cloudinary.com')) {
            console.log('  Deleting main image from Cloudinary...');
            await (0, cloudinary_1.deleteFromCloudinary)(product.image);
        }
        if (product.images && product.images.length > 0) {
            console.log(`  Deleting ${product.images.length} additional images from Cloudinary...`);
            for (const img of product.images) {
                if (img.includes('cloudinary.com')) {
                    await (0, cloudinary_1.deleteFromCloudinary)(img);
                }
            }
        }
        await Product_1.default.findByIdAndDelete(product._id);
        console.log(` Product "${product.name}" deleted successfully`);
        process.exit(0);
    }
    catch (error) {
        console.error(' Error:', error.message);
        process.exit(1);
    }
}
deleteProductByName();
