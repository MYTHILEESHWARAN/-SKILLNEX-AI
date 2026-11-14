/**
 * SKILLNEX AI — Profile Model
 * Stores comprehensive user career and skill profile information.
 */

const mongoose = require('mongoose');

const skillItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Skill name is required'],
      trim: true
    },
    category: {
      type: String,
      enum: ['technical', 'soft', 'tool', 'domain', 'other'],
      default: 'technical'
    },
    proficiency: {
      type: Number,
      min: [0, 'Proficiency cannot be less than 0'],
      max: [100, 'Proficiency cannot exceed 100'],
      default: 50
    },
    verified: {
      type: Boolean,
      default: false
    }
  },
  { _id: false }
);

const profileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      unique: true,
      index: true
    },
    currentRole: {
      type: String,
      trim: true,
      default: 'Student'
    },
    targetRole: {
      type: String,
      trim: true,
      default: 'Machine Learning Engineer'
    },
    bio: {
      type: String,
      maxlength: [500, 'Bio cannot exceed 500 characters'],
      default: ''
    },
    experienceLevel: {
      type: String,
      enum: {
        values: ['beginner', 'intermediate', 'advanced', 'expert'],
        message: '{VALUE} is not a valid experience level'
      },
      default: 'beginner'
    },
    skills: {
      type: [skillItemSchema],
      default: []
    },
    education: {
      type: String,
      trim: true,
      default: ''
    },
    preferredIndustries: {
      type: [String],
      default: []
    },
    targetSalary: {
      type: String,
      trim: true,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Profile', profileSchema);
