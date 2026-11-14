/**
 * SKILLNEX AI — Agent 4: Assessment Evaluator Agent
 * Generates skill-testing quizzes and evaluates responses with diagnostic feedback.
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

/**
 * Generates interactive skill assessment questions
 */
const generateAssessment = async ({ topic = 'Python and Machine Learning', targetRole = 'ML Engineer', difficulty = 'intermediate', questionCount = 5 }) => {
  try {
    const ai = getGeminiClient();
    const model = getModelName();

    const prompt = `You are the ASSESSMENT EVALUATOR AGENT in SKILLNEX AI.
Generate a ${questionCount}-question multiple-choice assessment for the topic: "${topic}".
Target Role: "${targetRole}"
Difficulty: "${difficulty}"

Each question must be challenging, industry-relevant, and test practical understanding.
Return ONLY valid JSON:
{
  "agent": "AssessmentEvaluatorAgent",
  "topic": "${topic}",
  "difficulty": "${difficulty}",
  "questions": [
    {
      "questionId": 1,
      "questionText": "Clear, technically precise question here?",
      "options": [
        "Option A text",
        "Option B text",
        "Option C text",
        "Option D text"
      ],
      "correctAnswer": 0,
      "explanation": "Why this specific option is correct.",
      "skillTested": "Specific Subskill"
    }
  ]
}`;

    const res = await ai.models.generateContent({
      model,
      contents: prompt,
      config: { temperature: 0.2, responseMimeType: 'application/json' }
    });

    const parsed = cleanJson(res.text);
    return {
      success: true,
      agent: 'AssessmentEvaluatorAgent',
      action: 'generate',
      timestamp: new Date(),
      data: parsed
    };
  } catch (error) {
    return {
      success: false,
      agent: 'AssessmentEvaluatorAgent',
      action: 'generate',
      error: error.message,
      code: error.code || 'ASSESSMENT_GENERATION_FAILED'
    };
  }
};

/**
 * Evaluates learner answers, computes scores, and isolates weak areas
 */
const evaluateAnswers = async ({ questions = [], userAnswers = [] }) => {
  try {
    let correctCount = 0;
    const weakSkills = [];
    const strongSkills = [];
    const detailedFeedback = [];

    questions.forEach((q, idx) => {
      const userSelected = userAnswers.find(a => a.questionId === q.questionId);
      const isCorrect = userSelected && userSelected.selectedAnswer === q.correctAnswer;

      if (isCorrect) {
        correctCount++;
        strongSkills.push(q.skillTested);
      } else {
        weakSkills.push(q.skillTested);
      }

      detailedFeedback.push({
        questionId: q.questionId,
        questionText: q.questionText,
        userAnswer: userSelected ? userSelected.selectedAnswer : null,
        correctAnswer: q.correctAnswer,
        isCorrect: Boolean(isCorrect),
        explanation: q.explanation,
        skillTested: q.skillTested
      });
    });

    const total = questions.length || 1;
    const percentage = Math.round((correctCount / total) * 100);
    const passed = percentage >= 70;

    return {
      success: true,
      agent: 'AssessmentEvaluatorAgent',
      action: 'evaluate',
      timestamp: new Date(),
      data: {
        score: correctCount,
        totalQuestions: total,
        percentage,
        passed,
        strengths: [...new Set(strongSkills)],
        weakTopics: [...new Set(weakSkills)],
        feedbackList: detailedFeedback,
        adaptiveRecommendation: passed
          ? 'Great proficiency demonstrated! Ready to advance to intermediate modules.'
          : 'Score below 70% benchmark. Review foundational exercises in the weak topics identified before proceeding.'
      }
    };
  } catch (error) {
    return {
      success: false,
      agent: 'AssessmentEvaluatorAgent',
      action: 'evaluate',
      error: error.message
    };
  }
};

module.exports = {
  name: 'AssessmentEvaluatorAgent',
  generateAssessment,
  evaluateAnswers
};
