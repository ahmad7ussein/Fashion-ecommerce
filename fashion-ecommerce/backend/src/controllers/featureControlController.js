"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadHomeSliderImage = exports.updateCustomDesignSettings = exports.getCustomDesignSettings = exports.updateHomeSliderSettings = exports.getHomeSliderSettings = exports.logVirtualExperienceConversion = exports.logVirtualExperienceUsage = exports.updateVirtualExperienceSettings = exports.getVirtualExperienceSettings = void 0;
const VirtualExperienceSetting_1 = __importDefault(require("../models/VirtualExperienceSetting"));
const CustomDesignSetting_1 = __importDefault(require("../models/CustomDesignSetting"));
const HomeSliderSetting_1 = __importDefault(require("../models/HomeSliderSetting"));
const cloudinary_1 = require("../config/cloudinary");
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
const getHomeSliderSettingsInternal = async () => {
    let settings = await HomeSliderSetting_1.default.findOne();
    if (!settings) {
        settings = await HomeSliderSetting_1.default.create({ slides: [] });
    }
    return settings;
};
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
const getHomeSliderSettings = async (_req, res) => {
    try {
        const settings = await getHomeSliderSettingsInternal();
        res.status(200).json({ success: true, data: settings });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || "Server error" });
    }
};
exports.getHomeSliderSettings = getHomeSliderSettings;
const updateHomeSliderSettings = async (req, res) => {
    try {
        const settings = await getHomeSliderSettingsInternal();
        if (Array.isArray(req.body.slides)) {
            settings.slides = req.body.slides.map((slide, index) => ({
                image: slide.image,
                title: slide.title,
                subtitle: slide.subtitle,
                description: slide.description,
                buttonText: slide.buttonText,
                buttonLink: slide.buttonLink,
                bgGradient: slide.bgGradient,
                bgImage: slide.bgImage,
                isActive: slide.isActive !== undefined ? slide.isActive : true,
                order: Number.isFinite(slide.order) ? slide.order : index,
            }));
        }
        await settings.save();
        res.status(200).json({ success: true, data: settings });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || "Server error" });
    }
};
exports.updateHomeSliderSettings = updateHomeSliderSettings;
const uploadHomeSliderImage = async (req, res) => {
    try {
        const fileBuffer = req.file?.buffer;
        if (!fileBuffer) {
            return res.status(400).json({ success: false, message: "No image file provided." });
        }
        const uploadedUrl = await (0, cloudinary_1.uploadToCloudinary)(fileBuffer, "stylecraft/home-slider");
        return res.status(200).json({ success: true, data: { url: uploadedUrl } });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message || "Upload failed" });
    }
};
exports.uploadHomeSliderImage = uploadHomeSliderImage;
