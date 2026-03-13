# Quick Start Guide

## ⚡ 5 Steps to Get Running

### Step 1: Backend Setup (2 minutes)
```bash
cd smartscholar-backend

# The .env file is already created with placeholders
# Edit .env and add your actual keys:
# GEMINI_API_KEY=<your_key_from_https://aistudio.google.com>
# SUPABASE_URL=<from_https://supabase.com>
# SUPABASE_KEY=<from_supabase>

pip install -r requirements.txt
python main.py
```

✅ Backend running at: `http://localhost:8000`

---

### Step 2: Frontend Setup (2 minutes)
```bash
# In new terminal, from project root
npm install
npm run dev
```

✅ Frontend running at: `http://localhost:5173`

---

### Step 3: Test Connection
1. Open http://localhost:5173 in browser
2. Go to Auth page
3. Fill in name, class, subject
4. Upload a test PDF (optional to test upload)
5. Click "Next" → should go to Dashboard

✅ Frontend-Backend connected!

---

### Step 4: Test Features
- **Upload**: Go to `/upload` → upload a PDF
- **Quiz**: Go to `/quiz` → generate and answer questions  
- **Tutor**: Go to `/tutor` → chat with AI
- **Grader**: Go to `/grader` → upload handwritten answers

---

### Step 5: Deploy (when ready)
```bash
# Frontend build
npm run build
# Deploy dist/ folder to hosting

# Backend
# Deploy to Heroku, Railway, AWS, etc.
# Update VITE_API_URL to your backend URL
```

---

## 🔧 Common Commands

```bash
# Start Backend
cd smartscholar-backend && python main.py

# Start Frontend  
npm run dev

# Build Frontend
npm run build

# Install Dependencies
pip install -r smartscholar-backend/requirements.txt
npm install
```

---

## 📝 Required API Keys

1. **Groq API** (https://console.groq.com)
   - Go to: https://console.groq.com/
   - Click "API Keys"
   - Copy to backend `.env`

2. **Supabase** (free tier available)
   - Go to: https://supabase.com
   - Create new project
   - Copy URL and Key to backend `.env`

---

## ✅ Verify Setup

### Backend Running?
```bash
curl http://localhost:8000/
# Should return: {"message":"SmartScholar AI Backend is running"}
```

### Can Frontend Reach Backend?
```bash
# Open browser DevTools (F12)
# Go to Console
# All requests should succeed (not show CORS errors)
```

---

## 🚨 If Something Goes Wrong

1. **"Cannot reach server"** → Backend not running
   - Run: `python smartscholar-backend/main.py`

2. **"Gemini API Key invalid"** → Wrong API key
   - Get new key from https://aistudio.google.com/
   - Update backend `.env`
   - Restart backend

3. **"Database error"** → Supabase not configured
   - Verify credentials in backend `.env`
   - Check Supabase project is active
   - Restart backend

4. **File upload stuck** → Processing large file
   - Wait 1-2 minutes
   - Check backend terminal for logs

---

## 📁 Folder Structure

```
ai_roadmap/
├── .env                          ← Frontend API URL
├── package.json                  ← Frontend dependencies
├── src/                          ← Frontend React code
│   ├── lib/api.ts               ← API calls with retry
│   └── pages/                   ← All pages (Quiz, Upload, etc)
│
└── smartscholar-backend/
    ├── .env                     ← Backend API keys
    ├── main.py                  ← Start backend here
    ├── requirements.txt         ← Python dependencies
    └── routers/                 ← API endpoints
```

---

## 🎯 What Works Now

✅ Frontend-Backend Communication  
✅ Error Handling & Retry Logic  
✅ User-Friendly Error Messages  
✅ File Upload with Validation  
✅ Quiz Generation  
✅ AI Tutor Chat  
✅ Handwritten Grading  
✅ Progress Tracking  

---

## 📖 Full Documentation

- `SETUP_GUIDE.md` - Complete setup & troubleshooting
- `FIXES_SUMMARY.md` - What was fixed
- `CHANGES_DETAILED.md` - Exact code changes

---

**That's it! You're ready to go.** 🚀

For detailed information, see `SETUP_GUIDE.md`
