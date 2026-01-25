"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteReview = exports.updateReviewStatus = exports.getAllReviews = exports.getMyReviews = exports.getApprovedReviews = exports.createReview = void 0;
const Review_1 = __importDefault(require("../models/Review"));
const createReview = async (req, res) => {
    try {
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
        if (order && !order.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid order ID format',
            });
        }
        const review = await Review_1.default.create({
            user: req.user._id,
            order: order || undefined,
            rating,
            title,
            comment,
            status: 'pending',
        });
        console.log(' Review created:', {
            reviewId: review._id,
            userId: req.user?._id,
            status: review.status,
        });
        res.status(201).json({
            success: true,
            message: 'Review submitted successfully. It will be published after admin approval.',
            data: review,
        });
    }
    catch (error) {
        console.error(' Error creating review:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
};
exports.createReview = createReview;
const getApprovedReviews = async (req, res) => {
    try {
        const { limit = 10, page = 1 } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        const reviews = await Review_1.default.find({ status: 'approved' })
            .select('user rating title comment createdAt')
            .populate('user', 'firstName lastName email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum)
            .lean()
            .maxTimeMS(10000);
        const total = await Review_1.default.countDocuments({ status: 'approved' });
        res.status(200).json({
            success: true,
            count: reviews.length,
            total,
            page: pageNum,
            pages: Math.ceil(total / limitNum),
            data: reviews,
        });
    }
    catch (error) {
        console.error(' Error fetching reviews:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
};
exports.getApprovedReviews = getApprovedReviews;
const getMyReviews = async (req, res) => {
    try {
        const reviews = await Review_1.default.find({ user: req.user?._id })
            .select('rating title comment status createdAt')
            .sort({ createdAt: -1 })
            .lean()
            .maxTimeMS(10000);
        res.status(200).json({
            success: true,
            count: reviews.length,
            data: reviews,
        });
    }
    catch (error) {
        console.error(' Error fetching user reviews:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
};
exports.getMyReviews = getMyReviews;
const getAllReviews = async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        const query = {};
        if (status && status !== 'all') {
            query.status = status;
        }
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        const reviews = await Review_1.default.find(query)
            .select('user order rating title comment status createdAt')
            .populate('user', 'firstName lastName email')
            .populate('order', 'orderNumber')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum)
            .lean()
            .maxTimeMS(10000);
        const total = await Review_1.default.countDocuments(query);
        res.status(200).json({
            success: true,
            count: reviews.length,
            total,
            page: pageNum,
            pages: Math.ceil(total / limitNum),
            data: reviews,
        });
    }
    catch (error) {
        console.error(' Error fetching all reviews:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
};
exports.getAllReviews = getAllReviews;
const updateReviewStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, adminResponse } = req.body;
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
        const review = await Review_1.default.findByIdAndUpdate(id, { status, adminResponse: adminResponse || undefined }, { new: true, runValidators: true }).populate('user', 'firstName lastName email');
        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found',
            });
        }
        console.log(' Review status updated:', {
            reviewId: review._id,
            status: review.status,
        });
        res.status(200).json({
            success: true,
            message: 'Review status updated successfully',
            data: review,
        });
    }
    catch (error) {
        console.error(' Error updating review status:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
};
exports.updateReviewStatus = updateReviewStatus;
const deleteReview = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid review ID format',
            });
        }
        const review = await Review_1.default.findById(id);
        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found',
            });
        }
        if (review.user.toString() !== req.user?._id?.toString() &&
            req.user?.role !== 'admin') {
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
    }
    catch (error) {
        console.error(' Error deleting review:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
};
exports.deleteReview = deleteReview;
