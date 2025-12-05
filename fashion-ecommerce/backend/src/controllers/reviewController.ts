import { Response } from 'express';
import Review from '../models/Review';
import { AuthRequest } from '../middleware/auth';

// @desc    Create new review
// @route   POST /api/reviews
// @access  Private
export const createReview = async (req: AuthRequest, res: Response) => {
  try {
    // VALIDATION: Ensure user is authenticated
    if (!req.user?._id) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    const { order, rating, title, comment } = req.body;

    if (!rating || !title || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Rating, title, and comment are required',
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5',
      });
    }

    // VALIDATION: Validate order ID format if provided
    if (order && !order.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID format',
      });
    }

    const review = await Review.create({
      user: req.user._id as any,
      order: order || undefined,
      rating,
      title,
      comment,
      status: 'pending',
    });

    console.log('✅ Review created:', {
      reviewId: review._id,
      userId: req.user?._id,
      status: review.status,
    });

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully. It will be published after admin approval.',
      data: review,
    });
  } catch (error: any) {
    console.error('❌ Error creating review:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Get approved reviews (public)
// @route   GET /api/reviews
// @access  Public
export const getApprovedReviews = async (req: any, res: Response) => {
  try {
    const { limit = 10, page = 1 } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const reviews = await Review.find({ status: 'approved' })
      .populate('user', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Review.countDocuments({ status: 'approved' });

    res.status(200).json({
      success: true,
      count: reviews.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: reviews,
    });
  } catch (error: any) {
    console.error('❌ Error fetching reviews:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Get user's reviews
// @route   GET /api/reviews/my-reviews
// @access  Private
export const getMyReviews = async (req: AuthRequest, res: Response) => {
  try {
    const reviews = await Review.find({ user: req.user?._id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews,
    });
  } catch (error: any) {
    console.error('❌ Error fetching user reviews:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Get all reviews (Admin)
// @route   GET /api/reviews/all
// @access  Private/Admin
export const getAllReviews = async (req: AuthRequest, res: Response) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const query: any = {};
    if (status && status !== 'all') {
      query.status = status;
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const reviews = await Review.find(query)
      .populate('user', 'firstName lastName email')
      .populate('order', 'orderNumber')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Review.countDocuments(query);

    res.status(200).json({
      success: true,
      count: reviews.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: reviews,
    });
  } catch (error: any) {
    console.error('❌ Error fetching all reviews:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Update review status (Admin)
// @route   PUT /api/reviews/:id/status
// @access  Private/Admin
export const updateReviewStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, adminResponse } = req.body;

    // VALIDATION: Validate ObjectId format
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid review ID format',
      });
    }

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be pending, approved, or rejected',
      });
    }

    const review = await Review.findByIdAndUpdate(
      id,
      { status, adminResponse: adminResponse || undefined },
      { new: true, runValidators: true }
    ).populate('user', 'firstName lastName email');

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    console.log('✅ Review status updated:', {
      reviewId: review._id,
      status: review.status,
    });

    res.status(200).json({
      success: true,
      message: 'Review status updated successfully',
      data: review,
    });
  } catch (error: any) {
    console.error('❌ Error updating review status:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Delete review
// @route   DELETE /api/reviews/:id
// @access  Private
export const deleteReview = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // VALIDATION: Validate ObjectId format
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid review ID format',
      });
    }

    const review = await Review.findById(id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    // Check if user owns the review or is admin
    if (
      review.user.toString() !== (req.user?._id as any)?.toString() &&
      req.user?.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this review',
      });
    }

    await review.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully',
    });
  } catch (error: any) {
    console.error('❌ Error deleting review:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

