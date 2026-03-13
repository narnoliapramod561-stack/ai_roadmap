from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel
from services.ai_logic import generate_mcqs
from services.supabase import get_supabase
from services.sm2 import calculate_next_review
from typing import List, Optional
import uuid

router = APIRouter(prefix="/quiz", tags=["quiz"])
db = get_supabase()

def normalize_user_id(user_val: Optional[str]):
    if not user_val:
        return None
    try:
        # Check if already a valid UUID
        uuid.UUID(user_val)
        return user_val
    except:
        # Convert string (like 'user_abc') to a deterministic UUID
        return str(uuid.uuid5(uuid.NAMESPACE_DNS, user_val))

class QuizGenerateRequest(BaseModel):
    topic_id: str
    topic_label: Optional[str] = None  # Frontend can pass label directly to skip DB UUID requirement
    count: int = 5
    difficulty: str = "medium"

class QuizSubmitRequest(BaseModel):
    quiz_id: str
    user_answers: List[int]
    topic_id: str
    user_id: Optional[str] = None

@router.post("/generate")
async def generate_new_quiz(req: QuizGenerateRequest):
    try:
        topic_label = req.topic_label
        context = ""

        # If no label provided directly, try to get it from DB (only if it's a valid UUID)
        if not topic_label:
            is_valid_uuid = False
            try:
                uuid.UUID(req.topic_id)
                is_valid_uuid = True
            except ValueError:
                pass

            if is_valid_uuid and db:
                try:
                    topic_res = db.table("topics").select("label, material_id").eq("id", req.topic_id).single().execute()
                    if topic_res.data:
                        topic_label = topic_res.data["label"]
                        material_id = topic_res.data["material_id"]
                        # Get Material Context for richer quiz generation
                        material_res = db.table("study_materials").select("raw_text").eq("id", material_id).single().execute()
                        context = material_res.data["raw_text"][:2000] if material_res.data else ""
                except Exception as db_err:
                    print(f"Warning: DB topic lookup failed, falling back to ID as label: {db_err}")

            # Fallback: use the topic_id itself as the label (slug to title case)
            if not topic_label:
                topic_label = req.topic_id.replace("-", " ").replace("_", " ").title()

        # Call AI to generate questions
        questions = []
        try:
            questions = await generate_mcqs(topic_label, context, req.count, req.difficulty)
        except Exception as ai_err:
            print(f"Quiz AI Error: {ai_err}")
            return {
                "quiz_id": str(uuid.uuid4()),
                "questions": [],
                "error": "AI Service unavailable",
                "details": str(ai_err)
            }

        if isinstance(questions, dict) and "error" in questions:
            return {
                "quiz_id": str(uuid.uuid4()),
                "questions": [],
                "error": questions["error"],
                "details": questions.get("details", "")
            }

        # Ensure it's a list
        if not isinstance(questions, list):
            questions = []

        # Store in Supabase (best-effort, won't block quiz if DB fails)
        quiz_id = str(uuid.uuid4())
        try:
            if db:
                # Use a safe topic_id for DB insert (only valid UUIDs or generate a new one)
                safe_topic_id = req.topic_id
                try:
                    uuid.UUID(req.topic_id)
                except ValueError:
                    safe_topic_id = quiz_id  # Use quiz_id as fallback foreign key

                quiz_res = db.table("quizzes").insert({
                    "topic_id": safe_topic_id,
                    "questions": questions
                }).execute()
                if quiz_res.data:
                    quiz_id = quiz_res.data[0]["id"]
        except Exception as db_err:
            print(f"Warning: Quiz storage failed (persistence skipped): {db_err}")

        return {"quiz_id": quiz_id, "questions": questions, "topic_label": topic_label}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Quiz Router Internal Error: {e}")
        return {
            "quiz_id": str(uuid.uuid4()),
            "questions": [],
            "error": "Internal Server Error",
            "details": str(e)
        }

@router.post("/{quiz_id}/submit")
async def submit_quiz(quiz_id: str, req: QuizSubmitRequest):
    try:
        # 1. Fetch Quiz
        quiz_res = db.table("quizzes").select("questions").eq("id", quiz_id).single().execute()
        if not quiz_res.data:
            raise HTTPException(status_code=404, detail="Quiz not found")
        
        questions = quiz_res.data["questions"]
        
        # 2. Score Quiz
        correct_count = 0
        feedback = []
        
        for i, q in enumerate(questions):
            user_ans = req.user_answers[i] if i < len(req.user_answers) else -1
            is_correct = (user_ans == q["correct"])
            if is_correct:
                correct_count += 1
                
            feedback.append({
                "question_index": i,
                "is_correct": is_correct,
                "ai_reasoning": q.get("ai_reasoning", []),
                "explanation": q.get("explanation", "")
            })
        
        # 3. SM-2 Update
        quality = round((correct_count / len(questions)) * 5)
        norm_user_id = normalize_user_id(req.user_id)
        
        # Get current progress
        progress_res = db.table("topic_progress").select("*").eq("topic_id", req.topic_id).eq("user_id", norm_user_id).execute()
        
        if not progress_res.data:
            interval, repetitions, easiness = calculate_next_review(quality, 0, 0, 2.5)
            db.table("topic_progress").insert({
                "topic_id": req.topic_id,
                "user_id": norm_user_id,
                "interval": interval,
                "repetitions": repetitions,
                "easiness_factor": easiness,
                "mastery_level": (correct_count / len(questions)) * 100
            }).execute()
        else:
            curr = progress_res.data[0]
            interval, repetitions, easiness = calculate_next_review(
                quality, curr["interval"], curr["repetitions"], curr["easiness_factor"]
            )
            db.table("topic_progress").update({
                "interval": interval,
                "repetitions": repetitions,
                "easiness_factor": easiness,
                "mastery_level": min(100, curr["mastery_level"] + (quality * 2)),
                "last_reviewed_at": "now()"
            }).eq("id", curr["id"]).execute()
            
        return {
            "score": correct_count,
            "total": len(questions),
            "feedback": feedback,
            "next_review_interval": interval
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to submit quiz: {str(e)}")
