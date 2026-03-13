# 🔧 Failed to Fetch - Troubleshooting Guide

## 🚨 Common Causes

### 1. **Backend Not Running** (Most Common)
```bash
# Check if backend is running on port 8000
curl http://localhost:8000/

# If not working, start it:
cd smartscholar-backend
python main.py
```

### 2. **Wrong Port**
- Backend should be on: `http://localhost:8000`
- Check `.env` file: `VITE_API_URL=http://127.0.0.1:8000`

### 3. **Port Already in Use**
```bash
# Kill whatever is using port 8000
lsof -ti:8000 | xargs kill -9

# Then start backend again
python smartscholar-backend/main.py
```

### 4. **API Key Missing**
```env
# Check smartscholar-backend/.env has:
GEMINI_API_KEY=your_actual_key
SUPABASE_URL=your_actual_url
SUPABASE_KEY=your_actual_key
```

### 5. **CORS Issue**
- The backend has CORS enabled for all origins
- Should not be the issue, but check backend startup logs

---

## ✅ Step-by-Step Fix

### Step 1: Verify Backend is Ready
```bash
# In a NEW terminal, run:
curl http://localhost:8000/

# Should output:
# {"message":"SmartScholar AI Backend is running"}
```

If this fails:
- Backend is not running
- Go to Step 2

### Step 2: Start Backend Properly
```bash
cd /Users/subhamkumar/Desktop/h1/ai_roadmap/smartscholar-backend

# Check dependencies
pip list | grep -i fastapi
pip list | grep -i uvicorn

# If missing, install
pip install -r requirements.txt

# Start server
python main.py
```

**Expected Output:**
```
INFO:     Started server process [12345]
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete
```

### Step 3: Verify Frontend Can Reach Backend
Open browser DevTools (F12):
1. Go to **Console** tab
2. Try to upload a file
3. Look for error messages
4. Check **Network** tab for failed requests

### Step 4: Check .env Files
**Frontend `.env`:**
```env
VITE_API_URL=http://127.0.0.1:8000
```

**Backend `.env`:**
```env
GEMINI_API_KEY=your_key
SUPABASE_URL=your_url
SUPABASE_KEY=your_key
```

### Step 5: Restart Everything
```bash
# Terminal 1: Backend
cd smartscholar-backend
python main.py

# Terminal 2: Frontend (new terminal)
npm run dev

# Terminal 3: Open browser
open http://localhost:5173
```

---

## 🔍 Detailed Debugging

### Check 1: Is Port 8000 Listening?
```bash
# On macOS:
lsof -i :8000

# Should show:
# python    12345 user   3u  IPv4 0x... 0t0  TCP *:8000 (LISTEN)
```

### Check 2: Can You Reach Backend from Terminal?
```bash
# Test 1: Basic connectivity
curl -v http://localhost:8000/

# Test 2: Test /materials/upload endpoint
curl -X POST http://localhost:8000/materials/upload \
  -F "file=@test.txt"
```

### Check 3: Frontend Environment
```bash
# Check if .env is loaded
# Open browser DevTools → Network tab
# Upload should show request to:
# http://127.0.0.1:8000/materials/upload
```

### Check 4: Browser Console Error
```javascript
// Open DevTools Console (F12)
// Look for specific errors:

// Error: Failed to fetch
// → Backend not running

// Error: CORS policy
// → More complex, but should work with current config

// Error: 400/404/500
// → Backend running but API error
```

---

## 🛠️ Common Error Messages & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `Failed to fetch` | Backend not running | `python main.py` |
| `Connection refused` | Wrong port or not listening | Check port 8000 |
| `CORS error` | Unknown (shouldn't happen) | Check CORS in main.py |
| `400 Bad Request` | File upload format | Check PDF is valid |
| `500 Server Error` | Backend exception | Check backend logs |
| `504 Gateway Timeout` | Backend too slow | File too large or Gemini slow |

---

## 📋 Complete Startup Procedure

### Terminal 1: Backend
```bash
cd /Users/subhamkumar/Desktop/h1/ai_roadmap
cd smartscholar-backend

# Verify dependencies
pip install -r requirements.txt

# Start server
python main.py

# You should see:
# INFO:     Started server process [12345]
# INFO:     Uvicorn running on http://0.0.0.0:8000
# INFO:     Application startup complete
```

### Terminal 2: Frontend
```bash
cd /Users/subhamkumar/Desktop/h1/ai_roadmap

# Install dependencies (if first time)
npm install

# Start development server
npm run dev

# You should see:
# VITE v8.0.0  ready in xxx ms
# ➜  Local:   http://localhost:5173/
```

### Terminal 3: Browser
```bash
# Open in browser
http://localhost:5173

# Try uploading a file
# If "failed to fetch" appears, check Terminal 1 for errors
```

---

## 🔬 Advanced Debugging

### Check Backend Logs
```bash
# Terminal 1 should show:
# INFO:     127.0.0.1:59234 - "POST /materials/upload HTTP/1.1" 200
#                                                              ^^^ Should be 200 (success)

# If 404 or 500:
# - 404 means endpoint doesn't exist
# - 500 means backend error (check terminal for traceback)
```

### Test Upload Directly
```bash
# Upload test PDF without frontend
curl -X POST http://localhost:8000/materials/upload \
  -F "file=@test.pdf"

# If this fails, API is broken (backend issue)
# If this works, frontend is broken (JS issue)
```

### Check Network Tab in DevTools
1. Open DevTools (F12)
2. Go to **Network** tab
3. Try uploading file
4. Click the request that says `upload`
5. Check:
   - **URL**: Should be `http://127.0.0.1:8000/materials/upload`
   - **Method**: Should be `POST`
   - **Status**: Should be `200` (if working)
   - **Response**: Should show JSON success

---

## 🚨 If All Else Fails

### Start Completely Fresh
```bash
# 1. Kill any running Python processes
pkill -f "python main.py"

# 2. Kill any running Node processes
pkill -f "npm"

# 3. Delete logs/cache
rm -rf smartscholar-backend/__pycache__
rm -rf node_modules/.vite

# 4. Reinstall
cd smartscholar-backend
pip install -r requirements.txt

cd ..
npm install

# 5. Start fresh
# Terminal 1:
cd smartscholar-backend && python main.py

# Terminal 2:
npm run dev
```

### Verify Each Component
```bash
# Test 1: Backend running?
curl http://localhost:8000/
# Expected: {"message":"SmartScholar AI Backend is running"}

# Test 2: Frontend running?
open http://localhost:5173
# Expected: SmartScholar app loads

# Test 3: Can reach backend?
open http://localhost:5173
# Look at browser console (F12) for CORS or fetch errors
```

---

## 📞 If Still Stuck

### Checklist
- [ ] Backend running (`python main.py`)
- [ ] Port 8000 is listening (`lsof -i :8000`)
- [ ] `.env` files exist and have correct URLs
- [ ] Frontend running (`npm run dev`)
- [ ] `.env` in root has `VITE_API_URL=http://127.0.0.1:8000`
- [ ] Backend `.env` has Gemini + Supabase keys
- [ ] No "CORS" errors in browser console
- [ ] Network tab shows request to `http://127.0.0.1:8000/materials/upload`

### Check Error Message Exactly
Tell me:
1. What does the error message say exactly?
2. Is it in browser console or on screen?
3. When you run `curl http://localhost:8000/`, what happens?
4. What does the backend terminal show?

---

## ✅ Once Fixed

If you see a success message like:
```
"status": "success",
"material_id": "...",
"analysis": {...}
```

Then everything is working! 🎉

---

**Most Common Solution**: Run `python smartscholar-backend/main.py` in a new terminal!

