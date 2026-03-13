from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from services.supabase import get_supabase
from services.sm2 import calculate_next_review
from datetime import date, timedelta
from typing import Optional, List
import uuid

router = APIRouter(prefix="/spaced-repetition", tags=["spaced-repetition"])
db = get_supabase()


def normalize_user_id(user_val: Optional[str]):
    if not user_val:
        return None
    try:
        uuid.UUID(user_val)
        return user_val
    except Exception:
        return str(uuid.uuid5(uuid.NAMESPACE_DNS, user_val))


@router.get("/queue")
async def get_review_queue(user_id: str = Query(...)):
    """
    Returns the student's spaced repetition queue — topics ordered by review urgency.
    """
    try:
        norm_uid = normalize_user_id(user_id)
        res = db.table("spaced_repetition_queue").select("*").eq("user_id", norm_uid).order("next_review").execute()
        items = res.data or []
        today = str(date.today())

        # Enrich each item with status
        for item in items:
            next_review = item.get("next_review", today)
            if next_review <= today:
                item["status"] = "overdue" if next_review < today else "due_today"
            else:
                days_until = (date.fromisoformat(next_review) - date.today()).days
                item["status"] = f"due_in_{days_until}_days"

        return {"queue": items, "total": len(items)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/update")
async def update_review(
    user_id: str = Query(...),
    topic_name: str = Query(...),
    score_0_to_5: int = Query(..., ge=0, le=5)
):
    """
    Manually updates a topic's SM-2 entry after review.
    """
    try:
        norm_uid = normalize_user_id(user_id)
        res = db.table("spaced_repetition_queue").select("*").eq("user_id", norm_uid).eq("topic_name", topic_name).execute()

        if res.data:
            row = res.data[0]
            interval, repetitions, easiness = calculate_next_review(
                score_0_to_5, row["interval_days"], row["repetitions"], row["easiness"]
            )
        else:
            interval, repetitions, easiness = calculate_next_review(score_0_to_5, 1, 0, 2.5)

        next_review = str(date.today() + timedelta(days=interval))

        db.table("spaced_repetition_queue").upsert({
            "user_id": norm_uid,
            "topic_name": topic_name,
            "easiness": easiness,
            "interval_days": interval,
            "repetitions": repetitions,
            "next_review": next_review,
            "last_score": score_0_to_5 / 5.0,
        }, on_conflict="user_id, topic_name").execute()

        return {"topic_name": topic_name, "next_review": next_review, "interval_days": interval}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/overdue")
async def get_overdue_topics(user_id: str = Query(...)):
    """
    Returns all topics that need immediate review (past their scheduled date).
    """
    try:
        norm_uid = normalize_user_id(user_id)
        today = str(date.today())
        res = db.table("spaced_repetition_queue").select("topic_name, next_review, last_score, interval_days").eq("user_id", norm_uid).lte("next_review", today).execute()
        return {"overdue": res.data or [], "count": len(res.data or [])}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
