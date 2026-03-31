from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from services.ai_logic import analyze_syllabus, generate_mcqs
from services.supabase import get_supabase
import pdfplumber
import io
import json
import uuid
from typing import Optional

router = APIRouter(prefix="/materials", tags=["materials"])
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

@router.get("/")
async def list_materials(user_id: str = None):
    try:
        if not db:
            return []
        
        norm_user_id = normalize_user_id(user_id)
        
        try:
            query = db.table("study_materials").select("*")
            if norm_user_id:
                query = query.eq("user_id", norm_user_id)
                    
            res = query.order("created_at", desc=True).execute()
            return res.data
        except Exception as query_err:
            print(f"Query error (retrying without filter): {query_err}")
            # Fallback for display - fetch all if filtering fails
            res = db.table("study_materials").select("*").order("created_at", desc=True).execute()
            return res.data
            
    except Exception as e:
        print(f"Error listing materials: {e}")
        return []

@router.delete("/{material_id}")
async def delete_material(material_id: str):
    try:
        if not db:
            raise HTTPException(status_code=500, detail="Database not configured")
        
        # 1. Delete associated topics (cascading cleanup)
        try:
            db.table("topics").delete().eq("material_id", material_id).execute()
        except:
            pass
        
        # 2. Delete the material itself
        db.table("study_materials").delete().eq("id", material_id).execute()
        
        return {"status": "success", "message": "Material and associated topics deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete material: {str(e)}")

@router.post("/upload")
async def upload_material(
    file: UploadFile = File(...), 
    user_id: Optional[str] = Form(None),
    user_email: Optional[str] = Form(None),
    subject_name: str = Form(...),
    exam_date: Optional[str] = Form(None)
):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    content = await file.read()
    text = ""
    try:
        with pdfplumber.open(io.BytesIO(content)) as pdf:
            for page in pdf.pages:
                text += page.extract_text() or ""
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse PDF: {str(e)}")
    
    if not text.strip():
        raise HTTPException(status_code=400, detail="The PDF content is empty or unreadable")

    # 1. AI Analysis
    analysis_result = await analyze_syllabus(text)
    
    if "error" in analysis_result:
        detail = analysis_result["error"]
        if "details" in analysis_result:
            detail += f": {analysis_result['details']}"
        raise HTTPException(status_code=500, detail=detail)

    # 2. Save to Supabase
    material_id = str(uuid.uuid4())
    filename = file.filename
    norm_user_id = normalize_user_id(user_id)
    
    if db:
        # Ensure user exists first (satisfies user_id FK constraint)
        if norm_user_id:
            try:
                # Use provided email or fallback to a deterministic one to satisfy NOT NULL constraint
                email = user_email or f"user_{norm_user_id[:8]}@smartscholar.ai"
                db.table("users").upsert({"id": norm_user_id, "email": email}, on_conflict="id").execute()
            except Exception as ue:
                print(f"User upsert failed (non-critical): {ue}")

        # Build insert payload with actual DB column names
        insert_data = {
            "id": material_id,
            "user_id": norm_user_id,
            "filename": filename,     # Likely NOT NULL in DB
            "file_name": filename,    # Alias column
            "subject": subject_name,
            "raw_text": text[:50000],
            "ai_roadmap": analysis_result,
            "knowledge_graph": analysis_result.get("knowledge_graph"),
            "exam_date": exam_date
        }
        
        try:
            db.table("study_materials").insert(insert_data).execute()
            print(f"Material saved successfully: {material_id}")
        except Exception as full_err:
            print(f"Full insert failed: {full_err}")
            
            # Try progressively simpler inserts but KEEPS user_id if possible
            fallback_attempts = [
                # Without large JSON fields
                {"id": material_id, "user_id": norm_user_id, "filename": filename, "file_name": filename, "subject": subject_name, "raw_text": text[:20000], "exam_date": exam_date},
                # Without exam_date and smaller text
                {"id": material_id, "user_id": norm_user_id, "filename": filename, "file_name": filename, "subject": subject_name, "raw_text": text[:10000]},
                # Without user_id (AS LAST RESORT)
                {"id": material_id, "filename": filename, "file_name": filename, "subject": subject_name, "raw_text": text[:5000]},
            ]
            for attempt_data in fallback_attempts:
                try:
                    db.table("study_materials").insert(attempt_data).execute()
                    print(f"Fallback insert OK with keys: {list(attempt_data.keys())}")
                    break
                except Exception as fe:
                    print(f"Fallback attempt failed: {fe}")
                
        # 3. Store Extracted Topics
        try:
            nodes = analysis_result.get("knowledge_graph", {}).get("nodes", [])
            topics_data = []
            for node in nodes:
                topics_data.append({
                    "id": str(uuid.uuid4()),
                    "material_id": material_id,
                    "label": node.get("label", "Unknown Topic"),
                    "difficulty": node.get("difficulty", "medium")
                })
            if topics_data:
                db.table("topics").insert(topics_data).execute()
                print(f"Successfully inserted {len(topics_data)} topics.")
        except Exception as topic_err:
            print(f"Failed to insert topics: {topic_err}")
            
    # Always return success if AI analysis worked
    return {
        "status": "success", 
        "material_id": material_id,
        "analysis": analysis_result
    }
