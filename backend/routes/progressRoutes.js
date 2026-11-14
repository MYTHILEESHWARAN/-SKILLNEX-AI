/**
 * SKILLNEX AI — Progress Routes
 */

const express = require('express');
const router = express.Router();
const {
  completeModule,
  getAdaptiveRecommendations
} = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/module/complete', completeModule);
router.post('/adaptive-recommendations', getAdaptiveRecommendations);

module.exports = router;
