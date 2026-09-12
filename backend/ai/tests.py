from unittest.mock import MagicMock, patch
from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from .schemas import (
    AcademicRiskAssessmentResult,
    QuizGenerationResult,
    RevisionPlanResult,
    TopicExtractionResult,
    WeakTopicAnalysis,
)

User = get_user_model()


class AIServiceUnitTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email="ai.tester@example.com",
            password="Password123!",
            full_name="AI Tester",
        )
        self.client.force_authenticate(user=self.user)

    def test_schemas_validation(self):
        """Test that Pydantic models validate correctly."""
        topic_data = {
            "title": "Binary Trees & BST",
            "summary": "Covers tree traversals, balancing, and search complexity.",
            "difficulty": "Intermediate",
            "key_topics": ["Tree Traversal", "AVL Trees", "BST Invariants"],
            "key_formulas_or_definitions": ["O(log n) average search time"],
        }
        topic_result = TopicExtractionResult(**topic_data)
        self.assertEqual(topic_result.title, "Binary Trees & BST")
        self.assertEqual(len(topic_result.key_topics), 3)

        quiz_data = {
            "quiz_title": "DSA Trees Quiz",
            "subject": "Computer Science",
            "questions": [
                {
                    "question": "What is the time complexity of searching a balanced BST?",
                    "options": ["O(1)", "O(log n)", "O(n)", "O(n^2)"],
                    "correct_answer_index": 1,
                    "explanation": "Balanced BST splits the search space in half at each node.",
                    "topic_tag": "Binary Search Trees",
                }
            ],
        }
        quiz_result = QuizGenerationResult(**quiz_data)
        self.assertEqual(len(quiz_result.questions), 1)
        self.assertEqual(quiz_result.questions[0].correct_answer_index, 1)

    @patch("ai.services.get_gemini_client")
    def test_ai_health_check_endpoint(self, mock_get_client):
        """Test GET /api/ai/health/ endpoint."""
        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.text = "StudentBrain AI Service is operational."
        mock_client.models.generate_content.return_value = mock_response
        mock_get_client.return_value = mock_client

        url = reverse("ai-health-check")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "connected")
        self.assertIn("operational", response.data["message"])

    @patch("ai.services._call_gemini_structured")
    def test_quiz_generate_endpoint(self, mock_call):
        """Test POST /api/ai/quiz/generate/ endpoint."""
        mock_call.return_value = {
            "quiz_title": "Organic Reactions",
            "subject": "Chemistry",
            "questions": [
                {
                    "question": "What is an electrophile?",
                    "options": ["Electron lover", "Proton donor", "Neutral molecule", "Solvent"],
                    "correct_answer_index": 0,
                    "explanation": "Electrophiles accept electrons.",
                    "topic_tag": "Electrophiles",
                }
            ],
        }

        url = reverse("ai-quiz-generate")
        payload = {
            "subject": "Chemistry",
            "topics": ["Electrophiles", "Nucleophiles"],
            "num_questions": 1,
            "difficulty": "Beginner",
        }
        response = self.client.post(url, data=payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["subject"], "Chemistry")
        self.assertEqual(len(response.data["questions"]), 1)

    @patch("ai.services._call_gemini_structured")
    def test_risk_assessment_endpoint(self, mock_call):
        """Test POST /api/ai/risk-assessment/ endpoint."""
        mock_call.return_value = {
            "risk_level": "Low",
            "risk_score": 15.0,
            "risk_factors": ["Minor GPA gap"],
            "actionable_interventions": ["Maintain current 5-day study streak"],
            "optimistic_outlook": "Target GPA is well within reach.",
        }

        url = reverse("ai-risk-assessment")
        payload = {
            "subject": "Mathematics",
            "current_gpa": 3.8,
            "target_gpa": 3.9,
            "completed_credits": 80,
            "total_credits": 120,
            "weekly_study_minutes": 300,
            "current_streak": 7,
            "weak_topics": ["Fourier Transform"],
        }
        response = self.client.post(url, data=payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["risk_level"], "Low")

    @patch("ai.services._call_gemini_structured")
    def test_quiz_evaluation_endpoint(self, mock_call):
        """Test POST /api/ai/quiz/evaluate/ endpoint."""
        mock_call.return_value = {
            "accuracy_percentage": 50.0,
            "performance_tier": "Needs Review",
            "weak_topics": ["Electrophiles"],
            "mastered_topics": ["Nucleophiles"],
            "study_recommendations": ["Review chapter 4 on organic mechanisms."],
        }

        url = reverse("ai-quiz-evaluate")
        payload = {
            "subject": "Chemistry",
            "question_results": [
                {
                    "question": "What is an electrophile?",
                    "selected_option": "Proton donor",
                    "correct_option": "Electron lover",
                    "is_correct": False,
                    "topic": "Electrophiles",
                },
                {
                    "question": "What is a nucleophile?",
                    "selected_option": "Electron donor",
                    "correct_option": "Electron donor",
                    "is_correct": True,
                    "topic": "Nucleophiles",
                },
            ],
        }
        response = self.client.post(url, data=payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["accuracy_percentage"], 50.0)
        self.assertIn("Electrophiles", response.data["weak_topics"])


