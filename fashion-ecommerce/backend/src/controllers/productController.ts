import { Request, Response } from 'express';
import Product from '../models/Product';
import { AuthRequest } from '../middleware/auth';
import { logEmployeeActivity } from './employeeActivityController';
import mongoose from 'mongoose';

// @desc    Get all products with filters
// @route   GET /api/products
// @access  Public
export const getProducts = async (req: Request, res: Response) => {
  try {
    const {
      search,
      category,
      gender,
      season,
      style,
      occasion,
      sortBy,
      page = 1,
      limit = 50,
    } = req.query;

    // Build query
    const query: any = { active: true };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (category && category !== 'all') {
      query.category = category;
    }

    if (gender && gender !== 'all') {
      query.gender = gender;
    }

    if (season && season !== 'all') {
      query.$or = [{ season }, { season: 'All Season' }];
    }

    if (style && style !== 'all') {
      query.style = style;
    }

    if (occasion && occasion !== 'all') {
      query.occasion = occasion;
    }

    // Sorting
    let sort: any = {};
    if (sortBy === 'price-low') {
      sort.price = 1;
    } else if (sortBy === 'price-high') {
      sort.price = -1;
    } else if (sortBy === 'featured') {
      sort.featured = -1;
    } else {
      sort.createdAt = -1;
    }

    // Pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const products = await Product.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    const total = await Product.countDocuments(query);

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: products,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
export const getProduct = async (req: Request, res: Response) => {
  try {
    const productId = req.params.id;

    // Check if it's a MongoDB ObjectId (24 hex characters)
    const isObjectId = productId && productId.match(/^[0-9a-fA-F]{24}$/);
    
    // Check if it's a numeric ID (for fallback catalog)
    const isNumericId = productId && /^\d+$/.test(productId);

    // If neither ObjectId nor numeric, return error
    if (!isObjectId && !isNumericId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format',
      });
    }

    let product = null;

    // Try to find by MongoDB ObjectId first
    if (isObjectId) {
      product = await Product.findById(productId);
    }

    // If not found and it's a numeric ID, it might be from fallback catalog
    // In this case, we return 404 so frontend can use fallback
    if (!product && isNumericId) {
      return res.status(404).json({
        success: false,
        message: 'Product not found. This ID may be from the fallback catalog.',
      });
    }

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Create product
// @route   POST /api/products
// @access  Private/Admin
export const createProduct = async (req: AuthRequest, res: Response) => {
  try {
    const product = await Product.create(req.body);

    // FIXED: Log employee activity for product creation
    if (req.user?._id && (req.user.role === 'admin' || req.user.role === 'employee')) {
      await logEmployeeActivity(
        req.user._id as any,
        'product_added',
        `Added new product: ${product.name}`,
        'Product',
        product._id as any,
        { productName: product.name, productCategory: product.category }
      );
    }

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private/Admin
export const updateProduct = async (req: AuthRequest, res: Response) => {
  try {
    // VALIDATION: Validate ObjectId format
    if (!req.params.id || !req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format',
      });
    }

    // FIXED: Get old product to track stock changes
    const oldProduct = await Product.findById(req.params.id);
    if (!oldProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    const oldStock = oldProduct.stock;
    const newStock = req.body.stock !== undefined ? req.body.stock : oldStock;

    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // FIXED: Log employee activity for product update with stock tracking
    if (req.user?._id && (req.user.role === 'admin' || req.user.role === 'employee')) {
      const activityDescription = oldStock !== newStock
        ? `Updated product: ${product.name} (Stock: ${oldStock} → ${newStock})`
        : `Updated product: ${product.name}`;
      
      await logEmployeeActivity(
        req.user._id as any,
        oldStock !== newStock ? 'stock_updated' : 'product_updated',
        activityDescription,
        'Product',
        product._id as any,
        { 
          productName: product.name,
          oldStock,
          newStock,
          stockChange: newStock - oldStock
        }
      );
    }

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: product,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private/Admin
export const deleteProduct = async (req: AuthRequest, res: Response) => {
  try {
    // VALIDATION: Validate ObjectId format
    if (!req.params.id || !req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format',
      });
    }

    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // FIXED: Log employee activity before deletion
    if (req.user?._id && (req.user.role === 'admin' || req.user.role === 'employee')) {
      await logEmployeeActivity(
        req.user._id as any,
        'product_deleted',
        `Deleted product: ${product.name}`,
        'Product',
        product._id as any,
        { productName: product.name }
      );
    }

    await Product.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Get product categories
// @route   GET /api/products/meta/categories
// @access  Public
export const getCategories = async (req: Request, res: Response) => {
  try {
    const categories = await Product.distinct('category');

    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Get product genders
// @route   GET /api/products/meta/genders
// @access  Public
export const getGenders = async (req: Request, res: Response) => {
  try {
    const genders = await Product.distinct('gender');

    res.status(200).json({
      success: true,
      data: genders,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

