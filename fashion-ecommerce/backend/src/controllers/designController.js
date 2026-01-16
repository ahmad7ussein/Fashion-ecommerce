"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportDesign = exports.uploadDesignAsset = exports.publishDesign = exports.getAllDesigns = exports.deleteDesign = exports.updateDesign = exports.getDesign = exports.addDesignToCart = exports.getMyDesigns = exports.createDesign = void 0;
const Design_1 = __importDefault(require("../models/Design"));
const StudioProduct_1 = __importDefault(require("../models/StudioProduct"));
const Cart_1 = __importDefault(require("../models/Cart"));
const mongoose_1 = __importDefault(require("mongoose"));
const cloudinary_1 = require("../config/cloudinary");
const normalizeViews = (views) => {
    if (!Array.isArray(views))
        return [];
    return views.map((view) => ({
        view: view.view,
        colorKey: String(view.colorKey || '').trim().toLowerCase(),
        canvasJson: view.canvasJson ?? view.canvas ?? null,
        ratioState: view.ratioState ?? null,
        previewSize: view.previewSize ?? null,
        updatedAt: view.updatedAt ? new Date(view.updatedAt) : new Date(),
    })).filter((view) => view.view && view.colorKey);
};
const createDesign = async (req, res) => {
    try {
        if (!req.user?._id) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated',
            });
        }
        const { name, baseProduct, baseProductId, elements, views, thumbnail, designImageURL, designMetadata, userDescription } = req.body;
        const validStatuses = ['draft', 'published', 'archived'];
        const designStatus = 'draft';
        if (!baseProductId || !mongoose_1.default.Types.ObjectId.isValid(baseProductId)) {
            return res.status(400).json({ success: false, message: 'Invalid base product id' });
        }
        const studioProduct = await StudioProduct_1.default.findOne({ _id: baseProductId, active: true });
        if (!studioProduct) {
            return res.status(404).json({ success: false, message: 'Base studio product not found or inactive' });
        }
        const design = await Design_1.default.create({
            user: req.user._id,
            name,
            baseProduct: baseProduct || { type: studioProduct.type, color: studioProduct.colors?.[0] || 'white', size: studioProduct.sizes?.[0] || 'M' },
            baseProductId: studioProduct._id,
            elements,
            views: normalizeViews(views),
            thumbnail,
            designImageURL,
            designMetadata,
            userDescription,
            price: studioProduct.price,
            status: designStatus,
            type: 'manual',
        });
        res.status(201).json({
            success: true,
            message: 'Design created successfully',
            data: design,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
};
exports.createDesign = createDesign;
const getMyDesigns = async (req, res) => {
    try {
        const { status } = req.query;
        const query = { user: req.user?._id };
        if (status && status !== 'all') {
            query.status = status;
        }
        const designs = await Design_1.default.find(query).sort({ createdAt: -1 }).allowDiskUse(true);
        res.status(200).json({
            success: true,
            count: designs.length,
            data: designs,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
};
exports.getMyDesigns = getMyDesigns;
const addDesignToCart = async (req, res) => {
    try {
        if (!req.user?._id) {
            return res.status(401).json({ success: false, message: 'User not authenticated' });
        }
        const designId = req.params.id;
        const { quantity = 1, size, color } = req.body;
        if (!designId || !designId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ success: false, message: 'Invalid design ID format' });
        }
        const design = await Design_1.default.findById(designId);
        if (!design) {
            return res.status(404).json({ success: false, message: 'Design not found' });
        }
        if (design.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized to use this design' });
        }
        const studioProduct = design.baseProductId ? await StudioProduct_1.default.findOne({ _id: design.baseProductId, active: true }) : null;
        if (!studioProduct) {
            return res.status(404).json({ success: false, message: 'Base studio product not available' });
        }
        const finalSize = size || design.baseProduct.size || studioProduct.sizes?.[0] || 'M';
        const finalColor = color || design.baseProduct.color || studioProduct.colors?.[0] || 'white';
        const cart = await Cart_1.default.findOneAndUpdate({ user: req.user._id }, {
            $setOnInsert: { user: req.user._id, items: [] },
        }, { upsert: true, new: true });
        const existingIndex = cart.items.findIndex((i) => i.design?.toString() === design._id.toString());
        if (existingIndex >= 0) {
            cart.items[existingIndex].quantity += Math.max(1, Number(quantity) || 1);
            cart.items[existingIndex].size = finalSize;
            cart.items[existingIndex].color = finalColor;
        }
        else {
            cart.items.push({
                design: design._id,
                name: design.name,
                price: studioProduct.price,
                quantity: Math.max(1, Number(quantity) || 1),
                size: finalSize,
                color: finalColor,
                image: design.thumbnail || design.designImageURL || studioProduct.baseMockupUrl,
                isCustom: true,
            });
        }
        await cart.save();
        return res.status(200).json({ success: true, message: 'Design added to cart', data: cart });
    }
    catch (error) {
        console.error('Error adding design to cart', error);
        return res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};
exports.addDesignToCart = addDesignToCart;
const getDesign = async (req, res) => {
    try {
        if (!req.params.id || !req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid design ID format',
            });
        }
        const design = await Design_1.default.findById(req.params.id).populate('user', 'firstName lastName email');
        if (!design) {
            return res.status(404).json({
                success: false,
                message: 'Design not found',
            });
        }
        const isOwner = design.user._id.toString() === req.user?._id?.toString();
        const isStaff = req.user?.role === 'admin' || req.user?.role === 'employee';
        if (!isOwner && !isStaff) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to access this design',
            });
        }
        res.status(200).json({
            success: true,
            data: design,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
};
exports.getDesign = getDesign;
const updateDesign = async (req, res) => {
    try {
        if (!req.params.id || !req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid design ID format',
            });
        }
        let design = await Design_1.default.findById(req.params.id);
        if (!design) {
            return res.status(404).json({
                success: false,
                message: 'Design not found',
            });
        }
        if (design.user.toString() !== req.user?._id?.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this design',
            });
        }
        const payload = { ...req.body };
        if (payload.views) {
            payload.views = normalizeViews(payload.views);
        }
        design = await Design_1.default.findByIdAndUpdate(req.params.id, payload, {
            new: true,
            runValidators: true,
        });
        res.status(200).json({
            success: true,
            message: 'Design updated successfully',
            data: design,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
};
exports.updateDesign = updateDesign;
const deleteDesign = async (req, res) => {
    try {
        if (!req.params.id || !req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid design ID format',
            });
        }
        const design = await Design_1.default.findById(req.params.id);
        if (!design) {
            return res.status(404).json({
                success: false,
                message: 'Design not found',
            });
        }
        if (design.user.toString() !== req.user?._id?.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this design',
            });
        }
        await design.deleteOne();
        res.status(200).json({
            success: true,
            message: 'Design deleted successfully',
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
};
exports.deleteDesign = deleteDesign;
const getAllDesigns = async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        const query = {};
        if (status && status !== 'all') {
            query.status = status;
        }
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        const designs = await Design_1.default.find(query)
            .sort({ createdAt: -1 })
            .allowDiskUse(true)
            .skip(skip)
            .limit(limitNum)
            .populate('user', 'firstName lastName email');
        const total = await Design_1.default.countDocuments(query);
        res.status(200).json({
            success: true,
            count: designs.length,
            total,
            page: pageNum,
            pages: Math.ceil(total / limitNum),
            data: designs,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
};
exports.getAllDesigns = getAllDesigns;
const publishDesign = async (req, res) => {
    try {
        if (!req.params.id || !req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid design ID format',
            });
        }
        const design = await Design_1.default.findById(req.params.id);
        if (!design) {
            return res.status(404).json({
                success: false,
                message: 'Design not found',
            });
        }
        if (design.user.toString() !== req.user?._id?.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to publish this design',
            });
        }
        design.status = 'published';
        await design.save();
        res.status(200).json({
            success: true,
            message: 'Design published successfully',
            data: design,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
};
exports.publishDesign = publishDesign;
const uploadDesignAsset = async (req, res) => {
    try {
        if (!req.user?._id) {
            return res.status(401).json({ success: false, message: 'User not authenticated' });
        }
        const base64 = req.body?.image;
        const fileBuffer = req.file?.buffer;
        if (!base64 && !fileBuffer) {
            return res.status(400).json({ success: false, message: 'No image provided' });
        }
        const uploadedUrl = await (0, cloudinary_1.uploadToCloudinary)(fileBuffer || base64, 'stylecraft/design-assets');
        return res.status(200).json({ success: true, data: { url: uploadedUrl } });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};
exports.uploadDesignAsset = uploadDesignAsset;
const exportDesign = async (req, res) => {
    try {
        if (!req.params.id || !req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid design ID format',
            });
        }
        if (!req.user?._id) {
            return res.status(401).json({ success: false, message: 'User not authenticated' });
        }
        const design = await Design_1.default.findById(req.params.id);
        if (!design) {
            return res.status(404).json({ success: false, message: 'Design not found' });
        }
        if (design.user.toString() !== req.user._id.toString() &&
            req.user?.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized to export this design' });
        }
        const imageData = req.body?.imageData;
        if (!imageData) {
            return res.status(400).json({ success: false, message: 'Export image data is required' });
        }
        const uploadedUrl = await (0, cloudinary_1.uploadToCloudinary)(imageData, 'stylecraft/design-exports');
        design.designImageURL = uploadedUrl;
        if (!design.thumbnail) {
            design.thumbnail = uploadedUrl;
        }
        await design.save();
        return res.status(200).json({ success: true, data: { url: uploadedUrl } });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};
exports.exportDesign = exportDesign;
