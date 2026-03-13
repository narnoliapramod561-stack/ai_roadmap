# SmartScholar AI - Setup & Troubleshooting Guide

## 📋 Summary of Fixes Applied

### Frontend Issues Fixed ✅
1. **QuizPage** - Added error state UI with retry functionality
2. **GraderPage** - Added proper error messages and file validation
3. **TutorPage** - Enhanced error messages with network/timeout detection
4. **UploadPage** - Better error handling for different failure scenarios
5. **AuthPage** - Proper handling of optional upload failures
6. **API Layer** - Implemented retry logic with exponential backoff and timeouts

### Backend Issues Fixed ✅
1. **Quiz Router** - Added error handling for Gemini API calls and database operations
2. **Tutor Router** - Added try-catch for API failures
3. **Grader Router** - Added comprehensive error handling
4. **Environment Setup** - Created .env template files

---

## 🚀 Getting Started

### Prerequisites
- Python 3.9+ (for backend)
- Node.js 16+ (for frontend)
- Git
- A Groq API key (https://console.groq.com)
- A Supabase account

### Backend Setup

#### 1. Install Dependencies
```bash
cd smartscholar-backend
pip install -r requirements.txt
```

#### 2. Configure Environment Variables
Create a `.env` file in `smartscholar-backend/` with:
```env
GEMINI_API_KEY=your_actual_gemini_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
ENVIRONMENT=development
DEBUG=True
```

**How to get your keys:**
- **Gemini API**: Go to https://aistudio.google.com/ and create an API key
- **Supabase**: Create a project at https://supabase.com and copy the URL and anon key

#### 3. Run Backend Server
```bash
cd smartscholar-backend
python main.py
```
The server will start at: `http://localhost:8000`

Test if it's running:
```bash
curl http://localhost:8000/
```

### Frontend Setup

#### 1. Install Dependencies
```bash
npm install
```

#### 2. Configure Environment Variables
The `.env` file is already created with:
```env
VITE_API_URL=http://127.0.0.1:8000
```

For production, update to your backend URL.

#### 3. Run Development Server
```bash
npm run dev
```
The frontend will be available at: `http://localhost:5173`

#### 4. Build for Production
```bash
npm run build
```

---

## 🔧 Troubleshooting

### Error: "Cannot reach the server"
**Cause**: Backend is not running or API URL is incorrect

**Fix**:
1. Ensure backend is running: `python smartscholar-backend/main.py`
2. Check `VITE_API_URL` in `.env` matches your backend URL
3. Ensure port 8000 is not blocked

### Error: "Gemini API Key invalid"
**Cause**: GEMINI_API_KEY is missing or incorrect

**Fix**:
1. Get your key from https://aistudio.google.com/
2. Add it to `.env` in backend folder
3. Restart the backend server

### Error: "Database error" or "Supabase connection failed"
**Cause**: Supabase credentials are incorrect or missing

**Fix**:
1. Verify SUPABASE_URL and SUPABASE_KEY in `.env`
2. Ensure your Supabase project is active
3. Check if database tables exist (create them if needed)

### Error: "Request timed out"
**Cause**: Large file upload or slow connection

**Fix**:
1. Reduce PDF file size (max 50MB)
2. Check internet connection speed
3. Try again - automatic retry with backoff is implemented

### Quiz not generating
**Cause**: Missing topic data or Gemini API rate limit

**Fix**:
1. Ensure you uploaded a PDF first on Upload page
2. Check Gemini API quota at https://aistudio.google.com/
3. Wait before retrying (API may have rate limits)

### File upload stuck at 100%
**Cause**: Backend is processing large file or AI analysis is slow

**Fix**:
1. The progress bar may not be accurate for large files
2. Wait longer (can take 1-2 minutes for large PDFs)
3. Check backend logs for progress

---

## 📊 Architecture Overview

```
Frontend (React + TypeScript)
    ↓ (HTTP Requests via fetch with retry logic)
    ↓
Backend (FastAPI)
    ├─ /materials/upload → PDF parsing + Gemini analysis
    ├─ /quiz/generate → MCQ generation via Gemini
    ├─ /quiz/{id}/submit → Quiz scoring + SM-2 algorithm
    ├─ /tutor/chat → AI tutor responses via Gemini
    ├─ /grader/handwritten → Image analysis via Gemini
    └─ /study/roadmap → Knowledge graph retrieval
    ↓ (Database operations)
    ↓
Supabase (PostgreSQL Database)
    ├─ study_materials (uploaded PDFs)
    ├─ topics (knowledge graph nodes)
    ├─ quizzes (generated questions)
    ├─ topic_progress (learning progress)
    └─ [Other tables as needed]

External APIs
├─ Google Gemini 2.0 Flash (AI tasks)
└─ Supabase (Database & Auth)
```

---

## 🔑 Key Improvements Made

### Error Handling
- ✅ Retry logic with exponential backoff (3 retries default)
- ✅ 30-second timeout for all requests
- ✅ User-friendly error messages for different failure types
- ✅ Network vs. server error detection

### User Experience
- ✅ Error state UI on all pages
- ✅ Clear loading indicators
- ✅ Specific error messages (no generic "failed" messages)
- ✅ Retry buttons for failed operations

### Backend Robustness
- ✅ Try-catch blocks on all API endpoints
- ✅ Proper HTTP status codes (404, 500, etc.)
- ✅ Detailed error messages for debugging
- ✅ Database error handling

---

## 📝 Environment Variables Quick Reference

### Backend (.env)
```env
GEMINI_API_KEY          Required  Google Gemini API key
SUPABASE_URL            Required  Supabase project URL
SUPABASE_KEY            Required  Supabase anonymous key
ENVIRONMENT             Optional  development/production
DEBUG                   Optional  True/False
```

### Frontend (.env)
```env
VITE_API_URL            Optional  Backend URL (default: http://127.0.0.1:8000)
```

---

## 🧪 Testing the Connection

### Test Backend
```bash
# Test if backend is running
curl http://localhost:8000/

# Response should be:
# {"message":"SmartScholar AI Backend is running"}
```

### Test Frontend to Backend
1. Upload a PDF on the Upload page
2. If successful, you should see data in your dashboard
3. If error, check browser console (F12) for details

---

## 🐛 Getting Help

### Check Logs
- **Backend**: Look at terminal where `python main.py` is running
- **Frontend**: Open browser DevTools (F12) → Console tab

### Common Issues Checklist
- [ ] Gemini API key is valid
- [ ] Supabase credentials are correct
- [ ] Backend is running (`http://localhost:8000/`)
- [ ] Frontend can reach backend (no CORS errors)
- [ ] All required Python packages installed
- [ ] Port 8000 is available

---

Last Updated: March 13, 2026
