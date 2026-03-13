from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.ai_logic import chat_with_tutor

router = APIRouter(prefix="/tutor", tags=["tutor"])

class ChatMessage(BaseModel):
    message: str
    context: str = ""

@router.post("/chat")
async def chat(chat: ChatMessage):
    result = await chat_with_tutor(chat.message, chat.context)
    if "error" in result:
        # Prevent 500 error, return partial failure message
        return {
            "response": f"AI Tutor is temporarily offline: {result.get('details', 'Unknown error')}",
            "error": result["error"]
        }
    return result
