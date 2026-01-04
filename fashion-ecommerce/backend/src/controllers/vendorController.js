"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getVendorReport = exports.getVendorOrders = exports.rejectVendorProduct = exports.approveVendorProduct = exports.updateVendorProduct = exports.createVendorProduct = exports.getVendorProducts = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const VendorProduct_1 = __importDefault(require("../models/VendorProduct"));
const Product_1 = __importDefault(require("../models/Product"));
const Order_1 = __importDefault(require("../models/Order"));
const isValidObjectId = (id) => !!id && mongoose_1.default.Types.ObjectId.isValid(id);
const getVendorProducts = async (req, res) => {
    try {
        const query = {};
        if (req.user?.role === 'admin') {
            if (req.query.all === 'true') {
            }
            else if (req.query.vendorUserId) {
                query.vendorUser = req.query.vendorUserId;
            }
            else {
                query.vendorUser = req.user?._id;
            }
        }
        else {
            query.vendorUser = req.user?._id;
        }
        const products = await VendorProduct_1.default.find(query).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: products });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};
exports.getVendorProducts = getVendorProducts;
const createVendorProduct = async (req, res) => {
    try {
        const { productData } = req.body;
        if (!productData?.name || !productData?.price || !productData?.image) {
            return res.status(400).json({ success: false, message: 'Missing required product data' });
        }
        const item = await VendorProduct_1.default.create({
            vendorUser: req.user?._id,
            productData,
            status: 'pending',
        });
        res.status(201).json({ success: true, data: item });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};
exports.createVendorProduct = createVendorProduct;
const updateVendorProduct = async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({ success: false, message: 'Invalid vendor product ID format' });
        }
        const item = await VendorProduct_1.default.findOne({
            _id: req.params.id,
            vendorUser: req.user?._id,
        });
        if (!item) {
            return res.status(404).json({ success: false, message: 'Vendor product not found' });
        }
        if (item.status === 'approved') {
            return res.status(400).json({ success: false, message: 'Approved products cannot be edited' });
        }
        item.productData = { ...item.productData, ...req.body.productData };
        await item.save();
        res.status(200).json({ success: true, data: item });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};
exports.updateVendorProduct = updateVendorProduct;
const approveVendorProduct = async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({ success: false, message: 'Invalid vendor product ID format' });
        }
        const item = await VendorProduct_1.default.findById(req.params.id);
        if (!item) {
            return res.status(404).json({ success: false, message: 'Vendor product not found' });
        }
        if (item.status === 'approved' && item.publishedProductId) {
            return res.status(200).json({ success: true, data: item });
        }
        const createdProduct = await Product_1.default.create({
            ...item.productData,
            active: true,
            featured: false,
            onSale: false,
            salePercentage: 0,
            newArrival: false,
            inCollection: false,
        });
        item.status = 'approved';
        item.reviewNotes = req.body.reviewNotes;
        item.reviewedBy = req.user?._id;
        item.reviewedAt = new Date();
        item.publishedProductId = createdProduct._id;
        await item.save();
        res.status(200).json({ success: true, data: item });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};
exports.approveVendorProduct = approveVendorProduct;
const rejectVendorProduct = async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({ success: false, message: 'Invalid vendor product ID format' });
        }
        const item = await VendorProduct_1.default.findByIdAndUpdate(req.params.id, {
            status: 'rejected',
            reviewNotes: req.body.reviewNotes,
            reviewedBy: req.user?._id,
            reviewedAt: new Date(),
        }, { new: true });
        if (!item) {
            return res.status(404).json({ success: false, message: 'Vendor product not found' });
        }
        res.status(200).json({ success: true, data: item });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};
exports.rejectVendorProduct = rejectVendorProduct;
const getVendorOrders = async (req, res) => {
    try {
        const vendorProducts = await VendorProduct_1.default.find({
            vendorUser: req.user?._id,
            status: 'approved',
            publishedProductId: { $exists: true, $ne: null },
        }).select('publishedProductId');
        const productIds = vendorProducts
            .map((item) => item.publishedProductId)
            .filter((id) => id);
        if (productIds.length === 0) {
            return res.status(200).json({ success: true, data: { orders: [], totalSales: 0, revenue: 0 } });
        }
        const orders = await Order_1.default.find({ 'items.product': { $in: productIds } })
            .sort({ createdAt: -1 })
            .limit(50);
        const summary = await Order_1.default.aggregate([
            { $unwind: '$items' },
            { $match: { 'items.product': { $in: productIds }, 'paymentInfo.status': 'completed' } },
            {
                $group: {
                    _id: null,
                    totalSales: { $sum: '$items.quantity' },
                    revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
                },
            },
        ]);
        res.status(200).json({
            success: true,
            data: {
                orders,
                totalSales: summary[0]?.totalSales || 0,
                revenue: summary[0]?.revenue || 0,
            },
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};
exports.getVendorOrders = getVendorOrders;
const getVendorReport = async (req, res) => {
    try {
        const vendorProducts = await VendorProduct_1.default.find({
            vendorUser: req.user?._id,
            status: 'approved',
            publishedProductId: { $exists: true, $ne: null },
        }).select('publishedProductId');
        const productIds = vendorProducts
            .map((item) => item.publishedProductId)
            .filter((id) => id);
        let totalSales = 0;
        let revenue = 0;
        if (productIds.length > 0) {
            const summary = await Order_1.default.aggregate([
                { $unwind: '$items' },
                { $match: { 'items.product': { $in: productIds }, 'paymentInfo.status': 'completed' } },
                {
                    $group: {
                        _id: null,
                        totalSales: { $sum: '$items.quantity' },
                        revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
                    },
                },
            ]);
            totalSales = summary[0]?.totalSales || 0;
            revenue = summary[0]?.revenue || 0;
        }
        res.status(200).json({
            success: true,
            data: {
                totalSales,
                revenue,
            },
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};
exports.getVendorReport = getVendorReport;
