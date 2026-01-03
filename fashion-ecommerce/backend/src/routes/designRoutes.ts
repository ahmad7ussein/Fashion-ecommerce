import express from 'express';
import {
  createDesign,
  getMyDesigns,
  getDesign,
  updateDesign,
  deleteDesign,
  getAllDesigns,
  publishDesign,
  addDesignToCart,
} from '../controllers/designController';
import { protect, authorize } from '../middleware/auth';
import { designValidation, validate } from '../middleware/validator';

const router = express.Router();



router.post('/', protect, designValidation, validate, createDesign);
router.get('/my-designs', protect, getMyDesigns);
router.post('/:id/add-to-cart', protect, addDesignToCart);
router.put('/:id/publish', protect, publishDesign);


router.get('/', protect, authorize('admin'), getAllDesigns);


router.get('/:id', protect, getDesign);
router.put('/:id', protect, updateDesign);
router.delete('/:id', protect, deleteDesign);

export default router;
