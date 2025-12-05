import express from 'express';
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
  getGenders,
} from '../controllers/productController';
import { protect, authorize } from '../middleware/auth';
import { productValidation, validate } from '../middleware/validator';

const router = express.Router();

// Public routes
// FIXED: Order matters - specific routes must come before parameterized routes
router.get('/meta/categories', getCategories);
router.get('/meta/genders', getGenders);
router.get('/', getProducts);
router.get('/:id', getProduct);

// Admin and Employee routes (both can manage products)
router.post('/', protect, authorize('admin', 'employee'), productValidation, validate, createProduct);
router.put('/:id', protect, authorize('admin', 'employee'), updateProduct);
router.delete('/:id', protect, authorize('admin', 'employee'), deleteProduct);

export default router;

