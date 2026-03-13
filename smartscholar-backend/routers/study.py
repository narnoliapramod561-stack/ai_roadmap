from fastapi import APIRouter, UploadFile, File, HTTPException, Body
from services.ai_logic import generate_mcqs, generate_schedule
from services.supabase import get_supabase
from services.sm2 import calculate_next_review
import pdfplumber
import io
import uuid
from typing import Optional, List

router = APIRouter(prefix="/study", tags=["study"])
db = get_supabase()

def normalize_user_id(user_val: str):
    if not user_val:
        return None
    try:
        uuid.UUID(user_val)
        return user_val
    except:
        return str(uuid.uuid5(uuid.NAMESPACE_DNS, user_val))

@router.post("/generate-planner")
async def generate_planner(
    user_id: str = Body(...),
    timeframe: str = Body("daily"),
    exam_date: Optional[str] = Body(None),
    study_intervals: Optional[List[dict]] = Body(None),
    material_ids: Optional[List[str]] = Body(None)
):
    try:
        norm_user_id = normalize_user_id(user_id)
        
        # 1. Get User Context (Weak Topics)
        weak_topics = []
        if db:
            try:
                # Find topics with low mastery
                low_mastery = db.table("topic_progress") \
                    .select("topics(label)") \
                    .eq("user_id", norm_user_id) \
                    .lt("mastery_level", 50) \
                    .limit(5) \
                    .execute()
                if low_mastery.data:
                    weak_topics = [t["topics"]["label"] for t in low_mastery.data]
            except:
                pass

        # 1.5 Get Completed task context before deleting
        past_completed = []
        if db:
            try:
                past_res = db.table("planner_tasks").select("title").eq("user_id", norm_user_id).eq("is_completed", True).execute()
                if past_res.data:
                    past_completed = [t["title"] for t in past_res.data]
            except:
                pass

        # 2. Get Syllabus Context (Topics from uploaded materials)
        syllabus_topics = []
        if db:
            try:
                m_ids = []
                if material_ids:
                    m_ids = material_ids
                else:
                    # Fetch recent materials for this user (up to 10 to cover full syllabus)
                    m_res = db.table("study_materials").select("id").eq("user_id", norm_user_id).order("created_at", descending=True).limit(10).execute()
                    if m_res.data:
                        m_ids = [m["id"] for m in m_res.data]
                
                if m_ids:
                    t_res = db.table("topics").select("label").in_("material_id", m_ids).execute()
                    if t_res.data:
                        syllabus_topics = [topic["label"] for topic in t_res.data]
            except Exception as e:
                print(f"Warning: Syllabus context fetch failed: {e}")

        # 3. Call AI
        # Fallback date if none provided
        target_date = exam_date or "2024-12-31" 
        tasks = await generate_schedule(
            target_date, 
            timeframe, 
            4.0, 
            weak_topics, 
            study_intervals=study_intervals,
            syllabus_topics=syllabus_topics,
            past_completed_topics=past_completed
        )
        
        # 3. Store Tasks (Best Effort)
        if db and tasks:
            try:
                # Delete old planner for this timeframe to keep it clean
                db.table("planner_tasks").delete().eq("user_id", norm_user_id).eq("timeframe", timeframe).execute()
                
                db_tasks = []
                for t in tasks:
                    task_item = {
                        "id": str(uuid.uuid4()),
                        "user_id": norm_user_id,
                        "timeframe": timeframe,
                        "title": t["title"],
                        "description": t["description"],
                        "duration": t["duration"],
                        "category": t["category"],
                        "priority": t["priority"],
                        "subtopics": t.get("subtopics", []),
                        "is_completed": False
                    }
                    db_tasks.append(task_item)
                
                try:
                    res = db.table("planner_tasks").insert(db_tasks).execute()
                except Exception as insert_err:
                    # Fallback if 'subtopics' column doesn't exist
                    print(f"Subtopics column missing? Falling back. Error: {insert_err}")
                    for dbt in db_tasks:
                        dbt.pop("subtopics", None)
                    res = db.table("planner_tasks").insert(db_tasks).execute()

                if res.data:
                    return {"tasks": res.data}
            except Exception as e:
                print(f"Warning: Planner persistence failed: {e}")
        
        # Return AI tasks directly if storage failed
        return {"tasks": tasks, "warning": "Plan generated but not saved to cloud."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/planner")
async def get_planner(user_id: str, timeframe: str = "daily"):
    try:
        norm_user_id = normalize_user_id(user_id)
        if not db:
            return []
        
        res = db.table("planner_tasks") \
            .select("*") \
            .eq("user_id", norm_user_id) \
            .eq("timeframe", timeframe) \
            .order("created_at") \
            .execute()
        return res.data
    except Exception as e:
        print(f"Planner fetch error: {e}")
        return []

@router.patch("/planner/task/{task_id}")
async def update_task_status(task_id: str, is_completed: bool = Body(...)):
    try:
        if not db:
            return {"status": "error"}
        
        db.table("planner_tasks") \
            .update({"is_completed": is_completed}) \
            .eq("id", task_id) \
            .execute()
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/roadmap/{material_id}")
async def get_roadmap(material_id: str, user_id: str = None):
    try:
        norm_user_id = normalize_user_id(user_id)
        # Fetch topics
        topics_res = db.table("topics").select("*").eq("material_id", material_id).execute()
        
        # Fetch progress for these topics
        topic_ids = [t["id"] for t in topics_res.data]
        progress_res = db.table("topic_progress").select("*").in_("topic_id", topic_ids).eq("user_id", norm_user_id).execute()
        
        # Map progress to topics
        progress_map = {p["topic_id"]: p for p in progress_res.data}
        
        nodes = []
        for t in topics_res.data:
            prog = progress_map.get(t["id"], {})
            nodes.append({
                "id": t["id"],
                "label": t["label"],
                "difficulty": t["difficulty"],
                "mastery": prog.get("mastery_level", 0)
            })
            
        return {"nodes": nodes}
    except Exception as e:
        print(f"Roadmap error: {e}")
        return {"nodes": [], "warning": "Could not fetch roadmap from database"}

@router.get("/quiz/{topic_id}")
async def get_quiz(topic_id: str):
    try:
        # Check if quiz exists
        existing = db.table("quizzes").select("*").eq("topic_id", topic_id).execute()
        if existing.data:
            return {"quiz": existing.data[0]["questions"]}
        
        # Get topic label
        topic = db.table("topics").select("label").eq("id", topic_id).single().execute()
        if not topic.data:
            raise HTTPException(status_code=404, detail="Topic not found")
            
        quiz_data = await generate_mcqs(topic.data["label"])
        
        # Store Quiz
        try:
            db.table("quizzes").insert({
                "topic_id": topic_id,
                "questions": quiz_data
            }).execute()
        except Exception as insert_err:
            print(f"Warning: Quiz insertion failed: {insert_err}")
            
        return {"quiz": quiz_data}
    except Exception as e:
        print(f"Quiz fetch error: {e}")
        return {"quiz": [], "error": str(e)}

@router.post("/update-mastery")
async def update_mastery(
    topic_id: str = Body(...), 
    quality: int = Body(...), 
    user_id: str = Body(None)
):
    try:
        norm_user_id = normalize_user_id(user_id)
        # Get current progress
        progress = db.table("topic_progress").select("*").eq("topic_id", topic_id).eq("user_id", norm_user_id).execute()
        
        if not progress.data:
            # Initial review
            interval, repetitions, easiness = calculate_next_review(quality, 0, 0, 2.5)
            db.table("topic_progress").insert({
                "topic_id": topic_id,
                "user_id": norm_user_id,
                "interval": interval,
                "repetitions": repetitions,
                "easiness_factor": easiness,
                "mastery_level": (quality / 5) * 100,
                "last_reviewed_at": "now()"
            }).execute()
        else:
            curr = progress.data[0]
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
            
        return {"status": "success", "interval": interval}
    except Exception as e:
        print(f"Mastery update error: {e}")
        return {"status": "success", "warning": "Progress not saved"}
