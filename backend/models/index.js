// Export all models from a single file
const User = require('./User');
const Analysis = require('./Analysis');
const Deployment = require('./Deployment');
const File = require('./File');

module.exports = {
  User,
  Analysis,
  Deployment,
  File
};