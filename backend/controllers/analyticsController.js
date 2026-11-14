/**
 * SKILLNEX AI — Analytics & Progress Controller
 * Handles real-time learning metrics, streaks, module tracking, and adaptive interventions.
 */

const { User, Profile, Progress, Roadmap, Assessment } = require('../models');

/**
 * Calculates current streak based on last active timestamp
 */
const updateStreak = (currentStreak = 0, longestStreak = 0, lastActiveDate = null) => {
  const now = new Date();
  if (!lastActiveDate) {
    return { current: 1, longest: Math.max(1, longestStreak), lastActiveDate: now };
  }

  const lastActive = new Date(lastActiveDate);
  // Normalize dates to midnight for day comparison
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const last = new Date(lastActive.getFullYear(), lastActive.getMonth(), lastActive.getDate());

  const diffDays = Math.round((today - last) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    // Already active today; streak unchanged
    return { current: currentStreak || 1, longest: longestStreak || 1, lastActiveDate: now };
  } else if (diffDays === 1) {
    // Active yesterday; streak increments
    const newStreak = (currentStreak || 0) + 1;
    return { current: newStreak, longest: Math.max(newStreak, longestStreak), lastActiveDate: now };
  } else {
    // Gap day detected; reset streak to 1
    return { current: 1, longest: longestStreak || 1, lastActiveDate: now };
  }
};

/**
 * @desc    Get complete learning analytics dashboard
 * @route   GET /api/analytics/dashboard
 * @access  Private (JWT)
 */
const getDashboardAnalytics = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const [profile, progress, activeRoadmap, assessments] = await Promise.all([
      Profile.findOne({ userId }),
      Progress.findOne({ userId }),
      Roadmap.findOne({ userId, isActive: true }),
      Assessment.find({ userId, status: 'completed' }).sort({ createdAt: -1 }).limit(10)
    ]);

    const completedCount = progress ? progress.completedItems.length : 0;
    const totalHours = progress ? progress.totalHoursLearned : 0;
    const streakData = progress ? progress.streak : { current: 0, longest: 0 };

    // Calculate dynamic completion % against active roadmap
    let calculatedPercentage = progress ? progress.overallPercentage : 0;
    if (activeRoadmap && activeRoadmap.phases) {
      let totalRoadmapModules = 0;
      activeRoadmap.phases.forEach(p => {
        totalRoadmapModules += (p.weeks ? p.weeks.length : 1);
      });
      if (totalRoadmapModules > 0) {
        calculatedPercentage = Math.min(100, Math.round((completedCount / totalRoadmapModules) * 100));
      }
    }

    // Compute average assessment performance
    let avgAssessmentScore = 0;
    if (assessments.length > 0) {
      const sum = assessments.reduce((acc, a) => acc + (a.result ? a.result.percentage : 0), 0);
      avgAssessmentScore = Math.round(sum / assessments.length);
    }

    return res.status(200).json({
      success: true,
      data: {
        learner: {
          id: req.user._id,
          name: req.user.name,
          role: req.user.role,
          targetRole: profile ? profile.targetRole : 'Software Engineer'
        },
        metrics: {
          streak: streakData,
          totalHoursLearned: totalHours,
          completedModulesCount: completedCount,
          overallPercentage: calculatedPercentage,
          averageAssessmentScore: avgAssessmentScore,
          activeRoadmapTitle: activeRoadmap ? activeRoadmap.title : null
        },
        skillsRadar: profile ? profile.skills : [],
        recentCompletedItems: progress ? progress.completedItems.slice(-5).reverse() : [],
        recentAssessments: assessments.map(a => ({
          id: a._id,
          topic: a.topic,
          score: a.result.score,
          total: a.result.totalQuestions,
          percentage: a.result.percentage,
          passed: a.result.passed,
          date: a.result.evaluatedAt
        })),
        adaptiveAlerts: progress ? progress.adaptiveAlerts.filter(a => !a.resolved) : []
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Record a completed module & update learning streak
 * @route   POST /api/progress/module/complete
 * @access  Private (JWT)
 */
const completeModule = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { phaseNumber, weekNumber, itemTitle, hoursSpent = 2 } = req.body;

    if (!itemTitle) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'itemTitle is required to log module completion.',
          code: 'VALIDATION_MISSING_TITLE'
        }
      });
    }

    let progress = await Progress.findOne({ userId });
    if (!progress) {
      progress = await Progress.create({ userId });
    }

    // Check if already completed
    const alreadyDone = progress.completedItems.some(
      i => i.itemTitle === itemTitle && i.phaseNumber === Number(phaseNumber) && i.weekNumber === Number(weekNumber)
    );

    if (alreadyDone) {
      return res.status(409).json({
        success: false,
        error: {
          message: `Module "${itemTitle}" has already been logged as completed.`,
          code: 'MODULE_ALREADY_COMPLETED'
        }
      });
    }

    // Add completed item
    const parsedHours = Number(hoursSpent) || 2;
    progress.completedItems.push({
      phaseNumber: Number(phaseNumber) || 1,
      weekNumber: Number(weekNumber) || 1,
      itemTitle: itemTitle.trim(),
      hoursSpent: parsedHours,
      completedAt: new Date()
    });

    // Update hours & module count
    progress.totalHoursLearned = (progress.totalHoursLearned || 0) + parsedHours;
    progress.completedModulesCount = progress.completedItems.length;

    // Recalculate streak
    progress.streak = updateStreak(
      progress.streak ? progress.streak.current : 0,
      progress.streak ? progress.streak.longest : 0,
      progress.streak ? progress.streak.lastActiveDate : null
    );

    // Update Roadmap if active
    const activeRoadmap = await Roadmap.findOne({ userId, isActive: true });
    if (activeRoadmap && activeRoadmap.phases) {
      let markedInRoadmap = false;
      activeRoadmap.phases.forEach(phase => {
        if (phase.weeks) {
          phase.weeks.forEach(w => {
            if (w.weekNumber === Number(weekNumber) || w.title === itemTitle) {
              w.isCompleted = true;
              markedInRoadmap = true;
            }
          });
        }
      });
      if (markedInRoadmap) {
        await activeRoadmap.save();
      }

      // Calculate new completion %
      let totalWeeks = 0;
      activeRoadmap.phases.forEach(p => totalWeeks += (p.weeks ? p.weeks.length : 0));
      if (totalWeeks > 0) {
        progress.overallPercentage = Math.min(100, Math.round((progress.completedItems.length / totalWeeks) * 100));
      }
    }

    await progress.save();

    return res.status(200).json({
      success: true,
      message: `Module "${itemTitle}" marked as complete!`,
      data: {
        completedModulesCount: progress.completedModulesCount,
        totalHoursLearned: progress.totalHoursLearned,
        streak: progress.streak,
        overallPercentage: progress.overallPercentage
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Run adaptive learning engine and diagnose interventions
 * @route   POST /api/progress/adaptive-recommendations
 * @access  Private (JWT)
 */
const getAdaptiveRecommendations = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const [profile, progress, assessments] = await Promise.all([
      Profile.findOne({ userId }),
      Progress.findOne({ userId }),
      Assessment.find({ userId, status: 'completed' }).sort({ createdAt: -1 })
    ]);

    const generatedAlerts = [];
    const recommendations = [];

    // Condition 1: Check low assessment scores
    const lowScoreAssessments = assessments.filter(a => a.result && a.result.percentage < 70);
    if (lowScoreAssessments.length > 0) {
      const recentLow = lowScoreAssessments[0];
      const alert = {
        type: 'revision_needed',
        message: `Low performance (${recentLow.result.percentage}%) detected on "${recentLow.topic}".`,
        actionRequired: `Review weak topics: ${(recentLow.result.weakTopics || []).join(', ') || 'Core concepts'} before advancing.`
      };
      generatedAlerts.push(alert);
      recommendations.push(alert);
    }

    // Condition 2: Check learning pace & inactivity
    if (progress && progress.streak && progress.streak.lastActiveDate) {
      const daysSinceActive = Math.round((new Date() - new Date(progress.streak.lastActiveDate)) / (1000 * 60 * 60 * 24));
      if (daysSinceActive >= 3) {
        const paceAlert = {
          type: 'pace_adjustment',
          message: `Inactivity detected (${daysSinceActive} days since last module).`,
          actionRequired: 'Pace recalibrated: Dedicate 30 mins today to restore your learning streak.'
        };
        generatedAlerts.push(paceAlert);
        recommendations.push(paceAlert);
      }
    }

    // Condition 3: Reward high mastery
    const highScoreAssessments = assessments.filter(a => a.result && a.result.percentage >= 85);
    if (highScoreAssessments.length > 0) {
      const recentHigh = highScoreAssessments[0];
      recommendations.push({
        type: 'skill_unlocked',
        message: `Mastery achieved (${recentHigh.result.percentage}%) on "${recentHigh.topic}".`,
        actionRequired: 'Proficiency upgraded. You are eligible to skip introductory modules and tackle advanced tasks.'
      });
    }

    // Persist new alerts in Progress
    if (progress && generatedAlerts.length > 0) {
      generatedAlerts.forEach(a => progress.adaptiveAlerts.push(a));
      await progress.save();
    }

    return res.status(200).json({
      success: true,
      data: {
        adaptiveStanding: lowScoreAssessments.length > 0 ? 'Needs Revision' : 'On Track',
        activeAlertsCount: generatedAlerts.length,
        recommendations: recommendations.length > 0 ? recommendations : [
          {
            type: 'steady_pace',
            message: 'All metrics healthy. Continue along your planned roadmap.',
            actionRequired: 'Proceed with this week\'s scheduled milestone.'
          }
        ]
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardAnalytics,
  completeModule,
  getAdaptiveRecommendations
};
