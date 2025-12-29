import express from 'express';
import {
  getPartnerStoreForUser,
  getPartnerStoreProductsForUser,
  createPartnerProductForUser,
  updatePartnerProductForUser,
  getPartnerAnalyticsForUser,
} from '../controllers/partnerPanelController';
import { protect } from '../middleware/auth';
import { requireRoleAssignment } from '../middleware/roleAssignments';

const router = express.Router();

router.use(protect, requireRoleAssignment('partner'));

router.get('/store', getPartnerStoreForUser);
router.get('/products', getPartnerStoreProductsForUser);
router.post('/products', createPartnerProductForUser);
router.put('/products/:id', updatePartnerProductForUser);
router.get('/analytics', getPartnerAnalyticsForUser);

export default router;
