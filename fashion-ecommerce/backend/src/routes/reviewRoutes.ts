import express from 'express';
import {
  createReview,
  getApprovedReviews,
  getMyReviews,
  getAllReviews,
  updateReviewStatus,
  deleteReview,
} from '../controllers/reviewController';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

// Public route - Get approved reviews
router.get('/', getApprovedReviews);

// User routes
router.post('/', protect, createReview);
router.get('/my-reviews', protect, getMyReviews);
router.delete('/:id', protect, deleteReview);

// Employee/Admin routes - Employees can manage reviews
router.get('/all', protect, authorize('admin', 'employee'), getAllReviews);
router.put('/:id/status', protect, authorize('admin', 'employee'), updateReviewStatus);

export default router;

