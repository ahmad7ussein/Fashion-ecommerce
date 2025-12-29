import express from 'express';
import {
  register,
  login,
  getMe,
  updateProfile,
  googleAuth,
  forgotPassword,
  resetPassword,
} from '../controllers/authController';
import { protect } from '../middleware/auth';
import { registerValidation, loginValidation, validate } from '../middleware/validator';

const router = express.Router();

router.post('/register', registerValidation, validate, register);
router.post('/login', loginValidation, validate, login);
router.post('/google', googleAuth);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

export default router;

