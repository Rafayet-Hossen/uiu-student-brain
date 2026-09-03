import logging
from typing import Any, Dict, List, Optional
from google.genai import types
from google.genai.errors import APIError

from .client import FALLBACK_MODEL, PRIMARY_MODEL, get_gemini_client
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
    temperature: float = 0.3,
) -> Dict[str, Any]:
    """Helper that invokes Gemini API with automatic model fallback if 503 or overload occurs."""
    client = get_gemini_client()

    models_to_try = [PRIMARY_MODEL, FALLBACK_MODEL]

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
            raise ValueError("No parsed response returned by Gemini model.")
        except Exception as e:
            logger.warning(
                f"Gemini generation with {model_name} failed: {e}. Trying fallback..."
            )
            if model_name == models_to_try[-1]:
                # Last model also failed, re-raise exception
                raise e


def test_ai_connectivity() -> Dict[str, Any]:
    """Tests the Gemini API connection with a lightweight prompt."""
    client = get_gemini_client()
    for model_name in [PRIMARY_MODEL, FALLBACK_MODEL]:
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
            if model_name == FALLBACK_MODEL:
                raise e


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
        "Extract the core conceptual topics, produce a concise summary, detect difficulty, and extract key formulas or definitions."
    )
    if subject_hint:
        prompt += f" The course subject is: {subject_hint}."

    contents.append(prompt)

    return _call_gemini_structured(
        contents=contents,
        response_schema=TopicExtractionResult,
        system_instruction="You are an elite university teaching assistant analyzing course material.",
        temperature=0.2,
    )


def generate_topic_quiz(
    *,
    subject: str,
    topics: List[str],
    num_questions: int = 5,
    difficulty: str = "Intermediate",
) -> Dict[str, Any]:
    """Feature #8: Generates an academic multiple-choice test for concept assessment."""
    prompt = f"""
    Create an academic multiple-choice assessment for the course '{subject}'.
    Difficulty level: {difficulty}.
    Target number of questions: {num_questions}.
    Topics to cover: {', '.join(topics)}.

    Guidelines:
    - Exactly 4 plausible options per question.
    - Zero-based index for correct_answer_index (0, 1, 2, or 3).
    - Provide an insightful explanation for each answer.
    - Attach the specific sub-topic tag to each question.
    """

    return _call_gemini_structured(
        contents=prompt,
        response_schema=QuizGenerationResult,
        system_instruction="You are a rigorous university professor creating fair, high-yield diagnostic examination questions.",
        temperature=0.4,
    )


def analyze_quiz_weakness(
    *,
    subject: str,
    question_results: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """Feature #8: Analyzes student answers, scores performance, and identifies weak sub-topics."""
    total = len(question_results)
    correct_count = sum(1 for q in question_results if q.get("is_correct", False))
    accuracy = round((correct_count / total * 100), 1) if total > 0 else 0.0

    prompt = f"""
    Analyze the following student test results for the course '{subject}':
    Total Questions: {total}, Correct Answers: {correct_count}, Accuracy: {accuracy}%.

    Individual Question Breakdown:
    {question_results}

    Identify:
    1. Weak topics where the student struggled or failed.
    2. Mastered topics where the student showed strength.
    3. Actionable study recommendations to remediate the weak spots before exam time.
    """

    return _call_gemini_structured(
        contents=prompt,
        response_schema=WeakTopicAnalysis,
        temperature=0.3,
    )


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

    return _call_gemini_structured(
        contents=prompt,
        response_schema=RevisionPlanResult,
        temperature=0.3,
    )


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
            temperature=0.3,
        )
    except Exception as e:
        logger.error(f"AI Risk Assessment failed: {e}. Falling back to rule-based heuristic.")
        # Rule-based fallback if AI service is temporarily unreachable
        gpa_gap = max(0.0, target_gpa - current_gpa)
        is_low_hours = weekly_study_minutes < 180
        score = min(95.0, (gpa_gap * 40.0) + (30.0 if is_low_hours else 10.0))
        level = "High" if score > 60 else "Moderate" if score > 30 else "Low"
        return {
            "risk_level": level,
            "risk_score": round(score, 1),
            "risk_factors": [
                f"Target GPA gap of {round(gpa_gap, 2)} points",
                "Weekly study volume below recommended threshold" if is_low_hours else "Moderate study pace",
            ],
            "actionable_interventions": [
                "Increase daily study blocks by at least 30 minutes",
                "Schedule priority review for identified weak topics",
            ],
            "optimistic_outlook": "With disciplined adherence to your study plan, this target is attainable.",
        }
