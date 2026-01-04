"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const productSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: [true, 'Product name is required'],
        trim: true,
    },
    nameAr: {
        type: String,
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
    descriptionAr: {
        type: String,
        trim: true,
    },
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: [0, 'Price cannot be negative'],
    },
    image: {
        type: String,
        required: [true, 'Product image is required'],
    },
    images: [String],
    category: {
        type: String,
        required: [true, 'Category is required'],
        enum: ['T-Shirts', 'Hoodies', 'Sweatshirts', 'Pants', 'Shorts', 'Jackets', 'Tank Tops', 'Polo Shirts', 'Dresses', 'Blouses', 'Skirts', 'Jeans', 'Tops'],
    },
    gender: {
        type: String,
        required: [true, 'Gender is required'],
        enum: ['Men', 'Women', 'Unisex', 'Kids'],
    },
    season: {
        type: String,
        required: [true, 'Season is required'],
        enum: ['Summer', 'Winter', 'Spring', 'Fall', 'All Season'],
    },
    style: {
        type: String,
        required: [true, 'Style is required'],
        enum: ['Plain', 'Graphic', 'Embroidered', 'Printed', 'Vintage'],
    },
    occasion: {
        type: String,
        required: [true, 'Occasion is required'],
        enum: ['Casual', 'Formal', 'Sport', 'Classic', 'Streetwear'],
    },
    sizes: {
        type: [String],
        default: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    },
    colors: {
        type: [String],
        default: ['White', 'Black', 'Gray', 'Navy', 'Red'],
    },
    stock: {
        type: Number,
        default: 100,
        min: [0, 'Stock cannot be negative'],
    },
    featured: {
        type: Boolean,
        default: false,
    },
    active: {
        type: Boolean,
        default: true,
    },
    onSale: {
        type: Boolean,
        default: false,
    },
    salePercentage: {
        type: Number,
        min: [0, 'Sale percentage cannot be negative'],
        max: [100, 'Sale percentage cannot exceed 100'],
        default: 0,
    },
    newArrival: {
        type: Boolean,
        default: false,
    },
    inCollection: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});
productSchema.index({ active: 1, createdAt: -1 });
productSchema.index({ active: 1, gender: 1, createdAt: -1 });
productSchema.index({ active: 1, featured: 1, createdAt: -1 });
exports.default = mongoose_1.default.model('Product', productSchema);
