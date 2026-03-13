from fastapi import APIRouter, HTTPException, Query, Header
from pydantic import BaseModel
from services.supabase import get_supabase
from services.ai_logic import chat_with_tutor
from typing import Optional
import uuid

router = APIRouter(prefix="/ai", tags=["ai"])
db = get_supabase()


class ExplainRequest(BaseModel):
    topic: str
    question: str
    material_id: Optional[str] = None
    user_id: Optional[str] = None


def normalize_user_id(user_val: Optional[str]):
    if not user_val:
        return None
    try:
        uuid.UUID(user_val)
        return user_val
    except Exception:
        return str(uuid.uuid5(uuid.NAMESPACE_DNS, user_val))


@router.post("/explain")
async def explain_topic(req: ExplainRequest):
    """
    Explains a topic using the student's own uploaded notes as context.
    Implements semantic retrieval from study_materials raw_text.
    """
    try:
        context = ""

        # Fetch notes context from material
        if req.material_id:
            try:
                mat_res = db.table("study_materials").select("raw_text, subject").eq("id", req.material_id).single().execute()
                if mat_res.data and mat_res.data.get("raw_text"):
                    raw = mat_res.data["raw_text"]
                    # Simple relevance: find paragraph containing topic keywords
                    topic_lower = req.topic.lower()
                    paragraphs = raw.split("\n\n")
                    relevant = [p for p in paragraphs if topic_lower in p.lower()]
                    context = "\n\n".join(relevant[:3]) if relevant else raw[:2000]
            except Exception as ctx_err:
                print(f"Context retrieval failed: {ctx_err}")

        prompt = f"""The student is studying '{req.topic}' and has this question: {req.question}

Based on the following notes context, provide a clear explanation with a real-world example and analogy:
Context: {context if context else 'No specific notes available. Provide a general explanation.'}

Return JSON with: {{
  "explanation": "...",
  "example": "...",
  "analogy": "..."
}}"""

        result = await chat_with_tutor(prompt, context)
        
        # If the response has "response" key (from tutor), parse it
        if "response" in result:
            return {"explanation": result["response"], "example": "", "analogy": ""}
        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
