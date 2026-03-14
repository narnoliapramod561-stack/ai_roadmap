from fastapi import APIRouter, HTTPException, Query
from services.supabase import get_supabase
from datetime import date
from typing import Optional
import uuid

router = APIRouter(prefix="/readiness", tags=["readiness"])
db = get_supabase()


def normalize_user_id(user_val: Optional[str]):
    if not user_val:
        return None
    try:
        uuid.UUID(user_val)
        return user_val
    except Exception:
        return str(uuid.uuid5(uuid.NAMESPACE_DNS, user_val))


@router.get("/score")
async def get_readiness_score(
    user_id: str = Query(..., description="User ID"),
    material_id: Optional[str] = Query(None, description="Optional: filter by material")
):
    """
    Calculates real-time exam readiness using:
    - Quiz performance (45% weight)
    - Topic coverage (30% weight)
    - Schedule completion (25% weight)
    - Penalty for overdue spaced repetition reviews
    """
    try:
        norm_uid = normalize_user_id(user_id)
        if not norm_uid or not db:
            return {"readiness_pct": 0, "weak_areas": [], "strong_areas": [], "details": "No data available"}

        # 1. Fetch quiz history
        quiz_query = db.table("quizzes").select("topic_name, difficulty, attempt_result").eq("user_id", norm_uid)
        if material_id:
            quiz_query = quiz_query.eq("material_id", material_id)
        quiz_res = quiz_query.execute()
        quizzes = quiz_res.data or []

        # 2. Fetch spaced repetition queue for overdue penalty
        sr_res = db.table("spaced_repetition_queue").select("topic_name, next_review, last_score").eq("user_id", norm_uid).execute()
        sr_queue = sr_res.data or []

        # 3. Get total topics from materials (for coverage calculation)
        mat_query = db.table("study_materials").select("ai_roadmap").eq("user_id", norm_uid)
        if material_id:
            mat_query = mat_query.eq("id", material_id)
        mat_res = mat_query.execute()

        total_topics = 0
        for mat in (mat_res.data or []):
            ai_roadmap = mat.get("ai_roadmap") or {}
            total_topics += ai_roadmap.get("total_topics", 0) or len(ai_roadmap.get("topics", []))

        # 4. Fetch persistently learned topics
        learned_res = db.table("learned_topics").select("topic_label").eq("user_id", norm_uid).execute()
        learned_topics = [t["topic_label"] for t in (learned_res.data or [])]

        # 5. Fetch planner tasks for schedule completion
        planner_res = db.table("planner_tasks").select("is_completed").eq("user_id", norm_uid).execute()
        planner_tasks = planner_res.data or []
        
        # 6. Calculate topic scores from quiz history + learned topics
        topic_scores: dict = {}
        difficulty_weights = {"easy": 0.5, "medium": 1.0, "hard": 1.5}

        # Any topic marked as "Learned" is 100% mastered
        for topic in learned_topics:
            topic_scores[topic] = {"weighted_sum": 1.0, "weight_total": 1.0}

        for quiz in quizzes:
            result = quiz.get("attempt_result") or {}
            if not result:
                continue
            topic = quiz.get("topic_name", "Unknown")
            # If already marked learned, quiz score just reinforces it
            if topic in learned_topics:
                continue
            
            raw_score = result.get("score", 0)
            total_q = result.get("total", 1)
            score_pct = raw_score / max(total_q, 1)
            weight = difficulty_weights.get(quiz.get("difficulty", "medium"), 1.0)

            if topic not in topic_scores:
                topic_scores[topic] = {"weighted_sum": 0, "weight_total": 0}
            topic_scores[topic]["weighted_sum"] += score_pct * weight
            topic_scores[topic]["weight_total"] += weight

        final_topic_scores = {
            t: v["weighted_sum"] / v["weight_total"]
            for t, v in topic_scores.items()
            if v["weight_total"] > 0
        }

        # 5. Compute components
        avg_score = (
            sum(final_topic_scores.values()) / len(final_topic_scores)
            if final_topic_scores else 0
        )
        coverage = (
            len(final_topic_scores) / total_topics
            if total_topics > 0 else (1.0 if final_topic_scores else 0)
        )
        coverage = min(coverage, 1.0)

        # 8. Schedule completion (Merge legacy study_schedules with modern planner_tasks)
        schedule_completion = 0.0
        
        # Primary: Modern planner tasks completion ratio
        if planner_tasks:
            completed_p = sum(1 for t in planner_tasks if t.get("is_completed"))
            schedule_completion = completed_p / len(planner_tasks)
        # Fallback: Legacy study_schedules
        else:
            sched_res = db.table("study_schedules").select("schedule").eq("user_id", norm_uid).eq("active", True).limit(1).execute()
            if sched_res.data:
                sched = sched_res.data[0].get("schedule") or {}
                days = sched.get("days", [])
                if days:
                    completed_sessions = sum(
                        1 for day in days
                        for sess in day.get("sessions", [])
                        if sess.get("completed", False)
                    )
                    total_sessions = sum(len(day.get("sessions", [])) for day in days)
                    schedule_completion = completed_sessions / max(total_sessions, 1)

        # 7. Overdue SR penalty
        today = date.today()
        overdue = sum(
            1 for item in sr_queue
            if item.get("next_review") and item["next_review"] <= str(today)
        )

        # 8. Final readiness score
        readiness = (
            avg_score * 0.45 +
            coverage * 0.30 +
            schedule_completion * 0.25
        ) * 100

        readiness = max(0, min(100, readiness - (overdue * 3)))

        weak_areas = [t for t, s in final_topic_scores.items() if s < 0.6]
        strong_areas = [t for t, s in final_topic_scores.items() if s >= 0.8]

        return {
            "readiness_pct": round(readiness, 1),
            "weak_areas": weak_areas,
            "strong_areas": strong_areas,
            "topic_scores": {t: round(s * 100, 1) for t, s in final_topic_scores.items()},
            "overdue_reviews": overdue,
            "topics_attempted": len(final_topic_scores),
            "total_topics": total_topics,
        }

    except Exception as e:
        print(f"Readiness Score Error: {e}")
        return {"readiness_pct": 0, "weak_areas": [], "strong_areas": [], "error": str(e)}
