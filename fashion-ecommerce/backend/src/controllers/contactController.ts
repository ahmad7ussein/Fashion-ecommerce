import { Request, Response } from 'express';
import ContactMessage from '../models/ContactMessage';
import { AuthRequest } from '../middleware/auth';
import { logEmployeeActivity } from './employeeActivityController';

// @desc    Create a new contact message
// @route   POST /api/contact
// @access  Public
export const createContactMessage = async (req: Request, res: Response) => {
  try {
    const { name, email, subject, message } = req.body;

    // Validation
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, email, subject, and message',
      });
    }

    // Email validation
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address',
      });
    }

    const contactMessage = await ContactMessage.create({
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
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Get all contact messages
// @route   GET /api/contact
// @access  Private/Admin/Employee
export const getContactMessages = async (req: AuthRequest, res: Response) => {
  try {
    const {
      status,
      page = 1,
      limit = 20,
      search,
    } = req.query;

    // Build query
    const query: any = {};

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

    // Pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const messages = await ContactMessage.find(query)
      .populate('repliedBy', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .allowDiskUse(true)
      .skip(skip)
      .limit(limitNum);

    const total = await ContactMessage.countDocuments(query);

    // Count by status
    const statusCounts = {
      new: await ContactMessage.countDocuments({ status: 'new' }),
      read: await ContactMessage.countDocuments({ status: 'read' }),
      replied: await ContactMessage.countDocuments({ status: 'replied' }),
      archived: await ContactMessage.countDocuments({ status: 'archived' }),
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
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Get single contact message
// @route   GET /api/contact/:id
// @access  Private/Admin/Employee
export const getContactMessage = async (req: AuthRequest, res: Response) => {
  try {
    const message = await ContactMessage.findById(req.params.id).populate(
      'repliedBy',
      'firstName lastName email'
    );

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found',
      });
    }

    // Mark as read if it's new
    if (message.status === 'new') {
      message.status = 'read';
      message.readAt = new Date();
      await message.save();
    }

    res.status(200).json({
      success: true,
      data: message,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Update contact message status
// @route   PUT /api/contact/:id
// @access  Private/Admin/Employee
export const updateContactMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { status, replyMessage } = req.body;

    const message = await ContactMessage.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found',
      });
    }

    // Update status
    if (status) {
      message.status = status;
      if (status === 'read' && !message.readAt) {
        message.readAt = new Date();
      }
    }

    // Add reply
    if (replyMessage) {
      message.status = 'replied';
      message.repliedAt = new Date();
      message.repliedBy = req.user!._id as any;
      message.replyMessage = replyMessage;
    }

    await message.save();

    // Log employee activity
    if (req.user?._id && (req.user.role === 'admin' || req.user.role === 'employee')) {
      await logEmployeeActivity(
        req.user._id as any,
        'contact_message_updated',
        `Updated contact message from ${message.email}`,
        'ContactMessage',
        message._id as any,
        { messageId: message._id, status: message.status }
      );
    }

    res.status(200).json({
      success: true,
      message: 'Message updated successfully',
      data: message,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Delete contact message
// @route   DELETE /api/contact/:id
// @access  Private/Admin
export const deleteContactMessage = async (req: AuthRequest, res: Response) => {
  try {
    const message = await ContactMessage.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found',
      });
    }

    // Log employee activity before deletion
    if (req.user?._id && (req.user.role === 'admin' || req.user.role === 'employee')) {
      await logEmployeeActivity(
        req.user._id as any,
        'contact_message_deleted',
        `Deleted contact message from ${message.email}`,
        'ContactMessage',
        message._id as any,
        { messageId: message._id }
      );
    }

    await ContactMessage.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Message deleted successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

