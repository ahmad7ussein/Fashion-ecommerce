import express from 'express';
import {
  getRoleAssignments,
  createRoleAssignment,
  updateRoleAssignmentStatus,
  getMyRoleAssignments,
} from '../controllers/roleAssignmentController';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

router.use(protect);
router.get('/me', getMyRoleAssignments);
router.get('/', authorize('admin'), getRoleAssignments);
router.post('/', authorize('admin'), createRoleAssignment);
router.put('/:id/status', authorize('admin'), updateRoleAssignmentStatus);

export default router;
