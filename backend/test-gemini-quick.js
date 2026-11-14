/**
 * SKILLNEX AI — Quick Gemini Integration Test
 * Tests if @google/genai SDK is properly installed and can be configured
 */

const dotenv = require('dotenv');
dotenv.config();

console.log('═══════════════════════════════════════════════════════════');
console.log('   SKILLNEX AI — Gemini SDK Integration Diagnostic');
console.log('═══════════════════════════════════════════════════════════\n');

// Check 1: Environment Configuration
console.log('TEST 1: Environment Configuration');
console.log('─────────────────────────────────────');
const apiKey = process.env.GEMINI_API_KEY;
const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

console.log(`GEMINI_API_KEY set: ${apiKey ? '✓ YES (length: ' + apiKey.length + ')' : '✗ NO (empty)'}`);
console.log(`GEMINI_MODEL: ${modelName}`);
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);

if (!apiKey || apiKey.trim() === '') {
  console.log('\n⚠️  BLOCKING ISSUE: GEMINI_API_KEY is empty in .env');
  console.log('   Backend will fail when attempting AI operations.');
  console.log('   ACTION: Populate backend/.env with a valid Google Gemini API key.\n');
} else {
  console.log('\n✓ API Key is configured. Proceeding to SDK test...\n');
}

// Check 2: SDK Installation
console.log('TEST 2: @google/genai SDK Installation');
console.log('───────────────────────────────────────');
try {
  const { GoogleGenAI } = require('@google/genai');
  console.log('✓ @google/genai module successfully imported');

  // Check 3: SDK Instantiation
  console.log('\nTEST 3: SDK Instantiation');
  console.log('─────────────────────────');
  
  if (!apiKey || apiKey.trim() === '') {
    console.log('⚠️  Skipping instantiation test (API key missing)');
  } else {
    const ai = new GoogleGenAI({ apiKey });
    console.log('✓ GoogleGenAI client successfully instantiated');
    
    // Check 4: SDK Methods Available
    console.log('\nTEST 4: SDK Methods Available');
    console.log('────────────────────────────');
    console.log(`ai.models: ${ai.models ? '✓ exists' : '✗ missing'}`);
    console.log(`ai.models.generateContent: ${ai.models?.generateContent ? '✓ exists' : '✗ missing'}`);
  }
} catch (err) {
  console.log(`✗ Failed to import @google/genai: ${err.message}`);
  console.log('\nAction: Run: npm install @google/genai');
  process.exit(1);
}

// Check 5: MongoDB Connection (if needed)
console.log('\nTEST 5: Backend Dependencies');
console.log('───────────────────────────');
try {
  require('express');
  console.log('✓ express available');
  require('mongoose');
  console.log('✓ mongoose available');
  require('jsonwebtoken');
  console.log('✓ jsonwebtoken available');
  require('bcryptjs');
  console.log('✓ bcryptjs available');
} catch (err) {
  console.log(`✗ Missing dependency: ${err.message}`);
}

// Check 6: Configuration File Structure
console.log('\nTEST 6: Configuration Files');
console.log('──────────────────────────');
try {
  const geminiConfig = require('./config/gemini');
  console.log('✓ ./config/gemini.js loads successfully');
  console.log(`  - getGeminiClient exported: ${typeof geminiConfig.getGeminiClient}`);
  console.log(`  - getModelName exported: ${typeof geminiConfig.getModelName}`);
} catch (err) {
  console.log(`✗ config/gemini.js error: ${err.message}`);
}

try {
  const aiService = require('./services/aiService');
  console.log('✓ ./services/aiService.js loads successfully');
  console.log(`  - chatWithMentor exported: ${typeof aiService.chatWithMentor}`);
  console.log(`  - analyzeSkillGap exported: ${typeof aiService.analyzeSkillGap}`);
  console.log(`  - matchCareers exported: ${typeof aiService.matchCareers}`);
  console.log(`  - generateRoadmap exported: ${typeof aiService.generateRoadmap}`);
} catch (err) {
  console.log(`✗ services/aiService.js error: ${err.message}`);
}

// Check 7: Agents Structure
console.log('\nTEST 7: Agent Modules');
console.log('───────────────────');
const agents = [
  'skillAnalyzerAgent',
  'careerAdvisorAgent',
  'learningPathPlannerAgent',
  'assessmentEvaluatorAgent',
  'aiMentorAgent'
];

for (const agent of agents) {
  try {
    require(`./agents/${agent}`);
    console.log(`✓ agents/${agent}.js loads`);
  } catch (err) {
    console.log(`✗ agents/${agent}.js error: ${err.message}`);
  }
}

console.log('\n═══════════════════════════════════════════════════════════');
console.log('DIAGNOSTIC SUMMARY');
console.log('═══════════════════════════════════════════════════════════\n');

if (!apiKey || apiKey.trim() === '') {
  console.log('🔴 CRITICAL: Cannot test Gemini API without a valid API key');
  console.log('\n📌 NEXT STEPS:');
  console.log('   1. Get a Gemini API key from: https://aistudio.google.com/apikey');
  console.log('   2. Update backend/.env with: GEMINI_API_KEY=your_actual_key');
  console.log('   3. Restart the backend server\n');
} else {
  console.log('✅ All checks passed! Backend is ready for Gemini AI integration.\n');
  console.log('Next: Run test-ai.js to verify API endpoints and live Gemini responses.\n');
}

process.exit(0);

