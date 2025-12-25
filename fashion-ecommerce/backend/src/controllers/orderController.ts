import { Response } from 'express';
import mongoose from 'mongoose';
import Order from '../models/Order';
import User from '../models/User';
import Notification from '../models/Notification';
import { AuthRequest } from '../middleware/auth';
import { logEmployeeActivity } from './employeeActivityController';

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
export const createOrder = async (req: AuthRequest, res: Response) => {
  const session = await mongoose.startSession();
  try {
    console.log('dY"İ Creating order:', {
      userId: req.user?._id?.toString(),
      itemsCount: req.body.items?.length,
      hasShippingAddress: !!req.body.shippingAddress,
      hasPaymentInfo: !!req.body.paymentInfo,
    });

    const { items, shippingAddress, paymentInfo } = req.body;

    // Validate required fields (client pricing is ignored)
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

    const Product = (await import('../models/Product')).default;
    const StudioProduct = (await import('../models/StudioProduct')).default;
    const Design = (await import('../models/Design')).default;
    let createdOrder: any = null;

    await session.withTransaction(async () => {
      const validatedItems: any[] = [];
      let subtotal = 0;

      // Use server-side product data/pricing only
      for (const item of items) {
        const productId = item.product;
        const designId = item.design;
        const quantity = Math.max(1, Number(item.quantity) || 0);

        // Validate product or design reference
        if (!productId && !designId) {
          throw Object.assign(new Error('Item must include product or design'), { statusCode: 400 });
        }

        if (productId && !mongoose.Types.ObjectId.isValid(productId)) {
          throw Object.assign(new Error('Invalid product id'), { statusCode: 400 });
        }
        if (designId && !mongoose.Types.ObjectId.isValid(designId)) {
          throw Object.assign(new Error('Invalid design id'), { statusCode: 400 });
        }

        if (designId) {
          const design = await Design.findById(designId).session(session);
          if (!design) {
            throw Object.assign(new Error(`Design not found: ${designId}`), { statusCode: 404 });
          }
          if (design.user.toString() !== (req.user?._id as any).toString()) {
            throw Object.assign(new Error('Not authorized to order this design'), { statusCode: 403 });
          }
          const studioProduct = design.baseProductId
            ? await StudioProduct.findOne({ _id: design.baseProductId, active: true }).session(session)
            : null;
          if (!studioProduct) {
            throw Object.assign(new Error('Base studio product unavailable'), { statusCode: 404 });
          }

          const unitPrice = studioProduct.price;
          subtotal += unitPrice * quantity;

          validatedItems.push({
            design: design._id,
            product: undefined,
            name: design.name,
            price: unitPrice,
            quantity,
            size: item.size || design.baseProduct.size,
            color: item.color || design.baseProduct.color,
            image: item.image || design.thumbnail || design.designImageURL || studioProduct.baseMockupUrl,
            isCustom: true,
            designMetadata: design.designMetadata,
            designImageURL: design.designImageURL,
            baseProductId: studioProduct._id,
          });
        } else if (productId) {
          const product = await Product.findById(productId).session(session);
          if (!product) {
            throw Object.assign(new Error(`Product not found: ${productId}`), { statusCode: 404 });
          }

          if (product.stock < quantity) {
            throw Object.assign(
              new Error(`Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${quantity}`),
              { statusCode: 400 }
            );
          }

          const unitPrice = product.price;
          subtotal += unitPrice * quantity;

          validatedItems.push({
            product: product._id,
            name: item.name || product.name,
            price: unitPrice,
            quantity,
            size: item.size,
            color: item.color,
            image: item.image || product.image,
            isCustom: item.isCustom || false,
          });
        }
      }

      // Server-side totals (tax/shipping sanitized)
      const sanitizedTax = Math.max(Number(req.body.tax) || 0, 0);
      const sanitizedShipping = Math.max(Number(req.body.shipping) || 0, 0);
      const total = subtotal + sanitizedTax + sanitizedShipping;

      // Decrement stock atomically inside the transaction
      for (const item of validatedItems) {
        if (item.product) {
          const stockUpdate = await Product.updateOne(
            { _id: item.product, stock: { $gte: item.quantity } },
            { $inc: { stock: -item.quantity } }
          ).session(session);

          if (stockUpdate.modifiedCount === 0) {
            throw Object.assign(
              new Error(`Insufficient stock for product ${item.product}`),
              { statusCode: 409 }
            );
          }
        }
      }

      const orderDocs = await Order.create(
        [
          {
            user: req.user._id as any,
            items: validatedItems,
            shippingAddress,
            paymentInfo: paymentInfo || { method: 'card', status: 'pending' },
            subtotal,
            tax: sanitizedTax,
            shipping: sanitizedShipping,
            total,
          },
        ],
        { session }
      );

      createdOrder = orderDocs[0];
    });

    console.log('ƒo. Order created successfully:', {
      orderId: createdOrder._id,
      orderNumber: createdOrder.orderNumber,
      total: createdOrder.total,
    });

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: createdOrder,
    });
  } catch (error: any) {
    const status = error?.statusCode || 500;
    console.error('ƒ?O Error creating order:', error);
    res.status(status).json({
      success: false,
      message: error.message || 'Server error',
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    });
  } finally {
    session.endSession();
  }
};

// @desc    Get user orders
// @route   GET /api/orders/my-orders
// @access  Private
export const getMyOrders = async (req: AuthRequest, res: Response) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Database connection not available. Please try again later.',
      });
    }

    const orders = await Order.find({ user: req.user?._id as any })
      .sort({ createdAt: -1 })
      .allowDiskUse(true)
      .maxTimeMS(20000)
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
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Database connection not available. Please try again later.',
      });
    }

    // VALIDATION: Validate ObjectId format
    if (!req.params.id || !req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID format',
      });
    }

    const order = await Order.findById(req.params.id)
      .maxTimeMS(20000)
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

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Database connection not available. Please try again later.',
      });
    }

    // First, get all customer user IDs
    const customerUsers = await User.find({ role: 'customer' }).select('_id').maxTimeMS(20000);
    const customerIds = customerUsers.map(u => u._id);

    // Filter orders to only include customer orders
    query.user = { $in: customerIds };

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .allowDiskUse(true)
      .maxTimeMS(20000)
      .skip(skip)
      .limit(limitNum)
      .populate('user', 'firstName lastName email role');

    const total = await Order.countDocuments(query).maxTimeMS(20000);

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

// @desc    Update order status with tracking
// @route   PUT /api/orders/:id/status
// @access  Private/Admin/Employee
export const updateOrderStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { status, trackingNumber, carrier, estimatedDelivery, location, note } = req.body;

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

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Database connection not available. Please try again later.',
      });
    }

    const order = await Order.findById(req.params.id).maxTimeMS(20000).populate('user');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    const oldStatus = order.status;

    // Update order fields
    if (status) {
      order.status = status;
    }
    if (trackingNumber) {
      order.trackingNumber = trackingNumber;
    }
    if (carrier) {
      order.carrier = carrier;
    }
    if (estimatedDelivery) {
      order.estimatedDelivery = new Date(estimatedDelivery);
    }

    // Add tracking history entry
    if (status && status !== oldStatus) {
      if (!order.trackingHistory) {
        order.trackingHistory = [];
      }
      order.trackingHistory.push({
        status: status,
        location: location || undefined,
        note: note || undefined,
        updatedBy: req.user?._id as any,
        updatedAt: new Date(),
      });
    }

    await order.save();

    // FIXED: Log employee activity for order status update
    if (req.user?._id && (req.user.role === 'admin' || req.user.role === 'employee')) {
      await logEmployeeActivity(
        req.user._id as any,
        'order_updated',
        `Updated order ${order.orderNumber} status from ${oldStatus} to ${status}`,
        'Order',
        order._id as any,
        { orderNumber: order.orderNumber, oldStatus, newStatus: status, trackingNumber, carrier }
      );
    }

    // Create notification for customer
    if (status && status !== oldStatus && order.user) {
      const statusMessages: Record<string, { title: string; message: string; type: string }> = {
        processing: {
          title: 'Order Processing',
          message: `Your order ${order.orderNumber} is now being processed.`,
          type: 'order_status',
        },
        shipped: {
          title: 'Order Shipped',
          message: `Your order ${order.orderNumber} has been shipped!${trackingNumber ? ` Tracking: ${trackingNumber}` : ''}`,
          type: 'order_shipped',
        },
        delivered: {
          title: 'Order Delivered',
          message: `Your order ${order.orderNumber} has been delivered!`,
          type: 'order_delivered',
        },
        cancelled: {
          title: 'Order Cancelled',
          message: `Your order ${order.orderNumber} has been cancelled.`,
          type: 'order_cancelled',
        },
      };

      const notificationData = statusMessages[status];
      if (notificationData) {
        await Notification.create({
          user: order.user as any,
          type: notificationData.type as any,
          title: notificationData.title,
          message: notificationData.message,
          order: order._id,
          read: false,
        });
      }
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
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Database connection not available. Please try again later.',
      });
    }

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

    const order = await Order.findById(req.params.id).maxTimeMS(20000);

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

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Database connection not available. Please try again later.',
      });
    }

    const order = await Order.findById(req.params.id).maxTimeMS(20000);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    await Order.findByIdAndDelete(req.params.id).maxTimeMS(20000);

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
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Database connection not available. Please try again later.',
      });
    }

    const totalOrders = await Order.countDocuments().maxTimeMS(20000);
    const pendingOrders = await Order.countDocuments({ status: 'pending' }).maxTimeMS(20000);
    const processingOrders = await Order.countDocuments({ status: 'processing' }).maxTimeMS(20000);
    const shippedOrders = await Order.countDocuments({ status: 'shipped' }).maxTimeMS(20000);
    const deliveredOrders = await Order.countDocuments({ status: 'delivered' }).maxTimeMS(20000);

    const totalRevenue = await Order.aggregate([
      { $match: { 'paymentInfo.status': 'completed' } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]).maxTimeMS(20000);

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
