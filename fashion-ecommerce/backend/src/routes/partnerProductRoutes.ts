import express from 'express';
import {
  getPartnerProducts,
  createPartnerProduct,
  approvePartnerProduct,
  rejectPartnerProduct,
} from '../controllers/partnerStoreController';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

router.use(protect);
router.get('/', authorize('admin'), getPartnerProducts);
router.post('/', authorize('admin'), createPartnerProduct);
router.put('/:id/approve', authorize('admin'), approvePartnerProduct);
router.put('/:id/reject', authorize('admin'), rejectPartnerProduct);

export default router;
