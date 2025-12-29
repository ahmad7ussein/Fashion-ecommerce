import express from 'express';
import {
  getSupplierProducts,
  createSupplierProduct,
  approveSupplierProduct,
  rejectSupplierProduct,
} from '../controllers/supplierController';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

router.use(protect);
router.get('/', authorize('admin'), getSupplierProducts);
router.post('/', authorize('admin'), createSupplierProduct);
router.put('/:id/approve', authorize('admin'), approveSupplierProduct);
router.put('/:id/reject', authorize('admin'), rejectSupplierProduct);

export default router;
