/**
 * SKILLNEX AI — Assessment Routes
 */

const express = require('express');
const router = express.Router();
const {
  generateAssessment,
  evaluateAssessment,
  getAssessmentHistory
} = require('../controllers/assessmentController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/generate', generateAssessment);
router.post('/evaluate', evaluateAssessment);
router.get('/history', getAssessmentHistory);

module.exports = router;
