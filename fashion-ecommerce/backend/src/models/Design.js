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
const ratioObjectSchema = new mongoose_1.Schema({
    id: { type: String },
    type: { type: String },
    text: { type: String },
    src: { type: String },
    left: { type: Number },
    top: { type: Number },
    width: { type: Number },
    height: { type: Number },
    angle: { type: Number },
    opacity: { type: Number },
    fill: { type: String },
    fontSize: { type: Number },
    fontFamily: { type: String },
    fontWeight: { type: String },
    textAlign: { type: String },
}, { _id: false });
const designViewSchema = new mongoose_1.Schema({
    view: { type: String, enum: ['front', 'chest', 'back'], required: true },
    colorKey: { type: String, required: true },
    canvasJson: mongoose_1.Schema.Types.Mixed,
    ratioState: {
        area: {
            x: { type: Number },
            y: { type: Number },
            width: { type: Number },
            height: { type: Number },
        },
        objects: { type: [ratioObjectSchema], default: [] },
    },
    previewSize: {
        width: { type: Number },
        height: { type: Number },
    },
    updatedAt: { type: Date, default: Date.now },
}, { _id: false });
const designSchema = new mongoose_1.Schema({
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    name: {
        type: String,
        required: [true, 'Design name is required'],
        trim: true,
    },
    baseProduct: {
        type: {
            type: String,
            required: true,
            default: 't-shirt',
        },
        color: {
            type: String,
            required: true,
            default: 'white',
        },
        size: {
            type: String,
            required: true,
            default: 'M',
        },
    },
    baseProductId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'StudioProduct',
    },
    productId: { type: String },
    variantId: { type: String },
    colorKey: { type: String },
    colorName: { type: String },
    elements: [
        {
            id: { type: String, required: true },
            type: {
                type: String,
                enum: ['text', 'image'],
                required: true,
            },
            content: { type: String, required: true },
            x: { type: Number, required: true },
            y: { type: Number, required: true },
            width: { type: Number, required: true },
            height: { type: Number, required: true },
            rotation: { type: Number, default: 0 },
            fontSize: Number,
            fontFamily: String,
            color: String,
            fontWeight: String,
        },
    ],
    views: { type: [designViewSchema], default: [] },
    thumbnail: String,
    previewFrontUrl: String,
    previewBackUrl: String,
    baseFrontUrl: String,
    baseBackUrl: String,
    designImageURL: String,
    designMetadata: mongoose_1.Schema.Types.Mixed,
    userDescription: { type: String, trim: true },
    price: {
        type: Number,
        default: 39.99,
    },
    status: {
        type: String,
        enum: ['draft', 'published', 'archived'],
        default: 'draft',
    },
    type: {
        type: String,
        enum: ['manual', 'ai-enhanced'],
        default: 'manual',
    },
    sourceDesign: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Design',
    },
    aiModelUsed: { type: String },
    promptUsed: { type: String },
}, {
    timestamps: true,
});
exports.default = mongoose_1.default.model('Design', designSchema);
