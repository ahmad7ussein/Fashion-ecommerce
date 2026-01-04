"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSalesReport = exports.createEmployee = exports.deleteUser = exports.updateUserRole = exports.getUser = exports.getAllUsers = exports.getDashboardStats = void 0;
const User_1 = __importDefault(require("../models/User"));
const Order_1 = __importDefault(require("../models/Order"));
const Product_1 = __importDefault(require("../models/Product"));
const Design_1 = __importDefault(require("../models/Design"));
const employeeActivityController_1 = require("./employeeActivityController");
const getDashboardStats = async (req, res) => {
    try {
        const totalUsers = await User_1.default.countDocuments({ role: 'customer' });
        const totalOrders = await Order_1.default.countDocuments();
        const totalProducts = await Product_1.default.countDocuments();
        const totalDesigns = await Design_1.default.countDocuments();
        const revenueData = await Order_1.default.aggregate([
            { $match: { 'paymentInfo.status': 'completed' } },
            { $group: { _id: null, total: { $sum: '$total' } } },
        ]);
        const totalRevenue = revenueData[0]?.total || 0;
        const pendingOrders = await Order_1.default.countDocuments({ status: 'pending' });
        const processingOrders = await Order_1.default.countDocuments({ status: 'processing' });
        const shippedOrders = await Order_1.default.countDocuments({ status: 'shipped' });
        const deliveredOrders = await Order_1.default.countDocuments({ status: 'delivered' });
        const recentOrders = await Order_1.default.find()
            .sort({ createdAt: -1 })
            .allowDiskUse(true)
            .limit(5)
            .populate('user', 'firstName lastName email');
        const topProducts = await Order_1.default.aggregate([
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
};
exports.getDashboardStats = getDashboardStats;
const getAllUsers = async (req, res) => {
    try {
        const { role, page = 1, limit = 20, search } = req.query;
        console.log('🔍 getAllUsers called with params:', { role, page, limit, search });
        const query = {};
        if (role && role !== 'all') {
            query.role = role;
            console.log('✅ Filtering by role:', role);
        }
        else {
            console.log('ℹ️ No role filter, showing all users');
        }
        if (search) {
            query.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
            ];
            console.log('🔍 Adding search filter:', search);
        }
        console.log('📋 Final query:', JSON.stringify(query, null, 2));
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        const users = await User_1.default.find(query)
            .select('-password')
            .sort({ createdAt: -1 })
            .allowDiskUse(true)
            .skip(skip)
            .limit(limitNum);
        const total = await User_1.default.countDocuments(query);
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
    }
    catch (error) {
        console.error('❌ Error in getAllUsers:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
};
exports.getAllUsers = getAllUsers;
const getUser = async (req, res) => {
    try {
        if (!req.params.id || !req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID format',
            });
        }
        const user = await User_1.default.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }
        const orders = await Order_1.default.find({ user: user._id }).sort({ createdAt: -1 }).allowDiskUse(true).limit(10);
        const designs = await Design_1.default.find({ user: user._id }).sort({ createdAt: -1 }).allowDiskUse(true).limit(10);
        res.status(200).json({
            success: true,
            data: {
                user,
                orders,
                designs,
            },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
};
exports.getUser = getUser;
const updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;
        const validRoles = ['customer', 'employee', 'admin'];
        if (!role || !validRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                message: `Invalid role. Must be one of: ${validRoles.join(', ')}`,
            });
        }
        if (!req.params.id || !req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID format',
            });
        }
        const user = await User_1.default.findById(req.params.id);
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
};
exports.updateUserRole = updateUserRole;
const deleteUser = async (req, res) => {
    try {
        if (!req.params.id || !req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID format',
            });
        }
        const user = await User_1.default.findById(req.params.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }
        if (req.user && user._id.toString() === req.user._id.toString()) {
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
};
exports.deleteUser = deleteUser;
const createEmployee = async (req, res) => {
    try {
        const { firstName, lastName, email, password, phone } = req.body;
        if (!firstName || !lastName || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields',
            });
        }
        const userExists = await User_1.default.findOne({ email });
        if (userExists) {
            return res.status(400).json({
                success: false,
                message: 'User already exists with this email',
            });
        }
        const employee = await User_1.default.create({
            firstName,
            lastName,
            email,
            password,
            role: 'employee',
            phone,
        });
        if (req.user?._id) {
            await (0, employeeActivityController_1.logEmployeeActivity)(req.user._id, 'employee_created', `Created new employee: ${firstName} ${lastName} (${email})`, 'User', employee._id, { employeeEmail: email, employeeName: `${firstName} ${lastName}` });
        }
        const employeeResponse = employee.toObject();
        const { password: _password, ...employeeWithoutPassword } = employeeResponse;
        res.status(201).json({
            success: true,
            message: 'Employee created successfully',
            data: employeeWithoutPassword,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
};
exports.createEmployee = createEmployee;
const getSalesReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const matchStage = { 'paymentInfo.status': 'completed' };
        if (startDate || endDate) {
            matchStage.createdAt = {};
            if (startDate)
                matchStage.createdAt.$gte = new Date(startDate);
            if (endDate)
                matchStage.createdAt.$lte = new Date(endDate);
        }
        const salesByDay = await Order_1.default.aggregate([
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
        const totalSales = await Order_1.default.aggregate([
            { $match: matchStage },
            { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } },
        ]);
        if (req.user?._id) {
            await (0, employeeActivityController_1.logEmployeeActivity)(req.user._id, 'report_generated', `Generated sales report (${startDate || 'all time'})`, 'Report', undefined, { reportType: 'sales', startDate, endDate });
        }
        res.status(200).json({
            success: true,
            data: {
                salesByDay,
                summary: totalSales[0] || { total: 0, count: 0 },
            },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
};
exports.getSalesReport = getSalesReport;
