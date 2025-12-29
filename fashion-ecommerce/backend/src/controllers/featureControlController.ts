import { Response } from 'express';
import SimilarProductsSetting from '../models/SimilarProductsSetting';
import VirtualExperienceSetting from '../models/VirtualExperienceSetting';
import CustomDesignSetting from '../models/CustomDesignSetting';
import Product from '../models/Product';
import PartnerProduct from '../models/PartnerProduct';
import { AuthRequest } from '../middleware/auth';

const getSimilarSettings = async () => {
  let settings = await SimilarProductsSetting.findOne();
  if (!settings) {
    settings = await SimilarProductsSetting.create({});
  }
  return settings;
};

const getVirtualSettings = async () => {
  let settings = await VirtualExperienceSetting.findOne();
  if (!settings) {
    settings = await VirtualExperienceSetting.create({});
  }
  return settings;
};

const getCustomSettings = async () => {
  let settings = await CustomDesignSetting.findOne();
  if (!settings) {
    settings = await CustomDesignSetting.create({});
  }
  return settings;
};

export const getSimilarProductsSettings = async (_req: AuthRequest, res: Response) => {
  try {
    const settings = await getSimilarSettings();
    res.status(200).json({ success: true, data: settings });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const updateSimilarProductsSettings = async (req: AuthRequest, res: Response) => {
  try {
    const settings = await getSimilarSettings();
    settings.enabled = req.body.enabled ?? settings.enabled;
    settings.maxItems = req.body.maxItems ?? settings.maxItems;
    settings.prioritizeInStore = req.body.prioritizeInStore ?? settings.prioritizeInStore;
    settings.prioritizePartner = req.body.prioritizePartner ?? settings.prioritizePartner;
    settings.autoWhenNoPurchase = req.body.autoWhenNoPurchase ?? settings.autoWhenNoPurchase;
    await settings.save();

    res.status(200).json({ success: true, data: settings });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const getSimilarProducts = async (req: AuthRequest, res: Response) => {
  try {
    const settings = await getSimilarSettings();
    const productId = req.query.productId as string | undefined;
    const context = req.query.context as string | undefined;

    const autoEnabled = settings.autoWhenNoPurchase && context === 'noPurchase';
    if (!settings.enabled && !autoEnabled) {
      return res.status(200).json({ success: true, data: [] });
    }

    const maxItems = settings.maxItems || 4;
    const results: any[] = [];

    let baseProduct: any = null;
    if (productId) {
      baseProduct = await Product.findById(productId);
    }

    if (settings.prioritizeInStore) {
      const query: any = { active: true };
      if (baseProduct) {
        query._id = { $ne: baseProduct._id };
        query.category = baseProduct.category;
        query.gender = baseProduct.gender;
      }

      const inStore = await Product.find(query)
        .sort({ createdAt: -1 })
        .limit(maxItems)
        .lean();

      inStore.forEach((item: any) => {
        results.push({ ...item, source: 'in_store' });
      });
    }

    if (settings.prioritizePartner && results.length < maxItems) {
      const partnerItems = await PartnerProduct.find({ status: 'approved' })
        .populate('partnerStore', 'status')
        .sort({ createdAt: -1 })
        .limit(maxItems)
        .lean();

      partnerItems.forEach((item: any) => {
        const store = item.partnerStore as any;
        if (store?.status === 'active' && results.length < maxItems) {
          results.push({ ...item, source: 'partner' });
        }
      });
    }

    res.status(200).json({ success: true, data: results.slice(0, maxItems) });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const getVirtualExperienceSettings = async (_req: AuthRequest, res: Response) => {
  try {
    const settings = await getVirtualSettings();
    res.status(200).json({ success: true, data: settings });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const updateVirtualExperienceSettings = async (req: AuthRequest, res: Response) => {
  try {
    const settings = await getVirtualSettings();
    settings.enabled = req.body.enabled ?? settings.enabled;
    settings.supportedProductIds = req.body.supportedProductIds ?? settings.supportedProductIds;
    settings.supportedCategories = req.body.supportedCategories ?? settings.supportedCategories;
    await settings.save();

    res.status(200).json({ success: true, data: settings });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const logVirtualExperienceUsage = async (_req: AuthRequest, res: Response) => {
  try {
    const settings = await getVirtualSettings();
    settings.usageCount += 1;
    await settings.save();
    res.status(200).json({ success: true, data: settings });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const logVirtualExperienceConversion = async (_req: AuthRequest, res: Response) => {
  try {
    const settings = await getVirtualSettings();
    settings.conversionCount += 1;
    await settings.save();
    res.status(200).json({ success: true, data: settings });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const getCustomDesignSettings = async (_req: AuthRequest, res: Response) => {
  try {
    const settings = await getCustomSettings();
    res.status(200).json({ success: true, data: settings });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const updateCustomDesignSettings = async (req: AuthRequest, res: Response) => {
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
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};
