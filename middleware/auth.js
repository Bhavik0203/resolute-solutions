const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// Authentication middleware
const authenticate = async (req, res, next) => {
  try {
    let token;
    
    console.log('Authorization header:', req.headers.authorization); // Debug log
    
    // Check for token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
      console.log('Token found:', token ? 'Yes' : 'No'); // Debug log
    }
    
    if (!token) {
      console.log('No token provided'); // Debug log
      return res.status(401).json({
        status: 'error',
        message: 'Access denied. No token provided.'
      });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token decoded successfully, userId:', decoded.userId); // Debug log
    
    // Get user from database
    const user = await User.findById(decoded.userId).select('-password');
    console.log('User found:', user ? 'Yes' : 'No'); // Debug log
    
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Token is invalid. User not found.'
      });
    }
    
    if (!user.isActive) {
      return res.status(401).json({
        status: 'error',
        message: 'Account is deactivated.'
      });
    }
    
    console.log('User authenticated successfully:', user.email, 'Role:', user.role); // Debug log
    req.user = user;
    next();
  } catch (error) {
    console.log('Authentication error:', error.message); // Debug log
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid token.'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'error',
        message: 'Token has expired.'
      });
    }
    
    return res.status(500).json({
      status: 'error',
      message: 'Authentication error.'
    });
  }
};

// Authorization middleware for admin only
const authorizeAdmin = (req, res, next) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({
      status: 'error',
      message: 'Access denied. Admin privileges required.'
    });
  }
  next();
};

// Authorization middleware for user only
const authorizeUser = (req, res, next) => {
  console.log('User role:', req.user.role); // Debug log
  console.log('User ID:', req.user._id); // Debug log
  console.log('User email:', req.user.email); // Debug log
  if (req.user.role !== 'USER') {
    return res.status(403).json({
      status: 'error',
      message: 'Access denied. User privileges required.'
    });
  }
  next();
};

// Optional authentication middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      
      if (user && user.isActive) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication if token is invalid
    next();
  }
};

module.exports = {
  generateToken,
  authenticate,
  authorizeAdmin,
  authorizeUser,
  optionalAuth
};
