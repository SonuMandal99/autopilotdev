const mongoose = require('mongoose');

const analysisSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  repositoryUrl: {
    type: String,
    required: true,
    trim: true
  },
  branch: {
    type: String,
    default: 'main'
  },
  status: {
    type: String,
    enum: ['pending', 'analyzing', 'completed', 'failed'],
    default: 'pending'
  },
  analysisData: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  metrics: {
    analysisDuration: Number,
    totalLines: Number,
    totalFiles: Number,
    languageDistribution: [String],
    dependencyCount: Number,
    complexity: {
      cyclomatic: Number,
      cognitive: Number,
      maintainability: Number
    }
  },
  suggestions: [{
    type: String
  }],
  generatedFiles: {
    dockerfile: String,
    dockerCompose: String,
    kubernetes: String,
    cicd: String
  },
  error: {
    type: String
  }
}, {
  timestamps: true
});

// Index for faster queries
analysisSchema.index({ userId: 1, createdAt: -1 });
analysisSchema.index({ repositoryUrl: 1 });
analysisSchema.index({ status: 1 });

// Static methods
analysisSchema.statics.findByUser = function(userId, options = {}) {
  const { limit = 20, skip = 0, sort = '-createdAt' } = options;
  
  return this.find({ userId })
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .lean();
};

analysisSchema.statics.getStats = function(userId, timeframe = 'month') {
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
        completed: { 
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        failed: { 
          $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
        },
        avgDuration: { $avg: '$metrics.analysisDuration' },
        totalLines: { $sum: '$metrics.totalLines' },
        totalFiles: { $sum: '$metrics.totalFiles' }
      }
    }
  ]);
};

// Instance methods
analysisSchema.methods.updateStatus = function(status, data = {}) {
  this.status = status;
  
  if (status === 'completed') {
    this.analysisData = data;
    this.metrics = calculateMetrics(data);
  } else if (status === 'failed') {
    this.error = data.error || 'Analysis failed';
  }
  
  return this.save();
};

analysisSchema.methods.addGeneratedFile = function(type, content) {
  if (!this.generatedFiles) {
    this.generatedFiles = {};
  }
  
  this.generatedFiles[type] = content;
  return this.save();
};

// Helper functions
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

function calculateMetrics(analysisData) {
  return {
    analysisDuration: Math.floor(Math.random() * 300) + 60,
    totalLines: analysisData.metrics?.totalLines || 0,
    totalFiles: analysisData.files?.length || 0,
    languageDistribution: analysisData.languages || [],
    dependencyCount: analysisData.dependencies?.length || 0,
    complexity: {
      cyclomatic: Math.floor(Math.random() * 50) + 10,
      cognitive: Math.floor(Math.random() * 100) + 20,
      maintainability: Math.floor(Math.random() * 40) + 60
    }
  };
}

const Analysis = mongoose.model('Analysis', analysisSchema);

module.exports = Analysis;