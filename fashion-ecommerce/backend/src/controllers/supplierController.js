"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rejectSupplierProduct = exports.approveSupplierProduct = exports.createSupplierProduct = exports.getSupplierProducts = exports.getSupplierAnalytics = exports.updateSupplierStatus = exports.updateSupplier = exports.createSupplier = exports.getSuppliers = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Supplier_1 = __importDefault(require("../models/Supplier"));
const SupplierProduct_1 = __importDefault(require("../models/SupplierProduct"));
const Product_1 = __importDefault(require("../models/Product"));
const Order_1 = __importDefault(require("../models/Order"));
const isValidObjectId = (id) => !!id && mongoose_1.default.Types.ObjectId.isValid(id);
const getSuppliers = async (_req, res) => {
    try {
        const suppliers = await Supplier_1.default.find().sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            data: suppliers,
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};
exports.getSuppliers = getSuppliers;
const createSupplier = async (req, res) => {
    try {
        const { name, contactEmail, contactPhone, commissionRate, deliveryTime, returnPolicy } = req.body;
        if (!name) {
            return res.status(400).json({ success: false, message: 'Supplier name is required' });
        }
        const supplier = await Supplier_1.default.create({
            name,
            contactEmail,
            contactPhone,
            commissionRate,
            deliveryTime,
            returnPolicy,
            createdBy: req.user?._id,
        });
        res.status(201).json({ success: true, data: supplier });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};
exports.createSupplier = createSupplier;
const updateSupplier = async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({ success: false, message: 'Invalid supplier ID format' });
        }
        const supplier = await Supplier_1.default.findByIdAndUpdate(req.params.id, {
            name: req.body.name,
            contactEmail: req.body.contactEmail,
            contactPhone: req.body.contactPhone,
            commissionRate: req.body.commissionRate,
            deliveryTime: req.body.deliveryTime,
            returnPolicy: req.body.returnPolicy,
            ratingAverage: req.body.ratingAverage,
            ratingCount: req.body.ratingCount,
        }, { new: true, runValidators: true });
        if (!supplier) {
            return res.status(404).json({ success: false, message: 'Supplier not found' });
        }
        res.status(200).json({ success: true, data: supplier });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};
exports.updateSupplier = updateSupplier;
const updateSupplierStatus = async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({ success: false, message: 'Invalid supplier ID format' });
        }
        const supplier = await Supplier_1.default.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true, runValidators: true });
        if (!supplier) {
            return res.status(404).json({ success: false, message: 'Supplier not found' });
        }
        res.status(200).json({ success: true, data: supplier });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};
exports.updateSupplierStatus = updateSupplierStatus;
const getSupplierAnalytics = async (req, res) => {
    try {
        const supplierId = req.params.id;
        if (!isValidObjectId(supplierId)) {
            return res.status(400).json({ success: false, message: 'Invalid supplier ID format' });
        }
        const supplier = await Supplier_1.default.findById(supplierId);
        if (!supplier) {
            return res.status(404).json({ success: false, message: 'Supplier not found' });
        }
        const supplierProducts = await SupplierProduct_1.default.find({
            supplier: supplierId,
            status: 'approved',
            publishedProductId: { $exists: true, $ne: null },
        }).select('publishedProductId');
        const productIds = supplierProducts
            .map((item) => item.publishedProductId)
            .filter((id) => id);
        let totalSales = 0;
        let revenue = 0;
        if (productIds.length > 0) {
            const salesData = await Order_1.default.aggregate([
                { $unwind: '$items' },
                {
                    $match: {
                        'items.product': { $in: productIds },
                        'paymentInfo.status': 'completed',
                    },
                },
                {
                    $group: {
                        _id: null,
                        totalSales: { $sum: '$items.quantity' },
                        revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
                    },
                },
            ]);
            totalSales = salesData[0]?.totalSales || 0;
            revenue = salesData[0]?.revenue || 0;
        }
        res.status(200).json({
            success: true,
            data: {
                totalSales,
                revenue,
                ratings: {
                    average: supplier.ratingAverage,
                    count: supplier.ratingCount,
                },
            },
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};
exports.getSupplierAnalytics = getSupplierAnalytics;
const getSupplierProducts = async (req, res) => {
    try {
        const { status, supplierId } = req.query;
        const query = {};
        if (status)
            query.status = status;
        if (supplierId)
            query.supplier = supplierId;
        const items = await SupplierProduct_1.default.find(query)
            .populate('supplier', 'name')
            .sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: items });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};
exports.getSupplierProducts = getSupplierProducts;
const createSupplierProduct = async (req, res) => {
    try {
        const { supplierId, productData } = req.body;
        if (!isValidObjectId(supplierId)) {
            return res.status(400).json({ success: false, message: 'Invalid supplier ID format' });
        }
        const supplier = await Supplier_1.default.findById(supplierId);
        if (!supplier) {
            return res.status(404).json({ success: false, message: 'Supplier not found' });
        }
        if (!productData?.name || !productData?.price || !productData?.image) {
            return res.status(400).json({ success: false, message: 'Missing required product data' });
        }
        const item = await SupplierProduct_1.default.create({
            supplier: supplierId,
            productData,
            status: 'pending',
        });
        res.status(201).json({ success: true, data: item });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};
exports.createSupplierProduct = createSupplierProduct;
const approveSupplierProduct = async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({ success: false, message: 'Invalid supplier product ID format' });
        }
        const item = await SupplierProduct_1.default.findById(req.params.id);
        if (!item) {
            return res.status(404).json({ success: false, message: 'Supplier product not found' });
        }
        if (item.status === 'approved' && item.publishedProductId) {
            return res.status(200).json({ success: true, data: item });
        }
        const createdProduct = await Product_1.default.create({
            ...item.productData,
            active: true,
            featured: item.productData.featured || false,
            onSale: item.productData.onSale || false,
            salePercentage: item.productData.salePercentage || 0,
            newArrival: item.productData.newArrival || false,
            inCollection: item.productData.inCollection || false,
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
exports.approveSupplierProduct = approveSupplierProduct;
const rejectSupplierProduct = async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({ success: false, message: 'Invalid supplier product ID format' });
        }
        const item = await SupplierProduct_1.default.findByIdAndUpdate(req.params.id, {
            status: 'rejected',
            reviewNotes: req.body.reviewNotes,
            reviewedBy: req.user?._id,
            reviewedAt: new Date(),
        }, { new: true });
        if (!item) {
            return res.status(404).json({ success: false, message: 'Supplier product not found' });
        }
        res.status(200).json({ success: true, data: item });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};
exports.rejectSupplierProduct = rejectSupplierProduct;
