import express from 'express';
import {
  createContactMessage,
  getContactMessages,
  getContactMessage,
  updateContactMessage,
  deleteContactMessage,
} from '../controllers/contactController';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

// Public route - anyone can send a contact message
router.post('/', createContactMessage);

// Protected routes - only admin and employee can access
router.get('/', protect, authorize('admin', 'employee'), getContactMessages);
router.get('/:id', protect, authorize('admin', 'employee'), getContactMessage);
router.put('/:id', protect, authorize('admin', 'employee'), updateContactMessage);
router.delete('/:id', protect, authorize('admin'), deleteContactMessage);

export default router;

