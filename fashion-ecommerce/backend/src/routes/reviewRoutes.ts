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


router.get('/', getApprovedReviews);


router.post('/', protect, createReview);
router.get('/my-reviews', protect, getMyReviews);
router.delete('/:id', protect, deleteReview);


router.get('/all', protect, authorize('admin', 'employee'), getAllReviews);
router.put('/:id/status', protect, authorize('admin', 'employee'), updateReviewStatus);

export default router;

