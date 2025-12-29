import { Response } from 'express';
import mongoose from 'mongoose';
import VendorProduct from '../models/VendorProduct';
import Product from '../models/Product';
import Order from '../models/Order';
import { AuthRequest } from '../middleware/auth';

const isValidObjectId = (id?: string) => !!id && mongoose.Types.ObjectId.isValid(id);

export const getVendorProducts = async (req: AuthRequest, res: Response) => {
  try {
    const query: any = {};

    if (req.user?.role === 'admin') {
      if (req.query.all === 'true') {
        // Admin can list all vendor products
      } else if (req.query.vendorUserId) {
        query.vendorUser = req.query.vendorUserId;
      } else {
        query.vendorUser = req.user?._id;
      }
    } else {
      query.vendorUser = req.user?._id;
    }

    const products = await VendorProduct.find(query).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: products });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const createVendorProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { productData } = req.body;
    if (!productData?.name || !productData?.price || !productData?.image) {
      return res.status(400).json({ success: false, message: 'Missing required product data' });
    }

    const item = await VendorProduct.create({
      vendorUser: req.user?._id,
      productData,
      status: 'pending',
    });

    res.status(201).json({ success: true, data: item });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const updateVendorProduct = async (req: AuthRequest, res: Response) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid vendor product ID format' });
    }

    const item = await VendorProduct.findOne({
      _id: req.params.id,
      vendorUser: req.user?._id,
    });

    if (!item) {
      return res.status(404).json({ success: false, message: 'Vendor product not found' });
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

export const approveVendorProduct = async (req: AuthRequest, res: Response) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid vendor product ID format' });
    }

    const item = await VendorProduct.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Vendor product not found' });
    }

    if (item.status === 'approved' && item.publishedProductId) {
      return res.status(200).json({ success: true, data: item });
    }

    const createdProduct = await Product.create({
      ...item.productData,
      active: true,
      featured: false,
      onSale: false,
      salePercentage: 0,
      newArrival: false,
      inCollection: false,
    });

    item.status = 'approved';
    item.reviewNotes = req.body.reviewNotes;
    item.reviewedBy = req.user?._id as any;
    item.reviewedAt = new Date();
    item.publishedProductId = createdProduct._id as any;
    await item.save();

    res.status(200).json({ success: true, data: item });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const rejectVendorProduct = async (req: AuthRequest, res: Response) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid vendor product ID format' });
    }

    const item = await VendorProduct.findByIdAndUpdate(
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
      return res.status(404).json({ success: false, message: 'Vendor product not found' });
    }

    res.status(200).json({ success: true, data: item });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const getVendorOrders = async (req: AuthRequest, res: Response) => {
  try {
    const vendorProducts = await VendorProduct.find({
      vendorUser: req.user?._id,
      status: 'approved',
      publishedProductId: { $exists: true, $ne: null },
    }).select('publishedProductId');

    const productIds = vendorProducts
      .map((item) => item.publishedProductId)
      .filter((id) => id) as mongoose.Types.ObjectId[];

    if (productIds.length === 0) {
      return res.status(200).json({ success: true, data: { orders: [], totalSales: 0, revenue: 0 } });
    }

    const orders = await Order.find({ 'items.product': { $in: productIds } })
      .sort({ createdAt: -1 })
      .limit(50);

    const summary = await Order.aggregate([
      { $unwind: '$items' },
      { $match: { 'items.product': { $in: productIds }, 'paymentInfo.status': 'completed' } },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        orders,
        totalSales: summary[0]?.totalSales || 0,
        revenue: summary[0]?.revenue || 0,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const getVendorReport = async (req: AuthRequest, res: Response) => {
  try {
    const vendorProducts = await VendorProduct.find({
      vendorUser: req.user?._id,
      status: 'approved',
      publishedProductId: { $exists: true, $ne: null },
    }).select('publishedProductId');

    const productIds = vendorProducts
      .map((item) => item.publishedProductId)
      .filter((id) => id) as mongoose.Types.ObjectId[];

    let totalSales = 0;
    let revenue = 0;

    if (productIds.length > 0) {
      const summary = await Order.aggregate([
        { $unwind: '$items' },
        { $match: { 'items.product': { $in: productIds }, 'paymentInfo.status': 'completed' } },
        {
          $group: {
            _id: null,
            totalSales: { $sum: '$items.quantity' },
            revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          },
        },
      ]);

      totalSales = summary[0]?.totalSales || 0;
      revenue = summary[0]?.revenue || 0;
    }

    res.status(200).json({
      success: true,
      data: {
        totalSales,
        revenue,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};
