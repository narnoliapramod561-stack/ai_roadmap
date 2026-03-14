from groq import Groq
import os
import json
import asyncio
from dotenv import load_dotenv
from datetime import datetime

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
      "topics": [
        {{ "name": "Topic Name", "difficulty": "easy|medium|hard", "subtopics": ["Sub 1", "Sub 2"] }},
        ...
      ],
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
        "Topic Name": ["Subtopic 1", "Subtopic 2"]
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


async def generate_schedule(
    exam_date: str,
    timeframe: str = "daily",
    daily_hours: float = 4.0,
    weak_topics: list = [],
    study_intervals: list = [],
    syllabus_topics: list = [],
    past_completed_topics: list = [],
    learned_topics: list = [],         # Persistently marked as learned
    material_exam_dates: dict = {},     # { "Subject Name": "YYYY-MM-DD" }
    subject_names: list = []            # Fallback when no detailed topics are available
):
    """
    Generates a structured study schedule based on timeframes.
    Timeframe: daily | weekly | monthly

    learned_topics: topics the user permanently marked as done (persist across plan regens)
    material_exam_dates: per-subject exam dates for urgency/pacing context
    """
    today = datetime.now()

    # Compute primary exam days_left
    days_left = None
    if exam_date:
        try:
            target = datetime.strptime(exam_date, "%Y-%m-%d")
            days_left = max(0, (target - today).days)
        except:
            pass

    # Per-material urgency context
    material_dates_context = ""
    if material_exam_dates:
        lines = []
        for subj, edate in material_exam_dates.items():
            try:
                d = datetime.strptime(edate, "%Y-%m-%d")
                dl = max(0, (d - today).days)
                lines.append(f"  - {subj}: exam in {dl} days ({edate})")
            except:
                lines.append(f"  - {subj}: exam on {edate}")
        material_dates_context = "\nPER-SUBJECT EXAM DEADLINES (order by urgency — closest exam = highest priority):\n" + "\n".join(lines)

    intervals_context = ""
    if timeframe == "daily" and study_intervals:
        intervals_str = "\n".join([f"- {i['start']} to {i['end']}" for i in study_intervals])
        intervals_context = f"\nSTUDY TIME BLOCKS (schedule tasks only within these windows):\n{intervals_str}"

    # Hard guard — do NOT hallucinate topics when no syllabus is available
    if not syllabus_topics and not subject_names:
        print("WARNING: generate_schedule called with 0 syllabus topics and no subject names — returning empty")
        return []

    # If we have subject names but no topics, synthesize topic list from subjects
    if not syllabus_topics and subject_names:
        # Build a synthetic syllabus from subject names so the AI has something to work with
        # The AI prompt will instruct it to generate appropriate topics for these subjects
        syllabus_topics = subject_names
        print(f"No syllabus topics found — using {len(subject_names)} subject name(s) as syllabus context")

    using_subject_mode = (not syllabus_topics or syllabus_topics == subject_names) and len(subject_names) > 0
    syllabus_str = "\n- ".join(syllabus_topics[:80])
    if using_subject_mode:
        syllabus_context = f"\nSUBJECTS TO COVER (generate appropriate topics FOR each subject — do not add unrelated subjects):\n- {syllabus_str}"
    else:
        syllabus_context = f"\nFULL SYLLABUS TOPICS ({len(syllabus_topics)} topics — YOU MUST ONLY USE THESE):\n- {syllabus_str}"

    pacing_context = ""
    if days_left is not None:
        all_skipped = set(past_completed_topics) | set(learned_topics)
        remaining_count = len([t for t in syllabus_topics if t not in all_skipped]) if not using_subject_mode else "varies"
        topics_per_day = round(len(syllabus_topics) / max(1, days_left), 1) if not using_subject_mode else "varies"
        pacing_context = (
            f"\nPACING:"
            f"\n- Days until exam: {days_left}"
            f"\n- Target topics/day to finish on time: {topics_per_day}"
        )

    all_excluded = list(set(past_completed_topics) | set(learned_topics))
    past_context = ""
    if all_excluded:
        past_context = f"\nALREADY LEARNED — STRICTLY EXCLUDE THESE FROM THE PLAN:\n- " + "\n- ".join(all_excluded[:60])

    weak_context = ""
    if weak_topics:
        weak_context = f"\nWEAK AREAS (prioritize these — student struggles here):\n- " + "\n- ".join(weak_topics)

    if using_subject_mode:
        rules = """
    RULES (subject-name mode — no detailed syllabus provided):
    1. For each subject in the list, generate 4-8 realistic university-level topic names for that subject.
    2. Create study tasks covering those generated topics. Prioritize subjects with nearest exam dates.
    3. Each task title = a specific topic from that subject (e.g. "Arrays and Linked Lists" not just "Computer Science").
    4. Provide 2-3 granular subtopics per task.
    5. For 'daily': give 4-6 tasks. For 'weekly': 7 day-groups. For 'monthly': 4 week-groups.
    6. NEVER include any topic listed under ALREADY LEARNED."""
    else:
        rules = """
    STRICT RULES:
    1. ONLY use topic names from the "FULL SYLLABUS TOPICS" list above. Do NOT invent new topics.
    2. Do NOT add generic filler like "General Review", "Overview", or invented subjects.
    3. Each task title MUST be one of the exact topic names from the syllabus.
    4. Provide 2-4 granular subtopics per task specific to that topic's content.
    5. For 'daily': give 4-6 tasks covering the required topics/day from PACING.
    6. For 'weekly': distribute syllabus topics across 7 day-groups.
    7. For 'monthly': distribute across 4 week-groups.
    8. NEVER include any topic from the "ALREADY LEARNED" list — start from the NEXT unlearned topic.
    9. If per-subject exam dates are given, give higher priority (high priority field) to the subject with the nearest exam."""

    prompt = f"""
    You are a personalized study architect. Build a focused study plan.

    CONFIGURATION:
    - Timeframe: {timeframe}
    - Primary Exam Date: {exam_date}
    - Daily Study Hours: {daily_hours}
    {syllabus_context}{pacing_context}{material_dates_context}{past_context}{weak_context}{intervals_context}

    {rules}

    Return ONLY this exact JSON schema — no extra text:
    {{
      "timeframe": "{timeframe}",
      "tasks": [
        {{
          "id": "unique-id-string",
          "title": "Exact topic name from syllabus",
          "description": "What the student should focus on for this topic",
          "duration": "duration in minutes",
          "category": "Theory|Practice|Revision|Mock",
          "priority": "high|medium|low",
          "subtopics": ["Subtopic 1", "Subtopic 2", "Subtopic 3"]
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
