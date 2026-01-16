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
const cartSchema = new mongoose_1.Schema({
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: false,
    },
    guestSessionId: {
        type: String,
        required: false,
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
            baseProduct: mongoose_1.Schema.Types.Mixed,
            name: { type: String, required: true },
            price: { type: Number, required: true },
            quantity: { type: Number, required: true, min: 1 },
            size: { type: String, required: true },
            color: { type: String, required: true },
            image: { type: String, required: true },
            isCustom: { type: Boolean, default: false },
            designMetadata: mongoose_1.Schema.Types.Mixed,
            designKey: { type: String, trim: true },
            notes: { type: String, trim: true },
        },
    ],
    subtotal: {
        type: Number,
        default: 0,
    },
}, {
    timestamps: true,
});
cartSchema.index({ user: 1 }, { unique: true, sparse: true, partialFilterExpression: { user: { $exists: true } } });
cartSchema.index({ guestSessionId: 1 }, { unique: true, sparse: true, partialFilterExpression: { guestSessionId: { $exists: true } } });
cartSchema.pre('save', function (next) {
    this.subtotal = this.items.reduce((total, item) => {
        return total + item.price * item.quantity;
    }, 0);
    next();
});
exports.default = mongoose_1.default.model('Cart', cartSchema);
