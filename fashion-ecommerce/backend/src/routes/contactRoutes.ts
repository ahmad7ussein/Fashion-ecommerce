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


router.post('/', createContactMessage);


router.get('/', protect, authorize('admin', 'employee'), getContactMessages);
router.get('/:id', protect, authorize('admin', 'employee'), getContactMessage);
router.put('/:id', protect, authorize('admin', 'employee'), updateContactMessage);
router.delete('/:id', protect, authorize('admin'), deleteContactMessage);

export default router;

