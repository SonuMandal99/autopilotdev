const express = require('express');
const router = express.Router();
const { body, query, validationResult } = require('express-validator');
const k8sController = require('../controllers/k8sController');
const authMiddleware = require('../middleware/authMiddleware');

/**
 * @route POST /api/v1/kubernetes/generate
 * @desc Generate Kubernetes manifests
 * @access Private
 */
router.post(
  '/generate',
  [
    authMiddleware.verifyToken,
    body('analysisId').isMongoId().withMessage('Valid analysis ID is required'),
    body('type').isIn(['deployment', 'service', 'ingress', 'configmap', 'secret', 'all']),
    body('options.namespace').optional().isString().default('default'),
    body('options.replicas').optional().isInt({ min: 1 }).default(1),
    body('options.image').optional().isString(),
    body('options.ports').optional().isArray(),
    body('options.env').optional().isArray(),
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
      await k8sController.generateManifests(req, res);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/v1/kubernetes/validate
 * @desc Validate Kubernetes manifests
 * @access Private
 */
router.post(
  '/validate',
  [
    authMiddleware.verifyToken,
    body('manifests').isArray().withMessage('Manifests array is required'),
    body('manifests.*.apiVersion').isString(),
    body('manifests.*.kind').isString(),
    body('manifests.*.metadata').isObject(),
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
      await k8sController.validateManifests(req, res);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/v1/kubernetes/deploy
 * @desc Deploy to Kubernetes cluster
 * @access Private
 */
router.post(
  '/deploy',
  [
    authMiddleware.verifyToken,
    body('manifests').isArray().withMessage('Manifests array is required'),
    body('namespace').optional().isString().default('default'),
    body('dryRun').optional().isBoolean().default(false),
    body('wait').optional().isBoolean().default(true),
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
      await k8sController.deployToCluster(req, res);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/v1/kubernetes/deployments
 * @desc List Kubernetes deployments
 * @access Private
 */
router.get(
  '/deployments',
  [
    authMiddleware.verifyToken,
    query('namespace').optional().isString(),
    query('labelSelector').optional().isString(),
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
      await k8sController.listDeployments(req, res);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/v1/kubernetes/deployments/:name
 * @desc Get deployment details
 * @access Private
 */
router.get(
  '/deployments/:name',
  [
    authMiddleware.verifyToken,
    query('namespace').optional().isString().default('default'),
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
      await k8sController.getDeployment(req, res);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/v1/kubernetes/pods
 * @desc List Kubernetes pods
 * @access Private
 */
router.get(
  '/pods',
  [
    authMiddleware.verifyToken,
    query('namespace').optional().isString(),
    query('labelSelector').optional().isString(),
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
      await k8sController.listPods(req, res);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/v1/kubernetes/pods/:name/logs
 * @desc Get pod logs
 * @access Private
 */
router.get(
  '/pods/:name/logs',
  [
    authMiddleware.verifyToken,
    query('namespace').optional().isString().default('default'),
    query('container').optional().isString(),
    query('tailLines').optional().isInt({ min: 1, max: 1000 }),
    query('follow').optional().isBoolean(),
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
      await k8sController.getPodLogs(req, res);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/v1/kubernetes/services
 * @desc List Kubernetes services
 * @access Private
 */
router.get(
  '/services',
  [
    authMiddleware.verifyToken,
    query('namespace').optional().isString(),
    query('labelSelector').optional().isString(),
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
      await k8sController.listServices(req, res);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/v1/kubernetes/nodes
 * @desc List Kubernetes nodes
 * @access Private
 */
router.get(
  '/nodes',
  [
    authMiddleware.verifyToken,
    query('labelSelector').optional().isString(),
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
      await k8sController.listNodes(req, res);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/v1/kubernetes/events
 * @desc List Kubernetes events
 * @access Private
 */
router.get(
  '/events',
  [
    authMiddleware.verifyToken,
    query('namespace').optional().isString(),
    query('fieldSelector').optional().isString(),
    query('limit').optional().isInt({ min: 1, max: 1000 }),
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
      await k8sController.listEvents(req, res);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/v1/kubernetes/deployments/:name/scale
 * @desc Scale deployment
 * @access Private
 */
router.post(
  '/deployments/:name/scale',
  [
    authMiddleware.verifyToken,
    body('replicas').isInt({ min: 0 }).withMessage('Valid replica count is required'),
    query('namespace').optional().isString().default('default'),
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
      await k8sController.scaleDeployment(req, res);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route DELETE /api/v1/kubernetes/deployments/:name
 * @desc Delete deployment
 * @access Private
 */
router.delete(
  '/deployments/:name',
  [
    authMiddleware.verifyToken,
    query('namespace').optional().isString().default('default'),
    query('cascade').optional().isBoolean().default(true),
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
      await k8sController.deleteDeployment(req, res);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/v1/kubernetes/rollout/restart
 * @desc Restart deployment rollout
 * @access Private
 */
router.post(
  '/rollout/restart',
  [
    authMiddleware.verifyToken,
    body('deployment').isString().withMessage('Deployment name is required'),
    body('namespace').optional().isString().default('default'),
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
      await k8sController.restartRollout(req, res);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/v1/kubernetes/health
 * @desc Get cluster health status
 * @access Private
 */
router.get(
  '/health',
  [
    authMiddleware.verifyToken,
  ],
  async (req, res, next) => {
    try {
      await k8sController.getClusterHealth(req, res);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/v1/kubernetes/metrics
 * @desc Get cluster metrics
 * @access Private
 */
router.get(
  '/metrics',
  [
    authMiddleware.verifyToken,
    query('namespace').optional().isString(),
    query('resource').optional().isIn(['cpu', 'memory', 'all']),
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
      await k8sController.getClusterMetrics(req, res);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/v1/kubernetes/apply
 * @desc Apply Kubernetes configuration
 * @access Private
 */
router.post(
  '/apply',
  [
    authMiddleware.verifyToken,
    body('yaml').isString().withMessage('YAML configuration is required'),
    body('namespace').optional().isString(),
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
      await k8sController.applyConfiguration(req, res);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/v1/kubernetes/templates
 * @desc Get Kubernetes templates
 * @access Private
 */
router.get(
  '/templates',
  [
    authMiddleware.verifyToken,
    query('type').optional().isIn(['web', 'api', 'database', 'worker', 'cronjob']),
    query('language').optional().isString(),
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
      await k8sController.getTemplates(req, res);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/v1/kubernetes/namespace
 * @desc Create namespace
 * @access Private
 */
router.post(
  '/namespace',
  [
    authMiddleware.verifyToken,
    body('name').isString().withMessage('Namespace name is required'),
    body('labels').optional().isObject(),
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
      await k8sController.createNamespace(req, res);
    } catch (error) {
      next(error);
    }
  }
);

// WebSocket endpoint for real-time K8s updates
router.ws('/deployments/:name/watch', (ws, req) => {
  const { name } = req.params;
  const namespace = req.query.namespace || 'default';
  
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      
      switch (data.type) {
        case 'subscribe':
          ws.deploymentName = name;
          ws.namespace = namespace;
          ws.send(JSON.stringify({
            type: 'subscribed',
            deployment: name,
            namespace,
            timestamp: new Date().toISOString()
          }));
          break;
          
        case 'get-status':
          const status = await k8sController.getDeploymentStatus(name, namespace);
          ws.send(JSON.stringify({
            type: 'status',
            status,
            timestamp: new Date().toISOString()
          }));
          break;
          
        case 'get-logs':
          const podName = data.podName;
          const logs = await k8sController.streamPodLogs(podName, namespace);
          logs.on('data', (chunk) => {
            ws.send(JSON.stringify({
              type: 'log',
              data: chunk.toString(),
              pod: podName,
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
    console.log(`WebSocket closed for deployment ${name} in namespace ${namespace}`);
  });
});

module.exports = router;