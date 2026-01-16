"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = exports.optionalAuth = exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const env_1 = __importDefault(require("../config/env"));
const protect = async (req, res, next) => {
    try {
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to access this route',
            });
        }
        try {
            const decoded = jsonwebtoken_1.default.verify(token, env_1.default.jwtSecret);
            const user = await User_1.default.findById(decoded.id).select('-password');
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found',
                });
            }
            if (user.isDeleted) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found',
                });
            }
            req.user = user;
            next();
        }
        catch (error) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token',
            });
        }
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Server error in authentication',
        });
    }
};
exports.protect = protect;
const optionalAuth = async (req, res, next) => {
    try {
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }
        if (!token) {
            return next();
        }
        try {
            const decoded = jsonwebtoken_1.default.verify(token, env_1.default.jwtSecret);
            const user = await User_1.default.findById(decoded.id).select('-password');
            if (user && !user.isDeleted) {
                req.user = user;
            }
            next();
        }
        catch (error) {
            console.log('Optional auth: Invalid token, continuing as guest');
            next();
        }
    }
    catch (error) {
        next();
    }
};
exports.optionalAuth = optionalAuth;
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized',
            });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `User role '${req.user.role}' is not authorized to access this route`,
            });
        }
        next();
    };
};
exports.authorize = authorize;
