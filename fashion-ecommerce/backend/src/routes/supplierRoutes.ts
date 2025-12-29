import express from 'express';
import {
  getSuppliers,
  createSupplier,
  updateSupplier,
  updateSupplierStatus,
  getSupplierAnalytics,
} from '../controllers/supplierController';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

router.use(protect);
router.get('/', authorize('admin'), getSuppliers);
router.post('/', authorize('admin'), createSupplier);
router.put('/:id', authorize('admin'), updateSupplier);
router.put('/:id/status', authorize('admin'), updateSupplierStatus);
router.get('/:id/analytics', authorize('admin'), getSupplierAnalytics);

export default router;
