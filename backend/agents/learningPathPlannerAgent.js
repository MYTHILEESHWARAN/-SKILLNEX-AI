/**
 * SKILLNEX AI — Agent 3: Learning Path Planner Agent
 * Designs adaptive multi-level roadmaps (Beginner -> Intermediate -> Advanced).
 */

const { getGeminiClient, getModelName } = require('../config/gemini');

const cleanJson = (raw) => {
  let cleaned = (raw || '').trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start !== -1 && end !== -1) {
    cleaned = cleaned.substring(start, end + 1);
  }
  return JSON.parse(cleaned);
};

const execute = async ({ targetRole = 'Machine Learning Engineer', experienceLevel = 'beginner', currentSkills = [], gaps = [], timeframeWeeks = 12 }) => {
  try {
    const ai = getGeminiClient();
    const model = getModelName();

    const prompt = `You are the LEARNING PATH PLANNER AGENT in SKILLNEX AI.
Create a structured curriculum for the role "${targetRole}".
Experience Level: ${experienceLevel}
Known Skills: ${JSON.stringify(currentSkills)}
Prioritized Gaps to Close: ${JSON.stringify(gaps)}
Timeframe: ${timeframeWeeks} Weeks

Structure learning strictly across 3 distinct tiers:
1. Beginner Level (Foundational Intuition & Syntax)
2. Intermediate Level (Core Implementation & Applied Tooling)
3. Advanced Level (Production, Architecture & Optimization)

Return ONLY valid JSON matching this schema:
{
  "agent": "LearningPathPlannerAgent",
  "roadmapTitle": "${targetRole} Adaptive Mastery Path",
  "targetRole": "${targetRole}",
  "totalEstimatedWeeks": ${timeframeWeeks},
  "tiers": [
    {
      "tierLevel": "Beginner",
      "durationWeeks": 4,
      "objective": "Build core mathematical and programming foundations",
      "modules": [
        {
          "week": 1,
          "topic": "Pythonic Data Structures & Vectorization",
          "estimatedHours": 8,
          "exercises": ["Implement custom linked list", "Matrix multiplication benchmarks"],
          "recommendedResources": ["Official Python Docs", "NumPy User Guide"]
        }
      ]
    },
    {
      "tierLevel": "Intermediate",
      "durationWeeks": 4,
      "objective": "Design end-to-end ML pipelines and model training",
      "modules": [
        {
          "week": 5,
          "topic": "Supervised Learning Algorithms with Scikit-Learn",
          "estimatedHours": 10,
          "exercises": ["Kaggle tabular classification pipeline"],
          "recommendedResources": ["Scikit-Learn Tutorials"]
        }
      ]
    },
    {
      "tierLevel": "Advanced",
      "durationWeeks": 4,
      "objective": "Deploy scalable APIs, monitoring, and cloud inference",
      "modules": [
        {
          "week": 9,
          "topic": "Containerization and Fast Inference with Docker & FastAPI",
          "estimatedHours": 12,
          "exercises": ["Deploy containerized model with automated test suite"],
          "recommendedResources": ["Docker Deep Dive", "FastAPI Documentation"]
        }
      ]
    }
  ],
  "adaptiveStrategy": "If the learner demonstrates rapid comprehension in Phase 1 assessment (>85%), advance directly to Tier 2."
}`;

    const res = await ai.models.generateContent({
      model,
      contents: prompt,
      config: { temperature: 0.3, responseMimeType: 'application/json' }
    });

    const parsed = cleanJson(res.text);
    return {
      success: true,
      agent: 'LearningPathPlannerAgent',
      timestamp: new Date(),
      data: parsed
    };
  } catch (error) {
    return {
      success: false,
      agent: 'LearningPathPlannerAgent',
      timestamp: new Date(),
      error: error.message,
      code: error.code || 'PLANNING_FAILED'
    };
  }
};

module.exports = {
  name: 'LearningPathPlannerAgent',
  execute
};
