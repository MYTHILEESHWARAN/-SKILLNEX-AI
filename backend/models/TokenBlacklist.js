/**
 * SKILLNEX AI — Token Blacklist Model
 * Stores revoked JWT tokens with MongoDB TTL automatic expiration.
 */

const mongoose = require('mongoose');

const tokenBlacklistSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 } // Automatically deleted by MongoDB when expiresAt is reached
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('TokenBlacklist', tokenBlacklistSchema);
