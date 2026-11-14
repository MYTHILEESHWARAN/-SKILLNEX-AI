/**
 * SKILLNEX AI — OAuth Routes
 * Social login endpoints for Google, LinkedIn, GitHub
 */

const express = require('express');
const router = express.Router();
const { oauthCallback } = require('../controllers/oauthController');

// OAuth callback endpoint (receives profile data from frontend)
router.post('/callback', oauthCallback);

module.exports = router;
