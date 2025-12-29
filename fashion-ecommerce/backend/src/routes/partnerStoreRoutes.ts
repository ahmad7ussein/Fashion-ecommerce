import express from 'express';
import {
  getPartnerStores,
  createPartnerStore,
  updatePartnerStore,
  updatePartnerStoreStatus,
  getPartnerAnalytics,
  trackPartnerClick,
  trackPartnerSale,
} from '../controllers/partnerStoreController';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

router.use(protect);
router.get('/', authorize('admin'), getPartnerStores);
router.post('/', authorize('admin'), createPartnerStore);
router.put('/:id', authorize('admin'), updatePartnerStore);
router.put('/:id/status', authorize('admin'), updatePartnerStoreStatus);
router.get('/:id/analytics', authorize('admin'), getPartnerAnalytics);
router.post('/:id/track-click', authorize('admin'), trackPartnerClick);
router.post('/:id/track-sale', authorize('admin'), trackPartnerSale);

export default router;
