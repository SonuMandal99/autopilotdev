const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Create logs directory if it doesn't exist
const logDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Define console format (for development)
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(
    ({ timestamp, level, message, ...meta }) => {
      const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
      return `[${timestamp}] ${level}: ${message}${metaStr}`;
    }
  )
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'autopilotdev-backend' },
  transports: [
    // Console transport (for development)
    new winston.transports.Console({
      format: consoleFormat,
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug'
    }),
    
    // File transport for all logs
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 5,
      tailable: true
    }),
    
    // File transport for error logs
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 5,
      tailable: true
    })
  ]
});

// Add request logging middleware for Express
logger.expressMiddleware = function(req, res, next) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 400 ? 'warn' : 'info';
    
    logger.log(logLevel, `${req.method} ${req.originalUrl}`, {
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      userId: req.user?.id || 'anonymous'
    });
  });
  
  next();
};

// Add stream for Morgan middleware
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  }
};

// Helper methods
logger.api = {
  info: (endpoint, data = {}) => {
    logger.info(`API: ${endpoint}`, data);
  },
  
  error: (endpoint, error, data = {}) => {
    logger.error(`API Error: ${endpoint}`, { error: error.message, ...data });
  },
  
  warn: (endpoint, warning, data = {}) => {
    logger.warn(`API Warning: ${endpoint}`, { warning, ...data });
  }
};

logger.service = {
  start: (serviceName) => {
    logger.info(`Starting service: ${serviceName}`);
  },
  
  ready: (serviceName) => {
    logger.info(`Service ready: ${serviceName}`);
  },
  
  error: (serviceName, error) => {
    logger.error(`Service error: ${serviceName}`, { error: error.message });
  }
};

logger.database = {
  query: (collection, operation, data = {}) => {
    logger.debug(`DB ${operation} on ${collection}`, data);
  },
  
  error: (collection, operation, error) => {
    logger.error(`DB Error: ${operation} on ${collection}`, { 
      error: error.message,
      code: error.code
    });
  }
};

logger.ai = {
  request: (operation, tokens = 0) => {
    logger.info(`AI Request: ${operation}`, { tokens });
  },
  
  response: (operation, duration) => {
    logger.debug(`AI Response: ${operation}`, { duration: `${duration}ms` });
  },
  
  error: (operation, error) => {
    logger.error(`AI Error: ${operation}`, { error: error.message });
  }
};

logger.deployment = {
  start: (deploymentId, type) => {
    logger.info(`Deployment started: ${deploymentId}`, { type });
  },
  
  success: (deploymentId) => {
    logger.info(`Deployment successful: ${deploymentId}`);
  },
  
  error: (deploymentId, error) => {
    logger.error(`Deployment failed: ${deploymentId}`, { error: error.message });
  }
};

// Error handler for uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { 
    error: error.message, 
    stack: error.stack 
  });
  process.exit(1);
});

// Error handler for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection', { 
    reason: reason?.message || reason,
    promise
  });
});

// Export logger
module.exports = logger;