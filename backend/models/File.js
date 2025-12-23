const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
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
    enum: ['dockerfile', 'kubernetes', 'cicd', 'config', 'code', 'other'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  language: {
    type: String,
    default: 'text'
  },
  size: {
    type: Number,
    default: 0
  },
  tags: [{
    type: String
  }],
  metadata: {
    analysisId: mongoose.Schema.Types.ObjectId,
    deploymentId: mongoose.Schema.Types.ObjectId,
    repository: String,
    branch: String,
    generatedBy: {
      type: String,
      enum: ['ai', 'user', 'template'],
      default: 'user'
    }
  },
  isTemplate: {
    type: Boolean,
    default: false
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  downloads: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes
fileSchema.index({ userId: 1, createdAt: -1 });
fileSchema.index({ type: 1 });
fileSchema.index({ tags: 1 });
fileSchema.index({ 'metadata.analysisId': 1 });
fileSchema.index({ isTemplate: 1, type: 1 });

// Static methods
fileSchema.statics.findByUser = function(userId, options = {}) {
  const { limit = 20, skip = 0, type, tags, search } = options;
  
  const query = { userId };
  
  if (type) query.type = type;
  if (tags && tags.length > 0) query.tags = { $in: tags };
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { content: { $regex: search, $options: 'i' } }
    ];
  }
  
  return this.find(query)
    .sort('-createdAt')
    .skip(skip)
    .limit(limit)
    .lean();
};

fileSchema.statics.findTemplates = function(type = null) {
  const query = { isTemplate: true };
  if (type) query.type = type;
  
  return this.find(query)
    .sort({ downloads: -1 })
    .limit(50)
    .lean();
};

fileSchema.statics.incrementDownload = function(fileId) {
  return this.findByIdAndUpdate(
    fileId,
    { $inc: { downloads: 1 } },
    { new: true }
  );
};

// Instance methods
fileSchema.methods.addTag = function(tag) {
  if (!this.tags.includes(tag)) {
    this.tags.push(tag);
  }
  return this.save();
};

fileSchema.methods.removeTag = function(tag) {
  this.tags = this.tags.filter(t => t !== tag);
  return this.save();
};

fileSchema.methods.updateContent = function(content) {
  this.content = content;
  this.size = Buffer.byteLength(content, 'utf8');
  return this.save();
};

const File = mongoose.model('File', fileSchema);

module.exports = File;