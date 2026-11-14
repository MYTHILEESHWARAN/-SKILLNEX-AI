/**
 * SKILLNEX AI — Agent 1: Skill Analyzer Agent
 * Analyzes learner skills, identifies strengths & weaknesses, and computes proficiency metrics.
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

const execute = async ({ currentSkills = [], targetRole = 'Software Engineer', experienceLevel = 'beginner' }) => {
  try {
    const ai = getGeminiClient();
    const model = getModelName();

    const prompt = `You are the SKILL ANALYZER AGENT in SKILLNEX AI.
Analyze the following learner skills targeting the role "${targetRole}":
Current Skills: ${JSON.stringify(currentSkills)}
Experience Level: ${experienceLevel}

Produce a rigorous skills analysis. Return ONLY valid JSON in this schema:
{
  "agent": "SkillAnalyzerAgent",
  "targetRole": "${targetRole}",
  "overallProficiencyScore": 68,
  "strengths": [
    { "skill": "Skill Name", "proficiency": 85, "verdict": "Production-ready", "notes": "Solid understanding" }
  ],
  "moderateGaps": [
    { "skill": "Skill Name", "proficiency": 45, "targetProficiency": 75, "priority": "Medium", "recommendation": "Guided practice needed" }
  ],
  "criticalMissingSkills": [
    { "skill": "Missing Skill", "importance": "Crucial", "rationale": "Required by 90% of employers for this role" }
  ],
  "skillScoreBreakdown": {
    "coreTechnical": 70,
    "systemDesignAndArchitecture": 40,
    "toolsAndWorkflow": 65
  },
  "summary": "2-sentence executive summary of current readiness."
}`;

    const res = await ai.models.generateContent({
      model,
      contents: prompt,
      config: { temperature: 0.2, responseMimeType: 'application/json' }
    });

    const parsed = cleanJson(res.text);
    return {
      success: true,
      agent: 'SkillAnalyzerAgent',
      timestamp: new Date(),
      data: parsed
    };
  } catch (error) {
    return {
      success: false,
      agent: 'SkillAnalyzerAgent',
      timestamp: new Date(),
      error: error.message,
      code: error.code || 'SKILL_ANALYSIS_FAILED'
    };
  }
};

module.exports = {
  name: 'SkillAnalyzerAgent',
  execute
};
