from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
from dotenv import load_dotenv

from routers import study, tutor, quiz, materials, grader

load_dotenv()

app = FastAPI(title="SmartScholar AI Backend")

# Configure CORS — allow all origins for development
# We don't use cookie-based auth, so credentials aren't needed
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(study.router)
app.include_router(tutor.router)
app.include_router(quiz.router)
app.include_router(materials.router)
app.include_router(grader.router)

@app.get("/")
async def root():
    return {"message": "SmartScholar AI Backend is running"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
