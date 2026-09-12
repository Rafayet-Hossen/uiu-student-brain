from django.urls import path
from .views import (
    AIHealthCheckView,
    QuizEvaluationView,
    QuizGenerationView,
    RiskAssessmentView,
    TopicExtractionView,
)

urlpatterns = [
    path("health/", AIHealthCheckView.as_view(), name="ai-health-check"),
    path("extract-topics/", TopicExtractionView.as_view(), name="ai-extract-topics"),
    path("quiz/generate/", QuizGenerationView.as_view(), name="ai-quiz-generate"),
    path("quiz/evaluate/", QuizEvaluationView.as_view(), name="ai-quiz-evaluate"),
    path("risk-assessment/", RiskAssessmentView.as_view(), name="ai-risk-assessment"),
]

