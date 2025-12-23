const express = require('express');
const router = express.Router();
const { body, query, validationResult } = require('express-validator');
const dockerController = require('../controllers/dockerController');
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/docker/'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/json',
      'application/x-yaml',
      'text/plain',
      'text/x-dockerfile'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JSON, YAML, and text files are allowed.'));
    }
  }
});

/**
 * @route POST /api/v1/docker/generate
 * @desc Generate Dockerfile from analysis
 * @access Private
 */
router.post(
  '/generate',
  [
    authMiddleware.verifyToken,
    body('analysisId').isMongoId().withMessage('Valid analysis ID is required'),
    body('options.baseImage').optional().isString(),
    body('options.workdir').optional().isString(),
    body('options.ports').optional().isArray(),
    body('options.environment').optional().isArray(),
    body('options.volumes').optional().isArray(),
    body('options.command').optional().isString(),
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
      await dockerController.generateDockerfile(req, res);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/v1/docker/validate
 * @desc Validate Dockerfile
 * @access Private
 */
router.post(
  '/validate',
  [
    authMiddleware.verifyToken,
    body('dockerfile').isString().withMessage('Dockerfile content is required'),
    body('checkSyntax').optional().isBoolean(),
    body('checkBestPractices').optional().isBoolean(),
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
      await dockerController.validateDockerfile(req, res);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/v1/docker/compose/generate
 * @desc Generate Docker Compose file
 * @access Private
 */
router.post(
  '/compose/generate',
  [
    authMiddleware.verifyToken,
    body('services').isArray().withMessage('Services array is required'),
    body('services.*.name').isString(),
    body('services.*.image').optional().isString(),
    body('services.*.build').optional().isObject(),
    body('services.*.ports').optional().isArray(),
    body('services.*.environment').optional().isArray(),
    body('services.*.depends_on').optional().isArray(),
    body('version').optional().isString(),
    body('networks').optional().isObject(),
    body('volumes').optional().isObject(),
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
      await dockerController.generateComposeFile(req, res);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/v1/docker/build
 * @desc Build Docker image
 * @access Private
 */
router.post(
  '/build',
  [
    authMiddleware.verifyToken,
    body('dockerfile').isString().withMessage('Dockerfile content is required'),
    body('imageName').isString().withMessage('Image name is required'),
    body('tags').optional().isArray(),
    body('buildArgs').optional().isObject(),
    body('context').optional().isString(),
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
      await dockerController.buildImage(req, res);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/v1/docker/push
 * @desc Push Docker image to registry
 * @access Private
 */
router.post(
  '/push',
  [
    authMiddleware.verifyToken,
    body('imageName').isString().withMessage('Image name is required'),
    body('registry').optional().isString(),
    body('tags').optional().isArray(),
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
      await dockerController.pushImage(req, res);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/v1/docker/images
 * @desc List Docker images
 * @access Private
 */
router.get(
  '/images',
  [
    authMiddleware.verifyToken,
    query('all').optional().isBoolean(),
    query('filters').optional().isString(),
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
      await dockerController.listImages(req, res);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/v1/docker/containers
 * @desc List Docker containers
 * @access Private
 */
router.get(
  '/containers',
  [
    authMiddleware.verifyToken,
    query('all').optional().isBoolean(),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('size').optional().isBoolean(),
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
      await dockerController.listContainers(req, res);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/v1/docker/containers/run
 * @desc Run Docker container
 * @access Private
 */
router.post(
  '/containers/run',
  [
    authMiddleware.verifyToken,
    body('image').isString().withMessage('Image name is required'),
    body('name').optional().isString(),
    body('ports').optional().isArray(),
    body('environment').optional().isArray(),
    body('volumes').optional().isArray(),
    body('command').optional().isArray(),
    body('detach').optional().isBoolean(),
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
      await dockerController.runContainer(req, res);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/v1/docker/containers/:containerId/stop
 * @desc Stop Docker container
 * @access Private
 */
router.post(
  '/containers/:containerId/stop',
  [
    authMiddleware.verifyToken,
  ],
  async (req, res, next) => {
    try {
      await dockerController.stopContainer(req, res);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/v1/docker/containers/:containerId/start
 * @desc Start Docker container
 * @access Private
 */
router.post(
  '/containers/:containerId/start',
  [
    authMiddleware.verifyToken,
  ],
  async (req, res, next) => {
    try {
      await dockerController.startContainer(req, res);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route DELETE /api/v1/docker/containers/:containerId
 * @desc Remove Docker container
 * @access Private
 */
router.delete(
  '/containers/:containerId',
  [
    authMiddleware.verifyToken,
    query('force').optional().isBoolean(),
    query('v').optional().isBoolean(), // Remove volumes
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
      await dockerController.removeContainer(req, res);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/v1/docker/containers/:containerId/logs
 * @desc Get container logs
 * @access Private
 */
router.get(
  '/containers/:containerId/logs',
  [
    authMiddleware.verifyToken,
    query('tail').optional().isInt({ min: 1, max: 1000 }),
    query('follow').optional().isBoolean(),
    query('stdout').optional().isBoolean(),
    query('stderr').optional().isBoolean(),
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
      await dockerController.getContainerLogs(req, res);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/v1/docker/containers/:containerId/stats
 * @desc Get container statistics
 * @access Private
 */
router.get(
  '/containers/:containerId/stats',
  [
    authMiddleware.verifyToken,
    query('stream').optional().isBoolean(),
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
      await dockerController.getContainerStats(req, res);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/v1/docker/upload
 * @desc Upload Docker configuration files
 * @access Private
 */
router.post(
  '/upload',
  [
    authMiddleware.verifyToken,
    upload.single('file'),
  ],
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No file uploaded'
        });
      }
      await dockerController.uploadConfig(req, res);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/v1/docker/scan
 * @desc Scan Docker image for vulnerabilities
 * @access Private
 */
router.post(
  '/scan',
  [
    authMiddleware.verifyToken,
    body('image').isString().withMessage('Image name is required'),
    body('severity').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
    body('exitCode').optional().isInt(),
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
      await dockerController.scanImage(req, res);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/v1/docker/registry/list
 * @desc List images in registry
 * @access Private
 */
router.get(
  '/registry/list',
  [
    authMiddleware.verifyToken,
    query('registry').optional().isString(),
    query('username').optional().isString(),
    query('password').optional().isString(),
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
      await dockerController.listRegistryImages(req, res);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/v1/docker/templates
 * @desc Get Docker templates
 * @access Private
 */
router.get(
  '/templates',
  [
    authMiddleware.verifyToken,
    query('language').optional().isString(),
    query('type').optional().isIn(['web', 'api', 'database', 'worker']),
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
      await dockerController.getTemplates(req, res);
    } catch (error) {
      next(error);
    }
  }
);

// WebSocket endpoint for real-time Docker operations
router.ws('/build/:buildId/stream', (ws, req) => {
  const { buildId } = req.params;
  
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      
      switch (data.type) {
        case 'subscribe-build':
          ws.buildId = buildId;
          ws.send(JSON.stringify({
            type: 'subscribed',
            buildId,
            timestamp: new Date().toISOString()
          }));
          break;
          
        case 'get-build-logs':
          // Stream build logs
          const logs = await dockerController.streamBuildLogs(buildId);
          logs.on('data', (chunk) => {
            ws.send(JSON.stringify({
              type: 'log',
              data: chunk.toString(),
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
    console.log(`WebSocket closed for Docker build ${buildId}`);
  });
});

module.exports = router;