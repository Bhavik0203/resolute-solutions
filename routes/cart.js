const express = require('express');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { authenticate, authorizeUser } = require('../middleware/auth');
const { validate, cartItemSchema, mongoIdSchema, productIdParamSchema } = require('../middleware/validation');
const { AppError } = require('../middleware/errorHandler');

const router = express.Router();

// All cart routes require user authentication
router.use(authenticate);
router.use(authorizeUser);

// GET /api/cart - Get user's cart
router.get('/', async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ userId: req.user._id }).populate('items.productId', 'name price imageUrl');
    
    if (!cart) {
      cart = await Cart.create({ userId: req.user._id });
    }

    res.status(200).json({
      status: 'success',
      data: {
        cart: {
          id: cart._id,
          items: cart.items.map(item => ({
            productId: item.productId._id,
            productName: item.productId.name,
            productPrice: item.productId.price,
            productImage: item.productId.imageUrl,
            quantity: item.quantity,
            subtotal: item.productId.price * item.quantity
          })),
          totalItems: cart.totalItems,
          totalAmount: cart.totalAmount
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/cart/items - Add item to cart or update quantity
router.post('/items', validate(cartItemSchema), async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;

    // Check if product exists and is active
    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found or not available'
      });
    }

    // Check if enough stock is available
    if (product.availableStock < quantity) {
      return res.status(400).json({
        status: 'error',
        message: `Insufficient stock. Only ${product.availableStock} items available`
      });
    }

    // Find or create cart
    let cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      cart = await Cart.create({ userId: req.user._id });
    }

    // Add item to cart
    await cart.addItem(productId, quantity);

    // Populate the updated cart
    await cart.populate('items.productId', 'name price imageUrl');

    res.status(200).json({
      status: 'success',
      message: 'Item added to cart successfully',
      data: {
        cart: {
          id: cart._id,
          items: cart.items.map(item => ({
            productId: item.productId._id,
            productName: item.productId.name,
            productPrice: item.productId.price,
            productImage: item.productId.imageUrl,
            quantity: item.quantity,
            subtotal: item.productId.price * item.quantity
          })),
          totalItems: cart.totalItems,
          totalAmount: cart.totalAmount
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/cart/items/:productId - Update item quantity in cart
router.put('/items/:productId', validate(productIdParamSchema, 'params'), async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity < 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Quantity must be a positive number'
      });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found or not available'
      });
    }

    // Find cart
    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      return res.status(404).json({
        status: 'error',
        message: 'Cart not found'
      });
    }

    // Check if item exists in cart
    const cartItem = cart.items.find(item => item.productId.toString() === productId);
    if (!cartItem) {
      return res.status(404).json({
        status: 'error',
        message: 'Item not found in cart'
      });
    }

    // Check stock availability for the new quantity
    if (product.availableStock < quantity) {
      return res.status(400).json({
        status: 'error',
        message: `Insufficient stock. Only ${product.availableStock} items available`
      });
    }

    // Update quantity
    await cart.updateItemQuantity(productId, quantity);

    // Populate the updated cart
    await cart.populate('items.productId', 'name price imageUrl');

    res.status(200).json({
      status: 'success',
      message: 'Cart updated successfully',
      data: {
        cart: {
          id: cart._id,
          items: cart.items.map(item => ({
            productId: item.productId._id,
            productName: item.productId.name,
            productPrice: item.productId.price,
            productImage: item.productId.imageUrl,
            quantity: item.quantity,
            subtotal: item.productId.price * item.quantity
          })),
          totalItems: cart.totalItems,
          totalAmount: cart.totalAmount
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/cart/items/:productId - Remove item from cart
router.delete('/items/:productId', validate(productIdParamSchema, 'params'), async (req, res, next) => {
  try {
    const { productId } = req.params;

    // Find cart
    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      return res.status(404).json({
        status: 'error',
        message: 'Cart not found'
      });
    }

    // Remove item
    await cart.removeItem(productId);

    // Populate the updated cart
    await cart.populate('items.productId', 'name price imageUrl');

    res.status(200).json({
      status: 'success',
      message: 'Item removed from cart successfully',
      data: {
        cart: {
          id: cart._id,
          items: cart.items.map(item => ({
            productId: item.productId._id,
            productName: item.productId.name,
            productPrice: item.productId.price,
            productImage: item.productId.imageUrl,
            quantity: item.quantity,
            subtotal: item.productId.price * item.quantity
          })),
          totalItems: cart.totalItems,
          totalAmount: cart.totalAmount
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/cart - Clear entire cart
router.delete('/', async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      return res.status(404).json({
        status: 'error',
        message: 'Cart not found'
      });
    }

    await cart.clearCart();

    res.status(200).json({
      status: 'success',
      message: 'Cart cleared successfully',
      data: {
        cart: {
          id: cart._id,
          items: [],
          totalItems: 0,
          totalAmount: 0
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

