/**
 * SKILLNEX AI — Assessment Model
 * Stores skill-based quizzes, evaluations, answers, and adaptive feedback.
 */

const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    questionId: {
      type: Number,
      required: true
    },
    questionText: {
      type: String,
      required: true,
      trim: true
    },
    options: {
      type: [String],
      required: true,
      validate: [opts => opts.length >= 2, 'At least 2 options required']
    },
    correctAnswer: {
      type: Number, // 0-based index of correct option
      required: true
    },
    explanation: {
      type: String,
      default: ''
    },
    skillTested: {
      type: String,
      required: true,
      trim: true
    },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'intermediate'
    }
  },
  { _id: false }
);

const userResponseSchema = new mongoose.Schema(
  {
    questionId: {
      type: Number,
      required: true
    },
    selectedAnswer: {
      type: Number,
      required: true
    },
    isCorrect: {
      type: Boolean,
      required: true
    }
  },
  { _id: false }
);

const assessmentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    topic: {
      type: String,
      required: true,
      trim: true
    },
    targetRole: {
      type: String,
      required: true,
      trim: true
    },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'intermediate'
    },
    questions: {
      type: [questionSchema],
      required: true
    },
    userResponses: {
      type: [userResponseSchema],
      default: []
    },
    status: {
      type: String,
      enum: ['generated', 'in_progress', 'completed'],
      default: 'generated'
    },
    result: {
      score: { type: Number, default: 0 },
      totalQuestions: { type: Number, default: 0 },
      percentage: { type: Number, default: 0 },
      passed: { type: Boolean, default: false },
      strengths: { type: [String], default: [] },
      weakTopics: { type: [String], default: [] },
      recommendations: { type: [String], default: [] },
      evaluatedAt: { type: Date, default: null }
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Assessment', assessmentSchema);
