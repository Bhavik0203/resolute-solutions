const express = require('express');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const User = require('../models/User');
const Product = require('../models/Product');
const { authenticate, authorizeAdmin } = require('../middleware/auth');
const { validate, orderQuerySchema, orderStatusUpdateSchema, mongoIdSchema } = require('../middleware/validation');
const { AppError } = require('../middleware/errorHandler');

const router = express.Router();

// All admin routes require admin authentication
router.use(authenticate);
router.use(authorizeAdmin);

// GET /api/admin/orders - Get all orders with filtering
router.get('/orders', validate(orderQuerySchema, 'query'), async (req, res, next) => {
  try {
    const { page, limit, sort, order, status, userId } = req.query;
    
    // Build filter
    const filter = {};
    if (status) {
      filter.status = status;
    }
    if (userId) {
      filter.userId = userId;
    }

    // Build sort object
    let sortObj = {};
    if (sort) {
      sortObj[sort] = order === 'asc' ? 1 : -1;
    } else {
      sortObj.createdAt = -1;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query with user population
    const orders = await Order.find(filter)
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('userId', 'name email')
      .populate('items.productId', 'name imageUrl')
      .lean();

    const total = await Order.countDocuments(filter);

    res.status(200).json({
      status: 'success',
      data: {
        orders,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/orders/:id - Get single order details
router.get('/orders/:id', validate(mongoIdSchema, 'params'), async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('userId', 'name email')
      .populate('items.productId', 'name imageUrl description')
      .lean();

    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }

    // Get payment information
    const payment = await Payment.findOne({ orderId: order._id });

    res.status(200).json({
      status: 'success',
      data: {
        order: {
          ...order,
          payment
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/admin/orders/:id/status - Update order status
router.patch('/orders/:id/status', validate(mongoIdSchema, 'params'), validate(orderStatusUpdateSchema), async (req, res, next) => {
  try {
    const { status } = req.body;
    const orderId = req.params.id;

    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }

    // Validate status transition
    const validTransitions = {
      'PENDING_PAYMENT': ['PAID', 'CANCELLED'],
      'PAID': ['SHIPPED', 'CANCELLED'],
      'SHIPPED': ['DELIVERED'],
      'DELIVERED': [], // Final state
      'CANCELLED': [] // Final state
    };

    if (!validTransitions[order.status].includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: `Invalid status transition from ${order.status} to ${status}`
      });
    }

    // Update order status
    order.status = status;
    await order.save();

    res.status(200).json({
      status: 'success',
      message: 'Order status updated successfully',
      data: {
        order: {
          id: order._id,
          orderNumber: order.orderNumber,
          status: order.status,
          updatedAt: order.updatedAt
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/dashboard - Get dashboard statistics
router.get('/dashboard', async (req, res, next) => {
  try {
    const [
      totalOrders,
      totalUsers,
      totalProducts,
      totalRevenue,
      ordersByStatus,
      recentOrders
    ] = await Promise.all([
      Order.countDocuments(),
      User.countDocuments(),
      Product.countDocuments(),
      Order.aggregate([
        { $match: { status: { $in: ['PAID', 'SHIPPED', 'DELIVERED'] } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      Order.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Order.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('userId', 'name email')
        .select('orderNumber status totalAmount createdAt')
        .lean()
    ]);

    const revenue = totalRevenue.length > 0 ? totalRevenue[0].total : 0;

    res.status(200).json({
      status: 'success',
      data: {
        statistics: {
          totalOrders,
          totalUsers,
          totalProducts,
          totalRevenue: revenue,
          ordersByStatus: ordersByStatus.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
          }, {})
        },
        recentOrders
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/users - Get all users
router.get('/users', validate(orderQuerySchema, 'query'), async (req, res, next) => {
  try {
    const { page, limit, sort, order } = req.query;
    
    // Build sort object
    let sortObj = {};
    if (sort) {
      sortObj[sort] = order === 'asc' ? 1 : -1;
    } else {
      sortObj.createdAt = -1;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const users = await User.find()
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-password')
      .lean();

    const total = await User.countDocuments();

    res.status(200).json({
      status: 'success',
      data: {
        users,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/products - Get all products (including inactive)
router.get('/products', validate(orderQuerySchema, 'query'), async (req, res, next) => {
  try {
    const { page, limit, sort, order } = req.query;
    
    // Build sort object
    let sortObj = {};
    if (sort) {
      sortObj[sort] = order === 'asc' ? 1 : -1;
    } else {
      sortObj.createdAt = -1;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const products = await Product.find()
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Product.countDocuments();

    res.status(200).json({
      status: 'success',
      data: {
        products,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/admin/users/:id/status - Update user status
router.patch('/users/:id/status', validate(mongoIdSchema, 'params'), async (req, res, next) => {
  try {
    const { isActive } = req.body;
    const userId = req.params.id;

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Prevent admin from deactivating themselves
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot deactivate your own account'
      });
    }

    // Update user status
    user.isActive = isActive;
    await user.save();

    res.status(200).json({
      status: 'success',
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          updatedAt: user.updatedAt
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

