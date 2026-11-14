/**
 * SKILLNEX AI — Google Gemini Configuration
 * Initializes official @google/genai SDK with secure environment variable loading.
 */

const { GoogleGenAI } = require('@google/genai');

const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === '' || apiKey === 'your_gemini_api_key_here') {
    const error = new Error('Google Gemini API Key is missing. Please configure GEMINI_API_KEY in backend/.env.');
    error.code = 'GEMINI_API_KEY_MISSING';
    error.statusCode = 503;
    throw error;
  }

  return new GoogleGenAI({ apiKey });
};

const getModelName = () => {
  return process.env.GEMINI_MODEL || 'gemini-2.5-flash';
};

module.exports = {
  getGeminiClient,
  getModelName
};
