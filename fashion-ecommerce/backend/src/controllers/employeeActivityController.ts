import { Response } from 'express';
import EmployeeActivity from '../models/EmployeeActivity';
import { AuthRequest } from '../middleware/auth';
import mongoose from 'mongoose';

// @desc    Get all employee activities
// @route   GET /api/admin/employee-activities
// @access  Private/Admin
export const getAllEmployeeActivities = async (req: AuthRequest, res: Response) => {
  try {
    const { employeeId, page = 1, limit = 50 } = req.query;

    const query: any = {};
    if (employeeId) {
      query.employee = employeeId;
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const activities = await EmployeeActivity.find(query)
      .populate('employee', 'firstName lastName email role')
      .sort({ createdAt: -1 })
      .allowDiskUse(true)
      .skip(skip)
      .limit(limitNum);

    const total = await EmployeeActivity.countDocuments(query);

    // Get employee statistics
    const employeeStats = await EmployeeActivity.aggregate([
      { $group: {
        _id: '$employee',
        totalActions: { $sum: 1 },
        productsAdded: { $sum: { $cond: [{ $eq: ['$action', 'product_added'] }, 1, 0] } },
        ordersUpdated: { $sum: { $cond: [{ $eq: ['$action', 'order_updated'] }, 1, 0] } },
        lastActivity: { $max: '$createdAt' },
      }},
      { $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'employeeInfo'
      }},
      { $unwind: '$employeeInfo' },
      { $project: {
        employeeId: '$_id',
        employeeName: { $concat: ['$employeeInfo.firstName', ' ', '$employeeInfo.lastName'] },
        employeeEmail: '$employeeInfo.email',
        totalActions: 1,
        productsAdded: 1,
        ordersUpdated: 1,
        lastActivity: 1,
      }},
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
  } catch (error: any) {
    console.error('❌ Error fetching employee activities:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Log employee activity (internal helper)
// @route   POST /api/admin/employee-activities/log
// @access  Private/Admin/Employee
export const logEmployeeActivity = async (
  employeeId: mongoose.Types.ObjectId,
  action: string,
  description: string,
  targetType?: string,
  targetId?: mongoose.Types.ObjectId,
  metadata?: Record<string, any>
) => {
  try {
    await EmployeeActivity.create({
      employee: employeeId,
      action,
      description,
      targetType,
      targetId,
      metadata,
    });
  } catch (error: any) {
    console.error('❌ Error logging employee activity:', error);
    // Don't throw - activity logging should not break main operations
  }
};

