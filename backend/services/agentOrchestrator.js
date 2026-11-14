/**
 * SKILLNEX AI — Agent Orchestrator
 * Coordinates the 5 specialized AI agents into a cohesive adaptive learning pipeline.
 *
 * Workflow:
 * Learner Profile
 *      ↓
 * Skill Analyzer Agent
 *      ↓
 * [Parallel Execution] ──► Career Advisor Agent & Learning Path Planner Agent
 *      ↓
 * Assessment Evaluator Agent
 *      ↓
 * AI Mentor Agent
 *      ↓
 * Unified Learner Intelligence Report
 */

const skillAnalyzer = require('../agents/skillAnalyzerAgent');
const careerAdvisor = require('../agents/careerAdvisorAgent');
const pathPlanner = require('../agents/learningPathPlannerAgent');
const assessmentEvaluator = require('../agents/assessmentEvaluatorAgent');
const aiMentor = require('../agents/aiMentorAgent');

/**
 * Runs a single specialized agent by name
 */
const runSingleAgent = async (agentName, inputPayload) => {
  const normalized = (agentName || '').toLowerCase();

  switch (normalized) {
    case 'skill_analyzer':
    case 'skillanalyzer':
    case 'skills':
      return await skillAnalyzer.execute(inputPayload);

    case 'career_advisor':
    case 'careeradvisor':
    case 'careers':
      return await careerAdvisor.execute(inputPayload);

    case 'learning_path_planner':
    case 'pathplanner':
    case 'roadmap':
      return await pathPlanner.execute(inputPayload);

    case 'assessment_evaluator':
    case 'assessment':
      if (inputPayload.action === 'evaluate') {
        return await assessmentEvaluator.evaluateAnswers(inputPayload);
      }
      return await assessmentEvaluator.generateAssessment(inputPayload);

    case 'ai_mentor':
    case 'mentor':
      return await aiMentor.execute(inputPayload);

    default:
      throw new Error(`Unknown agent: '${agentName}'. Valid agents: skill_analyzer, career_advisor, learning_path_planner, assessment_evaluator, ai_mentor.`);
  }
};

/**
 * Executes the full coordinated multi-agent orchestration pipeline
 */
const runOrchestratedPipeline = async ({ profile = {}, progress = {}, customGoal = null }) => {
  const executionStartTime = Date.now();
  const targetRole = customGoal || profile.targetRole || 'Software Engineer';
  const currentSkills = profile.skills && profile.skills.length > 0
    ? profile.skills.map(s => (typeof s === 'string' ? s : s.name))
    : ['Python', 'SQL', 'Git'];
  const experienceLevel = profile.experienceLevel || 'beginner';

  const pipelineResults = {
    pipelineStatus: 'completed',
    targetRole,
    orchestrationTimestamp: new Date(),
    agentOutputs: {},
    errors: []
  };

  // STEP 1: Skill Analyzer Agent
  let skillAnalysisResult = null;
  try {
    skillAnalysisResult = await skillAnalyzer.execute({
      currentSkills,
      targetRole,
      experienceLevel
    });
    pipelineResults.agentOutputs.skillAnalyzer = skillAnalysisResult;
  } catch (err) {
    pipelineResults.errors.push({ agent: 'SkillAnalyzerAgent', error: err.message });
  }

  const detectedGaps = skillAnalysisResult && skillAnalysisResult.data
    ? [
        ...(skillAnalysisResult.data.criticalMissingSkills || []).map(s => (typeof s === 'object' ? s.skill : s)),
        ...(skillAnalysisResult.data.moderateGaps || []).map(s => (typeof s === 'object' ? s.skill : s))
      ]
    : ['System Architecture', 'Cloud Services'];

  // STEP 2 & 3: Run Career Advisor and Learning Path Planner in parallel
  const [careerResult, pathResult] = await Promise.allSettled([
    careerAdvisor.execute({
      profile: { ...profile, targetRole, skills: currentSkills, experienceLevel },
      skillAnalysis: skillAnalysisResult ? skillAnalysisResult.data : null
    }),
    pathPlanner.execute({
      targetRole,
      experienceLevel,
      currentSkills,
      gaps: detectedGaps,
      timeframeWeeks: 12
    })
  ]);

  if (careerResult.status === 'fulfilled') {
    pipelineResults.agentOutputs.careerAdvisor = careerResult.value;
  } else {
    pipelineResults.errors.push({ agent: 'CareerAdvisorAgent', error: careerResult.reason.message });
  }

  if (pathResult.status === 'fulfilled') {
    pipelineResults.agentOutputs.learningPathPlanner = pathResult.value;
  } else {
    pipelineResults.errors.push({ agent: 'LearningPathPlannerAgent', error: pathResult.reason.message });
  }

  // STEP 4: Assessment Evaluator Agent (generate quick benchmark)
  let assessmentSample = null;
  try {
    assessmentSample = await assessmentEvaluator.generateAssessment({
      topic: `${targetRole} Readiness`,
      targetRole,
      difficulty: experienceLevel,
      questionCount: 3
    });
    pipelineResults.agentOutputs.assessmentEvaluator = assessmentSample;
  } catch (err) {
    pipelineResults.errors.push({ agent: 'AssessmentEvaluatorAgent', error: err.message });
  }

  // STEP 5: AI Mentor Agent (synthesize feedback & next best action)
  let mentorResult = null;
  try {
    mentorResult = await aiMentor.execute({
      message: `I am aiming for ${targetRole}. What is my primary focus this week?`,
      userContext: {
        targetRole,
        experienceLevel,
        role: profile.currentRole
      },
      progressData: progress,
      assessmentHistory: progress.assessmentScores || []
    });
    pipelineResults.agentOutputs.aiMentor = mentorResult;
  } catch (err) {
    pipelineResults.errors.push({ agent: 'AiMentorAgent', error: err.message });
  }

  // STEP 6: Synthesize Unified Learner Intelligence Report
  const totalExecutionTimeMs = Date.now() - executionStartTime;

  const unifiedLearnerReport = {
    summary: {
      targetRole,
      readinessScore: skillAnalysisResult?.data?.overallProficiencyScore || 65,
      estimatedWeeksToJobReady: pathResult?.value?.data?.totalEstimatedWeeks || 12,
      executionTimeMs: totalExecutionTimeMs,
      completedAgents: Object.keys(pipelineResults.agentOutputs).length,
      failedAgents: pipelineResults.errors.length
    },
    skillProfile: skillAnalysisResult?.data || null,
    careerAlignment: careerResult?.value?.data?.matchedRoles || [],
    recommendedCurriculum: pathResult?.value?.data?.tiers || [],
    diagnosticBenchmark: assessmentSample?.data?.questions || [],
    prescribedAction: mentorResult?.data?.data?.nextBestAction || {
      actionTitle: 'Begin Tier 1 Learning Module',
      estimatedMinutes: 45,
      priority: 'High',
      rationale: 'Establish foundational mastery.'
    },
    mentorNote: mentorResult?.data?.data?.mentorshipMessage || 'Stay committed to your daily milestones!',
    agentTelemetry: {
      skillAnalyzer: skillAnalysisResult?.success || false,
      careerAdvisor: careerResult?.value?.success || false,
      learningPathPlanner: pathResult?.value?.success || false,
      assessmentEvaluator: assessmentSample?.success || false,
      aiMentor: mentorResult?.success || false
    }
  };

  return {
    success: true,
    data: unifiedLearnerReport,
    rawOutputs: pipelineResults.agentOutputs,
    errors: pipelineResults.errors
  };
};

module.exports = {
  runSingleAgent,
  runOrchestratedPipeline
};
