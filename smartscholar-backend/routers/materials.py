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

    # 2. Resilient Save to Supabase
    material_id = str(uuid.uuid4())
    filename = file.filename
    norm_user_id = normalize_user_id(user_id)
    
    if db:
        full_data = {
            "id": material_id,
            "user_id": norm_user_id,
            "filename": filename,
            "raw_text": text,
            "subject_name": subject_name,
            "exam_date": exam_date
        }
        
        try:
            # 1. Full Insert (Best case)
            db.table("study_materials").insert(full_data).execute()
        except Exception as full_err:
            error_str = str(full_err).lower()
            print(f"Full insert failed: {full_err}")
            
            # 2. Resilient Fallback (Handle missing subject_name or exam_date columns)
            # If the error relates to a column, try minimal insert
            if "column" in error_str:
                print("Detected missing column in schema. Switching to minimal resilient insert...")
                resilient_filename = f"{subject_name} - {filename}"
                resilient_data = {
                    "id": material_id,
                    "user_id": norm_user_id,
                    "filename": resilient_filename,
                    "raw_text": text
                }
                try:
                    db.table("study_materials").insert(resilient_data).execute()
                    print("Minimal resilient insert successful.")
                except Exception as res_err:
                    print(f"Resilient fallback failed: {res_err}")
                    # Attempt Ultra-Minimal
                    ultra_minimal_data = {"id": material_id, "filename": resilient_filename, "raw_text": text}
                    try:
                        db.table("study_materials").insert(ultra_minimal_data).execute()
                    except:
                        pass
            else:
                # Other error (like RLS), already handled by the general return below
                pass
                
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
                
    # Return success regardless of persistence if analysis worked, 
    # but the frontend now handles the local-only persistence for showing the item.
    return {
        "status": "success", 
        "material_id": material_id,
        "analysis": analysis_result
    }
