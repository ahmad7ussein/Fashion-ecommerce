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
exports.getOrderStats = exports.deleteOrder = exports.updatePaymentStatus = exports.updateOrderStatus = exports.getAllOrders = exports.getOrder = exports.getMyOrders = exports.createOrder = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Order_1 = __importDefault(require("../models/Order"));
const User_1 = __importDefault(require("../models/User"));
const Notification_1 = __importDefault(require("../models/Notification"));
const employeeActivityController_1 = require("./employeeActivityController");
const createOrder = async (req, res) => {
    const session = await mongoose_1.default.startSession();
    try {
        console.log('dY"İ Creating order:', {
            userId: req.user?._id?.toString(),
            itemsCount: req.body.items?.length,
            hasShippingAddress: !!req.body.shippingAddress,
            hasPaymentInfo: !!req.body.paymentInfo,
        });
        const { items, shippingAddress, paymentInfo } = req.body;
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Order must have at least one item',
            });
        }
        if (!shippingAddress) {
            return res.status(400).json({
                success: false,
                message: 'Shipping address is required',
            });
        }
        if (!req.user?._id) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated',
            });
        }
        const Product = (await Promise.resolve().then(() => __importStar(require('../models/Product')))).default;
        const StudioProduct = (await Promise.resolve().then(() => __importStar(require('../models/StudioProduct')))).default;
        const Design = (await Promise.resolve().then(() => __importStar(require('../models/Design')))).default;
        let createdOrder = null;
        await session.withTransaction(async () => {
            const validatedItems = [];
            let subtotal = 0;
            for (const item of items) {
                const productId = item.product;
                const designId = item.design;
                const quantity = Math.max(1, Number(item.quantity) || 0);
                if (!productId && !designId) {
                    throw Object.assign(new Error('Item must include product or design'), { statusCode: 400 });
                }
                if (productId && !mongoose_1.default.Types.ObjectId.isValid(productId)) {
                    throw Object.assign(new Error('Invalid product id'), { statusCode: 400 });
                }
                if (designId && !mongoose_1.default.Types.ObjectId.isValid(designId)) {
                    throw Object.assign(new Error('Invalid design id'), { statusCode: 400 });
                }
                const itemNotes = typeof item.notes === 'string' && item.notes.trim()
                    ? item.notes.trim().slice(0, 1000)
                    : undefined;
                if (designId) {
                    const design = await Design.findById(designId).session(session);
                    if (!design) {
                        throw Object.assign(new Error(`Design not found: ${designId}`), { statusCode: 404 });
                    }
                    if (design.user.toString() !== (req.user?._id).toString()) {
                        throw Object.assign(new Error('Not authorized to order this design'), { statusCode: 403 });
                    }
                    const studioProduct = design.baseProductId
                        ? await StudioProduct.findOne({ _id: design.baseProductId, active: true }).session(session)
                        : null;
                    if (!studioProduct) {
                        throw Object.assign(new Error('Base studio product unavailable'), { statusCode: 404 });
                    }
                    const unitPrice = studioProduct.price;
                    subtotal += unitPrice * quantity;
                    validatedItems.push({
                        design: design._id,
                        product: undefined,
                        name: design.name,
                        price: unitPrice,
                        quantity,
                        size: item.size || design.baseProduct.size,
                        color: item.color || design.baseProduct.color,
                        image: item.image || design.thumbnail || design.designImageURL || studioProduct.baseMockupUrl,
                        isCustom: true,
                        designMetadata: design.designMetadata || item.designMetadata,
                        designImageURL: design.designImageURL || item.image,
                        baseProductId: studioProduct._id,
                        notes: itemNotes,
                    });
                }
                else if (productId) {
                    const product = await Product.findById(productId).session(session);
                    if (!product) {
                        throw Object.assign(new Error(`Product not found: ${productId}`), { statusCode: 404 });
                    }
                    if (product.stock < quantity) {
                        throw Object.assign(new Error(`Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${quantity}`), { statusCode: 400 });
                    }
                    const unitPrice = product.price;
                    subtotal += unitPrice * quantity;
                    validatedItems.push({
                        product: product._id,
                        name: item.name || product.name,
                        price: unitPrice,
                        quantity,
                        size: item.size,
                        color: item.color,
                        image: item.image || product.image,
                        isCustom: item.isCustom || false,
                        designMetadata: item.isCustom ? item.designMetadata : undefined,
                        designImageURL: item.isCustom ? item.image : undefined,
                        notes: itemNotes,
                    });
                }
            }
            const sanitizedTax = Math.max(Number(req.body.tax) || 0, 0);
            const sanitizedShipping = Math.max(Number(req.body.shipping) || 0, 0);
            const total = subtotal + sanitizedTax + sanitizedShipping;
            for (const item of validatedItems) {
                if (item.product) {
                    const stockUpdate = await Product.updateOne({ _id: item.product, stock: { $gte: item.quantity } }, { $inc: { stock: -item.quantity } }).session(session);
                    if (stockUpdate.modifiedCount === 0) {
                        throw Object.assign(new Error(`Insufficient stock for product ${item.product}`), { statusCode: 409 });
                    }
                }
            }
            const orderDocs = await Order_1.default.create([
                {
                    user: req.user._id,
                    items: validatedItems,
                    shippingAddress,
                    paymentInfo: paymentInfo || { method: 'card', status: 'pending' },
                    subtotal,
                    tax: sanitizedTax,
                    shipping: sanitizedShipping,
                    total,
                },
            ], { session });
            createdOrder = orderDocs[0];
        });
        console.log('ƒo. Order created successfully:', {
            orderId: createdOrder._id,
            orderNumber: createdOrder.orderNumber,
            total: createdOrder.total,
        });
        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            data: createdOrder,
        });
    }
    catch (error) {
        const status = error?.statusCode || 500;
        console.error('ƒ?O Error creating order:', error);
        res.status(status).json({
            success: false,
            message: error.message || 'Server error',
            ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
        });
    }
    finally {
        session.endSession();
    }
};
exports.createOrder = createOrder;
const getMyOrders = async (req, res) => {
    try {
        if (mongoose_1.default.connection.readyState !== 1) {
            return res.status(503).json({
                success: false,
                message: 'Database connection not available. Please try again later.',
            });
        }
        const orders = await Order_1.default.find({ user: req.user?._id })
            .sort({ createdAt: -1 })
            .allowDiskUse(true)
            .maxTimeMS(20000)
            .populate('items.product', 'name image')
            .populate('items.design', 'name thumbnail');
        res.status(200).json({
            success: true,
            count: orders.length,
            data: orders,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
};
exports.getMyOrders = getMyOrders;
const getOrder = async (req, res) => {
    try {
        if (mongoose_1.default.connection.readyState !== 1) {
            return res.status(503).json({
                success: false,
                message: 'Database connection not available. Please try again later.',
            });
        }
        if (!req.params.id || !req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid order ID format',
            });
        }
        const order = await Order_1.default.findById(req.params.id)
            .maxTimeMS(20000)
            .populate('user', 'firstName lastName email')
            .populate('items.product', 'name image')
            .populate('items.design', 'name thumbnail');
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found',
            });
        }
        if (order.user._id.toString() !== req.user?._id?.toString() &&
            req.user?.role !== 'admin' &&
            req.user?.role !== 'employee') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to access this order',
            });
        }
        res.status(200).json({
            success: true,
            data: order,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
};
exports.getOrder = getOrder;
const getAllOrders = async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        const query = {};
        if (status && status !== 'all') {
            query.status = status;
        }
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        if (mongoose_1.default.connection.readyState !== 1) {
            return res.status(503).json({
                success: false,
                message: 'Database connection not available. Please try again later.',
            });
        }
        const customerUsers = await User_1.default.find({ role: 'customer' }).select('_id').maxTimeMS(20000);
        const customerIds = customerUsers.map(u => u._id);
        query.user = { $in: customerIds };
        const orders = await Order_1.default.find(query)
            .sort({ createdAt: -1 })
            .allowDiskUse(true)
            .maxTimeMS(20000)
            .skip(skip)
            .limit(limitNum)
            .populate('user', 'firstName lastName email role');
        const total = await Order_1.default.countDocuments(query).maxTimeMS(20000);
        res.status(200).json({
            success: true,
            count: orders.length,
            total,
            page: pageNum,
            pages: Math.ceil(total / limitNum),
            data: orders,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
};
exports.getAllOrders = getAllOrders;
const updateOrderStatus = async (req, res) => {
    try {
        const { status, trackingNumber, carrier, estimatedDelivery, location, note } = req.body;
        const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
            });
        }
        if (!req.params.id || !req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid order ID format',
            });
        }
        if (mongoose_1.default.connection.readyState !== 1) {
            return res.status(503).json({
                success: false,
                message: 'Database connection not available. Please try again later.',
            });
        }
        const order = await Order_1.default.findById(req.params.id).maxTimeMS(20000).populate('user');
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found',
            });
        }
        const oldStatus = order.status;
        if (status) {
            order.status = status;
        }
        if (trackingNumber) {
            order.trackingNumber = trackingNumber;
        }
        if (carrier) {
            order.carrier = carrier;
        }
        if (estimatedDelivery) {
            order.estimatedDelivery = new Date(estimatedDelivery);
        }
        if (status && status !== oldStatus) {
            if (!order.trackingHistory) {
                order.trackingHistory = [];
            }
            order.trackingHistory.push({
                status: status,
                location: location || undefined,
                note: note || undefined,
                updatedBy: req.user?._id,
                updatedAt: new Date(),
            });
        }
        // إضافة هذا الشرط لتحديث حالة الدفع عند الشحن
        if (status === 'shipped') {
            order.paymentInfo.status = 'completed';
        }
        await order.save();
        if (req.user?._id && (req.user.role === 'admin' || req.user.role === 'employee')) {
            await (0, employeeActivityController_1.logEmployeeActivity)(req.user._id, 'order_updated', `Updated order ${order.orderNumber} status from ${oldStatus} to ${status}`, 'Order', order._id, { orderNumber: order.orderNumber, oldStatus, newStatus: status, trackingNumber, carrier });
        }
        if (status && status !== oldStatus && order.user) {
            const statusMessages = {
                processing: {
                    title: 'Order Processing',
                    message: `Your order ${order.orderNumber} is now being processed.`,
                    type: 'order_status',
                },
                shipped: {
                    title: 'Order Shipped',
                    message: `Your order ${order.orderNumber} has been shipped!${trackingNumber ? ` Tracking: ${trackingNumber}` : ''}`,
                    type: 'order_shipped',
                },
                delivered: {
                    title: 'Order Delivered',
                    message: `Your order ${order.orderNumber} has been delivered!`,
                    type: 'order_delivered',
                },
                cancelled: {
                    title: 'Order Cancelled',
                    message: `Your order ${order.orderNumber} has been cancelled.`,
                    type: 'order_cancelled',
                },
            };
            const notificationData = statusMessages[status];
            if (notificationData) {
                await Notification_1.default.create({
                    user: order.user,
                    type: notificationData.type,
                    title: notificationData.title,
                    message: notificationData.message,
                    order: order._id,
                    read: false,
                });
            }
        }
        res.status(200).json({
            success: true,
            message: 'Order status updated successfully',
            data: order,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
};
exports.updateOrderStatus = updateOrderStatus;
const updatePaymentStatus = async (req, res) => {
    try {
        if (mongoose_1.default.connection.readyState !== 1) {
            return res.status(503).json({
                success: false,
                message: 'Database connection not available. Please try again later.',
            });
        }
        const { status, transactionId } = req.body;
        const validPaymentStatuses = ['pending', 'completed', 'failed', 'refunded'];
        if (status && !validPaymentStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid payment status. Must be one of: ${validPaymentStatuses.join(', ')}`,
            });
        }
        if (!req.params.id || !req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid order ID format',
            });
        }
        const order = await Order_1.default.findById(req.params.id).maxTimeMS(20000);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found',
            });
        }
        if (status) {
            order.paymentInfo.status = status;
        }
        if (transactionId) {
            order.paymentInfo.transactionId = transactionId;
        }
        await order.save();
        res.status(200).json({
            success: true,
            message: 'Payment status updated successfully',
            data: order,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
};
exports.updatePaymentStatus = updatePaymentStatus;
const deleteOrder = async (req, res) => {
    try {
        if (!req.params.id || !req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid order ID format',
            });
        }
        if (mongoose_1.default.connection.readyState !== 1) {
            return res.status(503).json({
                success: false,
                message: 'Database connection not available. Please try again later.',
            });
        }
        const order = await Order_1.default.findById(req.params.id).maxTimeMS(20000);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found',
            });
        }
        await Order_1.default.findByIdAndDelete(req.params.id).maxTimeMS(20000);
        res.status(200).json({
            success: true,
            message: 'Order deleted successfully',
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
};
exports.deleteOrder = deleteOrder;
const getOrderStats = async (req, res) => {
    try {
        if (mongoose_1.default.connection.readyState !== 1) {
            return res.status(503).json({
                success: false,
                message: 'Database connection not available. Please try again later.',
            });
        }
        const totalOrders = await Order_1.default.countDocuments().maxTimeMS(20000);
        const pendingOrders = await Order_1.default.countDocuments({ status: 'pending' }).maxTimeMS(20000);
        const processingOrders = await Order_1.default.countDocuments({ status: 'processing' }).maxTimeMS(20000);
        const shippedOrders = await Order_1.default.countDocuments({ status: 'shipped' }).maxTimeMS(20000);
        const deliveredOrders = await Order_1.default.countDocuments({ status: 'delivered' }).maxTimeMS(20000);
        const totalRevenue = await Order_1.default.aggregate([
            { $match: { 'paymentInfo.status': 'completed' } },
            { $group: { _id: null, total: { $sum: '$total' } } },
        ]).maxTimeMS(20000);
        res.status(200).json({
            success: true,
            data: {
                totalOrders,
                pendingOrders,
                processingOrders,
                shippedOrders,
                deliveredOrders,
                totalRevenue: totalRevenue[0]?.total || 0,
            },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
};
exports.getOrderStats = getOrderStats;
