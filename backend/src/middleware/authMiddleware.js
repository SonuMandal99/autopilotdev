const jwt = require('jsonwebtoken');
const config = require('../config/appConfig');
const User = require('../models/User');
const logger = require('../utils/logger');

const authMiddleware = {
  // Verify JWT token
  verifyToken: async (req, res, next) => {
    try {
      const token = req.header('Authorization')?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({
          success: false,
          error: 'Access denied. No token provided.'
        });
      }

      const decoded = jwt.verify(token, config.security.jwtSecret);
      
      // Find user by ID
      const user = await User.findById(decoded.userId).select('-password');
      
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Invalid token. User not found.'
        });
      }

      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          error: 'Account is deactivated.'
        });
      }

      // Attach user to request
      req.user = user;
      req.token = token;
      
      next();
    } catch (error) {
      logger.error('Token verification failed:', error);
      
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          error: 'Invalid token.'
        });
      }
      
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: 'Token expired.'
        });
      }
      
      return res.status(500).json({
        success: false,
        error: 'Internal server error.'
      });
    }
  },

  // Check if user has specific role
  requireRole: (...roles) => {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required.'
        });
      }

      if (!roles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions.'
        });
      }

      next();
    };
  },

  // Check if user can perform analysis (rate limiting)
  canAnalyze: async (req, res, next) => {
    try {
      if (!req.user.canAnalyze()) {
        return res.status(429).json({
          success: false,
          error: 'Daily analysis limit reached.',
          limit: req.user.limits.analysesPerDay,
          used: req.user.usage.analysesToday
        });
      }
      next();
    } catch (error) {
      next(error);
    }
  },

  // Check if user can deploy (rate limiting)
  canDeploy: async (req, res, next) => {
    try {
      if (!req.user.canDeploy()) {
        return res.status(429).json({
          success: false,
          error: 'Daily deployment limit reached.',
          limit: req.user.limits.deploymentsPerDay,
          used: req.user.usage.deploymentsToday
        });
      }
      next();
    } catch (error) {
      next(error);
    }
  }
};

module.exports = authMiddleware;