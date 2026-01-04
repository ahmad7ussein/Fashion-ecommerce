"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toggleFavorite = exports.removeFavorite = exports.addFavorite = exports.checkFavorite = exports.getFavorites = void 0;
const Favorite_1 = __importDefault(require("../models/Favorite"));
const Product_1 = __importDefault(require("../models/Product"));
const mongoose_1 = __importDefault(require("mongoose"));
const getFavorites = async (req, res) => {
    try {
        if (mongoose_1.default.connection.readyState !== 1) {
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
        const favorites = await Favorite_1.default.find({ user: req.user._id })
            .populate('product')
            .sort({ createdAt: -1 })
            .maxTimeMS(20000);
        const favoriteProducts = favorites.map(fav => fav.product).filter(Boolean);
        res.status(200).json({
            success: true,
            count: favoriteProducts.length,
            data: favoriteProducts,
        });
    }
    catch (error) {
        console.error('Error getting favorites:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
};
exports.getFavorites = getFavorites;
const checkFavorite = async (req, res) => {
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
        const favorite = await Favorite_1.default.findOne({
            user: req.user._id,
            product: productId,
        }).maxTimeMS(20000);
        res.status(200).json({
            success: true,
            isFavorite: !!favorite,
        });
    }
    catch (error) {
        console.error('Error checking favorite:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
};
exports.checkFavorite = checkFavorite;
const addFavorite = async (req, res) => {
    try {
        if (mongoose_1.default.connection.readyState !== 1) {
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
        const product = await Product_1.default.findById(productId).maxTimeMS(20000);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found',
            });
        }
        const existingFavorite = await Favorite_1.default.findOne({
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
        const favorite = await Favorite_1.default.create({
            user: req.user._id,
            product: productId,
        });
        res.status(201).json({
            success: true,
            message: 'Product added to favorites',
            data: favorite,
        });
    }
    catch (error) {
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
exports.addFavorite = addFavorite;
const removeFavorite = async (req, res) => {
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
        const favorite = await Favorite_1.default.findOneAndDelete({
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
    }
    catch (error) {
        console.error('Error removing favorite:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
};
exports.removeFavorite = removeFavorite;
const toggleFavorite = async (req, res) => {
    try {
        if (mongoose_1.default.connection.readyState !== 1) {
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
        const product = await Product_1.default.findById(productId).maxTimeMS(20000);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found',
            });
        }
        const filter = { user: req.user._id, product: productId };
        const removed = await Favorite_1.default.findOneAndDelete(filter).maxTimeMS(20000);
        if (removed) {
            return res.status(200).json({
                success: true,
                message: 'Product removed from favorites',
                isFavorite: false,
            });
        }
        try {
            const favorite = await Favorite_1.default.create(filter);
            return res.status(201).json({
                success: true,
                message: 'Product added to favorites',
                isFavorite: true,
                data: favorite,
            });
        }
        catch (err) {
            if (err?.code === 11000) {
                return res.status(200).json({
                    success: true,
                    message: 'Product already in favorites',
                    isFavorite: true,
                });
            }
            throw err;
        }
    }
    catch (error) {
        console.error('Error toggling favorite:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
};
exports.toggleFavorite = toggleFavorite;
