import { Response } from 'express';
import Order from '../models/Order';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';
import { logEmployeeActivity } from './employeeActivityController';

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
export const createOrder = async (req: AuthRequest, res: Response) => {
  try {
    console.log('📦 Creating order:', {
      userId: req.user?._id?.toString(),
      itemsCount: req.body.items?.length,
      hasShippingAddress: !!req.body.shippingAddress,
      hasPaymentInfo: !!req.body.paymentInfo,
    });

    const {
      items,
      shippingAddress,
      paymentInfo,
      subtotal,
      tax,
      shipping,
      total,
    } = req.body;

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order must have at least one item',
      });
    }

    if (!shippingAddress) {
      return res.status(400).json({
        success: false,
        message: 'Shipping address is required',
      });
    }

    if (!req.user?._id) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    // FIXED: Inventory Management - Check and decrement stock before creating order
    const Product = (await import('../models/Product')).default;
    
    // Validate stock availability for each item
    for (const item of items) {
      if (item.product) {
        const product = await Product.findById(item.product);
        if (!product) {
          return res.status(404).json({
            success: false,
            message: `Product not found: ${item.product}`,
          });
        }
        
        if (product.stock < item.quantity) {
          return res.status(400).json({
            success: false,
            message: `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`,
          });
        }
      }
    }
    
    // Decrement stock for each product in the order
    for (const item of items) {
      if (item.product) {
        await Product.findByIdAndUpdate(
          item.product,
          { $inc: { stock: -item.quantity } },
          { new: true }
        );
        console.log(`📦 Stock decremented: Product ${item.product}, Quantity: ${item.quantity}`);
      }
    }

    const order = await Order.create({
      user: req.user._id as any,
      items,
      shippingAddress,
      paymentInfo: paymentInfo || { method: 'card', status: 'pending' },
      subtotal: subtotal || 0,
      tax: tax || 0,
      shipping: shipping || 0,
      total: total || 0,
    });

    console.log('✅ Order created successfully:', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      total: order.total,
    });

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order,
    });
  } catch (error: any) {
    console.error('❌ Error creating order:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    });
  }
};

// @desc    Get user orders
// @route   GET /api/orders/my-orders
// @access  Private
export const getMyOrders = async (req: AuthRequest, res: Response) => {
  try {
    const orders = await Order.find({ user: req.user?._id as any })
      .sort({ createdAt: -1 })
      .populate('items.product', 'name image')
      .populate('items.design', 'name thumbnail');

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
export const getOrder = async (req: AuthRequest, res: Response) => {
  try {
    // VALIDATION: Validate ObjectId format
    if (!req.params.id || !req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID format',
      });
    }

    const order = await Order.findById(req.params.id)
      .populate('user', 'firstName lastName email')
      .populate('items.product', 'name image')
      .populate('items.design', 'name thumbnail');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Check if user owns this order or is admin/employee
    if (
      order.user._id.toString() !== (req.user?._id as any)?.toString() &&
      req.user?.role !== 'admin' &&
      req.user?.role !== 'employee'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this order',
      });
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Get all orders (Admin/Employee)
// @route   GET /api/orders
// @access  Private/Admin/Employee
export const getAllOrders = async (req: AuthRequest, res: Response) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const query: any = {};
    if (status && status !== 'all') {
      query.status = status;
    }

    // Only show orders from customers (exclude admin and employee orders)
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // First, get all customer user IDs
    const customerUsers = await User.find({ role: 'customer' }).select('_id');
    const customerIds = customerUsers.map(u => u._id);

    // Filter orders to only include customer orders
    query.user = { $in: customerIds };

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('user', 'firstName lastName email role');

    const total = await Order.countDocuments(query);

    res.status(200).json({
      success: true,
      count: orders.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: orders,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin/Employee
export const updateOrderStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { status, trackingNumber } = req.body;

    // VALIDATION: Validate status enum value
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    // VALIDATION: Validate ObjectId format
    if (!req.params.id || !req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID format',
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    if (status) {
      order.status = status;
    }
    if (trackingNumber) {
      order.trackingNumber = trackingNumber;
    }

    await order.save();

    // FIXED: Log employee activity for order status update
    if (req.user?._id && (req.user.role === 'admin' || req.user.role === 'employee')) {
      await logEmployeeActivity(
        req.user._id as any,
        'order_updated',
        `Updated order ${order.orderNumber} status to ${status}`,
        'Order',
        order._id as any,
        { orderNumber: order.orderNumber, newStatus: status, trackingNumber }
      );
    }

    res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      data: order,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Update payment status
// @route   PUT /api/orders/:id/payment
// @access  Private/Admin
export const updatePaymentStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { status, transactionId } = req.body;

    // VALIDATION: Validate payment status enum value
    const validPaymentStatuses = ['pending', 'completed', 'failed', 'refunded'];
    if (status && !validPaymentStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid payment status. Must be one of: ${validPaymentStatuses.join(', ')}`,
      });
    }

    // VALIDATION: Validate ObjectId format
    if (!req.params.id || !req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID format',
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    if (status) {
      order.paymentInfo.status = status;
    }
    if (transactionId) {
      order.paymentInfo.transactionId = transactionId;
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Payment status updated successfully',
      data: order,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Delete order (Admin only)
// @route   DELETE /api/orders/:id
// @access  Private/Admin
export const deleteOrder = async (req: AuthRequest, res: Response) => {
  try {
    // VALIDATION: Validate ObjectId format
    if (!req.params.id || !req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID format',
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    await Order.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Order deleted successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Get order statistics (Admin)
// @route   GET /api/orders/stats/overview
// @access  Private/Admin
export const getOrderStats = async (req: AuthRequest, res: Response) => {
  try {
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ status: 'pending' });
    const processingOrders = await Order.countDocuments({ status: 'processing' });
    const shippedOrders = await Order.countDocuments({ status: 'shipped' });
    const deliveredOrders = await Order.countDocuments({ status: 'delivered' });

    const totalRevenue = await Order.aggregate([
      { $match: { 'paymentInfo.status': 'completed' } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalOrders,
        pendingOrders,
        processingOrders,
        shippedOrders,
        deliveredOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

