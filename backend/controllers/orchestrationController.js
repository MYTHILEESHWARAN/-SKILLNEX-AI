/**
 * SKILLNEX AI — Orchestration Controller
 * Dispatches multi-agent pipelines and individual specialized AI agents.
 */

const { User, Profile, Progress } = require('../models');
const orchestrator = require('../services/agentOrchestrator');

/**
 * @desc    Run full 5-agent orchestration pipeline
 * @route   POST /api/orchestration/run
 * @access  Private (JWT)
 */
const runOrchestration = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { customGoal } = req.body;

    const [profile, progress] = await Promise.all([
      Profile.findOne({ userId }),
      Progress.findOne({ userId })
    ]);

    const orchestratedOutput = await orchestrator.runOrchestratedPipeline({
      profile: profile || {},
      progress: progress || {},
      customGoal: customGoal || null
    });

    return res.status(200).json(orchestratedOutput);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Run a single specialized AI agent
 * @route   POST /api/orchestration/agent/:agentName
 * @access  Private (JWT)
 */
const runSingleAgent = async (req, res, next) => {
  try {
    const { agentName } = req.params;
    const payload = req.body || {};

    const agentResult = await orchestrator.runSingleAgent(agentName, payload);
    return res.status(200).json(agentResult);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  runOrchestration,
  runSingleAgent
};
