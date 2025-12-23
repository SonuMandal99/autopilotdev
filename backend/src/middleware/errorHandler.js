const logger = require('../utils/logger');

const errorHandler = {
  // Handle 404 errors
  notFound: (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    error.status = 404;
    next(error);
  },

  // Global error handler
  handle: (error, req, res, next) => {
    const statusCode = error.status || 500;
    const message = error.message || 'Internal Server Error';
    
    // Log error
    logger.error(`${statusCode} - ${message}`, {
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      stack: error.stack,
      body: req.body,
      query: req.query,
      params: req.params,
      user: req.user?.id || 'anonymous'
    });

    // Send error response
    res.status(statusCode).json({
      success: false,
      error: message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  },

  // Handle async errors
  asyncHandler: (fn) => {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  },

  // Handle specific error types
  handleValidationError: (error) => {
    const errors = {};
    
    if (error.name === 'ValidationError') {
      Object.keys(error.errors).forEach((key) => {
        errors[key] = error.errors[key].message;
      });
    }
    
    return {
      status: 400,
      message: 'Validation Error',
      errors
    };
  },

  handleMongoError: (error) => {
    let message = 'Database Error';
    let status = 500;
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      message = `${field} already exists`;
      status = 400;
    }
    
    return { status, message };
  }
};

module.exports = errorHandler;