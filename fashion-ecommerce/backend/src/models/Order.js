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
const orderSchema = new mongoose_1.Schema({
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    orderNumber: {
        type: String,
        required: false,
        unique: true,
        sparse: true,
    },
    items: [
        {
            product: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: 'Product',
            },
            design: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: 'Design',
            },
            baseProductId: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: 'StudioProduct',
            },
            name: { type: String, required: true },
            price: { type: Number, required: true },
            quantity: { type: Number, required: true, min: 1 },
            size: { type: String, required: true },
            color: { type: String, required: true },
            image: { type: String, required: true },
            isCustom: { type: Boolean, default: false },
            designMetadata: mongoose_1.Schema.Types.Mixed,
            designImageURL: String,
        },
    ],
    shippingAddress: {
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        email: { type: String, required: true },
        phone: { type: String, required: true },
        street: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        zip: { type: String, required: true },
        country: { type: String, required: true },
    },
    paymentInfo: {
        method: { type: String, default: 'card' },
        status: {
            type: String,
            enum: ['pending', 'completed', 'failed', 'refunded'],
            default: 'pending',
        },
        transactionId: String,
    },
    subtotal: {
        type: Number,
        required: true,
    },
    tax: {
        type: Number,
        default: 0,
    },
    shipping: {
        type: Number,
        default: 0,
    },
    total: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
        default: 'pending',
    },
    trackingNumber: String,
    trackingHistory: [{
            status: { type: String, required: true },
            location: String,
            note: String,
            updatedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
            updatedAt: { type: Date, default: Date.now },
        }],
    carrier: String,
    estimatedDelivery: Date,
    notes: String,
}, {
    timestamps: true,
});
orderSchema.pre('save', async function (next) {
    if (!this.orderNumber || this.orderNumber === '') {
        try {
            const timestamp = Date.now();
            const randomStr = Math.random().toString(36).substring(2, 11).toUpperCase();
            this.orderNumber = `ORD-${timestamp}-${randomStr}`;
            let attempts = 0;
            while (attempts < 5) {
                const existing = await mongoose_1.default.model('Order').findOne({ orderNumber: this.orderNumber });
                if (!existing) {
                    break;
                }
                const newTimestamp = Date.now();
                const newRandomStr = Math.random().toString(36).substring(2, 11).toUpperCase();
                this.orderNumber = `ORD-${newTimestamp}-${newRandomStr}`;
                attempts++;
            }
            console.log('📝 Generated order number:', this.orderNumber);
        }
        catch (error) {
            console.error('❌ Error generating order number:', error);
            this.orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 11).toUpperCase()}`;
        }
    }
    next();
});
exports.default = mongoose_1.default.model('Order', orderSchema);
