from fastapi import APIRouter, UploadFile, File, HTTPException, Body
from pydantic import BaseModel
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
    material_ids: Optional[List[str]] = Body(None),
    syllabus_topics_override: Optional[List[str]] = Body(None),  # Frontend can pass topics directly
    subject_names_override: Optional[List[str]] = Body(None)      # Subject names as fallback
):
    try:
        norm_user_id = normalize_user_id(user_id)
        
        # 1. Get User Context (Weak Topics)
        weak_topics = []
        if db:
            try:
                low_mastery = db.table("topic_progress") \
                    .select("topics(label)") \
                    .eq("user_id", norm_user_id) \
                    .lt("mastery_level", 50) \
                    .limit(5) \
                    .execute()
                if low_mastery.data:
                    weak_topics = [t["topics"]["label"] for t in low_mastery.data if t.get("topics")]
            except:
                pass

        # 2. FIX: Get completed task titles BEFORE deleting old tasks
        past_completed = []
        if db:
            try:
                past_res = db.table("planner_tasks").select("title").eq("user_id", norm_user_id).eq("is_completed", True).execute()
                if past_res.data:
                    past_completed = [t["title"] for t in past_res.data]
            except:
                pass

        # 3. Get persistently learned topics 
        learned_topics = []
        if db:
            try:
                learned_res = db.table("learned_topics").select("topic_label").eq("user_id", norm_user_id).execute()
                if learned_res.data:
                    learned_topics = [t["topic_label"] for t in learned_res.data]
            except:
                pass

        # 4. Get Syllabus Context + per-material exam dates
        syllabus_topics = []
        material_exam_dates = {}  # { "Subject Name": "YYYY-MM-DD" }

        # Use frontend-provided topics if available (avoids DB lookup issues)
        if syllabus_topics_override:
            syllabus_topics = syllabus_topics_override
            print(f"Using frontend-provided syllabus_topics: {len(syllabus_topics)} topics")
        elif db:
            try:
                m_ids = []
                m_res = None
                if material_ids:
                    m_ids = material_ids
                    m_res = db.table("study_materials").select("id, ai_roadmap, subject, file_name, exam_date, raw_text").in_("id", m_ids).execute()
                else:
                    m_res = db.table("study_materials").select("id, ai_roadmap, subject, file_name, exam_date, raw_text").eq("user_id", norm_user_id).order("created_at", desc=True).limit(10).execute()
                    if m_res.data:
                        m_ids = [m["id"] for m in m_res.data]

                if m_res and m_res.data:
                    for mat in m_res.data:
                        ai_roadmap = mat.get("ai_roadmap") or {}
                        subject_label = mat.get("subject") or mat.get("file_name", "Unknown")
                        mat_exam_date = mat.get("exam_date")
                        if mat_exam_date:
                            material_exam_dates[subject_label] = mat_exam_date

                        topics_list = ai_roadmap.get("topics", [])
                        kg_nodes = ai_roadmap.get("knowledge_graph", {}).get("nodes", [])
                        for t in topics_list:
                            if isinstance(t, dict) and t.get("name"):
                                syllabus_topics.append(t["name"])
                        for n in kg_nodes:
                            if isinstance(n, dict) and n.get("label") and n["label"] not in syllabus_topics:
                                syllabus_topics.append(n["label"])

                # Fallback 1: topics table
                if not syllabus_topics and m_ids:
                    try:
                        t_res = db.table("topics").select("label").in_("material_id", m_ids).execute()
                        if t_res.data:
                            syllabus_topics = [topic["label"] for topic in t_res.data]
                    except:
                        pass

                # Fallback 2: extract from raw_text using AI
                if not syllabus_topics and m_res and m_res.data:
                    for mat in m_res.data:
                        raw_text = (mat.get("raw_text") or "").strip()
                        if raw_text:
                            print(f"Extracting topics from raw_text for material {mat.get('id')}")
                            try:
                                from services.ai_logic import analyze_syllabus
                                analysis = await analyze_syllabus(raw_text[:8000])  # Limit tokens
                                for t in analysis.get("topics", []):
                                    if isinstance(t, dict) and t.get("name"):
                                        syllabus_topics.append(t["name"])
                                for n in analysis.get("knowledge_graph", {}).get("nodes", []):
                                    if isinstance(n, dict) and n.get("label") and n["label"] not in syllabus_topics:
                                        syllabus_topics.append(n["label"])
                                # Store back so next call is fast
                                try:
                                    db.table("study_materials").update({"ai_roadmap": analysis}).eq("id", mat["id"]).execute()
                                except:
                                    pass
                            except Exception as re:
                                print(f"raw_text fallback failed: {re}")

                # Fallback 3: fetch ALL materials for this user (user_id mismatch workaround)
                if not syllabus_topics:
                    try:
                        all_res = db.table("study_materials").select("id, ai_roadmap, subject, file_name, exam_date").eq("user_id", norm_user_id).execute()
                        if all_res.data:
                            print(f"Fallback 3: found {len(all_res.data)} materials for norm_user_id")
                            for mat in all_res.data:
                                ai_roadmap = mat.get("ai_roadmap") or {}
                                subject_label = mat.get("subject") or mat.get("file_name", "Unknown")
                                mat_exam_date = mat.get("exam_date")
                                if mat_exam_date:
                                    material_exam_dates[subject_label] = mat_exam_date
                                for t in ai_roadmap.get("topics", []):
                                    if isinstance(t, dict) and t.get("name"):
                                        syllabus_topics.append(t["name"])
                                for n in ai_roadmap.get("knowledge_graph", {}).get("nodes", []):
                                    if isinstance(n, dict) and n.get("label") and n["label"] not in syllabus_topics:
                                        syllabus_topics.append(n["label"])
                    except Exception as fb3e:
                        print(f"Fallback 3 failed: {fb3e}")

                print(f"Syllabus context: {len(syllabus_topics)} topics for user {norm_user_id}")
                print(f"Learned topics: {len(learned_topics)}, Past completed: {len(past_completed)}")
            except Exception as e:
                print(f"Warning: Syllabus context fetch failed: {e}")

        # 5. Call AI with enriched context
        target_date = exam_date or "2025-12-31"

        # Collect subject names from DB materials for fallback
        db_subject_names = list(material_exam_dates.keys())
        # Merge with any frontend-provided subject names override
        all_subject_names = list(set((subject_names_override or []) + db_subject_names))

        print(f"Syllabus topics: {len(syllabus_topics)}, Subject names fallback: {all_subject_names}")

        tasks = await generate_schedule(
            target_date,
            timeframe,
            4.0,
            weak_topics,
            study_intervals=study_intervals,
            syllabus_topics=syllabus_topics,
            past_completed_topics=past_completed,
            learned_topics=learned_topics,
            material_exam_dates=material_exam_dates,
            subject_names=all_subject_names
        )

        # 6. Store Tasks — delete OLD tasks AFTER generating new ones
        if db and tasks:
            try:
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
                    print(f"Subtopics column missing? Falling back. Error: {insert_err}")
                    for dbt in db_tasks:
                        dbt.pop("subtopics", None)
                    res = db.table("planner_tasks").insert(db_tasks).execute()

                if res.data:
                    return {"tasks": res.data}
            except Exception as e:
                print(f"Warning: Planner persistence failed: {e}")

        return {"tasks": tasks, "warning": "Plan generated but not saved to cloud."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/mark-learned")
async def mark_topic_learned(
    user_id: str = Body(...),
    topic_label: str = Body(...),
    material_id: Optional[str] = Body(None)
):
    """Persistently mark a topic as learned. Survives plan regeneration."""
    try:
        norm_user_id = normalize_user_id(user_id)
        if not db:
            return {"status": "ok", "warning": "No database"}

        # Upsert so duplicates don't error
        try:
            db.table("learned_topics").upsert({
                "user_id": norm_user_id,
                "topic_label": topic_label,
                "material_id": material_id
            }, on_conflict="user_id,topic_label").execute()
        except Exception:
            # Fallback: try insert (table may not have unique constraint yet)
            try:
                db.table("learned_topics").insert({
                    "user_id": norm_user_id,
                    "topic_label": topic_label,
                    "material_id": material_id
                }).execute()
            except Exception as e2:
                print(f"mark-learned insert failed: {e2}")

        return {"status": "success", "topic": topic_label}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/unlearn-topic")
async def unlearn_topic(
    user_id: str,
    topic_label: str
):
    """Remove a topic from the learned list."""
    try:
        norm_user_id = normalize_user_id(user_id)
        if db:
            db.table("learned_topics").delete().eq("user_id", norm_user_id).eq("topic_label", topic_label).execute()
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/learned-topics")
async def get_learned_topics(user_id: str):
    """Return all topics the user has persistently marked as learned."""
    try:
        norm_user_id = normalize_user_id(user_id)
        if not db:
            return []
        res = db.table("learned_topics").select("topic_label, material_id, learned_at").eq("user_id", norm_user_id).execute()
        return res.data or []
    except Exception as e:
        print(f"learned-topics fetch error: {e}")
        return []


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


class TaskStatusUpdate(BaseModel):
    is_completed: bool

@router.patch("/planner/task/{task_id}")
async def update_task_status(task_id: str, body: TaskStatusUpdate):
    try:
        if not db:
            return {"status": "error"}

        db.table("planner_tasks") \
            .update({"is_completed": body.is_completed}) \
            .eq("id", task_id) \
            .execute()
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/roadmap/{material_id}")
async def get_roadmap(material_id: str, user_id: str = None):
    try:
        norm_user_id = normalize_user_id(user_id)
        
        # 1. Try to fetch the full original roadmap first (for structural edges and positions)
        res = db.table("study_materials").select("ai_roadmap").eq("id", material_id).single().execute()
        ai_roadmap = res.data.get("ai_roadmap") if res.data else None
        
        kg = {}
        if ai_roadmap:
            kg = ai_roadmap.get("knowledge_graph") or {}
        
        # 2. Fetch current mastery progress for all topics in this material
        topics_res = db.table("topics").select("*").eq("material_id", material_id).execute()
        topic_ids = [t["id"] for t in topics_res.data]
        progress_res = db.table("topic_progress").select("*").in_("topic_id", topic_ids).eq("user_id", norm_user_id).execute()
        progress_map = {p["topic_id"]: p for p in progress_res.data}

        # 3. Build nodes with latest mastery
        # If we have kg nodes, we use them as the base to preserve layout/edges
        if kg and kg.get("nodes"):
            nodes = kg["nodes"]
            edges = kg.get("edges") or []
            # Sync mastery onto these nodes (by label matching if IDs differ, or ID matching)
            for node in nodes:
                # Try finding in topics_res by label
                match = next((t for t in topics_res.data if t["label"] == node["label"]), None)
                if match:
                    prog = progress_map.get(match["id"], {})
                    node["mastery"] = prog.get("mastery_level", 0)
                    node["id"] = match["id"] # Ensure consistency with topics table IDs
            return {"nodes": nodes, "edges": edges}

        # Fallback: Build from topics table if no KG JSON found
        nodes = []
        for t in topics_res.data:
            prog = progress_map.get(t["id"], {})
            nodes.append({
                "id": t["id"],
                "label": t["label"],
                "difficulty": t["difficulty"],
                "mastery": prog.get("mastery_level", 0)
            })

        return {"nodes": nodes, "edges": []}
    except Exception as e:
        print(f"Roadmap error: {e}")
        return {"nodes": [], "edges": [], "warning": "Could not fetch roadmap from database"}


@router.get("/quiz/{topic_id}")
async def get_quiz(topic_id: str):
    try:
        existing = db.table("quizzes").select("*").eq("topic_id", topic_id).execute()
        if existing.data:
            return {"quiz": existing.data[0]["questions"]}

        topic = db.table("topics").select("label").eq("id", topic_id).single().execute()
        if not topic.data:
            raise HTTPException(status_code=404, detail="Topic not found")

        quiz_data = await generate_mcqs(topic.data["label"])

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
        progress = db.table("topic_progress").select("*").eq("topic_id", topic_id).eq("user_id", norm_user_id).execute()

        if not progress.data:
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
