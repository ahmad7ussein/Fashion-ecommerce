import express from 'express';
import {
  getSimilarProductsSettings,
  updateSimilarProductsSettings,
  getSimilarProducts,
  getVirtualExperienceSettings,
  updateVirtualExperienceSettings,
  logVirtualExperienceUsage,
  logVirtualExperienceConversion,
  getCustomDesignSettings,
  updateCustomDesignSettings,
} from '../controllers/featureControlController';
import { protect, authorize, optionalAuth } from '../middleware/auth';

const router = express.Router();

router.get('/similar-products/recommendations', optionalAuth, getSimilarProducts);

router.use(protect);
router.get('/similar-products', authorize('admin'), getSimilarProductsSettings);
router.put('/similar-products', authorize('admin'), updateSimilarProductsSettings);

router.get('/virtual-experience', authorize('admin'), getVirtualExperienceSettings);
router.put('/virtual-experience', authorize('admin'), updateVirtualExperienceSettings);
router.post('/virtual-experience/usage', logVirtualExperienceUsage);
router.post('/virtual-experience/conversion', logVirtualExperienceConversion);

router.get('/custom-design', authorize('admin'), getCustomDesignSettings);
router.put('/custom-design', authorize('admin'), updateCustomDesignSettings);

export default router;
