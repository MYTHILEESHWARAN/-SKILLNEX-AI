/**
 * SKILLNEX AI — AI Controller
 * Manages HTTP requests and database persistence for all Gemini AI modules.
 */

const { User, Profile, Progress, Roadmap, ChatHistory } = require('../models');
const aiService = require('../services/aiService');

/**
 * @desc    Chat with Gemini AI Mentor
 * @route   POST /api/ai/mentor/chat
 * @access  Private (JWT)
 */
const mentorChat = async (req, res, next) => {
  try {
    const { message } = req.body;
    const userId = req.user._id;

    if (!message || message.trim() === '') {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Chat message cannot be empty.',
          code: 'VALIDATION_EMPTY_MESSAGE'
        }
      });
    }

    // Retrieve or initialize user's ChatHistory
    let chat = await ChatHistory.findOne({ userId });
    if (!chat) {
      chat = await ChatHistory.create({
        userId,
        topic: 'General Career & Skill Mentorship',
        messages: []
      });
    }

    // Retrieve user Profile for contextual grounding
    const profile = await Profile.findOne({ userId });
    const userContext = {
      name: req.user.name,
      role: req.user.role,
      targetRole: profile ? profile.targetRole : 'Software Engineer',
      experienceLevel: profile ? profile.experienceLevel : 'beginner'
    };

    // Call Gemini AI service
    const replyText = await aiService.chatWithMentor({
      message: message.trim(),
      previousMessages: chat.messages,
      userContext
    });

    // Persist conversation to MongoDB
    chat.messages.push({
      sender: 'user',
      text: message.trim(),
      timestamp: new Date()
    });

    chat.messages.push({
      sender: 'ai',
      text: replyText,
      timestamp: new Date()
    });

    await chat.save();

    return res.status(200).json({
      success: true,
      data: {
        reply: replyText,
        sender: 'ai',
        timestamp: new Date(),
        totalMessages: chat.messages.length
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Fetch AI Mentor chat history
 * @route   GET /api/ai/mentor/history
 * @access  Private (JWT)
 */
const getChatHistory = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const chat = await ChatHistory.findOne({ userId });

    return res.status(200).json({
      success: true,
      data: {
        topic: chat ? chat.topic : 'General Career & Skill Mentorship',
        messages: chat ? chat.messages : []
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Clear AI Mentor chat history
 * @route   DELETE /api/ai/mentor/history
 * @access  Private (JWT)
 */
const clearChatHistory = async (req, res, next) => {
  try {
    const userId = req.user._id;
    await ChatHistory.findOneAndUpdate(
      { userId },
      { $set: { messages: [] } },
      { upsert: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Chat history cleared successfully.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Analyze skill gaps against a target role
 * @route   POST /api/ai/skills/analyze
 * @access  Private (JWT)
 */
const analyzeSkills = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const profile = await Profile.findOne({ userId });

    const targetRole = req.body.targetRole || (profile ? profile.targetRole : 'Machine Learning Engineer');
    const currentSkills = req.body.skills || (profile && profile.skills.length > 0 ? profile.skills.map(s => s.name) : ['Python', 'SQL', 'Git']);
    const experienceLevel = req.body.experienceLevel || (profile ? profile.experienceLevel : 'beginner');

    if (!targetRole || targetRole.trim() === '') {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Target role is required for skill gap analysis.',
          code: 'VALIDATION_MISSING_TARGET_ROLE'
        }
      });
    }

    const analysis = await aiService.analyzeSkillGap({
      currentSkills,
      targetRole: targetRole.trim(),
      experienceLevel
    });

    // Optionally update user's profile target role if requested
    if (profile && req.body.targetRole) {
      profile.targetRole = targetRole.trim();
      await profile.save();
    }

    return res.status(200).json({
      success: true,
      data: analysis
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Match user profile to career opportunities
 * @route   POST /api/ai/careers/match
 * @access  Private (JWT)
 */
const matchCareers = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const profile = await Profile.findOne({ userId });

    const skills = req.body.skills || (profile && profile.skills.length > 0 ? profile.skills.map(s => s.name) : ['Python', 'Data Structures', 'Git']);
    const experienceLevel = req.body.experienceLevel || (profile ? profile.experienceLevel : 'beginner');
    const currentRole = req.body.currentRole || (profile ? profile.currentRole : 'Student');
    const preferredIndustries = req.body.preferredIndustries || (profile ? profile.preferredIndustries : ['Technology', 'AI']);

    const matches = await aiService.matchCareers({
      skills,
      experienceLevel,
      currentRole,
      preferredIndustries
    });

    return res.status(200).json({
      success: true,
      data: matches
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Generate personalized learning roadmap
 * @route   POST /api/ai/roadmap/generate
 * @access  Private (JWT)
 */
const generateRoadmap = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const profile = await Profile.findOne({ userId });

    const targetRole = req.body.targetRole || (profile ? profile.targetRole : 'Machine Learning Engineer');
    const experienceLevel = req.body.experienceLevel || (profile ? profile.experienceLevel : 'beginner');
    const timeframeWeeks = Number(req.body.timeframeWeeks) || 16;
    const userSkills = req.body.skills || (profile && profile.skills.length > 0 ? profile.skills.map(s => s.name) : ['Python', 'Basics of Math']);

    if (!targetRole || targetRole.trim() === '') {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Target role is required to generate a learning roadmap.',
          code: 'VALIDATION_MISSING_TARGET_ROLE'
        }
      });
    }

    // Call Gemini AI service
    const generated = await aiService.generateRoadmap({
      userSkills,
      targetRole: targetRole.trim(),
      experienceLevel,
      timeframeWeeks
    });

    // Deactivate previous active roadmaps
    await Roadmap.updateMany({ userId, isActive: true }, { $set: { isActive: false } });

    // Save new roadmap to MongoDB
    const roadmap = await Roadmap.create({
      userId,
      title: generated.title || `${targetRole} Accelerator Roadmap`,
      targetRole: targetRole.trim(),
      estimatedWeeks: timeframeWeeks,
      currentPhase: 1,
      phases: generated.phases || [],
      isActive: true,
      generatedBy: 'ai'
    });

    // Update user's progress link
    await Progress.findOneAndUpdate(
      { userId },
      { $set: { roadmapId: roadmap._id, overallPercentage: 0 } },
      { upsert: true }
    );

    return res.status(201).json({
      success: true,
      message: 'Roadmap generated and saved successfully.',
      data: roadmap
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current user's roadmaps
 * @route   GET /api/ai/roadmap
 * @access  Private (JWT)
 */
const getUserRoadmaps = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const roadmaps = await Roadmap.find({ userId }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: roadmaps
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  mentorChat,
  getChatHistory,
  clearChatHistory,
  analyzeSkills,
  matchCareers,
  generateRoadmap,
  getUserRoadmaps
};
