import express from 'express';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from '../controllers/notificationController';
import { protect } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.get('/', protect, getNotifications);
router.put('/:id/read', protect, markAsRead);
router.put('/read-all', protect, markAllAsRead);
router.delete('/:id', protect, deleteNotification);

export default router;

