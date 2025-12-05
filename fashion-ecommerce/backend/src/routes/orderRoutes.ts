import express from 'express';
import {
  createOrder,
  getMyOrders,
  getOrder,
  getAllOrders,
  updateOrderStatus,
  updatePaymentStatus,
  deleteOrder,
  getOrderStats,
} from '../controllers/orderController';
import { protect, authorize } from '../middleware/auth';
import { orderValidation, validate } from '../middleware/validator';

const router = express.Router();

// Customer routes
router.post('/', protect, orderValidation, validate, createOrder);
router.get('/my-orders', protect, getMyOrders);

// Admin/Employee routes (must be before /:id to avoid route conflicts)
router.get('/', protect, authorize('admin', 'employee'), getAllOrders);
router.get('/stats/overview', protect, authorize('admin'), getOrderStats);

// Customer/Admin/Employee routes
router.get('/:id', protect, getOrder);
router.put('/:id/status', protect, authorize('admin', 'employee'), updateOrderStatus);
router.put('/:id/payment', protect, authorize('admin'), updatePaymentStatus);
router.delete('/:id', protect, authorize('admin'), deleteOrder);

export default router;

