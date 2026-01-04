"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteNotification = exports.markAllAsRead = exports.markAsRead = exports.getNotifications = void 0;
const Notification_1 = __importDefault(require("../models/Notification"));
const getNotifications = async (req, res) => {
    try {
        const { read, limit = 50, page = 1 } = req.query;
        if (!req.user?._id) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated',
            });
        }
        const query = { user: req.user._id };
        if (read !== undefined) {
            query.read = read === 'true';
        }
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        const notifications = await Notification_1.default.find(query)
            .populate('order', 'orderNumber status')
            .sort({ createdAt: -1 })
            .allowDiskUse(true)
            .skip(skip)
            .limit(limitNum);
        const total = await Notification_1.default.countDocuments(query);
        const unreadCount = await Notification_1.default.countDocuments({ user: req.user._id, read: false });
        res.status(200).json({
            success: true,
            count: notifications.length,
            total,
            unreadCount,
            page: pageNum,
            pages: Math.ceil(total / limitNum),
            data: notifications,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
};
exports.getNotifications = getNotifications;
const markAsRead = async (req, res) => {
    try {
        if (!req.user?._id) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated',
            });
        }
        const notification = await Notification_1.default.findOne({
            _id: req.params.id,
            user: req.user._id,
        });
        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found',
            });
        }
        notification.read = true;
        notification.readAt = new Date();
        await notification.save();
        res.status(200).json({
            success: true,
            message: 'Notification marked as read',
            data: notification,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
};
exports.markAsRead = markAsRead;
const markAllAsRead = async (req, res) => {
    try {
        if (!req.user?._id) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated',
            });
        }
        await Notification_1.default.updateMany({ user: req.user._id, read: false }, { read: true, readAt: new Date() });
        res.status(200).json({
            success: true,
            message: 'All notifications marked as read',
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
};
exports.markAllAsRead = markAllAsRead;
const deleteNotification = async (req, res) => {
    try {
        if (!req.user?._id) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated',
            });
        }
        const notification = await Notification_1.default.findOneAndDelete({
            _id: req.params.id,
            user: req.user._id,
        });
        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found',
            });
        }
        res.status(200).json({
            success: true,
            message: 'Notification deleted successfully',
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
};
exports.deleteNotification = deleteNotification;
