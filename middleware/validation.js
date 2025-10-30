const Joi = require('joi');

// User validation schemas
const registerSchema = Joi.object({
  name: Joi.string().min(2).max(50).required().messages({
    'string.empty': 'Name is required',
    'string.min': 'Name must be at least 2 characters',
    'string.max': 'Name cannot exceed 50 characters'
  }),
  email: Joi.string().email().required().messages({
    'string.empty': 'Email is required',
    'string.email': 'Please enter a valid email'
  }),
  password: Joi.string().min(6).required().messages({
    'string.empty': 'Password is required',
    'string.min': 'Password must be at least 6 characters'
  }),
  role: Joi.string().valid('USER', 'ADMIN').default('USER')
});

const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.empty': 'Email is required',
    'string.email': 'Please enter a valid email'
  }),
  password: Joi.string().required().messages({
    'string.empty': 'Password is required'
  })
});

// Product validation schemas
const productSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    'string.empty': 'Product name is required',
    'string.min': 'Product name must be at least 2 characters',
    'string.max': 'Product name cannot exceed 100 characters'
  }),
  price: Joi.number().min(0).required().messages({
    'number.base': 'Price must be a number',
    'number.min': 'Price cannot be negative'
  }),
  description: Joi.string().max(1000).required().messages({
    'string.empty': 'Description is required',
    'string.max': 'Description cannot exceed 1000 characters'
  }),
  stock: Joi.number().min(0).default(0).messages({
    'number.base': 'Stock must be a number',
    'number.min': 'Stock cannot be negative'
  }),
  category: Joi.string().max(50).optional(),
  imageUrl: Joi.string().uri().optional()
});

const productUpdateSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  price: Joi.number().min(0).optional(),
  description: Joi.string().max(1000).optional(),
  stock: Joi.number().min(0).optional(),
  category: Joi.string().max(50).optional(),
  imageUrl: Joi.string().uri().optional(),
  isActive: Joi.boolean().optional()
});

// Cart validation schemas
const cartItemSchema = Joi.object({
  productId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required().messages({
    'string.empty': 'Product ID is required',
    'string.pattern.base': 'Invalid product ID format'
  }),
  quantity: Joi.number().min(1).max(100).required().messages({
    'number.base': 'Quantity must be a number',
    'number.min': 'Quantity must be at least 1',
    'number.max': 'Quantity cannot exceed 100'
  })
});

// Order validation schemas
const checkoutSchema = Joi.object({
  shippingAddress: Joi.object({
    street: Joi.string().required().messages({
      'string.empty': 'Street address is required'
    }),
    city: Joi.string().required().messages({
      'string.empty': 'City is required'
    }),
    state: Joi.string().required().messages({
      'string.empty': 'State is required'
    }),
    zipCode: Joi.string().required().messages({
      'string.empty': 'ZIP code is required'
    }),
    country: Joi.string().required().messages({
      'string.empty': 'Country is required'
    })
  }).required(),
  paymentMethod: Joi.string().valid('CREDIT_CARD', 'DEBIT_CARD', 'PAYPAL', 'BANK_TRANSFER').default('CREDIT_CARD'),
  notes: Joi.string().max(500).optional()
});

const orderStatusUpdateSchema = Joi.object({
  status: Joi.string().valid('PENDING_PAYMENT', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED').required().messages({
    'any.only': 'Status must be one of: PENDING_PAYMENT, PAID, SHIPPED, DELIVERED, CANCELLED'
  })
});

// Query validation schemas
const paginationSchema = Joi.object({
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(100).default(10),
  sort: Joi.string().optional(),
  order: Joi.string().valid('asc', 'desc').default('desc')
});

const productQuerySchema = paginationSchema.keys({
  search: Joi.string().optional(),
  category: Joi.string().optional(),
  minPrice: Joi.number().min(0).optional(),
  maxPrice: Joi.number().min(0).optional()
});

const orderQuerySchema = paginationSchema.keys({
  status: Joi.string().valid('PENDING_PAYMENT', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED').optional(),
  userId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional()
});

// Parameter validation schemas
const mongoIdSchema = Joi.object({
  id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required().messages({
    'string.pattern.base': 'Invalid ID format'
  })
});

// Params schema for productId in route params
const productIdParamSchema = Joi.object({
  productId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required().messages({
    'string.pattern.base': 'Invalid product ID format'
  })
});

// Validation middleware factory
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error } = schema.validate(req[property], { abortEarly: false });
    
    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      return res.status(400).json({
        status: 'error',
        message: errorMessage
      });
    }
    
    next();
  };
};

module.exports = {
  registerSchema,
  loginSchema,
  productSchema,
  productUpdateSchema,
  cartItemSchema,
  checkoutSchema,
  orderStatusUpdateSchema,
  productQuerySchema,
  orderQuerySchema,
  paginationSchema,
  mongoIdSchema,
  productIdParamSchema,
  validate
};

