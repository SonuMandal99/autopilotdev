const express = require('express');
const router = express.Router();
const { body, query, validationResult } = require('express-validator');
const analyzeController = require('../controllers/analyzeController');
const authMiddleware = require('../middleware/authMiddleware');
const rateLimitMiddleware = require('../middleware/rateLimitMiddleware');

// Apply rate limiting to analysis routes
router.use(rateLimitMiddleware.analyzeLimiter);

/**
 * @route POST /api/v1/analyze/repository
 * @desc Analyze a GitHub repository
 * @access Private
 */
router.post(
  '/repository',
  [
    authMiddleware.verifyToken,
    body('url').isURL().withMessage('Valid repository URL is required'),
    body('branch').optional().isString(),
    body('depth').optional().isInt({ min: 1, max: 10 }),
    body('includeDependencies').optional().isBoolean(),
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
      await analyzeController.analyzeRepository(req, res);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/v1/analyze/:analysisId
 * @desc Get analysis results by ID
 * @access Private
 */
router.get(
  '/:analysisId',
  [
    authMiddleware.verifyToken,
    query('includeFiles').optional().isBoolean(),
    query('includeMetrics').optional().isBoolean(),
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
      await analyzeController.getAnalysisById(req, res);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/v1/analyze
 * @desc Get list of analyses (with pagination)
 * @access Private
 */
router.get(
  '/',
  [
    authMiddleware.verifyToken,
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('sortBy').optional().isIn(['createdAt', 'updatedAt', 'name']),
    query('order').optional().isIn(['asc', 'desc']),
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
      await analyzeController.getAnalyses(req, res);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/v1/analyze/validate
 * @desc Validate repository URL
 * @access Private
 */
router.post(
  '/validate',
  [
    authMiddleware.verifyToken,
    body('url').isURL().withMessage('Valid URL is required'),
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
      await analyzeController.validateRepository(req, res);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/v1/analyze/:analysisId/suggest
 * @desc Get AI suggestions for repository
 * @access Private
 */
router.post(
  '/:analysisId/suggest',
  [
    authMiddleware.verifyToken,
    body('aspects').optional().isArray(),
    body('includeExamples').optional().isBoolean(),
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
      await analyzeController.getSuggestions(req, res);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/v1/analyze/:analysisId/code-review
 * @desc Perform AI-powered code review
 * @access Private
 */
router.post(
  '/:analysisId/code-review',
  [
    authMiddleware.verifyToken,
    body('files').optional().isArray(),
    body('focus').optional().isIn(['security', 'performance', 'best-practices', 'all']),
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
      await analyzeController.performCodeReview(req, res);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/v1/analyze/:analysisId/dependencies
 * @desc Analyze dependencies
 * @access Private
 */
router.post(
  '/:analysisId/dependencies',
  [
    authMiddleware.verifyToken,
    query('checkVulnerabilities').optional().isBoolean(),
    query('checkUpdates').optional().isBoolean(),
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
      await analyzeController.analyzeDependencies(req, res);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/v1/analyze/:analysisId/complexity
 * @desc Calculate code complexity metrics
 * @access Private
 */
router.post(
  '/:analysisId/complexity',
  [
    authMiddleware.verifyToken,
  ],
  async (req, res, next) => {
    try {
      await analyzeController.calculateComplexity(req, res);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/v1/analyze/:analysisId/files
 * @desc Get repository files structure
 * @access Private
 */
router.get(
  '/:analysisId/files',
  [
    authMiddleware.verifyToken,
    query('path').optional().isString(),
    query('type').optional().isIn(['file', 'directory', 'all']),
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
      await analyzeController.getFileStructure(req, res);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/v1/analyze/:analysisId/file/:filePath
 * @desc Get file content
 * @access Private
 */
router.get(
  '/:analysisId/file/:filePath(*)',
  [
    authMiddleware.verifyToken,
  ],
  async (req, res, next) => {
    try {
      await analyzeController.getFileContent(req, res);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route DELETE /api/v1/analyze/:analysisId
 * @desc Delete analysis
 * @access Private
 */
router.delete(
  '/:analysisId',
  [
    authMiddleware.verifyToken,
  ],
  async (req, res, next) => {
    try {
      await analyzeController.deleteAnalysis(req, res);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/v1/analyze/stats/summary
 * @desc Get analysis statistics
 * @access Private
 */
router.get(
  '/stats/summary',
  [
    authMiddleware.verifyToken,
    query('timeframe').optional().isIn(['day', 'week', 'month', 'year']),
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
      await analyzeController.getAnalysisStats(req, res);
    } catch (error) {
      next(error);
    }
  }
);

// WebSocket endpoint for real-time analysis updates
router.ws('/:analysisId/stream', (ws, req) => {
  const { analysisId } = req.params;
  
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      
      switch (data.type) {
        case 'subscribe':
          // Subscribe to analysis updates
          ws.analysisId = analysisId;
          ws.send(JSON.stringify({
            type: 'subscribed',
            analysisId,
            timestamp: new Date().toISOString()
          }));
          break;
          
        case 'get-progress':
          // Get analysis progress
          const progress = await analyzeController.getAnalysisProgress(analysisId);
          ws.send(JSON.stringify({
            type: 'progress',
            progress,
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
    console.log(`WebSocket closed for analysis ${analysisId}`);
  });
});

module.exports = router;