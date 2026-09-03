from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from . import services
from .serializers import (
    QuizGenerationRequestSerializer,
    RiskAssessmentRequestSerializer,
    TopicExtractionRequestSerializer,
)


class AIHealthCheckView(APIView):
    """GET /api/ai/health/ - Verifies Gemini API connectivity."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            data = services.test_ai_connectivity()
            return Response(data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"status": "error", "message": str(e)},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )


class TopicExtractionView(APIView):
    """POST /api/ai/extract-topics/ - Extracts topics and summaries from notes."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = TopicExtractionRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = services.extract_material_topics(
            raw_text=serializer.validated_data["text"],
            subject_hint=serializer.validated_data.get("subject_hint"),
        )
        return Response(data, status=status.HTTP_200_OK)


class QuizGenerationView(APIView):
    """POST /api/ai/quiz/generate/ - Generates an academic quiz using Gemini."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = QuizGenerationRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = services.generate_topic_quiz(
            subject=serializer.validated_data["subject"],
            topics=serializer.validated_data["topics"],
            num_questions=serializer.validated_data.get("num_questions", 5),
            difficulty=serializer.validated_data.get("difficulty", "Intermediate"),
        )
        return Response(data, status=status.HTTP_200_OK)


class RiskAssessmentView(APIView):
    """POST /api/ai/risk-assessment/ - Calculates academic drop risk with AI insights."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = RiskAssessmentRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = services.assess_student_academic_risk(
            subject=serializer.validated_data["subject"],
            current_gpa=serializer.validated_data["current_gpa"],
            target_gpa=serializer.validated_data["target_gpa"],
            completed_credits=serializer.validated_data["completed_credits"],
            total_credits=serializer.validated_data["total_credits"],
            weekly_study_minutes=serializer.validated_data.get("weekly_study_minutes", 0),
            current_streak=serializer.validated_data.get("current_streak", 0),
            weak_topics=serializer.validated_data.get("weak_topics", []),
        )
        return Response(data, status=status.HTTP_200_OK)
