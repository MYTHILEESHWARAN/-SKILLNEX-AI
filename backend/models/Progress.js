/**
 * SKILLNEX AI — Progress Model
 * Tracks learner milestones, daily streaks, learning hours, and completion rates.
 */

const mongoose = require('mongoose');

const completedItemSchema = new mongoose.Schema(
  {
    phaseNumber: {
      type: Number,
      required: true
    },
    weekNumber: {
      type: Number,
      required: true
    },
    itemTitle: {
      type: String,
      required: true,
      trim: true
    },
    hoursSpent: {
      type: Number,
      default: 2
    },
    completedAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const assessmentScoreRecordSchema = new mongoose.Schema(
  {
    assessmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assessment'
    },
    topic: {
      type: String,
      required: true
    },
    percentage: {
      type: Number,
      required: true
    },
    passed: {
      type: Boolean,
      default: false
    },
    weakTopics: [String],
    recordedAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const skillHistoryRecordSchema = new mongoose.Schema(
  {
    skill: {
      type: String,
      required: true
    },
    proficiency: {
      type: Number,
      required: true
    },
    source: {
      type: String,
      enum: ['assessment', 'manual', 'ai_analysis', 'module_completion'],
      default: 'assessment'
    },
    recordedAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const adaptiveAlertSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['revision_needed', 'milestone_missed', 'skill_unlocked', 'pace_adjustment'],
      required: true
    },
    message: {
      type: String,
      required: true
    },
    actionRequired: {
      type: String,
      default: ''
    },
    resolved: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const progressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      unique: true,
      index: true
    },
    roadmapId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Roadmap'
    },
    overallPercentage: {
      type: Number,
      min: [0, 'Progress percentage cannot be negative'],
      max: [100, 'Progress percentage cannot exceed 100'],
      default: 0
    },
    streak: {
      current: {
        type: Number,
        default: 0
      },
      longest: {
        type: Number,
        default: 0
      },
      lastActiveDate: {
        type: Date,
        default: null
      }
    },
    totalHoursLearned: {
      type: Number,
      default: 0
    },
    completedModulesCount: {
      type: Number,
      default: 0
    },
    completedItems: {
      type: [completedItemSchema],
      default: []
    },
    assessmentScores: {
      type: [assessmentScoreRecordSchema],
      default: []
    },
    skillProficiencyHistory: {
      type: [skillHistoryRecordSchema],
      default: []
    },
    adaptiveAlerts: {
      type: [adaptiveAlertSchema],
      default: []
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Progress', progressSchema);
