"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteContactMessage = exports.updateContactMessage = exports.getContactMessage = exports.getContactMessages = exports.createContactMessage = void 0;
const ContactMessage_1 = __importDefault(require("../models/ContactMessage"));
const employeeActivityController_1 = require("./employeeActivityController");
const createContactMessage = async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;
        if (!name || !email || !subject || !message) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields: name, email, subject, and message',
            });
        }
        const emailRegex = /^\S+@\S+\.\S+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid email address',
            });
        }
        const contactMessage = await ContactMessage_1.default.create({
            name,
            email,
            subject,
            message,
            status: 'new',
        });
        res.status(201).json({
            success: true,
            message: 'Your message has been sent successfully. We will get back to you soon.',
            data: contactMessage,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
};
exports.createContactMessage = createContactMessage;
const getContactMessages = async (req, res) => {
    try {
        const { status, page = 1, limit = 20, search, } = req.query;
        const query = {};
        if (status && status !== 'all') {
            query.status = status;
        }
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { subject: { $regex: search, $options: 'i' } },
                { message: { $regex: search, $options: 'i' } },
            ];
        }
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        const messages = await ContactMessage_1.default.find(query)
            .populate('repliedBy', 'firstName lastName email')
            .sort({ createdAt: -1 })
            .allowDiskUse(true)
            .skip(skip)
            .limit(limitNum);
        const total = await ContactMessage_1.default.countDocuments(query);
        const statusCounts = {
            new: await ContactMessage_1.default.countDocuments({ status: 'new' }),
            read: await ContactMessage_1.default.countDocuments({ status: 'read' }),
            replied: await ContactMessage_1.default.countDocuments({ status: 'replied' }),
            archived: await ContactMessage_1.default.countDocuments({ status: 'archived' }),
        };
        res.status(200).json({
            success: true,
            count: messages.length,
            total,
            page: pageNum,
            pages: Math.ceil(total / limitNum),
            statusCounts,
            data: messages,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
};
exports.getContactMessages = getContactMessages;
const getContactMessage = async (req, res) => {
    try {
        const message = await ContactMessage_1.default.findById(req.params.id).populate('repliedBy', 'firstName lastName email');
        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Message not found',
            });
        }
        if (message.status === 'new') {
            message.status = 'read';
            message.readAt = new Date();
            await message.save();
        }
        res.status(200).json({
            success: true,
            data: message,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
};
exports.getContactMessage = getContactMessage;
const updateContactMessage = async (req, res) => {
    try {
        const { status, replyMessage } = req.body;
        const message = await ContactMessage_1.default.findById(req.params.id);
        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Message not found',
            });
        }
        if (status) {
            message.status = status;
            if (status === 'read' && !message.readAt) {
                message.readAt = new Date();
            }
        }
        if (replyMessage) {
            message.status = 'replied';
            message.repliedAt = new Date();
            message.repliedBy = req.user._id;
            message.replyMessage = replyMessage;
        }
        await message.save();
        if (req.user?._id && (req.user.role === 'admin' || req.user.role === 'employee')) {
            await (0, employeeActivityController_1.logEmployeeActivity)(req.user._id, 'contact_message_updated', `Updated contact message from ${message.email}`, 'ContactMessage', message._id, { messageId: message._id, status: message.status });
        }
        res.status(200).json({
            success: true,
            message: 'Message updated successfully',
            data: message,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
};
exports.updateContactMessage = updateContactMessage;
const deleteContactMessage = async (req, res) => {
    try {
        const message = await ContactMessage_1.default.findById(req.params.id);
        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Message not found',
            });
        }
        if (req.user?._id && (req.user.role === 'admin' || req.user.role === 'employee')) {
            await (0, employeeActivityController_1.logEmployeeActivity)(req.user._id, 'contact_message_deleted', `Deleted contact message from ${message.email}`, 'ContactMessage', message._id, { messageId: message._id });
        }
        await ContactMessage_1.default.findByIdAndDelete(req.params.id);
        res.status(200).json({
            success: true,
            message: 'Message deleted successfully',
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
};
exports.deleteContactMessage = deleteContactMessage;
