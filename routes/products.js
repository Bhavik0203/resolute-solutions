const express = require('express');
const Product = require('../models/Product');
const { authenticate, authorizeAdmin, optionalAuth } = require('../middleware/auth');
const { validate, productSchema, productUpdateSchema, productQuerySchema, mongoIdSchema } = require('../middleware/validation');
const { AppError } = require('../middleware/errorHandler');

const router = express.Router();

// GET /api/products - Get all products (public with optional auth)
router.get('/', optionalAuth, validate(productQuerySchema, 'query'), async (req, res, next) => {
  try {
    const { page, limit, sort, order, search, category, minPrice, maxPrice } = req.query;
    
    // Build filter object
    const filter = { isActive: true };
    
    if (search) {
      filter.$text = { $search: search };
    }
    
    if (category) {
      filter.category = category;
    }
    
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    // Build sort object
    let sortObj = {};
    if (sort) {
      sortObj[sort] = order === 'asc' ? 1 : -1;
    } else {
      sortObj.createdAt = -1; // Default sort by creation date
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const products = await Product.find(filter)
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Product.countDocuments(filter);

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

// GET /api/products/:id - Get single product
router.get('/:id', optionalAuth, validate(mongoIdSchema, 'params'), async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        product
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/products - Create new product (Admin only)
router.post('/', authenticate, authorizeAdmin, validate(productSchema), async (req, res, next) => {
  try {
    const product = await Product.create(req.body);

    res.status(201).json({
      status: 'success',
      message: 'Product created successfully',
      data: {
        product
      }
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/products/:id - Update product (Admin only)
router.put('/:id', authenticate, authorizeAdmin, validate(mongoIdSchema, 'params'), validate(productUpdateSchema), async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Product updated successfully',
      data: {
        product
      }
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/products/:id - Delete product (Admin only)
router.delete('/:id', authenticate, authorizeAdmin, validate(mongoIdSchema, 'params'), async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Product deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/products/categories/list - Get all categories
router.get('/categories/list', optionalAuth, async (req, res, next) => {
  try {
    const categories = await Product.distinct('category', { isActive: true });
    
    res.status(200).json({
      status: 'success',
      data: {
        categories: categories.filter(cat => cat) // Remove null/empty categories
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

