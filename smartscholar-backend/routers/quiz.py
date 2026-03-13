from fastapi import APIRouter, HTTPException, Body, Query
from pydantic import BaseModel
from services.ai_logic import generate_mcqs
from services.supabase import get_supabase
from services.sm2 import calculate_next_review
from typing import List, Optional
from datetime import date, timedelta
import uuid

router = APIRouter(prefix="/quiz", tags=["quiz"])
db = get_supabase()

def normalize_user_id(user_val: Optional[str]):
    if not user_val:
        return None
    try:
        uuid.UUID(user_val)
        return user_val
    except Exception:
        return str(uuid.uuid5(uuid.NAMESPACE_DNS, user_val))


class QuizGenerateRequest(BaseModel):
    topic_id: str
    topic_label: Optional[str] = None
    material_id: Optional[str] = None
    user_id: Optional[str] = None
    count: int = 5
    difficulty: str = "medium"


class QuizSubmitRequest(BaseModel):
    quiz_id: str
    user_answers: List[int]
    topic_id: str
    topic_name: Optional[str] = None
    user_id: Optional[str] = None
    difficulty: Optional[str] = "medium"


@router.post("/generate")
async def generate_new_quiz(req: QuizGenerateRequest):
    try:
        topic_label = req.topic_label
        context = ""

        # Try to resolve topic from DB
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
                        mat_id = topic_res.data["material_id"]
                        mat_res = db.table("study_materials").select("raw_text").eq("id", mat_id).single().execute()
                        context = mat_res.data["raw_text"][:2000] if mat_res.data else ""
                except Exception as db_err:
                    print(f"Warning: DB topic lookup failed: {db_err}")

            if not topic_label:
                topic_label = req.topic_id.replace("-", " ").replace("_", " ").title()

        # Fetch material context if material_id provided directly
        if not context and req.material_id and db:
            try:
                mat_res = db.table("study_materials").select("raw_text").eq("id", req.material_id).single().execute()
                context = mat_res.data["raw_text"][:2000] if mat_res.data else ""
            except Exception:
                pass

        # Generate questions via AI
        questions = []
        try:
            questions = await generate_mcqs(topic_label, context, req.count, req.difficulty)
        except Exception as ai_err:
            print(f"Quiz AI Error: {ai_err}")
            return {"quiz_id": str(uuid.uuid4()), "questions": [], "error": "AI Service unavailable", "details": str(ai_err)}

        if isinstance(questions, dict) and "error" in questions:
            return {"quiz_id": str(uuid.uuid4()), "questions": [], "error": questions["error"]}

        if not isinstance(questions, list):
            questions = []

        quiz_id = str(uuid.uuid4())

        # Store in Supabase
        norm_uid = normalize_user_id(req.user_id)
        try:
            if db:
                quiz_payload = {
                    "id": quiz_id,
                    "topic_name": topic_label,
                    "difficulty": req.difficulty,
                    "questions": questions,
                }
                if norm_uid:
                    quiz_payload["user_id"] = norm_uid
                if req.material_id:
                    quiz_payload["material_id"] = req.material_id

                quiz_res = db.table("quizzes").insert(quiz_payload).execute()
                if quiz_res.data:
                    quiz_id = quiz_res.data[0]["id"]
        except Exception as db_err:
            print(f"Warning: Quiz storage failed: {db_err}")

        return {"quiz_id": quiz_id, "questions": questions, "topic_label": topic_label}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Quiz Router Internal Error: {e}")
        return {"quiz_id": str(uuid.uuid4()), "questions": [], "error": "Internal Server Error", "details": str(e)}


@router.post("/{quiz_id}/submit")
async def submit_quiz(quiz_id: str, req: QuizSubmitRequest):
    try:
        # 1. Fetch Quiz
        quiz_res = db.table("quizzes").select("questions, topic_name, difficulty").eq("id", quiz_id).single().execute()
        if not quiz_res.data:
            raise HTTPException(status_code=404, detail="Quiz not found")

        questions = quiz_res.data["questions"]
        topic_name = req.topic_name or quiz_res.data.get("topic_name", "Unknown")
        difficulty = req.difficulty or quiz_res.data.get("difficulty", "medium")

        # 2. Score Quiz
        correct_count = 0
        feedback = []
        wrong_topics = []

        for i, q in enumerate(questions):
            user_ans = req.user_answers[i] if i < len(req.user_answers) else -1
            is_correct = (user_ans == q.get("correct", -1))
            if is_correct:
                correct_count += 1
            else:
                wrong_topics.append(q.get("question", "")[:60])

            feedback.append({
                "question_index": i,
                "question": q.get("question", ""),
                "your_answer": q["options"][user_ans] if 0 <= user_ans < len(q.get("options", [])) else "No answer",
                "correct_answer": q["options"][q["correct"]] if 0 <= q.get("correct", -1) < len(q.get("options", [])) else "N/A",
                "is_correct": is_correct,
                "explanation": q.get("explanation", ""),
                "ai_reasoning": q.get("ai_reasoning", []),
            })

        score_pct = correct_count / len(questions) if questions else 0
        quality_score = round(score_pct * 5)  # 0-5 for SM-2

        # 3. SM-2 Update → spaced_repetition_queue
        norm_uid = normalize_user_id(req.user_id)
        next_interval = 1

        if norm_uid and db:
            try:
                sr_res = db.table("spaced_repetition_queue").select("*") \
                    .eq("user_id", norm_uid).eq("topic_name", topic_name).execute()

                if sr_res.data:
                    row = sr_res.data[0]
                    interval, repetitions, easiness = calculate_next_review(
                        quality_score, row["interval_days"], row["repetitions"], row["easiness"]
                    )
                else:
                    interval, repetitions, easiness = calculate_next_review(quality_score, 1, 0, 2.5)

                next_interval = interval
                next_review = str(date.today() + timedelta(days=interval))

                db.table("spaced_repetition_queue").upsert({
                    "user_id": norm_uid,
                    "topic_name": topic_name,
                    "easiness": easiness,
                    "interval_days": interval,
                    "repetitions": repetitions,
                    "next_review": next_review,
                    "last_score": score_pct,
                }, on_conflict="user_id, topic_name").execute()

            except Exception as sm2_err:
                print(f"SM-2 Update Error: {sm2_err}")

        # 4. Save attempt_result to quizzes table
        try:
            attempt_result = {
                "score": correct_count,
                "total": len(questions),
                "score_pct": round(score_pct * 100, 1),
                "wrong_topics": wrong_topics,
                "difficulty": difficulty,
            }
            db.table("quizzes").update({
                "attempt_result": attempt_result,
                "attempted_at": "now()"
            }).eq("id", quiz_id).execute()
        except Exception as res_err:
            print(f"Quiz result save error: {res_err}")

        return {
            "score": correct_count,
            "total": len(questions),
            "score_pct": round(score_pct * 100, 1),
            "feedback": feedback,
            "wrong_topics": wrong_topics,
            "next_review_interval_days": next_interval,
            "sm2_quality": quality_score,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to submit quiz: {str(e)}")


@router.get("/history")
async def get_quiz_history(user_id: str = Query(...)):
    """
    Fetches all quiz attempts for a user with their results.
    """
    try:
        norm_uid = normalize_user_id(user_id)
        if not norm_uid or not db:
            return []

        res = db.table("quizzes").select(
            "id, topic_name, difficulty, attempt_result, attempted_at, created_at, material_id"
        ).eq("user_id", norm_uid).order("created_at", desc=True).execute()

        quizzes = res.data or []
        # Return only attempted quizzes for history
        attempted = [q for q in quizzes if q.get("attempt_result")]
        return attempted

    except Exception as e:
        print(f"Quiz History Error: {e}")
        return []


@router.get("/pending")
async def get_pending_quizzes(user_id: str = Query(...)):
    """
    Returns quizzes that haven't been attempted yet — for review queue.
    """
    try:
        norm_uid = normalize_user_id(user_id)
        if not norm_uid:
            return []
        res = db.table("quizzes").select("id, topic_name, difficulty, created_at").eq("user_id", norm_uid).is_("attempt_result", "null").order("created_at", desc=True).limit(20).execute()
        return res.data or []
    except Exception as e:
        return []
