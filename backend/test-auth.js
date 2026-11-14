/**
 * SKILLNEX AI — Phase 3 Auth Automated Test Suite
 * Tests all 7 required scenarios against the live API endpoints.
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

async function runTests() {
  console.log('Starting SKILLNEX AI Authentication Tests...\n');

  // Spawn Express server
  const server = spawn('node', ['server.js'], { cwd: __dirname });
  
  // Wait 2.5s for server and MongoDB connection
  await new Promise(r => setTimeout(r, 2500));

  let studentToken = null;
  const testStudentEmail = `alex.student.${Date.now()}@skillnex.ai`;
  const testPassword = 'Password123!';

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Register a new student
    // -------------------------------------------------------------------------
    console.log('TEST 1: Register a new student (POST /api/auth/register)');
    const regRes = await makeRequest({
      hostname: '127.0.0.1',
      port: 5050,
      path: '/api/auth/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      name: 'Alex Rivera',
      email: testStudentEmail,
      password: testPassword,
      role: 'student'
    });

    console.log(`Status: ${regRes.status}`);
    console.log(`Response:`, JSON.stringify(regRes.data, null, 2));
    if (regRes.status === 201 && regRes.data.success && regRes.data.token && !regRes.data.user.password) {
      studentToken = regRes.data.token;
      console.log('✅ TEST 1 PASSED: Student successfully registered, token issued, password omitted.\n');
    } else {
      throw new Error(`TEST 1 FAILED: Unexpected response status ${regRes.status}`);
    }

    // -------------------------------------------------------------------------
    // TEST 2: Register with an existing email (duplicate check)
    // -------------------------------------------------------------------------
    console.log('TEST 2: Register with an existing email (POST /api/auth/register)');
    const dupRes = await makeRequest({
      hostname: '127.0.0.1',
      port: 5050,
      path: '/api/auth/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      name: 'Alex Rivera Duplicate',
      email: testStudentEmail,
      password: 'AnotherPassword456!',
      role: 'student'
    });

    console.log(`Status: ${dupRes.status}`);
    console.log(`Response:`, JSON.stringify(dupRes.data, null, 2));
    if (dupRes.status === 409 && dupRes.data.error.code === 'AUTH_EMAIL_EXISTS') {
      console.log('✅ TEST 2 PASSED: Duplicate registration prevented with 409 Conflict.\n');
    } else {
      throw new Error(`TEST 2 FAILED: Expected 409 Conflict, got ${dupRes.status}`);
    }

    // -------------------------------------------------------------------------
    // TEST 3: Login with correct credentials
    // -------------------------------------------------------------------------
    console.log('TEST 3: Login with correct credentials (POST /api/auth/login)');
    const loginSuccessRes = await makeRequest({
      hostname: '127.0.0.1',
      port: 5050,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      email: testStudentEmail,
      password: testPassword
    });

    console.log(`Status: ${loginSuccessRes.status}`);
    console.log(`Response:`, JSON.stringify(loginSuccessRes.data, null, 2));
    if (loginSuccessRes.status === 200 && loginSuccessRes.data.success && loginSuccessRes.data.token) {
      studentToken = loginSuccessRes.data.token; // Refresh token
      console.log('✅ TEST 3 PASSED: Login succeeded with 200 OK and valid JWT token.\n');
    } else {
      throw new Error(`TEST 3 FAILED: Expected 200 OK, got ${loginSuccessRes.status}`);
    }

    // -------------------------------------------------------------------------
    // TEST 4: Login with incorrect credentials
    // -------------------------------------------------------------------------
    console.log('TEST 4: Login with incorrect credentials (POST /api/auth/login)');
    const loginFailRes = await makeRequest({
      hostname: '127.0.0.1',
      port: 5050,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      email: testStudentEmail,
      password: 'WrongPassword999'
    });

    console.log(`Status: ${loginFailRes.status}`);
    console.log(`Response:`, JSON.stringify(loginFailRes.data, null, 2));
    if (loginFailRes.status === 401 && loginFailRes.data.error.code === 'AUTH_INVALID_CREDENTIALS') {
      console.log('✅ TEST 4 PASSED: Invalid login rejected with 401 Unauthorized.\n');
    } else {
      throw new Error(`TEST 4 FAILED: Expected 401 Unauthorized, got ${loginFailRes.status}`);
    }

    // -------------------------------------------------------------------------
    // TEST 5: Access protected route with valid token
    // -------------------------------------------------------------------------
    console.log('TEST 5: Access protected route with valid token (GET /api/auth/me)');
    const protectedValidRes = await makeRequest({
      hostname: '127.0.0.1',
      port: 5050,
      path: '/api/auth/me',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${studentToken}`
      }
    });

    console.log(`Status: ${protectedValidRes.status}`);
    console.log(`Response:`, JSON.stringify(protectedValidRes.data, null, 2));
    if (protectedValidRes.status === 200 && protectedValidRes.data.success && protectedValidRes.data.data.user.email === testStudentEmail) {
      console.log('✅ TEST 5 PASSED: Protected route returned user data with valid JWT.\n');
    } else {
      throw new Error(`TEST 5 FAILED: Expected 200 OK, got ${protectedValidRes.status}`);
    }

    // -------------------------------------------------------------------------
    // TEST 6: Access protected route without token
    // -------------------------------------------------------------------------
    console.log('TEST 6: Access protected route without token (GET /api/auth/me)');
    const protectedNoTokenRes = await makeRequest({
      hostname: '127.0.0.1',
      port: 5050,
      path: '/api/auth/me',
      method: 'GET'
    });

    console.log(`Status: ${protectedNoTokenRes.status}`);
    console.log(`Response:`, JSON.stringify(protectedNoTokenRes.data, null, 2));
    if (protectedNoTokenRes.status === 401 && protectedNoTokenRes.data.error.code === 'AUTH_TOKEN_MISSING') {
      console.log('✅ TEST 6 PASSED: Protected route rejected request missing Authorization header.\n');
    } else {
      throw new Error(`TEST 6 FAILED: Expected 401 Unauthorized, got ${protectedNoTokenRes.status}`);
    }

    // -------------------------------------------------------------------------
    // TEST 7: Access protected route with invalid token
    // -------------------------------------------------------------------------
    console.log('TEST 7: Access protected route with invalid token (GET /api/auth/me)');
    const protectedInvalidRes = await makeRequest({
      hostname: '127.0.0.1',
      port: 5050,
      path: '/api/auth/me',
      method: 'GET',
      headers: {
        'Authorization': 'Bearer thisIsAnInvalidBogusTokenString123'
      }
    });

    console.log(`Status: ${protectedInvalidRes.status}`);
    console.log(`Response:`, JSON.stringify(protectedInvalidRes.data, null, 2));
    if (protectedInvalidRes.status === 401 && protectedInvalidRes.data.error.code === 'AUTH_TOKEN_INVALID') {
      console.log('✅ TEST 7 PASSED: Protected route rejected bogus token with 401 Unauthorized.\n');
    } else {
      throw new Error(`TEST 7 FAILED: Expected 401 Unauthorized, got ${protectedInvalidRes.status}`);
    }

    console.log('═══════════════════════════════════════════════════════════');
    console.log('🎉 ALL 7 AUTHENTICATION TEST CASES PASSED SUCCESSFULLY!');
    console.log('═══════════════════════════════════════════════════════════');

  } catch (err) {
    console.error('❌ Test execution error:', err.message);
  } finally {
    server.kill();
    process.exit(0);
  }
}

runTests();
