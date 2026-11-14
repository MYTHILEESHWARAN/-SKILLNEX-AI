# 🔑 SKILLNEX AI — Gemini API Key Setup

## Step 1: Get Your Free Gemini API Key

**⚠️ IMPORTANT: Google Authentication Required**

Your API key is personal and must be obtained directly from Google. Here's how:

### Option A: Automatic (Recommended)
1. Your browser will open the official Google AI Studio page automatically
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated key (looks like: `AIzaSy...`)

### Option B: Manual
If browser doesn't open, visit manually:
```
https://aistudio.google.com/apikey
```

---

## Step 2: Add Key to backend/.env

Once you have your API key:

1. **Locate file:** `backend/.env`

2. **Find this line:**
   ```
   GEMINI_API_KEY=
   ```

3. **Replace with:**
   ```
   GEMINI_API_KEY=YOUR_ACTUAL_KEY_HERE
   ```

4. **Important:**
   - Never commit this file to GitHub
   - Never share your key with anyone
   - The key is personal to your Google account
   - Keep `.env` in `.gitignore` (it already is)

---

## Step 3: Verify Setup

After adding the key:

```bash
cd backend
npm start
```

You should see:
```
✓ API server listening on port 5050
✓ Gemini SDK initialized successfully
```

---

## Step 4: Test Integration

```bash
node test-features-no-api.js
```

All tests should now pass with ✅ marks.

---

## Troubleshooting

| Error | Solution |
|-------|----------|
| GEMINI_API_KEY_MISSING | You didn't add the key to .env |
| API_KEY_INVALID | Key is wrong or expired. Get a new one |
| Server crashed | Check Node.js version (need 14+) |
| 503 errors | Restart backend after adding key |

---

## Security Notes

- ✅ API key stays on backend only
- ✅ Frontend never sees the key
- ✅ Key is loaded from environment variable
- ✅ Don't hardcode the key in code
- ✅ .env is in .gitignore (won't be committed)

---

**Next: Open the Google AI Studio page to get your API key →**

