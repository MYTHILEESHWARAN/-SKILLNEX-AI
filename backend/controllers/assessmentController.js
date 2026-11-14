/**
 * SKILLNEX AI — Assessment Controller
 * Generates technical assessments, evaluates user submissions, and updates skill proficiencies.
 */

const { Assessment, Profile, Progress } = require('../models');
const assessmentAgent = require('../agents/assessmentEvaluatorAgent');

/**
 * @desc    Generate a skill-based quiz
 * @route   POST /api/assessment/generate
 * @access  Private (JWT)
 */
const generateAssessment = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { topic, targetRole, difficulty = 'intermediate', questionCount = 3 } = req.body;

    const profile = await Profile.findOne({ userId });
    const chosenTopic = topic || (profile ? `${profile.targetRole} Core Competencies` : 'Software Engineering Fundamentals');
    const chosenRole = targetRole || (profile ? profile.targetRole : 'Software Engineer');

    const agentResult = await assessmentAgent.generateAssessment({
      topic: chosenTopic,
      targetRole: chosenRole,
      difficulty,
      questionCount: Number(questionCount) || 3
    });

    if (!agentResult.success || !agentResult.data) {
      return res.status(503).json({
        success: false,
        error: {
          message: agentResult.error || 'Failed to generate assessment questions with Gemini AI.',
          code: 'ASSESSMENT_GEN_FAILED'
        }
      });
    }

    // Save assessment questions in MongoDB
    const assessment = await Assessment.create({
      userId,
      topic: chosenTopic,
      targetRole: chosenRole,
      difficulty,
      questions: agentResult.data.questions || [],
      status: 'generated'
    });

    // Strip correctAnswer when sending to client to prevent client-side inspection
    const sanitizedQuestions = assessment.questions.map(q => ({
      questionId: q.questionId,
      questionText: q.questionText,
      options: q.options,
      skillTested: q.skillTested,
      difficulty: q.difficulty
    }));

    return res.status(201).json({
      success: true,
      data: {
        assessmentId: assessment._id,
        topic: assessment.topic,
        targetRole: assessment.targetRole,
        difficulty: assessment.difficulty,
        totalQuestions: sanitizedQuestions.length,
        questions: sanitizedQuestions
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Submit & evaluate user assessment answers
 * @route   POST /api/assessment/evaluate
 * @access  Private (JWT)
 */
const evaluateAssessment = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { assessmentId, userAnswers = [] } = req.body;

    if (!assessmentId) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'assessmentId is required.',
          code: 'VALIDATION_MISSING_ID'
        }
      });
    }

    const assessment = await Assessment.findOne({ _id: assessmentId, userId });
    if (!assessment) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Assessment not found or does not belong to you.',
          code: 'ASSESSMENT_NOT_FOUND'
        }
      });
    }

    if (assessment.status === 'completed') {
      return res.status(409).json({
        success: false,
        error: {
          message: 'This assessment has already been evaluated and completed.',
          code: 'ASSESSMENT_ALREADY_COMPLETED'
        }
      });
    }

    // Evaluate answers
    const evaluation = await assessmentAgent.evaluateAnswers({
      questions: assessment.questions,
      userAnswers
    });

    if (!evaluation.success) {
      return res.status(500).json({
        success: false,
        error: {
          message: 'Failed to evaluate assessment answers.',
          code: 'EVALUATION_ERROR'
        }
      });
    }

    const evalData = evaluation.data;

    // Record user answers & results in Assessment
    assessment.userResponses = userAnswers.map(ans => {
      const q = assessment.questions.find(item => item.questionId === ans.questionId);
      return {
        questionId: ans.questionId,
        selectedAnswer: ans.selectedAnswer,
        isCorrect: q ? q.correctAnswer === ans.selectedAnswer : false
      };
    });

    assessment.status = 'completed';
    assessment.result = {
      score: evalData.score,
      totalQuestions: evalData.totalQuestions,
      percentage: evalData.percentage,
      passed: evalData.passed,
      strengths: evalData.strengths,
      weakTopics: evalData.weakTopics,
      recommendations: [evalData.adaptiveRecommendation],
      evaluatedAt: new Date()
    };
    await assessment.save();

    // Update Progress model with assessment score
    const progress = await Progress.findOne({ userId });
    if (progress) {
      progress.assessmentScores.push({
        assessmentId: assessment._id,
        topic: assessment.topic,
        percentage: evalData.percentage,
        passed: evalData.passed,
        weakTopics: evalData.weakTopics,
        recordedAt: new Date()
      });

      // Record skill history
      evalData.strengths.forEach(skillName => {
        progress.skillProficiencyHistory.push({
          skill: skillName,
          proficiency: evalData.passed ? 85 : 65,
          source: 'assessment',
          recordedAt: new Date()
        });
      });

      await progress.save();
    }

    // Adaptive skill updates on Profile
    const profile = await Profile.findOne({ userId });
    if (profile && evalData.strengths.length > 0) {
      evalData.strengths.forEach(skillName => {
        const existingSkill = profile.skills.find(s => s.name.toLowerCase() === skillName.toLowerCase());
        if (existingSkill) {
          // Boost proficiency on passing assessment
          existingSkill.proficiency = Math.min(100, existingSkill.proficiency + 10);
          if (evalData.passed) existingSkill.verified = true;
        } else {
          profile.skills.push({
            name: skillName,
            category: 'technical',
            proficiency: evalData.passed ? 80 : 60,
            verified: evalData.passed
          });
        }
      });
      await profile.save();
    }

    return res.status(200).json({
      success: true,
      data: {
        assessmentId: assessment._id,
        topic: assessment.topic,
        score: evalData.score,
        totalQuestions: evalData.totalQuestions,
        percentage: evalData.percentage,
        passed: evalData.passed,
        strengths: evalData.strengths,
        weakTopics: evalData.weakTopics,
        detailedFeedback: evalData.feedbackList,
        adaptiveRecommendation: evalData.adaptiveRecommendation
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user's past assessments
 * @route   GET /api/assessment/history
 * @access  Private (JWT)
 */
const getAssessmentHistory = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const history = await Assessment.find({ userId }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: history
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  generateAssessment,
  evaluateAssessment,
  getAssessmentHistory
};
