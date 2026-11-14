/**
 * SKILLNEX AI — Roadmap Model
 * Structured learning roadmaps broken down into phases and weekly modules.
 */

const mongoose = require('mongoose');

const milestoneSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    completed: {
      type: Boolean,
      default: false
    }
  },
  { _id: false }
);

const weekModuleSchema = new mongoose.Schema(
  {
    weekNumber: {
      type: Number,
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    hours: {
      type: Number,
      default: 10
    },
    skillsCovered: {
      type: [String],
      default: []
    },
    milestones: {
      type: [milestoneSchema],
      default: []
    },
    isCompleted: {
      type: Boolean,
      default: false
    }
  },
  { _id: false }
);

const phaseSchema = new mongoose.Schema(
  {
    phaseNumber: {
      type: Number,
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['not_started', 'in_progress', 'completed'],
      default: 'not_started'
    },
    weeks: {
      type: [weekModuleSchema],
      default: []
    }
  },
  { _id: false }
);

const roadmapSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true
    },
    title: {
      type: String,
      required: [true, 'Roadmap title is required'],
      trim: true
    },
    targetRole: {
      type: String,
      required: [true, 'Target role is required'],
      trim: true
    },
    estimatedWeeks: {
      type: Number,
      default: 16
    },
    currentPhase: {
      type: Number,
      default: 1
    },
    phases: {
      type: [phaseSchema],
      default: []
    },
    isActive: {
      type: Boolean,
      default: true
    },
    generatedBy: {
      type: String,
      enum: ['ai', 'custom'],
      default: 'ai'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Roadmap', roadmapSchema);
