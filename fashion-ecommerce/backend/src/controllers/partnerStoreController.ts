import { Response } from 'express';
import mongoose from 'mongoose';
import PartnerStore from '../models/PartnerStore';
import PartnerProduct from '../models/PartnerProduct';
import PartnerEvent from '../models/PartnerEvent';
import { AuthRequest } from '../middleware/auth';

const isValidObjectId = (id?: string) => !!id && mongoose.Types.ObjectId.isValid(id);

export const getPartnerStores = async (_req: AuthRequest, res: Response) => {
  try {
    const stores = await PartnerStore.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: stores });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const createPartnerStore = async (req: AuthRequest, res: Response) => {
  try {
    const { name, slug, website, defaultCommissionRate, status, contactEmail, contactPhone, description } = req.body;

    if (!name || !slug) {
      return res.status(400).json({ success: false, message: 'Name and slug are required' });
    }

    const store = await PartnerStore.create({
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
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const updatePartnerStore = async (req: AuthRequest, res: Response) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid partner store ID format' });
    }

    const store = await PartnerStore.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name,
        slug: req.body.slug,
        website: req.body.website,
        defaultCommissionRate: req.body.defaultCommissionRate,
        status: req.body.status,
        contactEmail: req.body.contactEmail,
        contactPhone: req.body.contactPhone,
        description: req.body.description,
      },
      { new: true, runValidators: true }
    );

    if (!store) {
      return res.status(404).json({ success: false, message: 'Partner store not found' });
    }

    res.status(200).json({ success: true, data: store });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const updatePartnerStoreStatus = async (req: AuthRequest, res: Response) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid partner store ID format' });
    }

    const store = await PartnerStore.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true, runValidators: true }
    );

    if (!store) {
      return res.status(404).json({ success: false, message: 'Partner store not found' });
    }

    res.status(200).json({ success: true, data: store });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const getPartnerProducts = async (req: AuthRequest, res: Response) => {
  try {
    const { status, storeId } = req.query;
    const query: any = {};
    if (status) query.status = status;
    if (storeId) query.partnerStore = storeId;

    const products = await PartnerProduct.find(query)
      .populate('partnerStore', 'name slug')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: products });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const createPartnerProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { partnerStoreId, productData } = req.body;

    if (!isValidObjectId(partnerStoreId)) {
      return res.status(400).json({ success: false, message: 'Invalid partner store ID format' });
    }

    const store = await PartnerStore.findById(partnerStoreId);
    if (!store) {
      return res.status(404).json({ success: false, message: 'Partner store not found' });
    }

    if (!productData?.name || !productData?.price || !productData?.image) {
      return res.status(400).json({ success: false, message: 'Missing required product data' });
    }

    const item = await PartnerProduct.create({
      partnerStore: partnerStoreId,
      productData,
      status: 'pending',
    });

    res.status(201).json({ success: true, data: item });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const approvePartnerProduct = async (req: AuthRequest, res: Response) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid partner product ID format' });
    }

    const item = await PartnerProduct.findByIdAndUpdate(
      req.params.id,
      {
        status: 'approved',
        reviewNotes: req.body.reviewNotes,
        reviewedBy: req.user?._id,
        reviewedAt: new Date(),
      },
      { new: true }
    );

    if (!item) {
      return res.status(404).json({ success: false, message: 'Partner product not found' });
    }

    res.status(200).json({ success: true, data: item });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const rejectPartnerProduct = async (req: AuthRequest, res: Response) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid partner product ID format' });
    }

    const item = await PartnerProduct.findByIdAndUpdate(
      req.params.id,
      {
        status: 'rejected',
        reviewNotes: req.body.reviewNotes,
        reviewedBy: req.user?._id,
        reviewedAt: new Date(),
      },
      { new: true }
    );

    if (!item) {
      return res.status(404).json({ success: false, message: 'Partner product not found' });
    }

    res.status(200).json({ success: true, data: item });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const trackPartnerClick = async (req: AuthRequest, res: Response) => {
  try {
    const storeId = req.params.id;
    if (!isValidObjectId(storeId)) {
      return res.status(400).json({ success: false, message: 'Invalid partner store ID format' });
    }

    const event = await PartnerEvent.create({
      partnerStore: storeId,
      partnerProduct: req.body.partnerProductId,
      type: 'click',
      amount: 0,
      commissionRate: 0,
    });

    res.status(201).json({ success: true, data: event });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const trackPartnerSale = async (req: AuthRequest, res: Response) => {
  try {
    const storeId = req.params.id;
    if (!isValidObjectId(storeId)) {
      return res.status(400).json({ success: false, message: 'Invalid partner store ID format' });
    }

    const store = await PartnerStore.findById(storeId);
    if (!store) {
      return res.status(404).json({ success: false, message: 'Partner store not found' });
    }

    const amount = Number(req.body.amount || 0);
    const partnerProductId = req.body.partnerProductId;

    let commissionRate = store.defaultCommissionRate || 0;

    if (partnerProductId && isValidObjectId(partnerProductId)) {
      const product = await PartnerProduct.findById(partnerProductId);
      if (product?.productData?.commissionRate !== undefined) {
        commissionRate = product.productData.commissionRate || 0;
      }
    }

    const event = await PartnerEvent.create({
      partnerStore: storeId,
      partnerProduct: partnerProductId,
      type: 'sale',
      amount,
      commissionRate,
    });

    res.status(201).json({ success: true, data: event });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const getPartnerAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const storeId = req.params.id;
    if (!isValidObjectId(storeId)) {
      return res.status(400).json({ success: false, message: 'Invalid partner store ID format' });
    }

    const store = await PartnerStore.findById(storeId);
    if (!store) {
      return res.status(404).json({ success: false, message: 'Partner store not found' });
    }

    const summary = await PartnerEvent.aggregate([
      { $match: { partnerStore: new mongoose.Types.ObjectId(storeId) } },
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
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};
