const express = require('express');
const router = express.Router();
const { body, query, validationResult } = require('express-validator');
const deployController = require('../controllers/deployController');
const authMiddleware = require('../middleware/authMiddleware');

/**
 * @route POST /api/v1/deploy
 * @desc Deploy application
 * @access Private
 */
router.post(
  '/',
  [
    authMiddleware.verifyToken,
    body('type').isIn(['docker', 'kubernetes', 'cloud', 'serverless']),
    body('config').isObject().withMessage('Deployment configuration is required'),
    body('name').isString().withMessage('Application name is required'),
    body('environment').optional().isString().default('development'),
    body('version').optional().isString(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }
      await deployController.deployApplication(req, res);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/v1/deploy
 * @desc List deployments
 * @access Private
 */
router.get(
  '/',
  [
    authMiddleware.verifyToken,
    query('status').optional().isIn(['pending', 'running', 'success', 'failed', 'stopped']),
    query('type').optional().isIn(['docker', 'kubernetes', 'cloud', 'serverless']),
    query('environment').optional().isString(),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('page').optional().isInt({ min: 1 }),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }
      await deployController.listDeployments(req, res);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/v1/deploy/:deploymentId
 * @desc Get deployment details
 * @access Private
 */
router.get(
  '/:deploymentId',
  [
    authMiddleware.verifyToken,
  ],
  async (req, res, next) => {
    try {
      await deployController.getDeployment(req, res);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/v1/deploy/:deploymentId/status
 * @desc Get deployment status
 * @access Private
 */
router.get(
  '/:deploymentId/status',
  [
    authMiddleware.verifyToken,
  ],
  async (req, res, next) => {
    try {
      await deployController.getDeploymentStatus(req, res);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/v1/deploy/:deploymentId/logs
 * @desc Get deployment logs
 * @access Private
 */
router.get(
  '/:deploymentId/logs',
  [
    authMiddleware.verifyToken,
    query('tail').optional().isInt({ min: 1, max: 1000 }),
    query('since').optional().isString(),
    query('until').optional().isString(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }
      await deployController.getDeploymentLogs(req, res);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/v1/deploy/:deploymentId/stop
 * @desc Stop deployment
 * @access Private
 */
router.post(
  '/:deploymentId/stop',
  [
    authMiddleware.verifyToken,
  ],
  async (req, res, next) => {
    try {
      await deployController.stopDeployment(req, res);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/v1/deploy/:deploymentId/start
 * @desc Start deployment
 * @access Private
 */
router.post(
  '/:deploymentId/start',
  [
    authMiddleware.verifyToken,
  ],
  async (req, res, next) => {
    try {
      await deployController.startDeployment(req, res);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/v1/deploy/:deploymentId/restart
 * @desc Restart deployment
 * @access Private
 */
router.post(
  '/:deploymentId/restart',
  [
    authMiddleware.verifyToken,
  ],
  async (req, res, next) => {
    try {
      await deployController.restartDeployment(req, res);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/v1/deploy/:deploymentId/scale
 * @desc Scale deployment
 * @access Private
 */
router.post(
  '/:deploymentId/scale',
  [
    authMiddleware.verifyToken,
    body('replicas').isInt({ min: 1 }).withMessage('Valid replica count is required'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }
      await deployController.scaleDeployment(req, res);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route DELETE /api/v1/deploy/:deploymentId
 * @desc Delete deployment
 * @access Private
 */
router.delete(
  '/:deploymentId',
  [
    authMiddleware.verifyToken,
    query('force').optional().isBoolean(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }
      await deployController.deleteDeployment(req, res);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/v1/deploy/:deploymentId/rollback
 * @desc Rollback deployment
 * @access Private
 */
router.post(
  '/:deploymentId/rollback',
  [
    authMiddleware.verifyToken,
    body('version').optional().isString(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }
      await deployController.rollbackDeployment(req, res);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/v1/deploy/:deploymentId/metrics
 * @desc Get deployment metrics
 * @access Private
 */
router.get(
  '/:deploymentId/metrics',
  [
    authMiddleware.verifyToken,
    query('timeframe').optional().isIn(['1h', '24h', '7d', '30d']),
    query('metric').optional().isIn(['cpu', 'memory', 'network', 'all']),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }
      await deployController.getDeploymentMetrics(req, res);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/v1/deploy/:deploymentId/health
 * @desc Get deployment health
 * @access Private
 */
router.get(
  '/:deploymentId/health',
  [
    authMiddleware.verifyToken,
  ],
  async (req, res, next) => {
    try {
      await deployController.getDeploymentHealth(req, res);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/v1/deploy/batch
 * @desc Batch deploy multiple applications
 * @access Private
 */
router.post(
  '/batch',
  [
    authMiddleware.verifyToken,
    body('deployments').isArray().withMessage('Deployments array is required'),
    body('deployments.*.name').isString(),
    body('deployments.*.type').isIn(['docker', 'kubernetes', 'cloud', 'serverless']),
    body('deployments.*.config').isObject(),
    body('parallel').optional().isBoolean().default(false),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }
      await deployController.batchDeploy(req, res);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/v1/deploy/environments
 * @desc List deployment environments
 * @access Private
 */
router.get(
  '/environments',
  [
    authMiddleware.verifyToken,
  ],
  async (req, res, next) => {
    try {
      await deployController.listEnvironments(req, res);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/v1/deploy/environments
 * @desc Create deployment environment
 * @access Private
 */
router.post(
  '/environments',
  [
    authMiddleware.verifyToken,
    body('name').isString().withMessage('Environment name is required'),
    body('type').isIn(['development', 'staging', 'production']),
    body('config').isObject().withMessage('Environment configuration is required'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }
      await deployController.createEnvironment(req, res);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/v1/deploy/templates
 * @desc Get deployment templates
 * @access Private
 */
router.get(
  '/templates',
  [
    authMiddleware.verifyToken,
    query('type').optional().isIn(['web', 'api', 'database', 'microservice']),
    query('platform').optional().isIn(['docker', 'kubernetes', 'aws', 'azure', 'gcp']),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }
      await deployController.getTemplates(req, res);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/v1/deploy/validate
 * @desc Validate deployment configuration
 * @access Private
 */
router.post(
  '/validate',
  [
    authMiddleware.verifyToken,
    body('config').isObject().withMessage('Configuration is required'),
    body('type').isIn(['docker', 'kubernetes', 'cloud', 'serverless']),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }
      await deployController.validateDeployment(req, res);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/v1/deploy/status/summary
 * @desc Get deployment status summary
 * @access Private
 */
router.get(
  '/status/summary',
  [
    authMiddleware.verifyToken,
    query('timeframe').optional().isIn(['1h', '24h', '7d', '30d']),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }
      await deployController.getStatusSummary(req, res);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/v1/deploy/webhook/:deploymentId
 * @desc Webhook for deployment updates
 * @access Public (with secret validation)
 */
router.post(
  '/webhook/:deploymentId',
  [
    body('event').isString().withMessage('Event type is required'),
    body('data').isObject().withMessage('Event data is required'),
    body('signature').optional().isString(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }
      await deployController.handleWebhook(req, res);
    } catch (error) {
      next(error);
    }
  }
);

// WebSocket endpoint for real-time deployment updates
router.ws('/:deploymentId/stream', (ws, req) => {
  const { deploymentId } = req.params;
  
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      
      switch (data.type) {
        case 'subscribe':
          ws.deploymentId = deploymentId;
          ws.send(JSON.stringify({
            type: 'subscribed',
            deploymentId,
            timestamp: new Date().toISOString()
          }));
          break;
          
        case 'get-status':
          const status = await deployController.getRealtimeStatus(deploymentId);
          ws.send(JSON.stringify({
            type: 'status',
            status,
            timestamp: new Date().toISOString()
          }));
          break;
          
        case 'get-logs':
          const logs = await deployController.streamDeploymentLogs(deploymentId);
          logs.on('data', (chunk) => {
            ws.send(JSON.stringify({
              type: 'log',
              data: chunk.toString(),
              timestamp: new Date().toISOString()
            }));
          });
          break;
          
        case 'get-metrics':
          const metrics = await deployController.getRealtimeMetrics(deploymentId);
          ws.send(JSON.stringify({
            type: 'metrics',
            metrics,
            timestamp: new Date().toISOString()
          }));
          break;
          
        default:
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Unknown message type'
          }));
      }
    } catch (error) {
      ws.send(JSON.stringify({
        type: 'error',
        message: error.message
      }));
    }
  });
  
  ws.on('close', () => {
    console.log(`WebSocket closed for deployment ${deploymentId}`);
  });
});

module.exports = router;