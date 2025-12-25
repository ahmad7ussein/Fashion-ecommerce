import { Response } from 'express';
import Favorite from '../models/Favorite';
import Product from '../models/Product';
import { AuthRequest } from '../middleware/auth';
import mongoose from 'mongoose';

// @desc    Get user favorites
// @route   GET /api/favorites
// @access  Private
export const getFavorites = async (req: AuthRequest, res: Response) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Database connection not available. Please try again later.',
      });
    }

    if (!req.user?._id) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    const favorites = await Favorite.find({ user: req.user._id })
      .populate('product')
      .sort({ createdAt: -1 })
      .maxTimeMS(20000);

    const favoriteProducts = favorites.map(fav => fav.product).filter(Boolean);

    res.status(200).json({
      success: true,
      count: favoriteProducts.length,
      data: favoriteProducts,
    });
  } catch (error: any) {
    console.error('Error getting favorites:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Check if product is favorited
// @route   GET /api/favorites/check/:productId
// @access  Private
export const checkFavorite = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    const { productId } = req.params;

    if (!productId || !productId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format',
      });
    }

    const favorite = await Favorite.findOne({
      user: req.user._id,
      product: productId,
    }).maxTimeMS(20000);

    res.status(200).json({
      success: true,
      isFavorite: !!favorite,
    });
  } catch (error: any) {
    console.error('Error checking favorite:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Add product to favorites
// @route   POST /api/favorites/:productId
// @access  Private
export const addFavorite = async (req: AuthRequest, res: Response) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Database connection not available. Please try again later.',
      });
    }

    if (!req.user?._id) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    const { productId } = req.params;

    if (!productId || !productId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format',
      });
    }

    // Check if product exists
    const product = await Product.findById(productId).maxTimeMS(20000);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Check if already favorited
    const existingFavorite = await Favorite.findOne({
      user: req.user._id,
      product: productId,
    }).maxTimeMS(20000);

    if (existingFavorite) {
      return res.status(200).json({
        success: true,
        message: 'Product already in favorites',
        data: existingFavorite,
      });
    }

    // Create favorite
    const favorite = await Favorite.create({
      user: req.user._id,
      product: productId,
    });

    res.status(201).json({
      success: true,
      message: 'Product added to favorites',
      data: favorite,
    });
  } catch (error: any) {
    // Handle duplicate key error (unique index)
    if (error.code === 11000) {
      return res.status(200).json({
        success: true,
        message: 'Product already in favorites',
      });
    }
    console.error('Error adding favorite:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Remove product from favorites
// @route   DELETE /api/favorites/:productId
// @access  Private
export const removeFavorite = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    const { productId } = req.params;

    if (!productId || !productId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format',
      });
    }

    const favorite = await Favorite.findOneAndDelete({
      user: req.user._id,
      product: productId,
    }).maxTimeMS(20000);

    if (!favorite) {
      return res.status(404).json({
        success: false,
        message: 'Favorite not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Product removed from favorites',
    });
  } catch (error: any) {
    console.error('Error removing favorite:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Toggle favorite (add if not exists, remove if exists)
// @route   POST /api/favorites/toggle/:productId
// @access  Private
export const toggleFavorite = async (req: AuthRequest, res: Response) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Database connection not available. Please try again later.',
      });
    }

    if (!req.user?._id) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    const { productId } = req.params;

    if (!productId || !productId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format',
      });
    }

    // Check if product exists
    const product = await Product.findById(productId).maxTimeMS(20000);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Deterministic toggle based solely on DB state
    const filter = { user: req.user._id, product: productId };

    // Attempt to remove first; if a doc existed, we are now unfavorited
    const removed = await Favorite.findOneAndDelete(filter).maxTimeMS(20000);
    if (removed) {
      return res.status(200).json({
        success: true,
        message: 'Product removed from favorites',
        isFavorite: false,
      });
    }

    // Not found: create the favorite (unique index enforces idempotency)
    try {
      const favorite = await Favorite.create(filter);
      return res.status(201).json({
        success: true,
        message: 'Product added to favorites',
        isFavorite: true,
        data: favorite,
      });
    } catch (err: any) {
      // If another request added it in the meantime, treat as favorited
      if (err?.code === 11000) {
        return res.status(200).json({
          success: true,
          message: 'Product already in favorites',
          isFavorite: true,
        });
      }
      throw err;
    }
  } catch (error: any) {
    console.error('Error toggling favorite:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};
