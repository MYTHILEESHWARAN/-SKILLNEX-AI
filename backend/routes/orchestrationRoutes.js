/**
 * SKILLNEX AI — Orchestration Routes
 */

const express = require('express');
const router = express.Router();
const { runOrchestration, runSingleAgent } = require('../controllers/orchestrationController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/run', runOrchestration);
router.post('/agent/:agentName', runSingleAgent);

module.exports = router;
