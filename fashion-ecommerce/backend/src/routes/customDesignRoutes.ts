import express from 'express';
import {
  createCustomDesignRequest,
  getCustomDesignRequests,
  updateCustomDesignRequestStatus,
} from '../controllers/customDesignController';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

router.use(protect);
router.post('/', createCustomDesignRequest);
router.get('/', authorize('admin'), getCustomDesignRequests);
router.put('/:id/status', authorize('admin'), updateCustomDesignRequestStatus);

export default router;
