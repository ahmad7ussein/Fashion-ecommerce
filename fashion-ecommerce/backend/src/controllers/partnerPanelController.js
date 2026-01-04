"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPartnerAnalyticsForUser = exports.updatePartnerProductForUser = exports.createPartnerProductForUser = exports.getPartnerStoreProductsForUser = exports.getPartnerStoreForUser = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const PartnerStore_1 = __importDefault(require("../models/PartnerStore"));
const PartnerProduct_1 = __importDefault(require("../models/PartnerProduct"));
const PartnerEvent_1 = __importDefault(require("../models/PartnerEvent"));
const isValidObjectId = (id) => !!id && mongoose_1.default.Types.ObjectId.isValid(id);
const getPartnerStoreForUser = async (req, res) => {
    try {
        const storeId = req.roleAssignment?.partnerStore;
        if (!storeId) {
            return res.status(404).json({ success: false, message: 'Partner store not assigned' });
        }
        const store = await PartnerStore_1.default.findById(storeId);
        if (!store) {
            return res.status(404).json({ success: false, message: 'Partner store not found' });
        }
        res.status(200).json({ success: true, data: store });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};
exports.getPartnerStoreForUser = getPartnerStoreForUser;
const getPartnerStoreProductsForUser = async (req, res) => {
    try {
        const storeId = req.roleAssignment?.partnerStore;
        if (!storeId) {
            return res.status(404).json({ success: false, message: 'Partner store not assigned' });
        }
        const products = await PartnerProduct_1.default.find({ partnerStore: storeId }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: products });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};
exports.getPartnerStoreProductsForUser = getPartnerStoreProductsForUser;
const createPartnerProductForUser = async (req, res) => {
    try {
        const storeId = req.roleAssignment?.partnerStore;
        if (!storeId) {
            return res.status(404).json({ success: false, message: 'Partner store not assigned' });
        }
        const { productData } = req.body;
        if (!productData?.name || !productData?.price || !productData?.image) {
            return res.status(400).json({ success: false, message: 'Missing required product data' });
        }
        const item = await PartnerProduct_1.default.create({
            partnerStore: storeId,
            productData,
            status: 'pending',
        });
        res.status(201).json({ success: true, data: item });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};
exports.createPartnerProductForUser = createPartnerProductForUser;
const updatePartnerProductForUser = async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({ success: false, message: 'Invalid partner product ID format' });
        }
        const storeId = req.roleAssignment?.partnerStore;
        if (!storeId) {
            return res.status(404).json({ success: false, message: 'Partner store not assigned' });
        }
        const item = await PartnerProduct_1.default.findOne({ _id: req.params.id, partnerStore: storeId });
        if (!item) {
            return res.status(404).json({ success: false, message: 'Partner product not found' });
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
exports.updatePartnerProductForUser = updatePartnerProductForUser;
const getPartnerAnalyticsForUser = async (req, res) => {
    try {
        const storeId = req.roleAssignment?.partnerStore;
        if (!storeId) {
            return res.status(404).json({ success: false, message: 'Partner store not assigned' });
        }
        const summary = await PartnerEvent_1.default.aggregate([
            { $match: { partnerStore: new mongoose_1.default.Types.ObjectId(storeId) } },
            {
                $group: {
                    _id: '$type',
                    count: { $sum: 1 },
                    revenue: { $sum: '$amount' },
                    commission: {
                        $sum: { $multiply: ['$amount', { $divide: ['$commissionRate', 100] }] },
                    },
                },
            },
        ]);
        const clicks = summary.find((s) => s._id === 'click')?.count || 0;
        const sales = summary.find((s) => s._id === 'sale')?.count || 0;
        const revenue = summary.find((s) => s._id === 'sale')?.revenue || 0;
        const commission = summary.find((s) => s._id === 'sale')?.commission || 0;
        res.status(200).json({
            success: true,
            data: {
                clicks,
                sales,
                revenue,
                earnedCommission: commission,
            },
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};
exports.getPartnerAnalyticsForUser = getPartnerAnalyticsForUser;
