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


router.use(protect);


router.get('/', getFavorites);


router.get('/check/:productId', checkFavorite);


router.post('/toggle/:productId', toggleFavorite);


router.post('/:productId', addFavorite);


router.delete('/:productId', removeFavorite);

export default router;
