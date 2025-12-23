const mongoose = require('mongoose');

const deploymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['docker', 'kubernetes', 'cloud', 'serverless'],
    required: true
  },
  environment: {
    type: String,
    enum: ['development', 'staging', 'production'],
    default: 'development'
  },
  status: {
    type: String,
    enum: ['pending', 'deploying', 'running', 'stopped', 'failed', 'scaling'],
    default: 'pending'
  },
  config: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  url: {
    type: String
  },
  ports: [{
    type: Number
  }],
  logs: [{
    timestamp: Date,
    message: String,
    level: {
      type: String,
      enum: ['info', 'success', 'warning', 'error', 'debug']
    }
  }],
  metrics: {
    cpu: Number,
    memory: Number,
    networkIn: Number,
    networkOut: Number,
    uptime: String
  },
  replicas: {
    type: Number,
    default: 1,
    min: 1,
    max: 10
  },
  health: {
    status: {
      type: String,
      enum: ['healthy', 'unhealthy', 'unknown'],
      default: 'unknown'
    },
    lastCheck: Date,
    checks: [{
      timestamp: Date,
      status: String,
      responseTime: Number
    }]
  },
  version: {
    type: String,
    default: '1.0.0'
  },
  metadata: {
    region: String,
    zone: String,
    instanceType: String,
    costEstimate: String
  },
  error: {
    message: String,
    stack: String,
    timestamp: Date
  }
}, {
  timestamps: true
});

// Indexes
deploymentSchema.index({ userId: 1, createdAt: -1 });
deploymentSchema.index({ status: 1 });
deploymentSchema.index({ type: 1 });
deploymentSchema.index({ environment: 1 });

// Static methods
deploymentSchema.statics.findByUser = function(userId, options = {}) {
  const { limit = 20, skip = 0, status, type, environment } = options;
  
  const query = { userId };
  
  if (status) query.status = status;
  if (type) query.type = type;
  if (environment) query.environment = environment;
  
  return this.find(query)
    .sort('-createdAt')
    .skip(skip)
    .limit(limit)
    .lean();
};

deploymentSchema.statics.getStats = function(userId, timeframe = 'month') {
  const dateFilter = getDateFilter(timeframe);
  
  return this.aggregate([
    {
      $match: {
        userId: mongoose.Types.ObjectId(userId),
        createdAt: dateFilter
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        running: { 
          $sum: { $cond: [{ $eq: ['$status', 'running'] }, 1, 0] }
        },
        failed: { 
          $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
        },
        byType: {
          $push: '$type'
        },
        byEnvironment: {
          $push: '$environment'
        }
      }
    }
  ]);
};

// Instance methods
deploymentSchema.methods.addLog = function(message, level = 'info') {
  this.logs.push({
    timestamp: new Date(),
    message,
    level
  });
  
  // Keep only last 1000 logs
  if (this.logs.length > 1000) {
    this.logs = this.logs.slice(-1000);
  }
  
  return this.save();
};

deploymentSchema.methods.updateStatus = function(status, data = {}) {
  this.status = status;
  
  if (data.url) this.url = data.url;
  if (data.ports) this.ports = data.ports;
  if (data.metrics) this.metrics = data.metrics;
  if (data.replicas) this.replicas = data.replicas;
  if (data.error) this.error = data.error;
  
  return this.save();
};

deploymentSchema.methods.updateMetrics = function(metrics) {
  this.metrics = { ...this.metrics, ...metrics };
  this.markModified('metrics');
  return this.save();
};

deploymentSchema.methods.updateHealth = function(status, responseTime = null) {
  this.health.status = status;
  this.health.lastCheck = new Date();
  
  if (responseTime !== null) {
    this.health.checks.push({
      timestamp: new Date(),
      status,
      responseTime
    });
    
    // Keep only last 100 health checks
    if (this.health.checks.length > 100) {
      this.health.checks = this.health.checks.slice(-100);
    }
  }
  
  return this.save();
};

deploymentSchema.methods.scale = function(replicas) {
  if (replicas < 1 || replicas > 10) {
    throw new Error('Replicas must be between 1 and 10');
  }
  
  this.replicas = replicas;
  this.status = 'scaling';
  this.addLog(`Scaling to ${replicas} replicas`, 'info');
  
  return this.save();
};

// Helper function
function getDateFilter(timeframe) {
  const now = new Date();
  let startDate = new Date();

  switch (timeframe) {
    case 'day':
      startDate.setDate(now.getDate() - 1);
      break;
    case 'week':
      startDate.setDate(now.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(now.getMonth() - 1);
      break;
    case 'year':
      startDate.setFullYear(now.getFullYear() - 1);
      break;
    default:
      startDate.setMonth(now.getMonth() - 1);
  }

  return { $gte: startDate };
}

const Deployment = mongoose.model('Deployment', deploymentSchema);

module.exports = Deployment;