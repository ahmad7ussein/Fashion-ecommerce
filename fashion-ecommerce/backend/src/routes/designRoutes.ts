import express from 'express';
import {
  createDesign,
  getMyDesigns,
  getDesign,
  updateDesign,
  deleteDesign,
  getAllDesigns,
  publishDesign,
} from '../controllers/designController';
import { protect, authorize } from '../middleware/auth';
import { designValidation, validate } from '../middleware/validator';

const router = express.Router();

// FIXED: Order matters - specific routes must come before parameterized routes
// User routes
router.post('/', protect, designValidation, validate, createDesign);
router.get('/my-designs', protect, getMyDesigns);
router.put('/:id/publish', protect, publishDesign);

// Admin routes (must come before /:id to avoid route conflicts)
router.get('/', protect, authorize('admin'), getAllDesigns);

// User routes (parameterized routes come last)
router.get('/:id', protect, getDesign);
router.put('/:id', protect, updateDesign);
router.delete('/:id', protect, deleteDesign);

export default router;

