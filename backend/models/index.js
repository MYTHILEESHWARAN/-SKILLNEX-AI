/**
 * SKILLNEX AI — Models Index
 * Central export hub for all Mongoose models.
 */

const User = require('./User');
const Profile = require('./Profile');
const Progress = require('./Progress');
const Roadmap = require('./Roadmap');
const ChatHistory = require('./ChatHistory');
const TokenBlacklist = require('./TokenBlacklist');
const Assessment = require('./Assessment');

module.exports = {
  User,
  Profile,
  Progress,
  Roadmap,
  ChatHistory,
  TokenBlacklist,
  Assessment
};
