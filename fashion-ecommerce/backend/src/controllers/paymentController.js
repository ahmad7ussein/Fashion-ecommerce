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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyCheckoutSession = exports.createCheckoutSession = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const stripe_1 = __importDefault(require("stripe"));
const Order_1 = __importDefault(require("../models/Order"));
const RevenueTransaction_1 = __importDefault(require("../models/RevenueTransaction"));
const env_1 = __importDefault(require("../config/env"));
const getStripeClient = () => {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
        return null;
    }
    return new stripe_1.default(secretKey);
};
const buildLineItems = (order) => {
    const lineItems = order.items.map((item) => ({
        price_data: {
            currency: "usd",
            product_data: {
                name: item.name || "Order Item",
            },
            unit_amount: Math.max(1, Math.round(Number(item.price) * 100)),
        },
        quantity: Math.max(1, Number(item.quantity) || 1),
    }));
    if (order.shipping && order.shipping > 0) {
        lineItems.push({
            price_data: {
                currency: "usd",
                product_data: {
                    name: "Shipping",
                },
                unit_amount: Math.max(1, Math.round(Number(order.shipping) * 100)),
            },
            quantity: 1,
        });
    }
    if (order.tax && order.tax > 0) {
        lineItems.push({
            price_data: {
                currency: "usd",
                product_data: {
                    name: "Tax",
                },
                unit_amount: Math.max(1, Math.round(Number(order.tax) * 100)),
            },
            quantity: 1,
        });
    }
    return lineItems;
};
const calculateOrderTotal = (order) => {
    const itemsTotal = order.items.reduce((sum, item) => {
        const price = Number(item.price) || 0;
        const qty = Math.max(1, Number(item.quantity) || 1);
        return sum + price * qty;
    }, 0);
    const tax = Number(order.tax) || 0;
    const shipping = Number(order.shipping) || 0;
    return itemsTotal + tax + shipping;
};
const createCheckoutSession = async (req, res) => {
    try {
        const stripe = getStripeClient();
        if (!stripe) {
            return res.status(500).json({
                success: false,
                message: "Stripe is not configured on the server",
            });
        }
        const { orderId } = req.body;
        if (!orderId || !mongoose_1.default.Types.ObjectId.isValid(orderId)) {
            return res.status(400).json({
                success: false,
                message: "Valid orderId is required",
            });
        }
        const order = await Order_1.default.findById(orderId).populate("user");
        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }
        if (req.user?.role !== "admin" && req.user?.role !== "employee") {
            if (!req.user?._id || order.user?._id?.toString() !== req.user._id.toString()) {
                return res.status(403).json({
                    success: false,
                    message: "Not authorized to pay for this order",
                });
            }
        }
        if (order.paymentInfo?.status === "completed") {
            return res.status(400).json({
                success: false,
                message: "Order is already paid",
            });
        }
        const calculatedTotal = calculateOrderTotal(order);
        if (calculatedTotal <= 0) {
            return res.status(400).json({
                success: false,
                message: "Order total is invalid",
            });
        }
        const lineItems = buildLineItems(order);
        const successUrl = `${env_1.default.frontendUrl || "http://localhost:3000"}/payment-success?session_id={CHECKOUT_SESSION_ID}`;
        const cancelUrl = `${env_1.default.frontendUrl || "http://localhost:3000"}/payment-cancel`;
        const session = await stripe.checkout.sessions.create({
            mode: "payment",
            payment_method_types: ["card"],
            line_items: lineItems,
            success_url: successUrl,
            cancel_url: cancelUrl,
            client_reference_id: order._id.toString(),
            metadata: {
                orderId: order._id.toString(),
                orderNumber: order.orderNumber || "",
            },
        });
        res.status(200).json({
            success: true,
            data: {
                url: session.url,
                sessionId: session.id,
            },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || "Server error",
        });
    }
};
exports.createCheckoutSession = createCheckoutSession;
const verifyCheckoutSession = async (req, res) => {
    try {
        const stripe = getStripeClient();
        if (!stripe) {
            return res.status(500).json({
                success: false,
                message: "Stripe is not configured on the server",
            });
        }
        const sessionId = String(req.query.session_id || "");
        if (!sessionId) {
            return res.status(400).json({
                success: false,
                message: "session_id is required",
            });
        }
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        if (!session) {
            return res.status(404).json({
                success: false,
                message: "Checkout session not found",
            });
        }
        if (session.payment_status !== "paid") {
            return res.status(400).json({
                success: false,
                message: "Payment not completed",
            });
        }
        const orderId = session.metadata?.orderId || session.client_reference_id;
        if (!orderId || !mongoose_1.default.Types.ObjectId.isValid(orderId)) {
            return res.status(400).json({
                success: false,
                message: "Order reference is missing from session",
            });
        }
        const order = await Order_1.default.findById(orderId).populate("user");
        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }
        if (req.user?.role !== "admin" && req.user?.role !== "employee") {
            if (!req.user?._id || order.user?._id?.toString() !== req.user._id.toString()) {
                return res.status(403).json({
                    success: false,
                    message: "Not authorized to verify this payment",
                });
            }
        }
        const expectedTotalCents = Math.round(calculateOrderTotal(order) * 100);
        if (session.amount_total && expectedTotalCents !== session.amount_total) {
            return res.status(400).json({
                success: false,
                message: "Payment amount does not match order total",
            });
        }
        const existingRevenue = await RevenueTransaction_1.default.findOne({ sessionId: session.id });
        if (!existingRevenue) {
            const amountPaid = (session.amount_total || 0) / 100;
            if (amountPaid > 0) {
                await RevenueTransaction_1.default.create({
                    order: order._id,
                    amount: amountPaid,
                    currency: session.currency || "usd",
                    paymentProvider: "stripe",
                    sessionId: session.id,
                    paymentIntentId: session.payment_intent || undefined,
                    paidAt: new Date(),
                });
            }
        }
        if (order.paymentInfo?.status !== "completed") {
            order.paymentInfo = {
                ...order.paymentInfo,
                method: "stripe",
                status: "completed",
                transactionId: session.payment_intent || session.id,
            };
            await order.save();
        }
        res.status(200).json({
            success: true,
            data: {
                orderId: order._id,
                orderNumber: order.orderNumber,
                alreadyVerified: Boolean(existingRevenue),
            },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || "Server error",
        });
    }
};
exports.verifyCheckoutSession = verifyCheckoutSession;
