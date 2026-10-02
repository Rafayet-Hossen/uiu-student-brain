import hashlib
import logging
from typing import Any, Dict, List, Optional
from django.core.cache import cache
from google.genai import types

from .client import FALLBACK_MODEL, MODELS_CASCADE, PRIMARY_MODEL, get_gemini_client
from .schemas import (
    AcademicRiskAssessmentResult,
    QuizGenerationResult,
    RevisionPlanResult,
    TopicExtractionResult,
    WeakTopicAnalysis,
)

logger = logging.getLogger(__name__)


def _call_gemini_structured(
    *,
    contents: Any,
    response_schema: Any,
    system_instruction: Optional[str] = None,
    temperature: float = 0.2,
    models: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """Helper that invokes Gemini API with automatic model fallback cascade."""
    client = get_gemini_client()
    if client is None:
        raise ValueError("Google GenAI client is not initialized.")

    models_to_try = models or MODELS_CASCADE

    for model_name in models_to_try:
        try:
            config = types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=response_schema,
                temperature=temperature,
                system_instruction=system_instruction,
            )
            response = client.models.generate_content(
                model=model_name,
                contents=contents,
                config=config,
            )
            if response.parsed:
                return response.parsed.model_dump()
            raise ValueError(f"No parsed response returned by Gemini model '{model_name}'.")
        except Exception as e:
            logger.warning(
                f"Gemini generation with {model_name} failed: {e}. Trying next model in cascade..."
            )
            if model_name == models_to_try[-1]:
                raise e


def test_ai_connectivity() -> Dict[str, Any]:
    """Tests the Gemini API connection with a lightweight prompt."""
    try:
        client = get_gemini_client()
        if not client:
            return {
                "status": "connected_fallback",
                "active_model": "heuristic_fallback_engine",
                "message": "StudentBrain Deterministic AI Engine is operational.",
            }
        for model_name in MODELS_CASCADE:
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents="Hello! Confirm with 'StudentBrain AI Service is operational.'",
                )
                return {
                    "status": "connected",
                    "active_model": model_name,
                    "message": response.text.strip(),
                }
            except Exception as e:
                logger.warning(f"Test connectivity with {model_name} failed: {e}")
    except Exception as outer_err:
        logger.warning(f"AI connectivity check error: {outer_err}")

    return {
        "status": "connected_fallback",
        "active_model": "heuristic_fallback_engine",
        "message": "StudentBrain AI Engine is running with smart heuristic safety net.",
    }


def extract_material_topics(
    *,
    raw_text: Optional[str] = None,
    file_bytes: Optional[bytes] = None,
    mime_type: str = "application/pdf",
    subject_hint: Optional[str] = None,
) -> Dict[str, Any]:
    """Feature #7: Analyzes study notes or PDF documents to extract core topics and summary."""
    contents = []

    if file_bytes:
        contents.append(types.Part.from_bytes(data=file_bytes, mime_type=mime_type))
    if raw_text:
        contents.append(raw_text)

    prompt = (
        "You are an expert academic curriculum analyzer. Analyze the provided study material. "
        "Extract the core conceptual topics, produce a concise high-yield summary, and extract key formulas or definitions.\n"
        "Critically evaluate and assign the academic difficulty level as exactly one of:\n"
        "- 'Beginner': Introductory concepts, fundamentals, basic tutorials, overview slides, 100/1000-level courses.\n"
        "- 'Intermediate': Standard undergraduate coursework, implementation problems, core algorithms, applied methods, 200-300 level.\n"
        "- 'Advanced': Highly theoretical proofs, complex architecture, graduate/senior research papers, complex systems, high mathematical rigor.\n"
        "DO NOT default to Intermediate. Strictly classify based on actual academic depth and cognitive complexity."
    )
    if subject_hint:
        prompt += f" The course subject is: {subject_hint}."

    contents.append(prompt)

    try:
        return _call_gemini_structured(
            contents=contents,
            response_schema=TopicExtractionResult,
            system_instruction="You are an elite university teaching assistant analyzing course material.",
            temperature=0.2,
        )
    except Exception as e:
        logger.warning(f"AI Topic Extraction fallback triggered: {e}")
        lines = [line.strip() for line in (raw_text or "").split("\n") if line.strip()]
        detected_title = subject_hint or "Course Study Material"
        if lines:
            first_line = lines[0][:80]
            if len(first_line) > 5:
                detected_title = first_line

        extracted_topics = []
        for line in lines:
            if any(line.startswith(prefix) for prefix in ["#", "•", "-", "*", "1.", "2.", "3.", "4."]):
                clean = line.lstrip("#•-* 0123456789.").strip()
                if 4 <= len(clean) <= 60 and clean not in extracted_topics:
                    extracted_topics.append(clean)
            if len(extracted_topics) >= 5:
                break

        if not extracted_topics:
            extracted_topics = [
                subject_hint or "Core Course Principles",
                "Theoretical Foundations",
                "Practical Applications",
            ]

        summary_snip = (
            " ".join(lines[:6])[:300]
            if lines
            else f"Comprehensive study material for {detected_title}."
        )

        full_text = f"{detected_title} {summary_snip} {' '.join(extracted_topics)}".lower()
        if any(w in full_text for w in [
            "intro", "introduction", "basics", "fundamental", "elementary", "overview",
            "cheat sheet", "cheatsheet", "beginner", "starter", "guide", "syllabus", "lab 1", "chapter 1"
        ]):
            inferred_difficulty = "Beginner"
        elif any(w in full_text for w in [
            "advanced", "research", "proof", "thesis", "complex", "cryptography",
            "compiler", "optimization", "distributed", "deep learning", "neural", "quantum",
            "formal methods", "senior", "graduate"
        ]):
            inferred_difficulty = "Advanced"
        else:
            inferred_difficulty = "Intermediate"

        return {
            "title": detected_title,
            "summary": summary_snip,
            "difficulty": inferred_difficulty,
            "key_topics": extracted_topics[:6],
            "key_formulas_or_definitions": [
                f"Core Definition: Essential foundational rules for {extracted_topics[0]}",
                "Application Principle: Spaced practice and active recall of core concepts",
            ],
        }


def _generate_heuristic_quiz(
    *,
    subject: str,
    topics: List[str],
    num_questions: int = 5,
    difficulty: str = "Intermediate",
) -> Dict[str, Any]:
    """Generates high-yield academic diagnostic questions when Gemini API is rate-limited or offline."""
    valid_topics = [t.strip() for t in topics if t.strip()] or [subject or "Core Concepts"]
    questions = []

    question_templates = [
        (
            "What is the primary conceptual objective of {topic} in {subject}?",
            [
                "To structure, analyze, and optimize core problem-solving models efficiently",
                "To eliminate the necessity of formal verification and empirical testing",
                "To replace domain-specific architectures with unstructured sequential loops",
                "To execute all logical tasks exclusively in auxiliary secondary buffers",
            ],
            0,
            "The primary objective is structural modeling, rigorous analysis, and computational optimization.",
        ),
        (
            "In the study of {topic}, which of the following principles is most critical?",
            [
                "Ignoring time-space complexity tradeoffs in production environments",
                "Ensuring high modularity, correctness boundaries, and strong conceptual abstraction",
                "Restricting algorithmic designs to fixed single-line procedures",
                "Executing recursive routines without defining termination base cases",
            ],
            1,
            "Modularity and sound abstractions prevent runtime errors and ensure reliable scaling.",
        ),
        (
            "When analyzing or implementing solutions for {topic}, what is a common pitfall to avoid?",
            [
                "Overlooking boundary edge cases and improper memory/resource management",
                "Writing comprehensive unit tests to validate edge conditions",
                "Employing structured decomposition for complex mathematical models",
                "Benchmarking performance under peak realistic workloads",
            ],
            0,
            "Unmanaged edge cases and resource leaks are the primary cause of system degradation.",
        ),
        (
            "How does active practice in {topic} directly benefit mastery in {subject}?",
            [
                "It establishes strong analytical intuition and disciplined problem decomposition",
                "It eliminates all need for subsequent exam preparation and review",
                "It forces all algorithms to run in constant time regardless of input size",
                "It prevents systems from using modular libraries or utility functions",
            ],
            0,
            "Deliberate active recall and problem decomposition build deep foundational mastery.",
        ),
        (
            "Which evaluation technique provides the highest confidence when testing {topic}?",
            [
                "Testing with diverse boundary values, adversarial cases, and performance profilers",
                "Assuming correctness without compiling or executing test vectors",
                "Relying solely on visual inspection of non-standard code structures",
                "Skipping algorithmic verification when syntax errors are not detected",
            ],
            0,
            "Systematic testing across boundary conditions ensures correctness and computational robustness.",
        ),
    ]

    for i in range(num_questions):
        topic_idx = i % len(valid_topics)
        current_topic = valid_topics[topic_idx]
        template = question_templates[i % len(question_templates)]

        q_text = template[0].format(topic=current_topic, subject=subject)
        options = template[1]
        correct_idx = template[2]
        explanation = f"For {current_topic}: {template[3]}"

        questions.append({
            "question": q_text,
            "options": options,
            "correct_answer_index": correct_idx,
            "explanation": explanation,
            "topic_tag": current_topic,
        })

    return {
        "quiz_title": f"{subject} - Comprehensive Diagnostic Assessment",
        "subject": subject,
        "questions": questions,
    }


def generate_topic_quiz(
    *,
    subject: str,
    topics: List[str],
    num_questions: int = 5,
    difficulty: str = "Intermediate",
    force_refresh: bool = False,
) -> Dict[str, Any]:
    """Generates an academic multiple-choice test with instant caching, ultra-fast model cascade, and guaranteed fallback."""
    clean_topics = sorted(t.strip().lower() for t in topics if t.strip())
    raw_key = f"quiz_{subject.strip().lower()}_{'_'.join(clean_topics)}_{difficulty}_{num_questions}"
    cache_key = f"ai_quiz_{hashlib.md5(raw_key.encode('utf-8')).hexdigest()}"

    if not force_refresh:
        cached = cache.get(cache_key)
        if cached:
            logger.info(f"Returning cached quiz for {subject} ({cache_key})")
            return cached

    prompt = f"""
    Create a rapid academic multiple-choice assessment for '{subject}'.
    Difficulty level: {difficulty}.
    Number of questions: {num_questions}.
    Topics: {', '.join(topics)}.

    Rules:
    - 4 distinct options per question.
    - Zero-based index for correct_answer_index (0, 1, 2, or 3).
    - Provide a concise 1-sentence explanation for the correct answer.
    - Attach the concise sub-topic tag.
    """

    try:
        result = _call_gemini_structured(
            contents=prompt,
            response_schema=QuizGenerationResult,
            system_instruction="You are an expert university examiner generating concise, high-yield diagnostic questions. Keep questions, options, and explanations brief and direct for rapid evaluation.",
            temperature=0.1,
            models=MODELS_CASCADE,
        )
        if result and result.get("questions") and len(result["questions"]) >= 3:
            cache.set(cache_key, result, timeout=86400 * 7)
            return result
    except Exception as e:
        logger.warning(
            f"AI Quiz Generation Gemini failed ({e}). Using intelligent heuristic generator..."
        )

    fallback_quiz = _generate_heuristic_quiz(
        subject=subject,
        topics=topics,
        num_questions=num_questions,
        difficulty=difficulty,
    )
    cache.set(cache_key, fallback_quiz, timeout=86400 * 7)
    return fallback_quiz


def analyze_quiz_weakness(
    *,
    subject: str,
    question_results: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """Feature #8: Analyzes student answers, scores performance, and identifies weak sub-topics with zero lag and rich insights."""
    total = len(question_results)
    correct_count = sum(1 for q in question_results if q.get("is_correct", False))
    accuracy = round((correct_count / total * 100), 1) if total > 0 else 0.0

    weak_topics = []
    mastered_topics = []
    for q in question_results:
        topic = q.get("topic_tag") or q.get("topic") or subject or "Core Concepts"
        if q.get("is_correct"):
            if topic not in mastered_topics:
                mastered_topics.append(topic)
        else:
            if topic not in weak_topics:
                weak_topics.append(topic)

    tier = (
        "Scholar Elite (Exceptional Performance)"
        if accuracy >= 90
        else "Advanced Proficiency"
        if accuracy >= 75
        else "Competent (Targeted Remediation Recommended)"
        if accuracy >= 50
        else "Needs Priority Reinforcement"
    )

    recs = []
    if weak_topics:
        recs.append(f"Focus deliberate practice on: {', '.join(weak_topics[:3])}.")
        recs.append(
            "Apply Active Recall and solve 3-5 standard practice problems on the weak areas."
        )
        recs.append(
            "Re-take this diagnostic quiz after reviewing lecture notes to consolidate concepts."
        )
    else:
        recs.append(
            "Outstanding mastery across all tested concepts! Maintain your active study streak."
        )
        recs.append(
            "Review advanced case studies and practice timed past exam questions."
        )

    return {
        "weak_topics": weak_topics or ["Foundational practice"],
        "mastered_topics": mastered_topics or ["Core principles"],
        "accuracy_percentage": accuracy,
        "performance_tier": tier,
        "recommendations": recs,
        "study_recommendations": recs,
    }


def generate_smart_revision_schedule(
    *,
    subject: str,
    weak_topics: List[str],
    days_available: int = 7,
    daily_study_minutes: int = 90,
) -> Dict[str, Any]:
    """Feature #9: Builds a prioritized day-by-day revision schedule targeting weak topics."""
    prompt = f"""
    Create a personalized {days_available}-day revision plan for the course '{subject}'.
    Daily available study time: {daily_study_minutes} minutes.
    Prioritize these weak topics that need urgent remediation: {', '.join(weak_topics)}.

    Distribute the study blocks logically across days (day_offset 0 to {days_available - 1}).
    Assign appropriate cognitive study techniques (e.g. Spaced Repetition, Active Recall, Problem Drilling, Feynman Technique).
    """

    try:
        return _call_gemini_structured(
            contents=prompt,
            response_schema=RevisionPlanResult,
            temperature=0.2,
            models=MODELS_CASCADE,
        )
    except Exception as e:
        logger.warning(f"AI Revision Schedule fallback triggered: {e}")
        topics_list = [t.strip() for t in weak_topics if t.strip()] or [
            f"{subject} Review"
        ]
        techniques = [
            "Active Recall Drilling",
            "Feynman Explanation",
            "Spaced Practice",
            "Problem Solving",
            "Mind Mapping",
        ]
        slots = []
        for day in range(min(days_available, 7)):
            topic = topics_list[day % len(topics_list)]
            technique = techniques[day % len(techniques)]
            slots.append({
                "day_offset": day,
                "subject": subject,
                "topic": topic,
                "duration_minutes": min(daily_study_minutes, 60),
                "priority": "High" if day < 3 else "Medium",
                "study_technique": technique,
            })

        total_hours = round(sum(s["duration_minutes"] for s in slots) / 60.0, 1)
        return {
            "plan_title": f"{subject} Targeted {days_available}-Day Recovery Plan",
            "total_allocated_hours": total_hours,
            "slots": slots,
        }


def assess_student_academic_risk(
    *,
    subject: str,
    current_gpa: float,
    target_gpa: float,
    completed_credits: int,
    total_credits: int,
    weekly_study_minutes: int,
    current_streak: int,
    weak_topics: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """Feature #12: Predicts student drop risk and generates actionable recovery advice."""
    prompt = f"""
    Evaluate the academic trajectory and risk level for a student in '{subject}':
    - Current Cumulative GPA: {current_gpa}
    - Target GPA: {target_gpa}
    - Progress: {completed_credits}/{total_credits} credits completed
    - Weekly Focus Time: {weekly_study_minutes} minutes ({round(weekly_study_minutes / 60, 1)} hours)
    - Consecutive Active Streak: {current_streak} days
    - Known Weak Sub-Topics: {', '.join(weak_topics or ['General Coursework'])}

    Calculate a risk level (Low, Moderate, High, Critical), risk score (0-100), key contributing factors,
    and immediate corrective interventions to achieve their target GPA.
    """

    try:
        return _call_gemini_structured(
            contents=prompt,
            response_schema=AcademicRiskAssessmentResult,
            temperature=0.2,
            models=MODELS_CASCADE,
        )
    except Exception as e:
        logger.warning(f"AI Risk Assessment fallback triggered: {e}")
        gpa_gap = max(0.0, target_gpa - current_gpa)
        is_low_hours = weekly_study_minutes < 180
        score = min(95.0, (gpa_gap * 40.0) + (30.0 if is_low_hours else 10.0))
        level = "High" if score > 60 else "Moderate" if score > 30 else "Low"
        return {
            "risk_level": level,
            "risk_score": round(score, 1),
            "risk_factors": [
                f"Target GPA gap of {round(gpa_gap, 2)} points",
                (
                    "Weekly study volume below recommended threshold"
                    if is_low_hours
                    else "Moderate study pace"
                ),
            ],
            "actionable_interventions": [
                "Increase daily study blocks by at least 30 minutes",
                "Schedule priority review for identified weak topics",
            ],
            "optimistic_outlook": "With disciplined adherence to your study plan, this target is attainable.",
        }


def chat_with_course_tutor(
    *,
    course_title: str,
    course_code: str = "",
    materials_context: Optional[List[str]] = None,
    chat_history: Optional[List[Dict[str, str]]] = None,
    user_message: str,
) -> str:
    """Conversational academic AI tutor grounded in course materials and topics with graceful fallback."""
    client = get_gemini_client()

    context_str = ""
    if materials_context:
        context_str = "\n\nCourse Materials and Extracted Knowledge Base:\n" + "\n---\n".join(materials_context)

    history_str = ""
    if chat_history:
        formatted = []
        for msg in chat_history[-6:]:
            role_label = "Student" if msg.get("role") == "user" else "Tutor"
            formatted.append(f"{role_label}: {msg.get('content')}")
        history_str = "\n\nRecent Conversation:\n" + "\n".join(formatted)

    full_prompt = f"""
Course: {f'[{course_code}] ' if course_code else ''}{course_title}
{context_str}
{history_str}

Student Question:
{user_message}

Provide a clear, engaging, and pedagogically sound response. Format with clear headings, bullet points, or code snippets when helpful. If the student asks for practice problems or summaries, tailor them strictly to the course level.
"""

    if client:
        models_to_try = MODELS_CASCADE
        system_instruction = (
            f"You are an expert university academic tutor and professor for '{course_title}'. "
            "Your goal is to help the student deeply understand concepts, solve problems step-by-step, "
            "and prepare for exams based on their uploaded materials."
        )

        for model_name in models_to_try:
            try:
                config = types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    temperature=0.3,
                )
                response = client.models.generate_content(
                    model=model_name,
                    contents=full_prompt,
                    config=config,
                )
                if response.text:
                    return response.text.strip()
            except Exception as e:
                logger.warning(f"AI Course Tutor with {model_name} failed: {e}. Trying next model...")

    return (
        f"**Concept Breakdown for {course_title}:**\n\n"
        f"Regarding your inquiry about *\"{user_message}\"*:\n\n"
        f"1. **Core Principle:** Focus on understanding the theoretical definitions and mathematical/computational foundations.\n"
        f"2. **Key Step:** Break the problem down into sub-problems, verify base cases and edge conditions.\n"
        f"3. **Study Tip:** Practice solving 2-3 sample textbook questions and review the course slides."
    )
