const http = require('http');
const mongoose = require('mongoose');
const socketIo = require('socket.io');
const app = require('./app');
const config = require('./config/appConfig');
const logger = require('./utils/logger');

class Server {
  constructor() {
    this.app = app;
    this.server = http.createServer(this.app);
    this.io = socketIo(this.server, {
      cors: {
        origin: config.cors.origins,
        methods: ['GET', 'POST']
      }
    });
    this.port = config.server.port;
    this.setupSocketIO();
  }

  setupSocketIO() {
    this.io.on('connection', (socket) => {
      logger.info(`Socket connected: ${socket.id}`);

      // Join deployment room
      socket.on('join-deployment', (deploymentId) => {
        socket.join(`deployment-${deploymentId}`);
        logger.info(`Socket ${socket.id} joined deployment-${deploymentId}`);
      });

      // Leave deployment room
      socket.on('leave-deployment', (deploymentId) => {
        socket.leave(`deployment-${deploymentId}`);
        logger.info(`Socket ${socket.id} left deployment-${deploymentId}`);
      });

      // Code generation updates
      socket.on('subscribe-codegen', (sessionId) => {
        socket.join(`codegen-${sessionId}`);
      });

      // Disconnect
      socket.on('disconnect', () => {
        logger.info(`Socket disconnected: ${socket.id}`);
      });
    });

    // Make io available in app
    this.app.set('io', this.io);
  }

  async connectDatabase() {
    try {
      await mongoose.connect(config.database.uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });
      
      logger.info('✅ MongoDB connected successfully');
      
      mongoose.connection.on('error', (err) => {
        logger.error(`MongoDB connection error: ${err.message}`);
      });
      
      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected');
      });
      
    } catch (error) {
      logger.error(`❌ MongoDB connection failed: ${error.message}`);
      process.exit(1);
    }
  }

  async initializeServices() {
    try {
      // Initialize AI service
      const aiService = require('./services/ai/openaiService');
      await aiService.initialize();
      logger.info('✅ AI service initialized');
      
      // Initialize GitHub service
      const githubService = require('./services/githubService');
      await githubService.initialize();
      logger.info('✅ GitHub service initialized');
      
      // Initialize Docker service
      const dockerService = require('./services/dockerService');
      await dockerService.initialize();
      logger.info('✅ Docker service initialized');
      
    } catch (error) {
      logger.error(`Service initialization failed: ${error.message}`);
      // Don't exit, some services might be optional
    }
  }

  async start() {
    try {
      // Connect to database
      await this.connectDatabase();
      
      // Initialize services
      await this.initializeServices();
      
      // Start server
      this.server.listen(this.port, () => {
        logger.info(`
        🚀 AutoPilotDev Backend Server Started
        ========================================
        📍 Environment: ${config.server.env}
        🌐 Server URL: http://localhost:${this.port}
        📚 API Documentation: http://localhost:${this.port}/api-docs
        🔌 Socket.IO: http://localhost:${this.port} (ws://localhost:${this.port})
        🗄️  Database: ${config.database.uri.split('@')[1] || 'Local MongoDB'}
        📅 Started at: ${new Date().toISOString()}
        ========================================
        `);
      });

      // Handle server errors
      this.server.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
          logger.error(`Port ${this.port} is already in use`);
          process.exit(1);
        } else {
          logger.error(`Server error: ${error.message}`);
        }
      });

      // Graceful shutdown
      this.setupGracefulShutdown();

    } catch (error) {
      logger.error(`Failed to start server: ${error.message}`);
      process.exit(1);
    }
  }

  setupGracefulShutdown() {
    const shutdownSignals = ['SIGINT', 'SIGTERM', 'SIGQUIT'];
    
    shutdownSignals.forEach(signal => {
      process.on(signal, async () => {
        logger.warn(`\n${signal} received. Starting graceful shutdown...`);
        
        try {
          // Close socket connections
          this.io.close();
          logger.info('Socket connections closed');
          
          // Close HTTP server
          this.server.close(() => {
            logger.info('HTTP server closed');
          });
          
          // Close database connection
          await mongoose.connection.close();
          logger.info('Database connection closed');
          
          // Exit process
          setTimeout(() => {
            logger.info('Graceful shutdown completed');
            process.exit(0);
          }, 1000);
          
        } catch (error) {
          logger.error(`Error during shutdown: ${error.message}`);
          process.exit(1);
        }
      });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error(`Uncaught Exception: ${error.message}`);
      logger.error(error.stack);
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });
  }
}

// Create and start server instance
const server = new Server();

// Start the server
if (require.main === module) {
  server.start();
}

module.exports = { server, app: server.app };