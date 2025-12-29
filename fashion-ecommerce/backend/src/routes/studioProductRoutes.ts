import express from 'express';
import { protect, authorize } from '../middleware/auth';
import {
  createStudioProduct,
  deleteStudioProduct,
  getActiveStudioProducts,
  getAllStudioProducts,
  getStudioProduct,
  updateStudioProduct,
} from '../controllers/studioProductController';

const router = express.Router();

// Public active list
router.get('/active', getActiveStudioProducts);

// Admin
router.use(protect, authorize('admin'));
router.get('/', getAllStudioProducts);
router.get('/:id', getStudioProduct);
router.post('/', createStudioProduct);
router.put('/:id', updateStudioProduct);
router.delete('/:id', deleteStudioProduct);

export default router;
