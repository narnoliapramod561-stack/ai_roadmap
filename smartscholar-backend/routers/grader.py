from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from services.gemini import grade_handwritten
import base64

router = APIRouter(prefix="/grader", tags=["grader"])

@router.post("/handwritten")
async def handwritten_grader(
    file: UploadFile = File(...),
    question: str = Form(...),
    topic: str = Form(...)
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    content = await file.read()
    image_base64 = base64.b64encode(content).decode("utf-8")
    
    result = await grade_handwritten(image_base64, question, topic)
    
    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])
        
    return result
