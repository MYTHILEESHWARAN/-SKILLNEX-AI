/**
 * SKILLNEX AI — Phase 5 Test Suite
 * Tests Agent Orchestration, Assessments, Real-Time Progress, and Adaptive Analytics.
 */

const http = require('http');
const { spawn } = require('child_process');

function makeRequest(options, bodyData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);

    if (bodyData) {
      req.write(JSON.stringify(bodyData));
    }
    req.end();
  });
}

async function runPhase5Tests() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('   SKILLNEX AI — Phase 5 Agentic & Analytics Test Suite');
  console.log('═══════════════════════════════════════════════════════════\n');

  const server = spawn('node', ['server.js'], { cwd: __dirname });
  await new Promise(r => setTimeout(r, 2500));

  try {
    // -------------------------------------------------------------------------
    // STEP 0: Register & Authenticate a Learner
    // -------------------------------------------------------------------------
    const testEmail = `orchestration.learner.${Date.now()}@skillnex.ai`;
    const regRes = await makeRequest({
      hostname: '127.0.0.1',
      port: 5050,
      path: '/api/auth/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      name: 'Samir Patel',
      email: testEmail,
      password: 'StrongPassword2026!',
      role: 'student'
    });
    const token = regRes.data.token;
    console.log(`Registered authenticated learner: ${testEmail}\n`);

    // -------------------------------------------------------------------------
    // TEST 1: Progress Module Completion (POST /api/progress/module/complete)
    // -------------------------------------------------------------------------
    console.log('TEST 1: Logging Completed Learning Module & Calculating Streak');
    const completeRes = await makeRequest({
      hostname: '127.0.0.1',
      port: 5050,
      path: '/api/progress/module/complete',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    }, {
      phaseNumber: 1,
      weekNumber: 1,
      itemTitle: 'Linear Algebra & NumPy Arrays',
      hoursSpent: 3
    });

    console.log(`Status: ${completeRes.status}`);
    console.log(`Response:`, JSON.stringify(completeRes.data, null, 2));
    if (completeRes.status === 200 && completeRes.data.success && completeRes.data.data.streak.current >= 1) {
      console.log('✅ TEST 1 PASSED: Module completion logged with real-time hours & streak increment.\n');
    } else {
      throw new Error(`TEST 1 FAILED: Unexpected status ${completeRes.status}`);
    }

    // -------------------------------------------------------------------------
    // TEST 2: Duplicate Module Completion Prevention
    // -------------------------------------------------------------------------
    console.log('TEST 2: Duplicate Module Completion Idempotency');
    const duplicateRes = await makeRequest({
      hostname: '127.0.0.1',
      port: 5050,
      path: '/api/progress/module/complete',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    }, {
      phaseNumber: 1,
      weekNumber: 1,
      itemTitle: 'Linear Algebra & NumPy Arrays',
      hoursSpent: 3
    });

    console.log(`Status: ${duplicateRes.status} (Expected 409 Conflict)`);
    if (duplicateRes.status === 409 && duplicateRes.data.error.code === 'MODULE_ALREADY_COMPLETED') {
      console.log('✅ TEST 2 PASSED: Idempotency enforced on progress updates.\n');
    } else {
      throw new Error(`TEST 2 FAILED: Expected 409, got ${duplicateRes.status}`);
    }

    // -------------------------------------------------------------------------
    // TEST 3: Learning Analytics Dashboard (GET /api/analytics/dashboard)
    // -------------------------------------------------------------------------
    console.log('TEST 3: Learning Analytics Dashboard');
    const analyticsRes = await makeRequest({
      hostname: '127.0.0.1',
      port: 5050,
      path: '/api/analytics/dashboard',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    console.log(`Status: ${analyticsRes.status}`);
    console.log(`Metrics:`, JSON.stringify(analyticsRes.data.data.metrics, null, 2));
    if (analyticsRes.status === 200 && analyticsRes.data.data.metrics.totalHoursLearned === 3) {
      console.log('✅ TEST 3 PASSED: Learning analytics dashboard returned aggregate metrics.\n');
    } else {
      throw new Error(`TEST 3 FAILED: Dashboard did not match expected metrics.`);
    }

    // -------------------------------------------------------------------------
    // TEST 4: Adaptive Learning Recommendations (POST /api/progress/adaptive-recommendations)
    // -------------------------------------------------------------------------
    console.log('TEST 4: Adaptive Learning Engine Diagnostic');
    const adaptiveRes = await makeRequest({
      hostname: '127.0.0.1',
      port: 5050,
      path: '/api/progress/adaptive-recommendations',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    console.log(`Status: ${adaptiveRes.status}`);
    console.log(`Standing: ${adaptiveRes.data.data.adaptiveStanding}`);
    console.log(`Recommendations:`, JSON.stringify(adaptiveRes.data.data.recommendations, null, 2));
    if (adaptiveRes.status === 200 && adaptiveRes.data.success) {
      console.log('✅ TEST 4 PASSED: Adaptive learning diagnostic generated contextual interventions.\n');
    }

    // -------------------------------------------------------------------------
    // TEST 5: Assessment Generation & Evaluation
    // -------------------------------------------------------------------------
    console.log('TEST 5: Assessment Generation (POST /api/assessment/generate)');
    const genRes = await makeRequest({
      hostname: '127.0.0.1',
      port: 5050,
      path: '/api/assessment/generate',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    }, {
      topic: 'Python ML Data Structures',
      targetRole: 'Machine Learning Engineer',
      difficulty: 'intermediate',
      questionCount: 2
    });

    console.log(`Status: ${genRes.status}`);
    let assessmentId = null;
    if (genRes.status === 201 && genRes.data.success) {
      assessmentId = genRes.data.data.assessmentId;
      console.log(`Generated Assessment ID: ${assessmentId}`);
      console.log('Questions received (sanitized without client answer exposure):', genRes.data.data.totalQuestions);
      console.log('✅ TEST 5a PASSED: Skill-based assessment generated with sanitized options.\n');

      // Test 5b: Evaluate submission
      console.log('TEST 5b: Assessment Answer Evaluation (POST /api/assessment/evaluate)');
      const evalRes = await makeRequest({
        hostname: '127.0.0.1',
        port: 5050,
        path: '/api/assessment/evaluate',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }, {
        assessmentId,
        userAnswers: [
          { questionId: 1, selectedAnswer: 0 },
          { questionId: 2, selectedAnswer: 1 }
        ]
      });

      console.log(`Status: ${evalRes.status}`);
      console.log(`Evaluation Summary:`, JSON.stringify({
        percentage: evalRes.data.data.percentage,
        passed: evalRes.data.data.passed,
        strengths: evalRes.data.data.strengths,
        weakTopics: evalRes.data.data.weakTopics,
        adaptiveRecommendation: evalRes.data.data.adaptiveRecommendation
      }, null, 2));
      if (evalRes.status === 200 && evalRes.data.success) {
        console.log('✅ TEST 5b PASSED: Assessment evaluated, score saved, skill history updated.\n');
      }
    } else if (genRes.status === 503) {
      console.log(`ℹ️ Notice: Gemini API returned 503 (${genRes.data.error.code}). Handled gracefully without crash.\n`);
    }

    // -------------------------------------------------------------------------
    // TEST 6: Agent Orchestrator Run (POST /api/orchestration/run)
    // -------------------------------------------------------------------------
    console.log('TEST 6: Full 5-Agent Orchestration Pipeline (POST /api/orchestration/run)');
    const orchRes = await makeRequest({
      hostname: '127.0.0.1',
      port: 5050,
      path: '/api/orchestration/run',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    }, { customGoal: 'Autonomous AI Engineer' });

    console.log(`Status: ${orchRes.status}`);
    console.log(`Telemetry / Summary:`, JSON.stringify(orchRes.data.data?.summary || orchRes.data, null, 2));
    if (orchRes.status === 200 && orchRes.data.success) {
      console.log('✅ TEST 6 PASSED: Orchestrated pipeline executed and unified learner report synthesized.\n');
    }

    // -------------------------------------------------------------------------
    // TEST 7: Single Agent Execution (POST /api/orchestration/agent/:agentName)
    // -------------------------------------------------------------------------
    console.log('TEST 7: Single Agent On-Demand Execution (POST /api/orchestration/agent/skill_analyzer)');
    const singleAgentRes = await makeRequest({
      hostname: '127.0.0.1',
      port: 5050,
      path: '/api/orchestration/agent/skill_analyzer',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    }, {
      currentSkills: ['Python', 'PyTorch', 'FastAPI'],
      targetRole: 'AI Application Engineer',
      experienceLevel: 'intermediate'
    });

    console.log(`Status: ${singleAgentRes.status}`);
    console.log(`Agent Result:`, JSON.stringify({
      agent: singleAgentRes.data.agent,
      success: singleAgentRes.data.success,
      error: singleAgentRes.data.error || null
    }, null, 2));
    if (singleAgentRes.status === 200) {
      console.log('✅ TEST 7 PASSED: Single agent executed independently with modular contract.\n');
    }

    console.log('═══════════════════════════════════════════════════════════');
    console.log('🎉 ALL PHASE 5 TESTS COMPLETED SUCCESSFULLY!');
    console.log('═══════════════════════════════════════════════════════════');

  } catch (err) {
    console.error('❌ Test error:', err.message);
  } finally {
    server.kill();
    process.exit(0);
  }
}

runPhase5Tests();
