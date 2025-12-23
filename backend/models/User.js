const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  profile: {
    name: String,
    avatar: String,
    bio: String,
    company: String,
    location: String,
    website: String,
    github: String
  },
  settings: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'dark'
    },
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true }
    },
    aiPreferences: {
      model: { type: String, default: 'gpt-4' },
      temperature: { type: Number, default: 0.7, min: 0, max: 2 }
    }
  },
  integrations: {
    github: {
      token: String,
      username: String
    },
    docker: {
      username: String,
      token: String
    },
    openai: {
      apiKey: String
    }
  },
  limits: {
    analysesPerDay: { type: Number, default: 10 },
    deploymentsPerDay: { type: Number, default: 5 },
    storageMB: { type: Number, default: 1024 }
  },
  usage: {
    analysesToday: { type: Number, default: 0 },
    deploymentsToday: { type: Number, default: 0 },
    storageUsedMB: { type: Number, default: 0 },
    lastReset: { type: Date, default: Date.now }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Check if user can perform analysis
userSchema.methods.canAnalyze = function() {
  this.resetDailyUsageIfNeeded();
  return this.usage.analysesToday < this.limits.analysesPerDay;
};

// Check if user can deploy
userSchema.methods.canDeploy = function() {
  this.resetDailyUsageIfNeeded();
  return this.usage.deploymentsToday < this.limits.deploymentsPerDay;
};

// Reset daily usage if needed
userSchema.methods.resetDailyUsageIfNeeded = function() {
  const now = new Date();
  const lastReset = new Date(this.usage.lastReset);
  
  // Reset if it's a new day
  if (now.toDateString() !== lastReset.toDateString()) {
    this.usage.analysesToday = 0;
    this.usage.deploymentsToday = 0;
    this.usage.lastReset = now;
  }
};

// Increment analysis count
userSchema.methods.incrementAnalysisCount = function() {
  this.resetDailyUsageIfNeeded();
  this.usage.analysesToday += 1;
  return this.save();
};

// Increment deployment count
userSchema.methods.incrementDeploymentCount = function() {
  this.resetDailyUsageIfNeeded();
  this.usage.deploymentsToday += 1;
  return this.save();
};

// Static methods
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

userSchema.statics.findByUsername = function(username) {
  return this.findOne({ username: username.toLowerCase() });
};

const User = mongoose.model('User', userSchema);

module.exports = User;