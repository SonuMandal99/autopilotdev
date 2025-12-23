const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

// Import routes
const analyzeRoutes = require('./routes/analyzeRoutes');
const dockerRoutes = require('./routes/dockerRoutes');
const k8sRoutes = require('./routes/k8sRoutes');
const cicdRoutes = require('./routes/cicdRoutes');
const deployRoutes = require('./routes/deployRoutes');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const notFoundHandler = require('./middleware/notFoundHandler');
const authMiddleware = require('./middleware/authMiddleware');

// Import configuration
const config = require('./config/appConfig');

class App {
  constructor() {
    this.app = express();
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  initializeMiddlewares() {
    // Security middleware
    this.app.use(helmet());
    
    // CORS configuration
    this.app.use(cors({
      origin: config.cors.origins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: config.rateLimit.windowMs,
      max: config.rateLimit.max,
      message: {
        success: false,
        error: 'Too many requests from this IP, please try again later.'
      },
      standardHeaders: true,
      legacyHeaders: false
    });
    
    this.app.use('/api/', limiter);

    // Body parsing
    this.app.use(express.json({ limit: config.server.maxRequestBodySize }));
    this.app.use(express.urlencoded({ extended: true, limit: config.server.maxRequestBodySize }));

    // Compression
    this.app.use(compression());

    // Static files
    this.app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
    this.app.use('/docs', express.static(path.join(__dirname, '../docs')));

    // Logging
    if (config.server.env === 'development') {
      this.app.use(morgan('dev'));
    } else {
      this.app.use(morgan('combined', {
        stream: require('fs').createWriteStream(
          path.join(__dirname, '../logs/access.log'),
          { flags: 'a' }
        )
      }));
    }

    // Request logging middleware
    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
      next();
    });
  }

  initializeRoutes() {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.status(200).json({
        success: true,
        message: 'AutoPilotDev API is running',
        timestamp: new Date().toISOString(),
        version: config.server.version,
        environment: config.server.env
      });
    });

    // API routes with version prefix
    const apiPrefix = `/api/${config.api.version}`;
    
    // Public routes (no authentication required)
    this.app.use(`${apiPrefix}/health`, (req, res) => {
      res.json({ status: 'healthy', service: 'AutoPilotDev API' });
    });

    // Protected routes (authentication required)
    this.app.use(`${apiPrefix}/analyze`, authMiddleware.verifyToken, analyzeRoutes);
    this.app.use(`${apiPrefix}/docker`, authMiddleware.verifyToken, dockerRoutes);
    this.app.use(`${apiPrefix}/kubernetes`, authMiddleware.verifyToken, k8sRoutes);
    this.app.use(`${apiPrefix}/cicd`, authMiddleware.verifyToken, cicdRoutes);
    this.app.use(`${apiPrefix}/deploy`, authMiddleware.verifyToken, deployRoutes);

    // Demo route for testing
    this.app.get(`${apiPrefix}/demo`, (req, res) => {
      res.json({
        success: true,
        message: 'AutoPilotDev API Demo Endpoint',
        endpoints: {
          analyze: `${apiPrefix}/analyze`,
          docker: `${apiPrefix}/docker`,
          kubernetes: `${apiPrefix}/kubernetes`,
          cicd: `${apiPrefix}/cicd`,
          deploy: `${apiPrefix}/deploy`
        },
        documentation: '/api-docs'
      });
    });

    // API documentation
    if (config.server.env === 'development') {
      const swaggerUi = require('swagger-ui-express');
      const swaggerDocument = require('../docs/swagger.json');
      this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
    }
  }

  initializeErrorHandling() {
    // 404 handler
    this.app.use(notFoundHandler);

    // Global error handler
    this.app.use(errorHandler);
  }

  getServer() {
    return this.app;
  }
}

module.exports = new App().getServer();