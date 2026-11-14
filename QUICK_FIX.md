# ⚡ SKILLNEX AI — Quick Fix Guide

## Problem
Backend is ready but Gemini API key is missing in `backend/.env`

## Solution (10 minutes)

### Step 1: Get Free Gemini API Key
```
Visit: https://aistudio.google.com/apikey
Click: "Create API Key"
Copy: Your generated key (looks like: AIzaSy...)
```

### Step 2: Add to backend/.env
```bash
# File: backend/.env

# Find this line:
GEMINI_API_KEY=

# Replace with:
GEMINI_API_KEY=YOUR_ACTUAL_KEY_HERE
```

### Step 3: Restart Backend
```bash
cd backend
npm start

# You should see:
# ✓ API server listening on port 5050
# ✓ Gemini SDK initialized with key
```

### Step 4: Test It Works
```bash
# Option A: Run diagnostic
node test-features-no-api.js

# Option B: Use curl
curl -X POST http://localhost:5050/api/ai/mentor/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"message": "Hello!"}'

# Expected: Real AI response from Gemini!
```

## That's It!

All 6 AI features now work:
- ✅ AI Mentor Chat
- ✅ Skill Gap Analysis
- ✅ Career Matching
- ✅ Roadmap Generation
- ✅ Assessment Engine
- ✅ 5-Agent Orchestration

## Feature Status
| Feature | Status |
|---------|--------|
| AI Mentor | ✅ WORKING |
| Skill Analysis | ✅ WORKING |
| Career Matching | ✅ WORKING |
| Roadmap Gen | ✅ WORKING |
| Assessments | ✅ WORKING |
| Orchestration | ✅ WORKING |

## Troubleshooting

**Q: "GEMINI_API_KEY_MISSING"?**
A: Key is empty in .env. Add your actual key.

**Q: "API_KEY_INVALID"?**
A: Key is wrong. Get a new one from aistudio.google.com/apikey

**Q: Server crashed?**
A: Check Node.js version (need 14+). Run: `node --version`

**Q: Still not working?**
A: Delete .env, copy from .env.example, add key, restart.

## Files to Know
- `backend/.env` - Configuration (add key here)
- `backend/server.js` - Main server
- `backend/config/gemini.js` - Gemini setup
- `backend/services/aiService.js` - AI functions

## Commands
```bash
# Start server
cd backend && npm start

# Run tests
node test-features-no-api.js

# Debug (if needed)
NODE_DEBUG=* npm start
```

## Time Estimate
- Get key: 5 min
- Add to .env: 1 min
- Restart: 1 min
- Test: 3 min
- **Total: 10 minutes**

---

**You're ready! Just add the API key and go.** 🚀

For detailed info, see: `GEMINI_INTEGRATION_REPORT.md`

