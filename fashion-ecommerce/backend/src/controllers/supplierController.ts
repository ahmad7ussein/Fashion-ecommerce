import { Response } from 'express';
import mongoose from 'mongoose';
import Supplier from '../models/Supplier';
import SupplierProduct from '../models/SupplierProduct';
import Product from '../models/Product';
import Order from '../models/Order';
import { AuthRequest } from '../middleware/auth';

const isValidObjectId = (id?: string) => !!id && mongoose.Types.ObjectId.isValid(id);


export const getSuppliers = async (_req: AuthRequest, res: Response) => {
  try {
    const suppliers = await Supplier.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: suppliers,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const createSupplier = async (req: AuthRequest, res: Response) => {
  try {
    const { name, contactEmail, contactPhone, commissionRate, deliveryTime, returnPolicy } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Supplier name is required' });
    }

    const supplier = await Supplier.create({
      name,
      contactEmail,
      contactPhone,
      commissionRate,
      deliveryTime,
      returnPolicy,
      createdBy: req.user?._id,
    });

    res.status(201).json({ success: true, data: supplier });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const updateSupplier = async (req: AuthRequest, res: Response) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid supplier ID format' });
    }

    const supplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name,
        contactEmail: req.body.contactEmail,
        contactPhone: req.body.contactPhone,
        commissionRate: req.body.commissionRate,
        deliveryTime: req.body.deliveryTime,
        returnPolicy: req.body.returnPolicy,
        ratingAverage: req.body.ratingAverage,
        ratingCount: req.body.ratingCount,
      },
      { new: true, runValidators: true }
    );

    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    res.status(200).json({ success: true, data: supplier });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const updateSupplierStatus = async (req: AuthRequest, res: Response) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid supplier ID format' });
    }

    const supplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true, runValidators: true }
    );

    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    res.status(200).json({ success: true, data: supplier });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const getSupplierAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const supplierId = req.params.id;
    if (!isValidObjectId(supplierId)) {
      return res.status(400).json({ success: false, message: 'Invalid supplier ID format' });
    }

    const supplier = await Supplier.findById(supplierId);
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    const supplierProducts = await SupplierProduct.find({
      supplier: supplierId,
      status: 'approved',
      publishedProductId: { $exists: true, $ne: null },
    }).select('publishedProductId');

    const productIds = supplierProducts
      .map((item) => item.publishedProductId)
      .filter((id) => id) as mongoose.Types.ObjectId[];

    let totalSales = 0;
    let revenue = 0;

    if (productIds.length > 0) {
      const salesData = await Order.aggregate([
        { $unwind: '$items' },
        {
          $match: {
            'items.product': { $in: productIds },
            'paymentInfo.status': 'completed',
          },
        },
        {
          $group: {
            _id: null,
            totalSales: { $sum: '$items.quantity' },
            revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          },
        },
      ]);

      totalSales = salesData[0]?.totalSales || 0;
      revenue = salesData[0]?.revenue || 0;
    }

    res.status(200).json({
      success: true,
      data: {
        totalSales,
        revenue,
        ratings: {
          average: supplier.ratingAverage,
          count: supplier.ratingCount,
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};


export const getSupplierProducts = async (req: AuthRequest, res: Response) => {
  try {
    const { status, supplierId } = req.query;

    const query: any = {};
    if (status) query.status = status;
    if (supplierId) query.supplier = supplierId;

    const items = await SupplierProduct.find(query)
      .populate('supplier', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: items });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const createSupplierProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { supplierId, productData } = req.body;

    if (!isValidObjectId(supplierId)) {
      return res.status(400).json({ success: false, message: 'Invalid supplier ID format' });
    }

    const supplier = await Supplier.findById(supplierId);
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    if (!productData?.name || !productData?.price || !productData?.image) {
      return res.status(400).json({ success: false, message: 'Missing required product data' });
    }

    const item = await SupplierProduct.create({
      supplier: supplierId,
      productData,
      status: 'pending',
    });

    res.status(201).json({ success: true, data: item });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const approveSupplierProduct = async (req: AuthRequest, res: Response) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid supplier product ID format' });
    }

    const item = await SupplierProduct.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Supplier product not found' });
    }

    if (item.status === 'approved' && item.publishedProductId) {
      return res.status(200).json({ success: true, data: item });
    }

    const createdProduct = await Product.create({
      ...item.productData,
      active: true,
      featured: item.productData.featured || false,
      onSale: item.productData.onSale || false,
      salePercentage: item.productData.salePercentage || 0,
      newArrival: item.productData.newArrival || false,
      inCollection: item.productData.inCollection || false,
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

export const rejectSupplierProduct = async (req: AuthRequest, res: Response) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid supplier product ID format' });
    }

    const item = await SupplierProduct.findByIdAndUpdate(
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
      return res.status(404).json({ success: false, message: 'Supplier product not found' });
    }

    res.status(200).json({ success: true, data: item });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};
