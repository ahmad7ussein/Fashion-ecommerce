"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logEmployeeActivity = exports.getAllEmployeeActivities = void 0;
const EmployeeActivity_1 = __importDefault(require("../models/EmployeeActivity"));
const getAllEmployeeActivities = async (req, res) => {
    try {
        const { employeeId, page = 1, limit = 50 } = req.query;
        const query = {};
        if (employeeId) {
            query.employee = employeeId;
        }
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        const activities = await EmployeeActivity_1.default.find(query)
            .populate('employee', 'firstName lastName email role')
            .sort({ createdAt: -1 })
            .allowDiskUse(true)
            .skip(skip)
            .limit(limitNum);
        const total = await EmployeeActivity_1.default.countDocuments(query);
        const employeeStats = await EmployeeActivity_1.default.aggregate([
            { $group: {
                    _id: '$employee',
                    totalActions: { $sum: 1 },
                    productsAdded: { $sum: { $cond: [{ $eq: ['$action', 'product_added'] }, 1, 0] } },
                    ordersUpdated: { $sum: { $cond: [{ $eq: ['$action', 'order_updated'] }, 1, 0] } },
                    lastActivity: { $max: '$createdAt' },
                } },
            { $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'employeeInfo'
                } },
            { $unwind: '$employeeInfo' },
            { $project: {
                    employeeId: '$_id',
                    employeeName: { $concat: ['$employeeInfo.firstName', ' ', '$employeeInfo.lastName'] },
                    employeeEmail: '$employeeInfo.email',
                    totalActions: 1,
                    productsAdded: 1,
                    ordersUpdated: 1,
                    lastActivity: 1,
                } },
            { $sort: { totalActions: -1 } },
        ]);
        res.status(200).json({
            success: true,
            count: activities.length,
            total,
            page: pageNum,
            pages: Math.ceil(total / limitNum),
            data: activities,
            statistics: employeeStats,
        });
    }
    catch (error) {
        console.error('❌ Error fetching employee activities:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
};
exports.getAllEmployeeActivities = getAllEmployeeActivities;
const logEmployeeActivity = async (employeeId, action, description, targetType, targetId, metadata) => {
    try {
        await EmployeeActivity_1.default.create({
            employee: employeeId,
            action,
            description,
            targetType,
            targetId,
            metadata,
        });
    }
    catch (error) {
        console.error('❌ Error logging employee activity:', error);
    }
};
exports.logEmployeeActivity = logEmployeeActivity;
