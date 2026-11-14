/**
 * SKILLNEX AI — OAuth Controller
 * Handles social login via Google, LinkedIn, GitHub
 */

const { User, Profile, Progress } = require('../models');
const jwt = require('jsonwebtoken');

/**
 * @desc    Handle OAuth callback and create/update user
 * @route   POST /api/auth/oauth/callback
 * @access  Public
 */
const oauthCallback = async (req, res, next) => {
  try {
    const { provider, profile } = req.body;

    if (!provider || !profile) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Provider and profile data are required.',
          code: 'VALIDATION_MISSING_OAUTH_DATA'
        }
      });
    }

    const { id, email, name, picture } = profile;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: {
          message: `Unable to retrieve email from ${provider}. Please grant email access in your ${provider} settings.`,
          code: 'OAUTH_EMAIL_REQUIRED'
        }
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user exists
    let user = await User.findOne({ email: normalizedEmail });

    if (user) {
      // Existing user - return token
      const token = generateToken(user._id, user.role);

      return res.status(200).json({
        success: true,
        message: `Logged in with ${provider}`,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          createdAt: user.createdAt
        }
      });
    }

    // Create new user from OAuth profile
    const newUser = await User.create({
      name: name || email.split('@')[0],
      email: normalizedEmail,
      password: `oauth_${provider}_${id}`, // OAuth users don't have passwords
      role: 'student', // Default role for OAuth signups
      avatar: picture || ''
    });

    // Auto-initialize profile and progress
    try {
      await Profile.create({
        userId: newUser._id,
        currentRole: 'Student',
        targetRole: 'Software Engineer'
      });

      await Progress.create({
        userId: newUser._id,
        overallPercentage: 0,
        streak: { current: 1, longest: 1, lastActiveDate: new Date() },
        totalHoursLearned: 0
      });
    } catch (profileErr) {
      console.warn(`[Profile Init Notice] ${profileErr.message}`);
    }

    // Issue token
    const token = generateToken(newUser._id, newUser.role);

    return res.status(201).json({
      success: true,
      message: `Account created via ${provider}`,
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        avatar: newUser.avatar,
        createdAt: newUser.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Helper: Generate JWT token
 */
const generateToken = (userId, role) => {
  const secret = process.env.JWT_SECRET || 'skillnex_dev_secret_change_in_production_key_12345';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign({ id: userId, role }, secret, { expiresIn });
};

module.exports = {
  oauthCallback
};
