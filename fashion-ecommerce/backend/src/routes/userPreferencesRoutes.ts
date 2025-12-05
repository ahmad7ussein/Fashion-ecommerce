import express from 'express';
import {
  getUserPreferences,
  updateUserPreferences,
} from '../controllers/userPreferencesController';
import { protect } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(protect);

router.get('/', getUserPreferences);
router.put('/', updateUserPreferences);

export default router;

