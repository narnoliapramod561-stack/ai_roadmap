# SmartScholar AI - Intelligent Learning Platform

An AI-powered educational platform that transforms study materials into personalized learning systems using advanced techniques like spaced repetition (SM-2 algorithm), adaptive quizzing, and AI-driven tutoring.

## 🌟 Features

### 📚 Material Upload & Analysis
- Upload PDF syllabi and study materials
- AI-powered analysis to extract knowledge graphs
- Automatic topic extraction and relationship mapping

### 🧠 AI Tutor
- Chat with an intelligent AI tutor powered by Groq
- Context-aware responses based on your study materials
- Personalized learning guidance

### 📝 Smart Quiz Generation
- Auto-generate multiple-choice questions from study materials
- Adaptive difficulty levels (easy, medium, hard)
- Spaced repetition algorithm (SM-2) for optimal learning

### 🎓 Handwritten Answer Grading
- Upload photos of handwritten answers
- AI-powered evaluation and scoring
- Detailed feedback on strengths and areas for improvement

### 📊 Progress Tracking
- Real-time learning progress visualization
- Mastery level tracking per topic
- Personalized study recommendations

### 🗺️ Visual Knowledge Map
- Interactive visualization of your knowledge graph
- See topic relationships and mastery levels
- Identify weak areas at a glance

---

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- Python 3.9+
- Groq API key (from [console.groq.com](https://console.groq.com))
- Supabase account (free from [supabase.com](https://supabase.com))

### Setup (2 steps)

#### 1. Backend Setup
```bash
cd smartscholar-backend
pip install -r requirements.txt

# Add your API keys to .env
# GEMINI_API_KEY=your_key
# SUPABASE_URL=your_url
# SUPABASE_KEY=your_key

python main.py
```

#### 2. Frontend Setup
```bash
npm install
npm run dev
```

Visit: [http://localhost:5173](http://localhost:5173)

---

## 📖 Documentation

- **[QUICK_START.md](QUICK_START.md)** - Get up and running in 5 minutes
- **[SETUP_GUIDE.md](SETUP_GUIDE.md)** - Detailed setup and troubleshooting
- **[FIXES_SUMMARY.md](FIXES_SUMMARY.md)** - What was fixed in this version
- **[CHANGES_DETAILED.md](CHANGES_DETAILED.md)** - Detailed code changes

---

## 🏗️ Architecture

### Frontend
- **React 19** with TypeScript
- **Vite** for fast development
- **Zustand** for state management
- **TailwindCSS** for styling
- **Framer Motion** for animations
- **XYFlow** for graph visualization

### Backend
- **FastAPI** for REST API
- **Google Generative AI (Gemini 2.0)** for AI features
- **Supabase** (PostgreSQL) for data persistence
- **pdfplumber** for PDF parsing
- **SM-2 Algorithm** for spaced repetition

### External Services
- **Google Gemini API** - AI for quiz generation, grading, tutoring
- **Supabase** - PostgreSQL database and authentication

---

## 📝 Recent Changes (v1.1)

### ✅ Frontend Error Handling
- Added error states to all pages
- Implemented retry logic with exponential backoff
- User-friendly error messages for different failure types
- Timeout handling (30s per request)

### ✅ Backend Improvements
- Added try-catch blocks to all endpoints
- Better error messages
- Proper HTTP status codes
- Request validation

### ✅ Configuration
- Environment variable setup files
- Clear documentation for API key setup
- Production deployment guidance

---

## 🔧 API Endpoints

### Materials
- `POST /materials/upload` - Upload and analyze PDF

### Quiz
- `POST /quiz/generate` - Generate MCQs for a topic
- `POST /quiz/{id}/submit` - Submit quiz answers and get score

### Tutor
- `POST /tutor/chat` - Chat with AI tutor

### Grader
- `POST /grader/handwritten` - Grade handwritten answers

### Study
- `GET /study/roadmap/{material_id}` - Get knowledge graph

---

## 🧪 Testing

### Test Upload
```bash
1. Go to http://localhost:5173/upload
2. Upload a PDF file
3. Should see analysis and knowledge graph
```

### Test Quiz
```bash
1. Go to http://localhost:5173/quiz
2. Answer questions
3. See score and feedback
```

### Test Tutor
```bash
1. Go to http://localhost:5173/tutor
2. Ask a question about your material
3. Get AI-powered response
```

---

## 🐛 Troubleshooting

### Cannot reach server
→ Make sure backend is running: `python smartscholar-backend/main.py`

### Gemini API Key invalid
→ Get a new key from [aistudio.google.com](https://aistudio.google.com) and update `.env`

### Database error
→ Check Supabase credentials in `.env`

See [SETUP_GUIDE.md](SETUP_GUIDE.md) for more troubleshooting steps.

---

## 🌐 Deployment

### Frontend
```bash
npm run build
# Deploy dist/ folder to Vercel, Netlify, or your hosting
```

### Backend
```bash
# Deploy to Railway, Heroku, AWS, Google Cloud, etc.
# Update VITE_API_URL in frontend .env
```

---

## 📊 Project Statistics

- **Frontend Files**: 11 pages + 20+ components
- **Backend Routes**: 5 main routers with error handling
- **Database Tables**: 6 tables for comprehensive data storage
- **API Endpoints**: 10+ endpoints
- **Error Handling**: Implemented across all layers

---

## 🤝 Contributing

Issues and pull requests are welcome!

---

## 📄 License

MIT License - feel free to use this project for educational purposes

---

## 🎯 Roadmap

- [ ] Mobile app version
- [ ] Advanced learning analytics
- [ ] Peer study groups
- [ ] Exam preparation mode
- [ ] Multi-language support
- [ ] Offline functionality
- [ ] Custom AI models per subject
- [ ] Integration with popular learning platforms

---

## 💡 Key Technologies

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React + TypeScript | Interactive UI |
| Styling | TailwindCSS | Modern design system |
| State | Zustand | Lightweight state management |
| Backend | FastAPI | Fast, scalable REST API |
| Database | Supabase (PostgreSQL) | Data persistence |
| AI | Google Gemini | Question generation, grading, tutoring |
| Visualization | XYFlow | Knowledge graph visualization |

---

## 📞 Support

For issues and questions:
1. Check [SETUP_GUIDE.md](SETUP_GUIDE.md)
2. Review [FIXES_SUMMARY.md](FIXES_SUMMARY.md)
3. Check browser console (F12) for detailed errors

---

**Last Updated**: March 13, 2026  
**Status**: ✅ Fully Functional  
**Version**: 1.1 (with error handling improvements)

Made with ❤️ for students and educators

import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
