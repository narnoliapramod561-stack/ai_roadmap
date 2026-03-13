from groq import Groq
import os
import json
import asyncio
from dotenv import load_dotenv

load_dotenv(override=True)

client = Groq(api_key=os.getenv("GROQ_API_KEY"))
MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
VISION_MODEL = os.getenv("GROQ_VISION_MODEL", "meta-llama/llama-4-scout-17b-16e-instruct")

async def call_groq_json(prompt: str, system_message: str = "You are a helpful assistant that outputs only valid JSON."):
    """
    Helper to get structured JSON from Groq.
    """
    try:
        completion = await asyncio.to_thread(
            client.chat.completions.create,
            model=MODEL,
            messages=[
                {"role": "system", "content": system_message},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"}
        )
        return json.loads(completion.choices[0].message.content)
    except Exception as e:
        error_msg = str(e)
        if "429" in error_msg or "rate_limit" in error_msg.lower():
            return {"error": "Groq API Rate Limit", "details": "Please try again later."}
        return {"error": "AI Analysis Failed", "details": error_msg}

async def analyze_syllabus(raw_text: str):
    prompt = f"""
    Analyze the following raw syllabus text and extract a structured knowledge roadmap.
    
    Return ONLY a JSON object with this exact structure:
    {{
      "total_topics": number,
      "knowledge_graph": {{
        "nodes": [
          {{ "id": "1", "label": "Topic Name", "mastery": 0, "difficulty": "easy|medium|hard" }},
          ...
        ],
        "edges": [
          {{ "id": "e1-2", "source": "1", "target": "2" }},
          ...
        ]
      }},
      "subtopics": {{
        "Topic Name": ["Subtopic 1", "Subtopic 2", ...]
      }}
    }}
    
    Syllabus Text:
    {raw_text}
    """
    return await call_groq_json(prompt)

async def generate_mcqs(topic: str, context: str = "", count: int = 5, difficulty: str = "medium"):
    system_msg = "You are an expert educator. You MUST output ONLY a valid JSON object. Do not include any text before or after the JSON."
    prompt = f"""
    Generate {count} high-quality Multiple Choice Questions for the topic: {topic}.
    Difficulty Level: {difficulty}
    Context: {context}
    
    The output MUST be a JSON object with this exact schema:
    {{
      "questions": [
        {{
          "question": "The question text",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correct": 0,
          "explanation": "Why this is correct",
          "ai_reasoning": ["Key concept 1", "Key concept 2"]
        }}
      ]
    }}
    
    Requirement: 
    - Exactly 4 options per question.
    - 'correct' must be an integer index (0-3).
    - Output ONLY the JSON.
    """
    data = await call_groq_json(prompt, system_msg)
    if "error" in data:
        return data
    return data.get("questions", data)

from datetime import datetime

async def generate_schedule(exam_date: str, timeframe: str = "daily", daily_hours: float = 4.0, weak_topics: list = [], study_intervals: list = [], syllabus_topics: list = [], past_completed_topics: list = []):
    """
    Generates a structured study schedule based on timeframes.
    Timeframe: daily | weekly | monthly
    """
    days_left = None
    if exam_date:
        try:
            target = datetime.strptime(exam_date, "%Y-%m-%d")
            today = datetime.now()
            days_left = (target - today).days
        except:
            pass

    intervals_context = ""
    if timeframe == "daily" and study_intervals:
        intervals_str = "\n".join([f"- {i['start']} to {i['end']}" for i in study_intervals])
        intervals_context = f"\nUser Preferences (Study only during these blocks):\n{intervals_str}"
    
    syllabus_context = ""
    if syllabus_topics:
        syllabus_context = f"\nFULL SYLLABUS CONTEXT ({len(syllabus_topics)} topics):\n- " + "\n- ".join(syllabus_topics[:50]) # Increased limit

    pacing_context = ""
    if days_left is not None:
        pacing_context = f"\nPACING CALCULATION:\n- Days remaining until exam: {days_left}\n- Total topics to cover: {len(syllabus_topics)}\n- Required topics per day: {round(len(syllabus_topics)/max(1, days_left), 1)}"

    past_context = ""
    if past_completed_topics:
        past_context = f"\nALREADY COMPLETED (DO NOT INCLUDE THESE):\n- " + "\n- ".join(past_completed_topics)

    prompt = f"""
    You are a 'Neural Pace-Aware Roadmap Architect'. Your goal is to map a student's ENTIRE syllabus to their remaining time.
    
    Context:
    - Timeframe Focus: {timeframe}
    - Target Exam Date: {exam_date}
    - Daily Study Capacity: {daily_hours} hours
    - Focus Areas (Weak Points): {", ".join(weak_topics) if weak_topics else "Review all core modules"}{intervals_context}{syllabus_context}{pacing_context}{past_context}
    
    Instructions for 'Full Syllabus Coverage':
    1. Look at the 'FULL SYLLABUS CONTEXT'. Do NOT ignore topics.
    2. Look at 'PACING CALCULATION'. If there are many topics and few days, increase the density of the roadmap.
    3. Look at 'ALREADY COMPLETED'. The user finished these previously. You MUST NOT include them in this new roadmap. Focus on what's left.
    4. You MUST use the specific names from the syllabus. No generic 'Review' or 'Study' titles. Use topic names like 'Gauss's Law' or 'Vector Calculus'.
    5. Each task title MUST include the suggested time slot (e.g., "[09:00 - 10:30] Quantum Mechanics: Schrodinger Equation").
    6. Provide 3-5 granular 'subtopics' for each task that exist within that master topic.
    7. For 'daily' timeframe: Give 4-6 specific tasks for TODAY that help the user stay on track with the pacing.
    
    Return ONLY a JSON object with this exact schema:
    {{
      "timeframe": "{timeframe}",
      "tasks": [
        {{
          "id": "uuid-v4-string",
          "title": "Specific Topic Title",
          "description": "Specific instructional step for this topic",
          "duration": "Duration in mins",
          "category": "Theory|Practice|Revision|Mock",
          "priority": "high|medium|low",
          "subtopics": ["Sub-detail 1", "Sub-detail 2", "Sub-detail 3"]
        }}
      ]
    }}
    """
    data = await call_groq_json(prompt)
    return data.get("tasks", [])

async def grade_handwritten(image_base64: str, question_context: str = "", topic: str = "General"):
    """
    Grades a handwritten answer image using Groq Vision.
    """
    system_prompt = "You are a versatile professor-level grader. You MUST output your evaluation in valid JSON format."
    user_prompt = f"""
    Analyze the handwritten answer in the provided image.
    
    Grading Context:
    - Provided Topic/Subject: {topic}
    - User Question/Context: {question_context}
    
    Instructions:
    1. Identify the actual topic and question being answered in the image. 
    2. If the user provided 'User Question/Context', use that to guide your evaluation.
    3. If the user context is missing or generic, infer the subject (Math, Science, Humanities, etc.) and specific question directly from the handwriting.
    4. Provide a fair, high-standard academic score (0-100).
    5. Be subject-agnostic. Do not default to Physics unless the image is clearly about Physics.
    
    Return ONLY a JSON object with this structure:
    {{
      "score": number (0-100), 
      "grade": "A|B|C|D|F", 
      "strengths": "What was done correctly?", 
      "improvements": "What needs correction or detail?", 
      "ai_reasoning": ["Analytical step 1", "Analytical step 2", "Analytical step 3"]
    }}
    """
    
    try:
        completion = await asyncio.to_thread(
            client.chat.completions.create,
            model=VISION_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": user_prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{image_base64}",
                            },
                        },
                    ],
                }
            ],
            response_format={"type": "json_object"}
        )
        content = completion.choices[0].message.content
        return json.loads(content)
    except Exception as e:
        print(f"Groq Vision Error: {e}")
        return {"error": "AI Grading Failed", "details": str(e)}

async def chat_with_tutor(message: str, context: str = ""):
    """
    General chat completion for the AI tutor using Groq.
    """
    system_prompt = "You are a helpful AI study tutor. Provide concise, accurate guidance based on the student's study materials."
    user_prompt = f"Context: {context}\nUser: {message}"
    
    try:
        completion = await asyncio.to_thread(
            client.chat.completions.create,
            model=MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ]
        )
        return {"response": completion.choices[0].message.content}
    except Exception as e:
        return {"error": "Chat failed", "details": str(e)}
