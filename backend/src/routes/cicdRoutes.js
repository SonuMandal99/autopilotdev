const express = require('express');
const router = express.Router();
const { body, query, validationResult } = require('express-validator');
const cicdController = require('../controllers/cicdController');
const authMiddleware = require('../middleware/authMiddleware');

/**
 * @route POST /api/v1/cicd/generate
 * @desc Generate CI/CD pipeline configuration
 * @access Private
 */
router.post(
  '/generate',
  [
    authMiddleware.verifyToken,
    body('analysisId').isMongoId().withMessage('Valid analysis ID is required'),
    body('provider').isIn(['github', 'gitlab', 'jenkins', 'circleci', 'travis', 'azure']),
    body('stages').isArray().withMessage('Pipeline stages are required'),
    body('stages.*.name').isString(),
    body('stages.*.steps').isArray(),
    body('options.environment').optional().isString(),
    body('options.branch').optional().isString().default('main'),
    body('options.cache').optional().isBoolean().default(true),
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
      await cicdController.generatePipeline(req, res);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/v1/cicd/validate
 * @desc Validate CI/CD configuration
 * @access Private
 */
router.post(
  '/validate',
  [
    authMiddleware.verifyToken,
    body('config').isString().withMessage('Configuration is required'),
    body('provider').isIn(['github', 'gitlab', 'jenkins', 'circleci', 'travis', 'azure']),
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
      await cicdController.validatePipeline(req, res);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/v1/cicd/trigger
 * @desc Trigger CI/CD pipeline
 * @access Private
 */
router.post(
  '/trigger',
  [
    authMiddleware.verifyToken,
    body('repository').isString().withMessage('Repository URL is required'),
    body('branch').optional().isString().default('main'),
    body('event').optional().isIn(['push', 'pull_request', 'manual', 'schedule']),
    body('variables').optional().isObject(),
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
      await cicdController.triggerPipeline(req, res);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/v1/cicd/pipelines
 * @desc List CI/CD pipelines
 * @access Private
 */
router.get(
  '/pipelines',
  [
    authMiddleware.verifyToken,
    query('repository').optional().isString(),
    query('status').optional().isIn(['running', 'success', 'failed', 'pending']),
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
      await cicdController.listPipelines(req, res);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/v1/cicd/pipelines/:pipelineId
 * @desc Get pipeline details
 * @access Private
 */
router.get(
  '/pipelines/:pipelineId',
  [
    authMiddleware.verifyToken,
  ],
  async (req, res, next) => {
    try {
      await cicdController.getPipeline(req, res);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/v1/cicd/pipelines/:pipelineId/jobs
 * @desc Get pipeline jobs
 * @access Private
 */
router.get(
  '/pipelines/:pipelineId/jobs',
  [
    authMiddleware.verifyToken,
  ],
  async (req, res, next) => {
    try {
      await cicdController.getPipelineJobs(req, res);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/v1/cicd/pipelines/:pipelineId/logs
 * @desc Get pipeline logs
 * @access Private
 */
router.get(
  '/pipelines/:pipelineId/logs',
  [
    authMiddleware.verifyToken,
    query('jobId').optional().isString(),
    query('stage').optional().isString(),
    query('tail').optional().isInt({ min: 1, max: 1000 }),
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
      await cicdController.getPipelineLogs(req, res);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/v1/cicd/pipelines/:pipelineId/stop
 * @desc Stop pipeline
 * @access Private
 */
router.post(
  '/pipelines/:pipelineId/stop',
  [
    authMiddleware.verifyToken,
  ],
  async (req, res, next) => {
    try {
      await cicdController.stopPipeline(req, res);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/v1/cicd/pipelines/:pipelineId/retry
 * @desc Retry pipeline
 * @access Private
 */
router.post(
  '/pipelines/:pipelineId/retry',
  [
    authMiddleware.verifyToken,
    query('fromStage').optional().isString(),
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
      await cicdController.retryPipeline(req, res);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/v1/cicd/webhooks
 * @desc List webhooks
 * @access Private
 */
router.get(
  '/webhooks',
  [
    authMiddleware.verifyToken,
    query('repository').optional().isString(),
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
      await cicdController.listWebhooks(req, res);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/v1/cicd/webhooks
 * @desc Create webhook
 * @access Private
 */
router.post(
  '/webhooks',
  [
    authMiddleware.verifyToken,
    body('repository').isString().withMessage('Repository URL is required'),
    body('events').isArray().withMessage('Events array is required'),
    body('url').isURL().withMessage('Webhook URL is required'),
    body('secret').optional().isString(),
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
      await cicdController.createWebhook(req, res);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route DELETE /api/v1/cicd/webhooks/:webhookId
 * @desc Delete webhook
 * @access Private
 */
router.delete(
  '/webhooks/:webhookId',
  [
    authMiddleware.verifyToken,
  ],
  async (req, res, next) => {
    try {
      await cicdController.deleteWebhook(req, res);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/v1/cicd/metrics
 * @desc Get CI/CD metrics
 * @access Private
 */
router.get(
  '/metrics',
  [
    authMiddleware.verifyToken,
    query('timeframe').optional().isIn(['day', 'week', 'month', 'year']),
    query('repository').optional().isString(),
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
      await cicdController.getMetrics(req, res);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/v1/cicd/templates
 * @desc Get CI/CD templates
 * @access Private
 */
router.get(
  '/templates',
  [
    authMiddleware.verifyToken,
    query('provider').optional().isIn(['github', 'gitlab', 'jenkins', 'circleci', 'travis', 'azure']),
    query('type').optional().isIn(['node', 'python', 'java', 'go', 'docker', 'kubernetes']),
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
      await cicdController.getTemplates(req, res);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/v1/cicd/test
 * @desc Test CI/CD configuration
 * @access Private
 */
router.post(
  '/test',
  [
    authMiddleware.verifyToken,
    body('config').isString().withMessage('Configuration is required'),
    body('provider').isString().withMessage('Provider is required'),
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
      await cicdController.testPipeline(req, res);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/v1/cicd/status
 * @desc Get CI/CD service status
 * @access Private
 */
router.get(
  '/status',
  [
    authMiddleware.verifyToken,
  ],
  async (req, res, next) => {
    try {
      await cicdController.getServiceStatus(req, res);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/v1/cicd/deploy
 * @desc Trigger deployment from CI/CD
 * @access Private
 */
router.post(
  '/deploy',
  [
    authMiddleware.verifyToken,
    body('pipelineId').isString().withMessage('Pipeline ID is required'),
    body('environment').isString().withMessage('Environment is required'),
    body('version').optional().isString(),
    body('rollback').optional().isBoolean().default(false),
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
      await cicdController.triggerDeployment(req, res);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/v1/cicd/deployments
 * @desc List deployments
 * @access Private
 */
router.get(
  '/deployments',
  [
    authMiddleware.verifyToken,
    query('environment').optional().isString(),
    query('status').optional().isIn(['success', 'failed', 'in_progress']),
    query('limit').optional().isInt({ min: 1, max: 100 }),
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
      await cicdController.listDeployments(req, res);
    } catch (error) {
      next(error);
    }
  }
);

// WebSocket endpoint for real-time CI/CD updates
router.ws('/pipelines/:pipelineId/stream', (ws, req) => {
  const { pipelineId } = req.params;
  
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      
      switch (data.type) {
        case 'subscribe':
          ws.pipelineId = pipelineId;
          ws.send(JSON.stringify({
            type: 'subscribed',
            pipelineId,
            timestamp: new Date().toISOString()
          }));
          break;
          
        case 'get-status':
          const status = await cicdController.getPipelineStatus(pipelineId);
          ws.send(JSON.stringify({
            type: 'status',
            status,
            timestamp: new Date().toISOString()
          }));
          break;
          
        case 'get-logs':
          const jobId = data.jobId;
          const logs = await cicdController.streamPipelineLogs(pipelineId, jobId);
          logs.on('data', (chunk) => {
            ws.send(JSON.stringify({
              type: 'log',
              data: chunk.toString(),
              jobId,
              timestamp: new Date().toISOString()
            }));
          });
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
    console.log(`WebSocket closed for pipeline ${pipelineId}`);
  });
});

module.exports = router;