"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStudioProduct = exports.getActiveStudioProducts = exports.getAllStudioProducts = exports.deleteStudioProduct = exports.updateStudioProduct = exports.createStudioProduct = void 0;
const StudioProduct_1 = __importDefault(require("../models/StudioProduct"));
const cloudinary_1 = require("../config/cloudinary");
const normalizeImageString = (value) => {
    if (typeof value === 'string') {
        return value;
    }
    if (value && typeof value === 'object') {
        const candidate = value.url
            || value.secure_url
            || value.path;
        if (typeof candidate === 'string') {
            return candidate;
        }
    }
    return null;
};
const resolveMockupUrl = async (value) => {
    const normalized = normalizeImageString(value);
    if (!normalized)
        return null;
    if (normalized.startsWith('data:image/')) {
        return (0, cloudinary_1.uploadToCloudinary)(normalized, 'stylecraft/studio-products');
    }
    return normalized;
};
const resolveColorMockups = async (value) => {
    if (!value || typeof value !== 'object')
        return {};
    const entries = [];
    if (Array.isArray(value)) {
        for (const item of value) {
            if (item && typeof item === 'object') {
                const color = String(item.color || '').trim();
                const url = item.url;
                if (color) {
                    entries.push({ color, url });
                }
            }
        }
    }
    else {
        for (const [colorKey, url] of Object.entries(value)) {
            const color = colorKey.trim();
            if (color) {
                entries.push({ color, url });
            }
        }
    }
    const resolved = {};
    for (const entry of entries) {
        const key = entry.color.trim().toLowerCase();
        if (!key)
            continue;
        const resolvedUrl = await resolveMockupUrl(entry.url);
        if (resolvedUrl) {
            resolved[key] = resolvedUrl;
        }
    }
    return resolved;
};
const createStudioProduct = async (req, res) => {
    try {
        const payload = { ...req.body };
        if (!payload.baseMockupUrl) {
            return res.status(400).json({ success: false, message: 'Mockup image is required' });
        }
        let resolvedMockup = null;
        try {
            resolvedMockup = await resolveMockupUrl(payload.baseMockupUrl);
        }
        catch (error) {
            return res.status(400).json({
                success: false,
                message: `Failed to upload mockup image: ${error.message || 'Upload failed'}`,
            });
        }
        if (!resolvedMockup) {
            return res.status(400).json({ success: false, message: 'Invalid mockup image format' });
        }
        payload.baseMockupUrl = resolvedMockup;
        if (payload.colorMockups) {
            try {
                payload.colorMockups = await resolveColorMockups(payload.colorMockups);
            }
            catch (error) {
                return res.status(400).json({
                    success: false,
                    message: `Failed to upload color mockups: ${error.message || 'Upload failed'}`,
                });
            }
        }
        const product = await StudioProduct_1.default.create(payload);
        res.status(201).json({ success: true, data: product });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};
exports.createStudioProduct = createStudioProduct;
const updateStudioProduct = async (req, res) => {
    try {
        const payload = { ...req.body };
        if (Object.prototype.hasOwnProperty.call(payload, 'baseMockupUrl')) {
            let resolvedMockup = null;
            try {
                resolvedMockup = await resolveMockupUrl(payload.baseMockupUrl);
            }
            catch (error) {
                return res.status(400).json({
                    success: false,
                    message: `Failed to upload mockup image: ${error.message || 'Upload failed'}`,
                });
            }
            if (!resolvedMockup) {
                return res.status(400).json({ success: false, message: 'Invalid mockup image format' });
            }
            payload.baseMockupUrl = resolvedMockup;
        }
        if (Object.prototype.hasOwnProperty.call(payload, 'colorMockups')) {
            try {
                payload.colorMockups = await resolveColorMockups(payload.colorMockups);
            }
            catch (error) {
                return res.status(400).json({
                    success: false,
                    message: `Failed to upload color mockups: ${error.message || 'Upload failed'}`,
                });
            }
        }
        const product = await StudioProduct_1.default.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true });
        if (!product) {
            return res.status(404).json({ success: false, message: 'Studio product not found' });
        }
        res.status(200).json({ success: true, data: product });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};
exports.updateStudioProduct = updateStudioProduct;
const deleteStudioProduct = async (req, res) => {
    try {
        const product = await StudioProduct_1.default.findByIdAndDelete(req.params.id);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Studio product not found' });
        }
        res.status(200).json({ success: true, message: 'Studio product deleted' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};
exports.deleteStudioProduct = deleteStudioProduct;
const getAllStudioProducts = async (_req, res) => {
    try {
        const products = await StudioProduct_1.default.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: products });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};
exports.getAllStudioProducts = getAllStudioProducts;
const getActiveStudioProducts = async (req, res) => {
    try {
        const products = await StudioProduct_1.default.find({ active: true }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: products });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};
exports.getActiveStudioProducts = getActiveStudioProducts;
const getStudioProduct = async (req, res) => {
    try {
        const product = await StudioProduct_1.default.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Studio product not found' });
        }
        res.status(200).json({ success: true, data: product });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};
exports.getStudioProduct = getStudioProduct;
