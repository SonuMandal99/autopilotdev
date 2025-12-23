const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redis = require('redis');
const config = require('../config/appConfig');

// Create Redis client if configured
let redisClient;
if (config.cache.enabled) {
  redisClient = redis.createClient({
    url: config.cache.redisUrl
  });
  
  redisClient.on('error', (err) => {
    console.error('Redis error:', err);
  });
}

const rateLimitMiddleware = {
  // Global rate limiter
  globalLimiter: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
      success: false,
      error: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    ...(config.cache.enabled && {
      store: new RedisStore({
        sendCommand: (...args) => redisClient.sendCommand(args)
      })
    })
  }),

  // Strict rate limiter for authentication endpoints
  authLimiter: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per windowMs
    message: {
      success: false,
      error: 'Too many authentication attempts, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false
  }),

  // AI endpoints rate limiter (cost-sensitive)
  aiLimiter: rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50, // Limit each user to 50 AI requests per hour
    keyGenerator: (req) => req.user?.id || req.ip,
    message: {
      success: false,
      error: 'AI request limit exceeded. Please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false
  }),

  // Analysis endpoints rate limiter
  analyzeLimiter: rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20, // Limit each user to 20 analyses per hour
    keyGenerator: (req) => req.user?.id || req.ip,
    message: {
      success: false,
      error: 'Analysis limit exceeded. Please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false
  }),

  // Deployment endpoints rate limiter
  deployLimiter: rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // Limit each user to 10 deployments per hour
    keyGenerator: (req) => req.user?.id || req.ip,
    message: {
      success: false,
      error: 'Deployment limit exceeded. Please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false
  }),

  // File upload rate limiter
  uploadLimiter: rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // Limit each user to 10 uploads per hour
    keyGenerator: (req) => req.user?.id || req.ip,
    message: {
      success: false,
      error: 'Upload limit exceeded. Please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false
  }),

  // Reset rate limit counter
  resetKey: (key) => {
    if (config.cache.enabled && redisClient) {
      redisClient.del(key);
    }
  }
};

module.exports = rateLimitMiddleware;