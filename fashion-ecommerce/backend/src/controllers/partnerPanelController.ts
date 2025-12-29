import { Response } from 'express';
import mongoose from 'mongoose';
import PartnerStore from '../models/PartnerStore';
import PartnerProduct from '../models/PartnerProduct';
import PartnerEvent from '../models/PartnerEvent';
import { RoleAuthRequest } from '../middleware/roleAssignments';

const isValidObjectId = (id?: string) => !!id && mongoose.Types.ObjectId.isValid(id);

export const getPartnerStoreForUser = async (req: RoleAuthRequest, res: Response) => {
  try {
    const storeId = req.roleAssignment?.partnerStore;
    if (!storeId) {
      return res.status(404).json({ success: false, message: 'Partner store not assigned' });
    }

    const store = await PartnerStore.findById(storeId);
    if (!store) {
      return res.status(404).json({ success: false, message: 'Partner store not found' });
    }

    res.status(200).json({ success: true, data: store });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const getPartnerStoreProductsForUser = async (req: RoleAuthRequest, res: Response) => {
  try {
    const storeId = req.roleAssignment?.partnerStore;
    if (!storeId) {
      return res.status(404).json({ success: false, message: 'Partner store not assigned' });
    }

    const products = await PartnerProduct.find({ partnerStore: storeId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: products });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const createPartnerProductForUser = async (req: RoleAuthRequest, res: Response) => {
  try {
    const storeId = req.roleAssignment?.partnerStore;
    if (!storeId) {
      return res.status(404).json({ success: false, message: 'Partner store not assigned' });
    }

    const { productData } = req.body;
    if (!productData?.name || !productData?.price || !productData?.image) {
      return res.status(400).json({ success: false, message: 'Missing required product data' });
    }

    const item = await PartnerProduct.create({
      partnerStore: storeId,
      productData,
      status: 'pending',
    });

    res.status(201).json({ success: true, data: item });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const updatePartnerProductForUser = async (req: RoleAuthRequest, res: Response) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid partner product ID format' });
    }

    const storeId = req.roleAssignment?.partnerStore;
    if (!storeId) {
      return res.status(404).json({ success: false, message: 'Partner store not assigned' });
    }

    const item = await PartnerProduct.findOne({ _id: req.params.id, partnerStore: storeId });
    if (!item) {
      return res.status(404).json({ success: false, message: 'Partner product not found' });
    }

    if (item.status === 'approved') {
      return res.status(400).json({ success: false, message: 'Approved products cannot be edited' });
    }

    item.productData = { ...item.productData, ...req.body.productData };
    await item.save();

    res.status(200).json({ success: true, data: item });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const getPartnerAnalyticsForUser = async (req: RoleAuthRequest, res: Response) => {
  try {
    const storeId = req.roleAssignment?.partnerStore;
    if (!storeId) {
      return res.status(404).json({ success: false, message: 'Partner store not assigned' });
    }

    const summary = await PartnerEvent.aggregate([
      { $match: { partnerStore: new mongoose.Types.ObjectId(storeId) } },
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
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};
