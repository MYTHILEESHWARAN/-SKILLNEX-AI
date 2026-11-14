/**
 * SKILLNEX AI — AI Service
 * Powered by Google Gemini API (@google/genai SDK)
 * Handles Mentor Chat, Skill Gap Analysis, Career Matching, and Roadmap Generation.
 */

const { getGeminiClient, getModelName } = require('../config/gemini');

/**
 * Safely parses JSON strings returned by Gemini, stripping any markdown wrappers.
 */
const cleanAndParseJson = (rawText) => {
  if (!rawText || typeof rawText !== 'string') {
    throw new Error('Empty response received from Gemini AI model.');
  }

  // Remove markdown code fence if present (e.g. ```json ... ```)
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }
  cleaned = cleaned.trim();

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    // Attempt fallback heuristic if there are trailing commas or text surrounding JSON
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      const extracted = cleaned.substring(firstBrace, lastBrace + 1);
      return JSON.parse(extracted);
    }
    throw new Error(`Failed to parse AI response as valid JSON: ${err.message}`);
  }
};

/**
 * Formats API errors cleanly without leaking internal tokens or raw stack traces.
 */
const handleGeminiError = (err) => {
  console.error(`[Gemini API Error] ${err.message}`);

  if (err.code === 'GEMINI_API_KEY_MISSING' || err.statusCode === 503) {
    const error = new Error('Google Gemini API Key is missing. Please set GEMINI_API_KEY in backend/.env.');
    error.statusCode = 503;
    error.code = 'GEMINI_API_KEY_MISSING';
    return error;
  }

  if (err.status === 429 || (err.message && err.message.includes('quota'))) {
    const error = new Error('Gemini API rate limit reached. Please retry in a few moments.');
    error.statusCode = 429;
    error.code = 'GEMINI_RATE_LIMIT';
    return error;
  }

  if (err.status === 400 || (err.message && err.message.includes('API_KEY_INVALID'))) {
    const error = new Error('Invalid Google Gemini API Key. Please verify GEMINI_API_KEY in backend/.env.');
    error.statusCode = 401;
    error.code = 'GEMINI_API_KEY_INVALID';
    return error;
  }

  const genericError = new Error(`AI processing failed: ${err.message}`);
  genericError.statusCode = 500;
  genericError.code = 'GEMINI_PROCESSING_ERROR';
  return genericError;
};

/**
 * 1. AI MENTOR CHAT
 * Generates an empathetic, pedagogically sound, and context-aware mentor response.
 */
const chatWithMentor = async ({ message, previousMessages = [], userContext = {} }) => {
  try {
    const ai = getGeminiClient();
    const model = getModelName();

    const systemInstruction = `You are the official AI Mentor for SKILLNEX AI.
Tagline: "Learn Smarter. Grow Faster. Achieve Further."
Role: Senior technical career mentor, educator, and supportive coach.
Tone: Encouraging, concise, practical, industry-savvy, and actionable.
User Context:
- Name: ${userContext.name || 'Learner'}
- Role/Track: ${userContext.role || 'Student'}
- Target Career: ${userContext.targetRole || 'Software Engineering'}
- Experience Level: ${userContext.experienceLevel || 'Beginner'}

Instructions:
- Address the user's technical and career questions directly.
- Keep responses focused, structuring longer advice with concise bullet points.
- If recommending learning milestones, ground them in real industry practice.`;

    // Construct conversation history for context
    const contents = [];

    // Append recent messages (up to last 10 turns)
    const recent = previousMessages.slice(-10);
    for (const msg of recent) {
      contents.push({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      });
    }

    // Append the current user prompt
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const response = await ai.models.generateContent({
      model,
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
        maxOutputTokens: 1000
      }
    });

    const replyText = response.text ? response.text.trim() : 'I am here to guide your learning journey.';
    return replyText;
  } catch (err) {
    throw handleGeminiError(err);
  }
};

/**
 * 2. SKILL GAP ANALYZER
 * Compares user skills with target role requirements and returns structured JSON.
 */
const analyzeSkillGap = async ({ currentSkills = [], targetRole, experienceLevel = 'beginner' }) => {
  try {
    const ai = getGeminiClient();
    const model = getModelName();

    const prompt = `Analyze the skill gap for a learner targeting the role of "${targetRole}".
Learner Experience Level: ${experienceLevel}
Current Skills Provided: ${JSON.stringify(currentSkills)}

You must return ONLY a raw JSON object (no markdown, no backticks, no prose) matching this exact JSON schema:
{
  "targetRole": "${targetRole}",
  "overallMatchPercentage": 72,
  "summary": "Short 2-sentence executive summary of the learner's readiness.",
  "strengths": [
    { "skill": "Skill Name", "proficiency": 80, "status": "Strong", "comment": "Explanation of strength" }
  ],
  "moderateGaps": [
    { "skill": "Skill Name", "currentProficiency": 40, "requiredProficiency": 70, "priority": "Medium", "action": "Recommended course/action" }
  ],
  "criticalGaps": [
    { "skill": "Skill Name", "currentProficiency": 15, "requiredProficiency": 80, "priority": "High", "action": "Urgent topic to study" }
  ],
  "topPriorityRecommendation": "The single highest-ROI skill to focus on next.",
  "estimatedWeeksToBridge": 8
}`;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        temperature: 0.2,
        responseMimeType: 'application/json'
      }
    });

    return cleanAndParseJson(response.text);
  } catch (err) {
    throw handleGeminiError(err);
  }
};

/**
 * 3. CAREER ADVISOR
 * Recommends matched roles with explicit scoring logic.
 */
const matchCareers = async ({ skills = [], experienceLevel = 'beginner', currentRole = 'Student', preferredIndustries = [] }) => {
  try {
    const ai = getGeminiClient();
    const model = getModelName();

    const prompt = `Act as an expert career advisor. Based on the user's profile:
- Current Role: ${currentRole}
- Experience Level: ${experienceLevel}
- Known Skills: ${JSON.stringify(skills)}
- Preferred Industries: ${JSON.stringify(preferredIndustries)}

Recommend 3 suitable career roles/internships. Return ONLY a valid JSON object matching this schema:
{
  "recommendations": [
    {
      "roleTitle": "Machine Learning Intern",
      "companyType": "Tech / AI Labs",
      "matchPercentage": 92,
      "scoringBreakdown": {
        "technicalSkillsScore": 88,
        "experienceAlignmentScore": 90,
        "marketDemandScore": 98
      },
      "estimatedCompensation": "$7,000 - $9,000 / month",
      "matchingSkills": ["Python", "NumPy", "Data Preprocessing"],
      "missingSkills": ["Docker", "Kubernetes"],
      "advice": "Actionable advice on how to secure this role within 60 days"
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        temperature: 0.3,
        responseMimeType: 'application/json'
      }
    });

    return cleanAndParseJson(response.text);
  } catch (err) {
    throw handleGeminiError(err);
  }
};

/**
 * 4. LEARNING ROADMAP GENERATOR
 * Generates an adaptive, multi-phase curriculum tailored to the user's level.
 */
const generateRoadmap = async ({ userSkills = [], targetRole, experienceLevel = 'beginner', timeframeWeeks = 16 }) => {
  try {
    const ai = getGeminiClient();
    const model = getModelName();

    const prompt = `Generate a personalized, progressive learning roadmap.
Target Role: "${targetRole}"
Experience Level: "${experienceLevel}"
Total Estimated Weeks: ${timeframeWeeks}
Existing Skills: ${JSON.stringify(userSkills)}

Return ONLY a valid JSON object matching this schema:
{
  "title": "${targetRole} Mastery Roadmap",
  "targetRole": "${targetRole}",
  "estimatedWeeks": ${timeframeWeeks},
  "phases": [
    {
      "phaseNumber": 1,
      "title": "Phase Title",
      "description": "Phase objective and scope",
      "status": "in_progress",
      "weeks": [
        {
          "weekNumber": 1,
          "title": "Week Topic Title",
          "hours": 10,
          "skillsCovered": ["Skill A", "Skill B"],
          "milestones": [
            { "title": "Milestone / Practical Exercise 1", "completed": false },
            { "title": "Milestone / Practical Exercise 2", "completed": false }
          ],
          "isCompleted": false
        }
      ]
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        temperature: 0.3,
        responseMimeType: 'application/json'
      }
    });

    return cleanAndParseJson(response.text);
  } catch (err) {
    throw handleGeminiError(err);
  }
};

module.exports = {
  chatWithMentor,
  analyzeSkillGap,
  matchCareers,
  generateRoadmap
};
