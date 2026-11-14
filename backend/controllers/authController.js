/**
 * SKILLNEX AI — Authentication Controller
 * Handles user registration, credential verification, JWT issuance, and sessions.
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Profile, Progress, TokenBlacklist } = require('../models');

// Helper to generate signed JWT token
const generateToken = (userId, role) => {
  const secret = process.env.JWT_SECRET || 'skillnex_dev_secret_change_in_production_key_12345';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  return jwt.sign({ id: userId, role }, secret, { expiresIn });
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // Validate inputs
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Please provide name, email, and password.',
          code: 'VALIDATION_MISSING_FIELDS'
        }
      });
    }

    // Validate email format
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Please provide a valid email address.',
          code: 'VALIDATION_INVALID_EMAIL'
        }
      });
    }

    // Validate password strength (minimum 8 characters)
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Password must be at least 8 characters long.',
          code: 'VALIDATION_WEAK_PASSWORD'
        }
      });
    }

    // Explicitly prohibit public registration for admin role
    if (role && role.toLowerCase() === 'admin') {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Public registration for the admin role is prohibited. Admin accounts must be provisioned through secure administrative procedures.',
          code: 'AUTH_ADMIN_REGISTRATION_FORBIDDEN'
        }
      });
    }

    // Validate allowed public roles
    const allowedPublicRoles = ['student', 'professional', 'organization'];
    const assignedRole = role ? role.toLowerCase() : 'student';
    if (!allowedPublicRoles.includes(assignedRole)) {
      return res.status(400).json({
        success: false,
        error: {
          message: `Public registration role must be one of: ${allowedPublicRoles.join(', ')}`,
          code: 'VALIDATION_INVALID_ROLE'
        }
      });
    }

    // Check if user already exists
    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: {
          message: 'An account with this email address already exists.',
          code: 'AUTH_EMAIL_EXISTS'
        }
      });
    }

    // Hash password with bcrypt (salt rounds = 12)
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const newUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: assignedRole
    });

    // Automatically initialize Profile & Progress records for seamless onboarding
    try {
      await Profile.create({
        userId: newUser._id,
        currentRole: assignedRole === 'student' ? 'Student' : assignedRole === 'professional' ? 'Professional' : 'Organization Member',
        targetRole: assignedRole === 'student' ? 'Software Engineer' : 'Lead Engineer'
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

    // Issue JWT token
    const token = generateToken(newUser._id, newUser.role);

    return res.status(201).json({
      success: true,
      message: 'User registered successfully.',
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
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate inputs
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Please provide both email and password.',
          code: 'VALIDATION_MISSING_CREDENTIALS'
        }
      });
    }

    // Check for user
    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Invalid email or password.',
          code: 'AUTH_INVALID_CREDENTIALS'
        }
      });
    }

    // Check account active state
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'This account has been deactivated. Please contact support.',
          code: 'AUTH_ACCOUNT_DISABLED'
        }
      });
    }

    // Verify password with bcrypt
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Invalid email or password.',
          code: 'AUTH_INVALID_CREDENTIALS'
        }
      });
    }

    // Generate token
    const token = generateToken(user._id, user.role);

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
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
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get currently logged in user profile
 * @route   GET /api/auth/me
 * @access  Private (Requires JWT)
 */
const getMe = async (req, res, next) => {
  try {
    // req.user was attached by authMiddleware.protect
    const user = req.user;

    // Fetch related profile if present
    const profile = await Profile.findOne({ userId: user._id });
    const progress = await Progress.findOne({ userId: user._id });

    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          createdAt: user.createdAt
        },
        profile: profile || null,
        progress: progress ? {
          overallPercentage: progress.overallPercentage,
          streak: progress.streak,
          totalHoursLearned: progress.totalHoursLearned
        } : null
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Secure Admin User Registration
 * @route   POST /api/auth/admin/register
 * @access  Restricted (Requires ADMIN_SETUP_SECRET or Authenticated Admin)
 */
const registerAdmin = async (req, res, next) => {
  try {
    const { name, email, password, adminSecretKey } = req.body;

    // Verify administrative provisioning authorization
    const configuredSecret = process.env.ADMIN_SETUP_SECRET || 'skillnex_admin_provisioning_secret_2026';
    const isAuthorizedViaSecret = adminSecretKey && adminSecretKey === configuredSecret;
    const isAuthorizedViaToken = req.user && req.user.role === 'admin';

    if (!isAuthorizedViaSecret && !isAuthorizedViaToken) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Access denied: Valid administrative setup secret or active admin credentials required.',
          code: 'AUTH_ADMIN_UNAUTHORIZED'
        }
      });
    }

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Please provide name, email, and password.',
          code: 'VALIDATION_MISSING_FIELDS'
        }
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Admin password must be at least 8 characters long.',
          code: 'VALIDATION_WEAK_PASSWORD'
        }
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({
        success: false,
        error: {
          message: 'An account with this email address already exists.',
          code: 'AUTH_EMAIL_EXISTS'
        }
      });
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const adminUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: 'admin'
    });

    const token = generateToken(adminUser._id, adminUser.role);

    return res.status(201).json({
      success: true,
      message: 'Admin account provisioned successfully.',
      token,
      user: {
        id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role,
        createdAt: adminUser.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Log user out & revoke JWT token on server
 * @route   POST /api/auth/logout
 * @access  Public / Protected
 */
const logout = async (req, res, next) => {
  try {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'No active session token provided in Authorization header to revoke.',
          code: 'AUTH_TOKEN_MISSING'
        }
      });
    }

    // Decode token to extract expiration for TTL indexing
    const secret = process.env.JWT_SECRET || 'skillnex_dev_secret_change_in_production_key_12345';
    let expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7d default fallback

    try {
      const decoded = jwt.decode(token);
      if (decoded && decoded.exp) {
        expiresAt = new Date(decoded.exp * 1000);
      }
    } catch (e) {
      // Use fallback expiresAt
    }

    // Store in token blacklist to revoke it immediately on server
    await TokenBlacklist.findOneAndUpdate(
      { token },
      { token, expiresAt },
      { upsert: true, new: true }
    );

    return res.status(200).json({
      success: true,
      message: 'User logged out successfully. Token has been revoked on the server.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  registerAdmin,
  login,
  getMe,
  logout
};
