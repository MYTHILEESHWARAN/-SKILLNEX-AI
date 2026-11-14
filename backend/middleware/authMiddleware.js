/**
 * SKILLNEX AI — Authentication Middleware
 * Protects private endpoints by verifying JSON Web Tokens (JWT).
 */

const jwt = require('jsonwebtoken');
const { User, TokenBlacklist } = require('../models');

/**
 * Protect routes: requires a valid JWT in the Authorization header
 */
const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Access denied. No authentication token provided.',
          code: 'AUTH_TOKEN_MISSING'
        }
      });
    }

    // Check if token has been revoked
    const isRevoked = await TokenBlacklist.findOne({ token });
    if (isRevoked) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Token has been revoked. Please log in again.',
          code: 'AUTH_TOKEN_REVOKED'
        }
      });
    }

    // Verify token
    const secret = process.env.JWT_SECRET || 'skillnex_dev_secret_change_in_production_key_12345';
    let decoded;
    try {
      decoded = jwt.verify(token, secret);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: {
            message: 'Authentication token has expired. Please log in again.',
            code: 'AUTH_TOKEN_EXPIRED'
          }
        });
      }
      return res.status(401).json({
        success: false,
        error: {
          message: 'Invalid authentication token.',
          code: 'AUTH_TOKEN_INVALID'
        }
      });
    }

    // Check if user still exists
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'User associated with this token no longer exists.',
          code: 'AUTH_USER_NOT_FOUND'
        }
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'This user account has been deactivated.',
          code: 'AUTH_ACCOUNT_DEACTIVATED'
        }
      });
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error(`[Auth Middleware Error] ${error.message}`);
    return res.status(500).json({
      success: false,
      error: {
        message: 'Internal server error during authentication verification.',
        code: 'AUTH_INTERNAL_ERROR'
      }
    });
  }
};

/**
 * Role-based authorization middleware
 * @param  {...string} roles Allowed roles (e.g. 'admin', 'organization')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          message: `Forbidden: User role '${req.user ? req.user.role : 'anonymous'}' is not authorized to access this resource.`,
          code: 'AUTH_ROLE_FORBIDDEN'
        }
      });
    }
    next();
  };
};

module.exports = {
  protect,
  authorize
};
