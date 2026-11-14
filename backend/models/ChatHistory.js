/**
 * SKILLNEX AI — ChatHistory Model
 * Persists conversations between learners and the Gemini-powered AI Mentor.
 */

const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: String,
      enum: {
        values: ['user', 'ai', 'system'],
        message: '{VALUE} is not a valid message sender'
      },
      required: [true, 'Message sender is required']
    },
    text: {
      type: String,
      required: [true, 'Message text is required'],
      trim: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const chatHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true
    },
    topic: {
      type: String,
      default: 'General Career & Skill Mentorship',
      trim: true
    },
    messages: {
      type: [messageSchema],
      default: []
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('ChatHistory', chatHistorySchema);
