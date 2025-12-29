import express from 'express';
import {
  getVendorProducts,
  createVendorProduct,
  updateVendorProduct,
  approveVendorProduct,
  rejectVendorProduct,
  getVendorOrders,
  getVendorReport,
} from '../controllers/vendorController';
import { protect, authorize } from '../middleware/auth';
import { requireRoleAssignment } from '../middleware/roleAssignments';

const router = express.Router();

router.use(protect, requireRoleAssignment('service_provider'));

router.get('/products', getVendorProducts);
router.post('/products', createVendorProduct);
router.put('/products/:id', updateVendorProduct);
router.get('/orders', getVendorOrders);
router.get('/reports', getVendorReport);

router.put('/products/:id/approve', authorize('admin'), approveVendorProduct);
router.put('/products/:id/reject', authorize('admin'), rejectVendorProduct);

export default router;
