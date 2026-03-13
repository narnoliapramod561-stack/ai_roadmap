from fastapi import APIRouter
from pydantic import BaseModel
import google.generativeai as genai
import os

router = APIRouter(prefix="/tutor", tags=["tutor"])

class ChatMessage(BaseModel):
    message: str
    context: str = ""

@router.post("/chat")
async def chat_with_tutor(chat: ChatMessage):
    model = genai.GenerativeModel('gemini-2.0-flash')
    prompt = f"You are a helpful AI study tutor. Context: {chat.context}\nUser: {chat.message}"
    response = model.generate_content(prompt)
    return {"response": response.text}
