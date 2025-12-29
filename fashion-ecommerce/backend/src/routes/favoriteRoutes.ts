import express from 'express';
import {
  getFavorites,
  checkFavorite,
  addFavorite,
  removeFavorite,
  toggleFavorite,
} from '../controllers/favoriteController';
import { protect } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get user favorites
router.get('/', getFavorites);

// Check if product is favorited
router.get('/check/:productId', checkFavorite);

// Toggle favorite (recommended - add/remove in one call)
router.post('/toggle/:productId', toggleFavorite);

// Add to favorites
router.post('/:productId', addFavorite);

// Remove from favorites
router.delete('/:productId', removeFavorite);

export default router;
