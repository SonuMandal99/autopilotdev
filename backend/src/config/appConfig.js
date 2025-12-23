require('dotenv').config();

const appConfig = {
  server: {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT) || 5000,
    name: process.env.APP_NAME || 'AutoPilotDev',
    version: process.env.APP_VERSION || '1.0.0',
    maxRequestBodySize: process.env.MAX_REQUEST_SIZE || '10mb',
    apiPrefix: process.env.API_PREFIX || '/api',
    apiVersion: process.env.API_VERSION || 'v1'
  },

  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/autopilotdev',
    name: process.env.DB_NAME || 'autopilotdev',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    }
  },

  security: {
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-this',
    tokenExpiry: process.env.TOKEN_EXPIRY || '24h',
    sessionSecret: process.env.SESSION_SECRET || 'session-secret',
    cors: {
      origins: process.env.ALLOWED_ORIGINS 
        ? process.env.ALLOWED_ORIGINS.split(',') 
        : ['http://localhost:3000', 'http://localhost:5173'],
      credentials: true
    }
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) * 60 * 1000 || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
    message: 'Too many requests from this IP, please try again later.'
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
    filePath: process.env.LOG_FILE_PATH || './logs/app.log',
    maxSize: '10m',
    maxFiles: '5d'
  },

  fileStorage: {
    uploadPath: process.env.UPLOAD_PATH || './uploads/',
    tempPath: process.env.TEMP_PATH || './temp/',
    maxFileSize: process.env.MAX_FILE_SIZE || '10mb',
    allowedTypes: ['image/*', 'application/json', 'text/plain', 'application/x-yaml']
  },

  services: {
    openai: {
      enabled: !!process.env.OPENAI_API_KEY,
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL || 'gpt-4',
      maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS) || 2048,
      temperature: parseFloat(process.env.OPENAI_TEMPERATURE) || 0.7
    },
    
    github: {
      enabled: !!process.env.GITHUB_TOKEN,
      token: process.env.GITHUB_TOKEN,
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET
    },
    
    docker: {
      enabled: !process.env.DOCKER_DISABLED,
      username: process.env.DOCKER_USERNAME,
      password: process.env.DOCKER_PASSWORD,
      registry: process.env.DOCKER_REGISTRY_URL || 'https://index.docker.io/v1/'
    },
    
    kubernetes: {
      enabled: !process.env.K8S_DISABLED,
      configPath: process.env.KUBECONFIG_PATH || '~/.kube/config',
      namespace: process.env.K8S_NAMESPACE || 'default'
    },
    
    cloud: {
      aws: {
        enabled: !!process.env.AWS_ACCESS_KEY_ID,
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION || 'us-east-1'
      },
      azure: {
        enabled: !!process.env.AZURE_SUBSCRIPTION_ID,
        subscriptionId: process.env.AZURE_SUBSCRIPTION_ID,
        tenantId: process.env.AZURE_TENANT_ID,
        clientId: process.env.AZURE_CLIENT_ID,
        clientSecret: process.env.AZURE_CLIENT_SECRET
      },
      gcp: {
        enabled: !!process.env.GCP_PROJECT_ID,
        projectId: process.env.GCP_PROJECT_ID,
        serviceAccountKey: process.env.GCP_SERVICE_ACCOUNT_KEY
      }
    }
  },

  monitoring: {
    enabled: process.env.MONITORING_ENABLED === 'true',
    metricsPort: parseInt(process.env.METRICS_PORT) || 9090,
    healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL) || 30000
  },

  cache: {
    enabled: process.env.REDIS_URL ? true : false,
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
    ttl: parseInt(process.env.CACHE_TTL) || 3600 // 1 hour
  },

  email: {
    enabled: !!process.env.SMTP_HOST,
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
    from: process.env.EMAIL_FROM || 'noreply@autopilotdev.com'
  },

  storage: {
    type: process.env.STORAGE_TYPE || 'local', // local, s3, azure, gcp
    localPath: process.env.STORAGE_LOCAL_PATH || './storage',
    s3: {
      bucket: process.env.S3_BUCKET,
      region: process.env.S3_REGION
    }
  }
};

// Validate required configurations
function validateConfig() {
  const errors = [];

  if (!appConfig.database.uri) {
    errors.push('MONGODB_URI is required');
  }

  if (appConfig.server.env === 'production') {
    if (!appConfig.security.jwtSecret || appConfig.security.jwtSecret === 'your-secret-key-change-this') {
      errors.push('JWT_SECRET must be set in production');
    }
    
    if (!appConfig.security.sessionSecret || appConfig.security.sessionSecret === 'session-secret') {
      errors.push('SESSION_SECRET must be set in production');
    }
  }

  if (errors.length > 0) {
    console.error('Configuration errors:');
    errors.forEach(error => console.error(`  - ${error}`));
    process.exit(1);
  }
}

// Export configuration and validation function
module.exports = appConfig;
module.exports.validateConfig = validateConfig;