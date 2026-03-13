from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
from dotenv import load_dotenv

from routers import study, tutor, quiz, materials, grader
from routers import auth, readiness, spaced_repetition, ai_explain

load_dotenv()

app = FastAPI(title="SmartScholar AI Backend", version="3.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all Routers
app.include_router(study.router)
app.include_router(tutor.router)
app.include_router(quiz.router)
app.include_router(materials.router)
app.include_router(grader.router)
# Blueprint routers
app.include_router(auth.router)
app.include_router(readiness.router)
app.include_router(spaced_repetition.router)
app.include_router(ai_explain.router)

@app.get("/")
async def root():
    return {"message": "SmartScholar AI Backend v3.0 — CODE-A-HAUNT 3.0"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
