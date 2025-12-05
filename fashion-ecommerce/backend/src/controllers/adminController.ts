import { Response } from 'express';
import User from '../models/User';
import Order from '../models/Order';
import Product from '../models/Product';
import Design from '../models/Design';
import { AuthRequest } from '../middleware/auth';
import { logEmployeeActivity } from './employeeActivityController';
import mongoose from 'mongoose';

// @desc    Get dashboard statistics
// @route   GET /api/admin/dashboard/stats
// @access  Private/Admin
export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    // Total counts - Only count customers (exclude admin and employee)
    const totalUsers = await User.countDocuments({ role: 'customer' });
    const totalOrders = await Order.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalDesigns = await Design.countDocuments();

    // Revenue
    const revenueData = await Order.aggregate([
      { $match: { 'paymentInfo.status': 'completed' } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]);
    const totalRevenue = revenueData[0]?.total || 0;

    // Orders by status
    const pendingOrders = await Order.countDocuments({ status: 'pending' });
    const processingOrders = await Order.countDocuments({ status: 'processing' });
    const shippedOrders = await Order.countDocuments({ status: 'shipped' });
    const deliveredOrders = await Order.countDocuments({ status: 'delivered' });

    // Recent orders
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'firstName lastName email');

    // Top products
    const topProducts = await Order.aggregate([
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          totalSold: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: 5 },
    ]);

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalOrders,
          totalProducts,
          totalDesigns,
          totalRevenue,
        },
        ordersByStatus: {
          pending: pendingOrders,
          processing: processingOrders,
          shipped: shippedOrders,
          delivered: deliveredOrders,
        },
        recentOrders,
        topProducts,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    const { role, page = 1, limit = 20, search } = req.query;

    console.log('🔍 getAllUsers called with params:', { role, page, limit, search });

    const query: any = {};
    // Filter by role if specified
    if (role && role !== 'all') {
      query.role = role;
      console.log('✅ Filtering by role:', role);
    } else {
      console.log('ℹ️ No role filter, showing all users');
    }
    // If role is 'all' or not specified, show all users (including admins for admin panel)

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
      console.log('🔍 Adding search filter:', search);
    }

    console.log('📋 Final query:', JSON.stringify(query, null, 2));

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await User.countDocuments(query);

    console.log('✅ Found users:', {
      total,
      returned: users.length,
      query: query,
      users: users.map(u => ({ id: u._id, email: u.email, role: u.role, name: `${u.firstName} ${u.lastName}` }))
    });

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: users,
    });
  } catch (error: any) {
    console.error('❌ Error in getAllUsers:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Get single user
// @route   GET /api/admin/users/:id
// @access  Private/Admin
export const getUser = async (req: AuthRequest, res: Response) => {
  try {
    // VALIDATION: Validate ObjectId format
    if (!req.params.id || !req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format',
      });
    }

    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Get user's orders
    const orders = await Order.find({ user: user._id }).sort({ createdAt: -1 }).limit(10);

    // Get user's designs
    const designs = await Design.find({ user: user._id }).sort({ createdAt: -1 }).limit(10);

    res.status(200).json({
      success: true,
      data: {
        user,
        orders,
        designs,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Update user role
// @route   PUT /api/admin/users/:id/role
// @access  Private/Admin
export const updateUserRole = async (req: AuthRequest, res: Response) => {
  try {
    const { role } = req.body;

    // VALIDATION: Validate role enum
    const validRoles = ['customer', 'employee', 'admin'];
    if (!role || !validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role. Must be one of: ${validRoles.join(', ')}`,
      });
    }

    // VALIDATION: Validate ObjectId format
    if (!req.params.id || !req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format',
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    user.role = role;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'User role updated successfully',
      data: user,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    // VALIDATION: Validate ObjectId format
    if (!req.params.id || !req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format',
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Prevent deleting yourself
    if (req.user && (user._id as any).toString() === (req.user._id as any).toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account',
      });
    }

    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Create employee
// @route   POST /api/admin/employees
// @access  Private/Admin
export const createEmployee = async (req: AuthRequest, res: Response) => {
  try {
    const { firstName, lastName, email, password, phone } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields',
      });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email',
      });
    }

    // Create employee
    const employee = await User.create({
      firstName,
      lastName,
      email,
      password,
      role: 'employee',
      phone,
    });

    // FIXED: Log employee creation activity
    if (req.user?._id) {
      await logEmployeeActivity(
        req.user._id as any,
        'employee_created',
        `Created new employee: ${firstName} ${lastName} (${email})`,
        'User',
        employee._id as any,
        { employeeEmail: email, employeeName: `${firstName} ${lastName}` }
      );
    }

    // Remove password from response
    const employeeResponse = employee.toObject();
    const { password: _password, ...employeeWithoutPassword } = employeeResponse as any;

    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      data: employeeWithoutPassword,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Get sales report
// @route   GET /api/admin/reports/sales
// @access  Private/Admin
export const getSalesReport = async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const matchStage: any = { 'paymentInfo.status': 'completed' };

    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) matchStage.createdAt.$gte = new Date(startDate as string);
      if (endDate) matchStage.createdAt.$lte = new Date(endDate as string);
    }

    const salesByDay = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          totalSales: { $sum: '$total' },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const totalSales = await Order.aggregate([
      { $match: matchStage },
      { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } },
    ]);

    // FIXED: Log employee activity for report generation
    if (req.user?._id) {
      await logEmployeeActivity(
        req.user._id as any,
        'report_generated',
        `Generated sales report (${startDate || 'all time'})`,
        'Report',
        undefined,
        { reportType: 'sales', startDate, endDate }
      );
    }

    res.status(200).json({
      success: true,
      data: {
        salesByDay,
        summary: totalSales[0] || { total: 0, count: 0 },
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

