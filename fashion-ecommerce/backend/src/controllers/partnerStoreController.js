"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPartnerAnalytics = exports.trackPartnerSale = exports.trackPartnerClick = exports.rejectPartnerProduct = exports.approvePartnerProduct = exports.createPartnerProduct = exports.getPartnerProducts = exports.updatePartnerStoreStatus = exports.updatePartnerStore = exports.createPartnerStore = exports.getPartnerStores = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const PartnerStore_1 = __importDefault(require("../models/PartnerStore"));
const PartnerProduct_1 = __importDefault(require("../models/PartnerProduct"));
const PartnerEvent_1 = __importDefault(require("../models/PartnerEvent"));
const isValidObjectId = (id) => !!id && mongoose_1.default.Types.ObjectId.isValid(id);
const getPartnerStores = async (_req, res) => {
    try {
        const stores = await PartnerStore_1.default.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: stores });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};
exports.getPartnerStores = getPartnerStores;
const createPartnerStore = async (req, res) => {
    try {
        const { name, slug, website, defaultCommissionRate, status, contactEmail, contactPhone, description } = req.body;
        if (!name || !slug) {
            return res.status(400).json({ success: false, message: 'Name and slug are required' });
        }
        const store = await PartnerStore_1.default.create({
            name,
            slug,
            website,
            defaultCommissionRate,
            status,
            contactEmail,
            contactPhone,
            description,
        });
        res.status(201).json({ success: true, data: store });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};
exports.createPartnerStore = createPartnerStore;
const updatePartnerStore = async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({ success: false, message: 'Invalid partner store ID format' });
        }
        const store = await PartnerStore_1.default.findByIdAndUpdate(req.params.id, {
            name: req.body.name,
            slug: req.body.slug,
            website: req.body.website,
            defaultCommissionRate: req.body.defaultCommissionRate,
            status: req.body.status,
            contactEmail: req.body.contactEmail,
            contactPhone: req.body.contactPhone,
            description: req.body.description,
        }, { new: true, runValidators: true });
        if (!store) {
            return res.status(404).json({ success: false, message: 'Partner store not found' });
        }
        res.status(200).json({ success: true, data: store });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};
exports.updatePartnerStore = updatePartnerStore;
const updatePartnerStoreStatus = async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({ success: false, message: 'Invalid partner store ID format' });
        }
        const store = await PartnerStore_1.default.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true, runValidators: true });
        if (!store) {
            return res.status(404).json({ success: false, message: 'Partner store not found' });
        }
        res.status(200).json({ success: true, data: store });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};
exports.updatePartnerStoreStatus = updatePartnerStoreStatus;
const getPartnerProducts = async (req, res) => {
    try {
        const { status, storeId } = req.query;
        const query = {};
        if (status)
            query.status = status;
        if (storeId)
            query.partnerStore = storeId;
        const products = await PartnerProduct_1.default.find(query)
            .populate('partnerStore', 'name slug')
            .sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: products });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};
exports.getPartnerProducts = getPartnerProducts;
const createPartnerProduct = async (req, res) => {
    try {
        const { partnerStoreId, productData } = req.body;
        if (!isValidObjectId(partnerStoreId)) {
            return res.status(400).json({ success: false, message: 'Invalid partner store ID format' });
        }
        const store = await PartnerStore_1.default.findById(partnerStoreId);
        if (!store) {
            return res.status(404).json({ success: false, message: 'Partner store not found' });
        }
        if (!productData?.name || !productData?.price || !productData?.image) {
            return res.status(400).json({ success: false, message: 'Missing required product data' });
        }
        const item = await PartnerProduct_1.default.create({
            partnerStore: partnerStoreId,
            productData,
            status: 'pending',
        });
        res.status(201).json({ success: true, data: item });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};
exports.createPartnerProduct = createPartnerProduct;
const approvePartnerProduct = async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({ success: false, message: 'Invalid partner product ID format' });
        }
        const item = await PartnerProduct_1.default.findByIdAndUpdate(req.params.id, {
            status: 'approved',
            reviewNotes: req.body.reviewNotes,
            reviewedBy: req.user?._id,
            reviewedAt: new Date(),
        }, { new: true });
        if (!item) {
            return res.status(404).json({ success: false, message: 'Partner product not found' });
        }
        res.status(200).json({ success: true, data: item });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};
exports.approvePartnerProduct = approvePartnerProduct;
const rejectPartnerProduct = async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({ success: false, message: 'Invalid partner product ID format' });
        }
        const item = await PartnerProduct_1.default.findByIdAndUpdate(req.params.id, {
            status: 'rejected',
            reviewNotes: req.body.reviewNotes,
            reviewedBy: req.user?._id,
            reviewedAt: new Date(),
        }, { new: true });
        if (!item) {
            return res.status(404).json({ success: false, message: 'Partner product not found' });
        }
        res.status(200).json({ success: true, data: item });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};
exports.rejectPartnerProduct = rejectPartnerProduct;
const trackPartnerClick = async (req, res) => {
    try {
        const storeId = req.params.id;
        if (!isValidObjectId(storeId)) {
            return res.status(400).json({ success: false, message: 'Invalid partner store ID format' });
        }
        const event = await PartnerEvent_1.default.create({
            partnerStore: storeId,
            partnerProduct: req.body.partnerProductId,
            type: 'click',
            amount: 0,
            commissionRate: 0,
        });
        res.status(201).json({ success: true, data: event });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};
exports.trackPartnerClick = trackPartnerClick;
const trackPartnerSale = async (req, res) => {
    try {
        const storeId = req.params.id;
        if (!isValidObjectId(storeId)) {
            return res.status(400).json({ success: false, message: 'Invalid partner store ID format' });
        }
        const store = await PartnerStore_1.default.findById(storeId);
        if (!store) {
            return res.status(404).json({ success: false, message: 'Partner store not found' });
        }
        const amount = Number(req.body.amount || 0);
        const partnerProductId = req.body.partnerProductId;
        let commissionRate = store.defaultCommissionRate || 0;
        if (partnerProductId && isValidObjectId(partnerProductId)) {
            const product = await PartnerProduct_1.default.findById(partnerProductId);
            if (product?.productData?.commissionRate !== undefined) {
                commissionRate = product.productData.commissionRate || 0;
            }
        }
        const event = await PartnerEvent_1.default.create({
            partnerStore: storeId,
            partnerProduct: partnerProductId,
            type: 'sale',
            amount,
            commissionRate,
        });
        res.status(201).json({ success: true, data: event });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};
exports.trackPartnerSale = trackPartnerSale;
const getPartnerAnalytics = async (req, res) => {
    try {
        const storeId = req.params.id;
        if (!isValidObjectId(storeId)) {
            return res.status(400).json({ success: false, message: 'Invalid partner store ID format' });
        }
        const store = await PartnerStore_1.default.findById(storeId);
        if (!store) {
            return res.status(404).json({ success: false, message: 'Partner store not found' });
        }
        const summary = await PartnerEvent_1.default.aggregate([
            { $match: { partnerStore: new mongoose_1.default.Types.ObjectId(storeId) } },
            {
                $group: {
                    _id: '$type',
                    count: { $sum: 1 },
                    revenue: { $sum: '$amount' },
                    commission: {
                        $sum: {
                            $multiply: ['$amount', { $divide: ['$commissionRate', 100] }],
                        },
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
exports.getPartnerAnalytics = getPartnerAnalytics;
