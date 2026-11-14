/**
 * SKILLNEX AI — AI Module Routes
 * Protected endpoints for Mentor Chat, Skill Analysis, Career Matching, and Roadmap Generation.
 */

const express = require('express');
const router = express.Router();
const {
  mentorChat,
  getChatHistory,
  clearChatHistory,
  analyzeSkills,
  matchCareers,
  generateRoadmap,
  getUserRoadmaps
} = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

// All AI endpoints require active user authentication
router.use(protect);

// ── AI Mentor Endpoints ──
router.post('/mentor/chat', mentorChat);
router.get('/mentor/history', getChatHistory);
router.delete('/mentor/history', clearChatHistory);

// ── Skill Gap Analyzer Endpoints ──
router.post('/skills/analyze', analyzeSkills);

// ── Career Advisor Endpoints ──
router.post('/careers/match', matchCareers);

// ── Learning Roadmap Generator Endpoints ──
router.post('/roadmap/generate', generateRoadmap);
router.get('/roadmap', getUserRoadmaps);

module.exports = router;
