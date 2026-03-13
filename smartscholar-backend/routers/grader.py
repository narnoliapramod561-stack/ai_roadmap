from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from services.ai_logic import grade_handwritten
import base64

router = APIRouter(prefix="/grader", tags=["grader"])

@router.post("/handwritten")
async def handwritten_grader(
    file: UploadFile = File(...),
    question: str = Form(...),
    topic: str = Form(...)
):
    try:
        if not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        content = await file.read()
        image_base64 = base64.b64encode(content).decode("utf-8")
        
        try:
            result = await grade_handwritten(image_base64, question_context=question, topic=topic)
        except Exception as ai_err:
            print(f"Handwritten Grader AI Error: {ai_err}")
            result = {"error": "AI Grading Service Unavailable", "details": str(ai_err)}
        
        if "error" in result:
            # Instead of 500, return a success status with the error info 
            # so the frontend can display it nicely without Crashing
            return {
                "status": "partial_failure",
                "error": result["error"],
                "score": 0,
                "grade": "N/A",
                "strengths": "AI service encountered an issue.",
                "improvements": "Please try again in a few moments.",
                "ai_reasoning": ["Handwritten analysis failed at the AI layer."]
            }
            
        return result
    except HTTPException:
        raise
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "score": 0,
            "grade": "N/A",
            "strengths": "System error.",
            "improvements": "Contact support if this persists."
        }
