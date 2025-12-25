import { Response } from 'express';
import Design from '../models/Design';
import StudioProduct from '../models/StudioProduct';
import Cart from '../models/Cart';
import { AuthRequest } from '../middleware/auth';
import mongoose from 'mongoose';

// @desc    Create new design
// @route   POST /api/designs
// @access  Private
export const createDesign = async (req: AuthRequest, res: Response) => {
  try {
    // VALIDATION: Ensure user is authenticated
    if (!req.user?._id) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    const { name, baseProduct, baseProductId, elements, thumbnail, designImageURL, designMetadata, userDescription } = req.body;

    // VALIDATION: Validate status enum
    const validStatuses = ['draft', 'published', 'archived'];
    const designStatus = 'draft';

    if (!baseProductId || !mongoose.Types.ObjectId.isValid(baseProductId)) {
      return res.status(400).json({ success: false, message: 'Invalid base product id' });
    }

    const studioProduct = await StudioProduct.findOne({ _id: baseProductId, active: true });
    if (!studioProduct) {
      return res.status(404).json({ success: false, message: 'Base studio product not found or inactive' });
    }

    const design = await Design.create({
      user: req.user._id as any,
      name,
      baseProduct: baseProduct || { type: studioProduct.type, color: studioProduct.colors?.[0] || 'white', size: studioProduct.sizes?.[0] || 'M' },
      baseProductId: studioProduct._id,
      elements,
      thumbnail,
      designImageURL,
      designMetadata,
      userDescription,
      price: studioProduct.price, // server-side price
      status: designStatus,
      type: 'manual',
    });

    res.status(201).json({
      success: true,
      message: 'Design created successfully',
      data: design,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Get user designs
// @route   GET /api/designs/my-designs
// @access  Private
export const getMyDesigns = async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.query;

    const query: any = { user: req.user?._id };
    if (status && status !== 'all') {
      query.status = status;
    }

    const designs = await Design.find(query).sort({ createdAt: -1 }).allowDiskUse(true);

    res.status(200).json({
      success: true,
      count: designs.length,
      data: designs,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Add design to cart
// @route   POST /api/designs/:id/add-to-cart
// @access  Private
export const addDesignToCart = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const designId = req.params.id;
    const { quantity = 1, size, color } = req.body;

    if (!designId || !designId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ success: false, message: 'Invalid design ID format' });
    }

    const design = await Design.findById(designId);
    if (!design) {
      return res.status(404).json({ success: false, message: 'Design not found' });
    }
    if (design.user.toString() !== (req.user._id as any).toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to use this design' });
    }

    const studioProduct = design.baseProductId ? await StudioProduct.findOne({ _id: design.baseProductId, active: true }) : null;
    if (!studioProduct) {
      return res.status(404).json({ success: false, message: 'Base studio product not available' });
    }

    const finalSize = size || design.baseProduct.size || studioProduct.sizes?.[0] || 'M';
    const finalColor = color || design.baseProduct.color || studioProduct.colors?.[0] || 'white';
    const cart = await Cart.findOneAndUpdate(
      { user: req.user._id as any },
      {
        $setOnInsert: { user: req.user._id as any, items: [] },
      },
      { upsert: true, new: true }
    );

    const existingIndex = cart.items.findIndex((i: any) => i.design?.toString() === design._id.toString());
    if (existingIndex >= 0) {
      cart.items[existingIndex].quantity += Math.max(1, Number(quantity) || 1);
      cart.items[existingIndex].size = finalSize;
      cart.items[existingIndex].color = finalColor;
    } else {
      cart.items.push({
        design: design._id as any,
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
  } catch (error: any) {
    console.error('Error adding design to cart', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Get single design
// @route   GET /api/designs/:id
// @access  Private
export const getDesign = async (req: AuthRequest, res: Response) => {
  try {
    // VALIDATION: Validate ObjectId format
    if (!req.params.id || !req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid design ID format',
      });
    }

    const design = await Design.findById(req.params.id).populate('user', 'firstName lastName email');

    if (!design) {
      return res.status(404).json({
        success: false,
        message: 'Design not found',
      });
    }

    // Check if user owns this design or is admin
    if (
      design.user._id.toString() !== (req.user?._id as any)?.toString() &&
      req.user?.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this design',
      });
    }

    res.status(200).json({
      success: true,
      data: design,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Update design
// @route   PUT /api/designs/:id
// @access  Private
export const updateDesign = async (req: AuthRequest, res: Response) => {
  try {
    // VALIDATION: Validate ObjectId format
    if (!req.params.id || !req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid design ID format',
      });
    }

    let design = await Design.findById(req.params.id);

    if (!design) {
      return res.status(404).json({
        success: false,
        message: 'Design not found',
      });
    }

    // Check if user owns this design
    if (design.user.toString() !== (req.user?._id as any)?.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this design',
      });
    }

    design = await Design.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: 'Design updated successfully',
      data: design,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Delete design
// @route   DELETE /api/designs/:id
// @access  Private
export const deleteDesign = async (req: AuthRequest, res: Response) => {
  try {
    // VALIDATION: Validate ObjectId format
    if (!req.params.id || !req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid design ID format',
      });
    }

    const design = await Design.findById(req.params.id);

    if (!design) {
      return res.status(404).json({
        success: false,
        message: 'Design not found',
      });
    }

    // Check if user owns this design
    if (design.user.toString() !== (req.user?._id as any)?.toString()) {
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
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Get all designs (Admin)
// @route   GET /api/designs
// @access  Private/Admin
export const getAllDesigns = async (req: AuthRequest, res: Response) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const query: any = {};
    if (status && status !== 'all') {
      query.status = status;
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const designs = await Design.find(query)
      .sort({ createdAt: -1 })
      .allowDiskUse(true)
      .skip(skip)
      .limit(limitNum)
      .populate('user', 'firstName lastName email');

    const total = await Design.countDocuments(query);

    res.status(200).json({
      success: true,
      count: designs.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: designs,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Publish design
// @route   PUT /api/designs/:id/publish
// @access  Private
export const publishDesign = async (req: AuthRequest, res: Response) => {
  try {
    // VALIDATION: Validate ObjectId format
    if (!req.params.id || !req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid design ID format',
      });
    }

    const design = await Design.findById(req.params.id);

    if (!design) {
      return res.status(404).json({
        success: false,
        message: 'Design not found',
      });
    }

    // Check if user owns this design
    if (design.user.toString() !== (req.user?._id as any)?.toString()) {
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
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};
