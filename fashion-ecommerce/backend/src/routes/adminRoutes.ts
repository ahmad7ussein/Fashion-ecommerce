import express from 'express';
import {
  getDashboardStats,
  getAllUsers,
  getUser,
  updateUserRole,
  deleteUser,
  getSalesReport,
  createEmployee,
} from '../controllers/adminController';
import { getAllEmployeeActivities } from '../controllers/employeeActivityController';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();


router.use(protect);


router.get('/users', authorize('admin', 'employee'), getAllUsers);
router.get('/users/:id', authorize('admin', 'employee'), getUser);


router.get('/dashboard/stats', authorize('admin'), getDashboardStats);
router.put('/users/:id/role', authorize('admin'), updateUserRole);
router.delete('/users/:id', authorize('admin'), deleteUser);
router.post('/employees', authorize('admin'), createEmployee);
router.get('/reports/sales', authorize('admin'), getSalesReport);
router.get('/employee-activities', authorize('admin'), getAllEmployeeActivities);

export default router;

