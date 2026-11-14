/**
 * SKILLNEX AI — Agent 2: Career Advisor Agent
 * Recommends optimal career pathways, matches skills, and scores job alignment.
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

const execute = async ({ profile = {}, skillAnalysis = null, preferredIndustries = [] }) => {
  try {
    const ai = getGeminiClient();
    const model = getModelName();

    const currentSkills = profile.skills || ['Python', 'SQL', 'Git'];
    const currentRole = profile.currentRole || 'Student';
    const targetRole = profile.targetRole || 'Software Engineer';
    const experienceLevel = profile.experienceLevel || 'beginner';

    const prompt = `You are the CAREER ADVISOR AGENT in SKILLNEX AI.
Learner Profile:
- Current Role: ${currentRole}
- Target Role: ${targetRole}
- Experience: ${experienceLevel}
- Known Skills: ${JSON.stringify(currentSkills)}
- Preferred Industries: ${JSON.stringify(preferredIndustries)}
${skillAnalysis ? `- Pre-computed Skill Analysis: ${JSON.stringify(skillAnalysis.strengths || [])}` : ''}

Evaluate matching career roles with explicit scoring algorithms. Return ONLY valid JSON:
{
  "agent": "CareerAdvisorAgent",
  "matchedRoles": [
    {
      "role": "Machine Learning Engineer",
      "alignmentPercentage": 88,
      "scoring": {
        "technicalMatch": 85,
        "marketDemandScore": 92,
        "experienceFit": 87
      },
      "salaryRange": "$85,000 - $115,000",
      "keyMatchingSkills": ["Python", "Algorithms"],
      "missingSkillsToUnlock": ["Docker", "Kubernetes"],
      "strategicOpportunity": "High growth potential in cloud AI deployment within 6-12 months."
    }
  ],
  "primaryRecommendation": "Detailed advice on the fastest track to employment."
}`;

    const res = await ai.models.generateContent({
      model,
      contents: prompt,
      config: { temperature: 0.3, responseMimeType: 'application/json' }
    });

    const parsed = cleanJson(res.text);
    return {
      success: true,
      agent: 'CareerAdvisorAgent',
      timestamp: new Date(),
      data: parsed
    };
  } catch (error) {
    return {
      success: false,
      agent: 'CareerAdvisorAgent',
      timestamp: new Date(),
      error: error.message,
      code: error.code || 'CAREER_ADVICE_FAILED'
    };
  }
};

module.exports = {
  name: 'CareerAdvisorAgent',
  execute
};
