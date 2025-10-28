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

// POST /api/orders/checkout - Create order from cart
router.post('/checkout', validate(checkoutSchema), async (req, res, next) => {
  const session = await mongoose.startSession();
  
  try {
    await session.withTransaction(async () => {
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

      // Create order
      const order = await Order.create([{
        userId: req.user._id,
        items: orderItems,
        totalAmount,
        shippingAddress,
        paymentMethod,
        notes,
        status: 'PENDING_PAYMENT'
      }], { session });

      // Reserve stock for all products
      for (const cartItem of cart.items) {
        await Product.findByIdAndUpdate(
          cartItem.productId._id,
          { $inc: { reservedStock: cartItem.quantity } },
          { session }
        );
      }

      // Clear the cart
      await Cart.findByIdAndUpdate(
        cart._id,
        { items: [], totalItems: 0, totalAmount: 0 },
        { session }
      );

      res.status(201).json({
        status: 'success',
        message: 'Order created successfully. Please complete payment within 15 minutes.',
        data: {
          order: order[0],
          expiresAt: order[0].expiresAt
        }
      });
    });
  } catch (error) {
    next(error);
  } finally {
    await session.endSession();
  }
});

// POST /api/orders/:id/pay - Process payment
router.post('/:id/pay', validate(mongoIdSchema, 'params'), async (req, res, next) => {
  const session = await mongoose.startSession();
  
  try {
    await session.withTransaction(async () => {
      const orderId = req.params.id;

      // Find order
      const order = await Order.findById(orderId).session(session);
      
      if (!order) {
        throw new AppError('Order not found', 404);
      }

      // Check if order belongs to user
      if (order.userId.toString() !== req.user._id.toString()) {
        throw new AppError('Unauthorized access to order', 403);
      }

      // Check if order is in correct status
      if (order.status !== 'PENDING_PAYMENT') {
        throw new AppError('Order is not in pending payment status', 400);
      }

      // Check if order is expired
      if (order.isExpired()) {
        // Cancel expired order and release reserved stock
        order.status = 'CANCELLED';
        await order.save({ session });

        // Release reserved stock
        for (const item of order.items) {
          await Product.findByIdAndUpdate(
            item.productId,
            { $inc: { reservedStock: -item.quantity } },
            { session }
          );
        }

        throw new AppError('Order has expired and been cancelled', 400);
      }

      // Simulate payment processing (in real app, integrate with payment gateway)
      const paymentSuccess = Math.random() > 0.1; // 90% success rate for demo

      if (!paymentSuccess) {
        // Payment failed - create failed payment record
        await Payment.create([{
          orderId: order._id,
          amount: order.totalAmount,
          status: 'FAILED',
          paymentMethod: order.paymentMethod,
          failureReason: 'Payment gateway declined transaction'
        }], { session });

        throw new AppError('Payment failed. Please try again.', 400);
      }

      // Payment successful - create success payment record
      const payment = await Payment.create([{
        orderId: order._id,
        amount: order.totalAmount,
        status: 'SUCCESS',
        paymentMethod: order.paymentMethod,
        gatewayResponse: { transactionId: `TXN-${Date.now()}` }
      }], { session });

      // Update order status to PAID
      order.status = 'PAID';
      await order.save({ session });

      // Move reserved stock to actual stock reduction
      for (const item of order.items) {
        await Product.findByIdAndUpdate(
          item.productId,
          { 
            $inc: { 
              stock: -item.quantity,
              reservedStock: -item.quantity 
            }
          },
          { session }
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
          payment: payment[0]
        }
      });
    });
  } catch (error) {
    next(error);
  } finally {
    await session.endSession();
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
      const session = await mongoose.startSession();
      
      try {
        await session.withTransaction(async () => {
          // Update order status
          order.status = 'CANCELLED';
          await order.save({ session });

          // Release reserved stock
          for (const item of order.items) {
            await Product.findByIdAndUpdate(
              item.productId,
              { $inc: { reservedStock: -item.quantity } },
              { session }
            );
          }
        });
      } catch (error) {
        console.error('Error cancelling expired order:', error);
      } finally {
        await session.endSession();
      }
    }
  } catch (error) {
    console.error('Error processing expired orders:', error);
  }
}, 60000); // Run every minute

module.exports = router;

