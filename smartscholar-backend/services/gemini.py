import google.generativeai as genai
import os
import json
from dotenv import load_dotenv

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel('gemini-2.0-flash')

async def analyze_syllabus(raw_text: str):
    """
    Turns raw syllabus text into a structured JSON roadmap.
    Returns: total_topics, knowledge_graph (nodes and edges), and subtopics.
    Nodes match frontend structure: id, label, mastery, difficulty.
    """
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
    
    response = model.generate_content(prompt)
    try:
        content = response.text.strip().replace("```json", "").replace("```", "")
        return json.loads(content)
    except Exception as e:
        return {"error": "Failed to parse AI response", "details": str(e)}

async def generate_mcqs(topic: str, context: str = "", count: int = 5, difficulty: str = "medium"):
    """
    Generates MCQs for a given topic.
    """
    prompt = f"""
    Generate {count} high-quality Multiple Choice Questions for the topic: {topic}.
    Difficulty Level: {difficulty}
    Context from study material: {context}
    
    Return ONLY a JSON list of objects:
    [
      {{
        "question": "...",
        "options": ["...", "...", "...", "..."],
        "correct": index_of_correct_option_0_to_3,
        "explanation": "Brief explanation for students",
        "ai_reasoning": [
          "Step 1: Identified concept...",
          "Step 2: Evaluated options...",
          "Calculated difficulty weight..."
        ]
      }}
    ]
    """
    
    response = model.generate_content(prompt)
    try:
        content = response.text.strip().replace("```json", "").replace("```", "")
        return json.loads(content)
    except Exception as e:
        return {"error": "Failed to parse AI response", "details": str(e)}

async def generate_schedule(exam_date: str, daily_hours: float, weak_topics: list):
    """
    Builds a study calendar based on exam date and weak topics.
    """
    prompt = f"""
    Create a study schedule leading up to {exam_date}.
    The student can study {daily_hours} hours per day.
    Weak topics to prioritize: {", ".join(weak_topics)}
    
    Return ONLY a JSON list of study sessions:
    [
      {{
        "date": "YYYY-MM-DD",
        "topic": "Topic Name",
        "duration_hours": 2,
        "activity": "Review / Practice / Deep Dive"
      }}
    ]
    """
    
    response = model.generate_content(prompt)
    try:
        content = response.text.strip().replace("```json", "").replace("```", "")
        return json.loads(content)
    except Exception as e:
        return {"error": "Failed to generate schedule", "details": str(e)}

async def grade_handwritten(image_base64: str, question: str, topic: str):
    """
    Grades a handwritten answer image using Gemini Vision.
    """
    prompt = f"""
    You are a professor-level grader. Analyze the handwritten answer in the image for the following:
    Topic: {topic}
    Question: {question}
    
    Return ONLY a JSON object:
    {{
      "score": number, 
      "grade": "A|B|C|D|F", 
      "strengths": "...", 
      "improvements": "...", 
      "ai_reasoning": [
        "Identified handwriting...",
        "Checked against model formula...",
        "Verified units...",
        "Final score derivation..."
      ]
    }}
    """
    
    # Gemini 2.0 Flash handles vision natively in the same model
    contents = [
        {"mime_type": "image/jpeg", "data": image_base64},
        prompt
    ]
    
    response = model.generate_content(contents)
    try:
        content = response.text.strip().replace("```json", "").replace("```", "")
        return json.loads(content)
    except Exception as e:
        return {"error": "Failed to grade image", "details": str(e)}
