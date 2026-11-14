/**
 * SKILLNEX AI — Agent 5: AI Mentor Agent
 * Provides personalized coaching and prescribes the single highest-ROI "next best action".
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

const execute = async ({ message, userContext = {}, progressData = {}, assessmentHistory = [] }) => {
  try {
    const ai = getGeminiClient();
    const model = getModelName();

    const prompt = `You are the AI MENTOR AGENT in SKILLNEX AI.
Learner Context:
- Name: ${userContext.name || 'Learner'}
- Role: ${userContext.role || 'Student'}
- Target Career: ${userContext.targetRole || 'Software Engineering'}
- Experience Level: ${userContext.experienceLevel || 'Beginner'}
- Learning Streak: ${progressData.streak ? progressData.streak.current : 0} Days
- Overall Completion: ${progressData.overallPercentage || 0}%
- Total Hours: ${progressData.totalHoursLearned || 0} Hours
- Recent Assessments: ${JSON.stringify(assessmentHistory.slice(-2))}

${message ? `Learner Question / Note: "${message}"` : 'Synthesize coaching feedback for this learner.'}

Analyze the learner's journey and return ONLY valid JSON:
{
  "agent": "AiMentorAgent",
  "mentorshipMessage": "Empathetic, clear, and motivating mentor feedback grounded in their current metrics.",
  "nextBestAction": {
    "actionTitle": "Action Title (e.g., Complete Week 3 Lab Practice)",
    "estimatedMinutes": 45,
    "priority": "High",
    "rationale": "Why this single action is the highest leverage next step right now."
  },
  "encouragement": "Short inspiring quote tailored to their progress.",
  "strengthsAcknowledged": ["Python", "Consistent Streak"]
}`;

    const res = await ai.models.generateContent({
      model,
      contents: prompt,
      config: { temperature: 0.4, responseMimeType: 'application/json' }
    });

    const parsed = cleanJson(res.text);
    return {
      success: true,
      agent: 'AiMentorAgent',
      timestamp: new Date(),
      data: parsed
    };
  } catch (error) {
    return {
      success: false,
      agent: 'AiMentorAgent',
      timestamp: new Date(),
      error: error.message,
      code: error.code || 'MENTOR_COACHING_FAILED'
    };
  }
};

module.exports = {
  name: 'AiMentorAgent',
  execute
};
