from typing import List, Optional
from pydantic import BaseModel, Field


# ============================================================
# FEATURE #7: MATERIAL UPLOAD & TOPIC EXTRACTION SCHEMAS
# ============================================================

class TopicExtractionResult(BaseModel):
    title: str = Field(description="Inferred or extracted academic title of the study material")
    summary: str = Field(description="A concise, high-yield academic summary of the content")
    difficulty: str = Field(description="Subject difficulty level: Beginner, Intermediate, or Advanced")
    key_topics: List[str] = Field(description="List of primary conceptual topics covered in the material")
    key_formulas_or_definitions: List[str] = Field(
        default_factory=list,
        description="Key formulas, definitions, or core principles extracted from the text"
    )


# ============================================================
# FEATURE #8: STUDY SESSION TEST & QUIZ SCHEMAS
# ============================================================

class QuizQuestion(BaseModel):
    question: str = Field(description="The multiple-choice question text")
    options: List[str] = Field(description="Exactly 4 distinct plausible answer choices")
    correct_answer_index: int = Field(description="Zero-based index (0, 1, 2, or 3) of the correct answer")
    explanation: str = Field(description="Detailed explanation of why the correct option is right and others are wrong")
    topic_tag: str = Field(description="Specific academic sub-topic this question evaluates")


class QuizGenerationResult(BaseModel):
    quiz_title: str = Field(description="Title of the generated assessment quiz")
    subject: str = Field(description="Course subject name")
    questions: List[QuizQuestion] = Field(description="List of multiple-choice questions")


class WeakTopicAnalysis(BaseModel):
    weak_topics: List[str] = Field(description="Sub-topics where the student answered questions incorrectly or struggled")
    mastered_topics: List[str] = Field(description="Sub-topics where the student demonstrated high proficiency")
    accuracy_percentage: float = Field(description="Overall quiz accuracy percentage (0 to 100)")
    recommendations: List[str] = Field(description="Actionable study recommendations focused on weak areas")


# ============================================================
# FEATURE #9: AI REVISION PLANNER SCHEMAS
# ============================================================

class RevisionPlanSlot(BaseModel):
    day_offset: int = Field(description="Days from today (0 = today, 1 = tomorrow, etc.)")
    subject: str = Field(description="Target course subject name")
    topic: str = Field(description="Weak topic or concept targeted for revision")
    duration_minutes: int = Field(description="Recommended study block duration in minutes (e.g. 45, 60, 90)")
    priority: str = Field(description="Revision urgency: High, Medium, or Low")
    study_technique: str = Field(description="Suggested technique, e.g., Feynman Technique, Active Recall, Problem Set")


class RevisionPlanResult(BaseModel):
    plan_title: str = Field(description="Title of the personalized revision schedule")
    total_allocated_hours: float = Field(description="Total planned hours across all revision slots")
    slots: List[RevisionPlanSlot] = Field(description="Day-by-day revision time blocks")


# ============================================================
# FEATURE #12: ACADEMIC RISK ASSESSMENT SCHEMAS
# ============================================================

class AcademicRiskAssessmentResult(BaseModel):
    risk_level: str = Field(description="Academic risk categorization: Low, Moderate, High, or Critical")
    risk_score: float = Field(description="Calculated risk score from 0.0 (safe) to 100.0 (extreme risk)")
    risk_factors: List[str] = Field(description="Key contributing reasons (e.g., target GPA gap, broken streaks)")
    actionable_interventions: List[str] = Field(description="Concrete corrective actions the student should take immediately")
    optimistic_outlook: str = Field(description="Positive and encouraging advisory note on recovery feasibility")
