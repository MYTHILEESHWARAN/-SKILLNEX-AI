/**
 * SKILLNEX AI — Authentication Routes
 * Maps auth endpoints to controller logic.
 */

const express = require('express');
const router = express.Router();
const {
  register,
  registerAdmin,
  login,
  getMe,
  logout
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Public endpoints (student, professional, organization)
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);

// Administrative provisioning endpoint (secured by setup secret or admin token)
router.post('/admin/register', registerAdmin);

// Protected endpoints
router.get('/me', protect, getMe);

module.exports = router;
