"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCustomDesignSettings = exports.getCustomDesignSettings = exports.logVirtualExperienceConversion = exports.logVirtualExperienceUsage = exports.updateVirtualExperienceSettings = exports.getVirtualExperienceSettings = exports.getSimilarProducts = exports.updateSimilarProductsSettings = exports.getSimilarProductsSettings = void 0;
const SimilarProductsSetting_1 = __importDefault(require("../models/SimilarProductsSetting"));
const VirtualExperienceSetting_1 = __importDefault(require("../models/VirtualExperienceSetting"));
const CustomDesignSetting_1 = __importDefault(require("../models/CustomDesignSetting"));
const Product_1 = __importDefault(require("../models/Product"));
const PartnerProduct_1 = __importDefault(require("../models/PartnerProduct"));
const getSimilarSettings = async () => {
    let settings = await SimilarProductsSetting_1.default.findOne();
    if (!settings) {
        settings = await SimilarProductsSetting_1.default.create({});
    }
    return settings;
};
const getVirtualSettings = async () => {
    let settings = await VirtualExperienceSetting_1.default.findOne();
    if (!settings) {
        settings = await VirtualExperienceSetting_1.default.create({});
    }
    return settings;
};
const getCustomSettings = async () => {
    let settings = await CustomDesignSetting_1.default.findOne();
    if (!settings) {
        settings = await CustomDesignSetting_1.default.create({});
    }
    return settings;
};
const getSimilarProductsSettings = async (_req, res) => {
    try {
        const settings = await getSimilarSettings();
        res.status(200).json({ success: true, data: settings });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};
exports.getSimilarProductsSettings = getSimilarProductsSettings;
const updateSimilarProductsSettings = async (req, res) => {
    try {
        const settings = await getSimilarSettings();
        settings.enabled = req.body.enabled ?? settings.enabled;
        settings.maxItems = req.body.maxItems ?? settings.maxItems;
        settings.prioritizeInStore = req.body.prioritizeInStore ?? settings.prioritizeInStore;
        settings.prioritizePartner = req.body.prioritizePartner ?? settings.prioritizePartner;
        settings.autoWhenNoPurchase = req.body.autoWhenNoPurchase ?? settings.autoWhenNoPurchase;
        await settings.save();
        res.status(200).json({ success: true, data: settings });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};
exports.updateSimilarProductsSettings = updateSimilarProductsSettings;
const getSimilarProducts = async (req, res) => {
    try {
        const settings = await getSimilarSettings();
        const productId = req.query.productId;
        const context = req.query.context;
        const autoEnabled = settings.autoWhenNoPurchase && context === 'noPurchase';
        if (!settings.enabled && !autoEnabled) {
            return res.status(200).json({ success: true, data: [] });
        }
        const maxItems = settings.maxItems || 4;
        const results = [];
        let baseProduct = null;
        if (productId) {
            baseProduct = await Product_1.default.findById(productId);
        }
        if (settings.prioritizeInStore) {
            const query = { active: true };
            if (baseProduct) {
                query._id = { $ne: baseProduct._id };
                query.category = baseProduct.category;
                query.gender = baseProduct.gender;
            }
            const inStore = await Product_1.default.find(query)
                .sort({ createdAt: -1 })
                .limit(maxItems)
                .lean();
            inStore.forEach((item) => {
                results.push({ ...item, source: 'in_store' });
            });
        }
        if (settings.prioritizePartner && results.length < maxItems) {
            const partnerItems = await PartnerProduct_1.default.find({ status: 'approved' })
                .populate('partnerStore', 'status')
                .sort({ createdAt: -1 })
                .limit(maxItems)
                .lean();
            partnerItems.forEach((item) => {
                const store = item.partnerStore;
                if (store?.status === 'active' && results.length < maxItems) {
                    results.push({ ...item, source: 'partner' });
                }
            });
        }
        res.status(200).json({ success: true, data: results.slice(0, maxItems) });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};
exports.getSimilarProducts = getSimilarProducts;
const getVirtualExperienceSettings = async (_req, res) => {
    try {
        const settings = await getVirtualSettings();
        res.status(200).json({ success: true, data: settings });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};
exports.getVirtualExperienceSettings = getVirtualExperienceSettings;
const updateVirtualExperienceSettings = async (req, res) => {
    try {
        const settings = await getVirtualSettings();
        settings.enabled = req.body.enabled ?? settings.enabled;
        settings.supportedProductIds = req.body.supportedProductIds ?? settings.supportedProductIds;
        settings.supportedCategories = req.body.supportedCategories ?? settings.supportedCategories;
        await settings.save();
        res.status(200).json({ success: true, data: settings });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};
exports.updateVirtualExperienceSettings = updateVirtualExperienceSettings;
const logVirtualExperienceUsage = async (_req, res) => {
    try {
        const settings = await getVirtualSettings();
        settings.usageCount += 1;
        await settings.save();
        res.status(200).json({ success: true, data: settings });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};
exports.logVirtualExperienceUsage = logVirtualExperienceUsage;
const logVirtualExperienceConversion = async (_req, res) => {
    try {
        const settings = await getVirtualSettings();
        settings.conversionCount += 1;
        await settings.save();
        res.status(200).json({ success: true, data: settings });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};
exports.logVirtualExperienceConversion = logVirtualExperienceConversion;
const getCustomDesignSettings = async (_req, res) => {
    try {
        const settings = await getCustomSettings();
        res.status(200).json({ success: true, data: settings });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};
exports.getCustomDesignSettings = getCustomDesignSettings;
const updateCustomDesignSettings = async (req, res) => {
    try {
        const settings = await getCustomSettings();
        settings.enabled = req.body.enabled ?? settings.enabled;
        settings.allowedFonts = req.body.allowedFonts ?? settings.allowedFonts;
        settings.printAreas = req.body.printAreas ?? settings.printAreas;
        settings.allowText = req.body.allowText ?? settings.allowText;
        settings.allowImages = req.body.allowImages ?? settings.allowImages;
        settings.maxTextLength = req.body.maxTextLength ?? settings.maxTextLength;
        settings.additionalPrices = req.body.additionalPrices ?? settings.additionalPrices;
        settings.requireApproval = req.body.requireApproval ?? settings.requireApproval;
        await settings.save();
        res.status(200).json({ success: true, data: settings });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};
exports.updateCustomDesignSettings = updateCustomDesignSettings;
