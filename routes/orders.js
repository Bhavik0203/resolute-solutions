const express = require('express');
const mongoose = require('mongoose');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { authenticate, authorizeUser } = require('../middleware/auth');
const { validate, checkoutSchema, orderQuerySchema, mongoIdSchema } = require('../middleware/validation');
const { AppError } = require('../middleware/errorHandler');
const { addEmailJob } = require('../services/emailQueue');

const router = express.Router();

// All order routes require user authentication
router.use(authenticate);
router.use(authorizeUser);

// Helper function to run operations with transaction support, falls back to non-transactional if replica set is not available
async function runWithTransaction(callback) {
  let session = null;
  try {
    session = await mongoose.startSession();
    // Try to use transaction
    await session.withTransaction(async () => {
      await callback(session);
    });
  } catch (error) {
    // If transaction fails due to replica set issue, retry without transaction
    if (error.message && error.message.includes('Transaction numbers are only allowed on a replica set member or mongos')) {
      console.warn('MongoDB replica set not available, running without transactions');
      if (session) {
        await session.endSession();
        session = null;
      }
      // Retry without transaction
      await callback(null);
    } else {
      throw error;
    }
  } finally {
    if (session) {
      await session.endSession();
    }
  }
}

// POST /api/orders/checkout - Create order from cart
router.post('/checkout', validate(checkoutSchema), async (req, res, next) => {
  try {
    await runWithTransaction(async (session) => {
      const { shippingAddress, paymentMethod, notes } = req.body;

      // Get user's cart
      const cart = await Cart.findOne({ userId: req.user._id }).populate('items.productId');
      
      if (!cart || cart.items.length === 0) {
        throw new AppError('Cart is empty', 400);
      }

      // Validate all products and check stock
      const orderItems = [];
      let totalAmount = 0;

      for (const cartItem of cart.items) {
        const product = cartItem.productId;
        
        if (!product.isActive) {
          throw new AppError(`Product ${product.name} is no longer available`, 400);
        }

        if (product.availableStock < cartItem.quantity) {
          throw new AppError(`Insufficient stock for ${product.name}. Available: ${product.availableStock}`, 400);
        }

        orderItems.push({
          productId: product._id,
          quantity: cartItem.quantity,
          priceAtPurchase: product.price,
          productName: product.name
        });

        totalAmount += product.price * cartItem.quantity;
      }

      // Create order using save() so pre('save') runs and orderNumber is generated
      const orderDoc = new Order({
        userId: req.user._id,
        items: orderItems,
        totalAmount,
        shippingAddress,
        paymentMethod,
        notes,
        status: 'PENDING_PAYMENT'
      });
      
      // Save with or without session based on availability
      if (session) {
        await orderDoc.save({ session });
      } else {
        await orderDoc.save();
      }

      // Reserve stock for all products
      for (const cartItem of cart.items) {
        const updateOptions = session ? { session } : {};
        await Product.findByIdAndUpdate(
          cartItem.productId._id,
          { $inc: { reservedStock: cartItem.quantity } },
          updateOptions
        );
      }

      // Clear the cart
      const cartUpdateOptions = session ? { session } : {};
      await Cart.findByIdAndUpdate(
        cart._id,
        { items: [], totalItems: 0, totalAmount: 0 },
        cartUpdateOptions
      );

      res.status(201).json({
        status: 'success',
        message: 'Order created successfully. Please complete payment within 15 minutes.',
        data: {
          order: orderDoc,
          expiresAt: orderDoc.expiresAt
        }
      });
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/orders/:id/pay - Process payment
router.post('/:id/pay', validate(mongoIdSchema, 'params'), async (req, res, next) => {
  try {
    await runWithTransaction(async (session) => {
      const orderId = req.params.id;

      // Find order
      const order = session 
        ? await Order.findById(orderId).session(session)
        : await Order.findById(orderId);
      
      if (!order) {
        throw new AppError('Order not found', 404);
      }

      // Check if order belongs to user
      if (order.userId.toString() !== req.user._id.toString()) {
        throw new AppError('Unauthorized access to order', 403);
      }

      // Check if order is expired first (before status check)
      if (order.status === 'PENDING_PAYMENT' && order.isExpired()) {
        // Cancel expired order and release reserved stock
        order.status = 'CANCELLED';
        if (session) {
          await order.save({ session });
        } else {
          await order.save();
        }

        // Release reserved stock
        for (const item of order.items) {
          const updateOptions = session ? { session } : {};
          await Product.findByIdAndUpdate(
            item.productId,
            { $inc: { reservedStock: -item.quantity } },
            updateOptions
          );
        }

        throw new AppError('Order has expired and been cancelled', 400);
      }

      // Check if order is in correct status with detailed error message
      if (order.status !== 'PENDING_PAYMENT') {
        let errorMessage = `Cannot process payment. Order status is: ${order.status}`;
        
        if (order.status === 'PAID') {
          errorMessage = 'Order has already been paid';
        } else if (order.status === 'CANCELLED') {
          errorMessage = 'Order has been cancelled';
        } else if (order.status === 'SHIPPED') {
          errorMessage = 'Order has already been shipped';
        } else if (order.status === 'DELIVERED') {
          errorMessage = 'Order has already been delivered';
        }
        
        throw new AppError(errorMessage, 400);
      }

      // Simulate payment processing (in real app, integrate with payment gateway)
      const paymentSuccess = Math.random() > 0.1; // 90% success rate for demo

      if (!paymentSuccess) {
        // Payment failed - create failed payment record
        const failedPayment = new Payment({
          orderId: order._id,
          amount: order.totalAmount,
          status: 'FAILED',
          paymentMethod: order.paymentMethod,
          failureReason: 'Payment gateway declined transaction'
        });
        if (session) {
          await failedPayment.save({ session });
        } else {
          await failedPayment.save();
        }

        throw new AppError('Payment failed. Please try again.', 400);
      }

      // Payment successful - create success payment record
      const paymentDoc = new Payment({
        orderId: order._id,
        amount: order.totalAmount,
        status: 'SUCCESS',
        paymentMethod: order.paymentMethod,
        gatewayResponse: { transactionId: `TXN-${Date.now()}` }
      });
      if (session) {
        await paymentDoc.save({ session });
      } else {
        await paymentDoc.save();
      }

      // Update order status to PAID
      order.status = 'PAID';
      if (session) {
        await order.save({ session });
      } else {
        await order.save();
      }

      // Move reserved stock to actual stock reduction
      for (const item of order.items) {
        const updateOptions = session ? { session } : {};
        await Product.findByIdAndUpdate(
          item.productId,
          { 
            $inc: { 
              stock: -item.quantity,
              reservedStock: -item.quantity 
            }
          },
          updateOptions
        );
      }

      // Queue email confirmation job
      await addEmailJob({
        type: 'ORDER_CONFIRMATION',
        orderId: order._id,
        userEmail: req.user.email,
        userName: req.user.name,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount
      });

      res.status(200).json({
        status: 'success',
        message: 'Payment processed successfully',
        data: {
          order: {
            id: order._id,
            orderNumber: order.orderNumber,
            status: order.status,
            totalAmount: order.totalAmount
          },
          payment: paymentDoc
        }
      });
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/orders - Get user's orders
router.get('/', validate(orderQuerySchema, 'query'), async (req, res, next) => {
  try {
    const { page, limit, sort, order, status } = req.query;
    
    // Build filter
    const filter = { userId: req.user._id };
    if (status) {
      filter.status = status;
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

    // Execute query
    const orders = await Order.find(filter)
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit))
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

// GET /api/orders/:id - Get single order
router.get('/:id', validate(mongoIdSchema, 'params'), async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.productId', 'name imageUrl description')
      .lean();

    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }

    // Check if order belongs to user
    if (order.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Unauthorized access to order'
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

// Background job to cancel expired orders
setInterval(async () => {
  try {
    const expiredOrders = await Order.find({
      status: 'PENDING_PAYMENT',
      expiresAt: { $lt: new Date() }
    });

    for (const order of expiredOrders) {
      try {
        await runWithTransaction(async (session) => {
          // Update order status
          order.status = 'CANCELLED';
          if (session) {
            await order.save({ session });
          } else {
            await order.save();
          }

          // Release reserved stock
          for (const item of order.items) {
            const updateOptions = session ? { session } : {};
            await Product.findByIdAndUpdate(
              item.productId,
              { $inc: { reservedStock: -item.quantity } },
              updateOptions
            );
          }
        });
      } catch (error) {
        console.error('Error cancelling expired order:', error);
      }
    }
  } catch (error) {
    console.error('Error processing expired orders:', error);
  }
}, 60000); // Run every minute

module.exports = router;

