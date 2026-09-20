from datetime import date, datetime, time, timedelta
from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from community.services import get_leaderboard
from materials.models import Course, Semester, StudyMaterial
from tracker.models import StudyGoal, StudySession
from tracker.services import (
    calculate_user_streaks,
    complete_study_session,
    expire_overdue_sessions,
    extend_study_session,
    get_user_rewards,
    start_study_session,
    submit_session_quiz,
)

User = get_user_model()


class ScheduledStudyTrackerTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="scholar@sust.edu",
            password="Password123!",
            full_name="Rafayet Hossen",
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

        self.semester = Semester.objects.create(
            user=self.user,
            name="Fall 2026",
            is_current=True,
        )
        self.course = Course.objects.create(
            user=self.user,
            semester=self.semester,
            title="Database Systems",
            code="CSE 333",
            color="#3b82f6",
        )
        self.material = StudyMaterial.objects.create(
            user=self.user,
            course=self.course,
            title="B+ Tree Indexing & Query Optimization",
            category="Lecture Note",
            material_type="document",
            key_topics=["B+ Trees", "Indexing", "Query Plan", "Join Algorithms"],
            difficulty_level="Intermediate",
        )
        self.goal = StudyGoal.objects.create(
            user=self.user,
            daily_goal_minutes=60,
        )

    def test_create_scheduled_session_with_material(self):
        tomorrow = date.today() + timedelta(days=1)
        session = StudySession.objects.create(
            user=self.user,
            course=self.course,
            material=self.material,
            subject="B+ Tree Indexing",
            session_date=tomorrow,
            start_time=time(10, 0),
            end_time=time(11, 0),
            duration_minutes=60,
            status="scheduled",
        )
        self.assertEqual(session.status, "scheduled")
        self.assertEqual(session.course, self.course)
        self.assertEqual(session.material, self.material)
        self.assertEqual(session.effective_duration_minutes, 0)  # Not completed yet

        # Streaks should not count scheduled sessions
        stats = calculate_user_streaks(user=self.user, reference_date=date.today())
        self.assertEqual(stats["total_sessions"], 0)
        self.assertEqual(stats["today_minutes"], 0)
        self.assertFalse(stats["daily_goal_achieved"])

    def test_auto_expire_overdue_sessions(self):
        yesterday = date.today() - timedelta(days=1)
        overdue_session = StudySession.objects.create(
            user=self.user,
            course=self.course,
            material=self.material,
            subject="Query Optimization",
            session_date=yesterday,
            start_time=time(9, 0),
            end_time=time(10, 0),
            duration_minutes=60,
            status="scheduled",
        )

        expired_count = expire_overdue_sessions(user=self.user)
        overdue_session.refresh_from_db()

        self.assertGreaterEqual(expired_count, 1)
        self.assertEqual(overdue_session.status, "missed")

        # Missed sessions give 0 minutes towards streak & goal
        stats = calculate_user_streaks(user=self.user)
        self.assertEqual(stats["total_sessions"], 0)
        self.assertEqual(stats["total_minutes"], 0)

    def test_session_lifecycle_start_complete_and_extend(self):
        today = date.today()
        session = StudySession.objects.create(
            user=self.user,
            course=self.course,
            material=self.material,
            subject="Database Indexing",
            session_date=today,
            start_time=time(23, 0),
            duration_minutes=45,
            status="scheduled",
        )

        # 1. Start Session
        start_study_session(session=session)
        session.refresh_from_db()
        self.assertEqual(session.status, "in_progress")
        self.assertIsNotNone(session.actual_started_at)

        # 2. Complete Session
        complete_study_session(session=session)
        session.refresh_from_db()
        self.assertEqual(session.status, "completed")
        self.assertIsNotNone(session.actual_completed_at)
        self.assertEqual(session.effective_duration_minutes, 45)

        # Streaks and goal should count 45 minutes
        stats = calculate_user_streaks(user=self.user, reference_date=today)
        self.assertEqual(stats["total_sessions"], 1)
        self.assertEqual(stats["today_minutes"], 45)
        self.assertFalse(stats["daily_goal_achieved"])  # 45 < 60

        # 3. Extend Session by 20 minutes (Total 65 min -> Goal Achieved!)
        extend_study_session(session=session, extra_minutes=20)
        session.refresh_from_db()
        self.assertEqual(session.extended_minutes, 20)
        self.assertEqual(session.effective_duration_minutes, 65)

        stats = calculate_user_streaks(user=self.user, reference_date=today)
        self.assertEqual(stats["today_minutes"], 65)
        self.assertTrue(stats["daily_goal_achieved"])

    def test_submit_session_quiz_and_weakness_diagnosis(self):
        today = date.today()
        session = StudySession.objects.create(
            user=self.user,
            course=self.course,
            material=self.material,
            subject="B+ Tree Indexing",
            session_date=today,
            duration_minutes=60,
            status="completed",
        )

        mock_answers = [
            {
                "question_index": 0,
                "question": "What is the fanout of a B+ Tree node?",
                "selected_option": "Number of child pointers",
                "correct_option": "Number of child pointers",
                "is_correct": True,
                "topic": "B+ Trees",
            },
            {
                "question_index": 1,
                "question": "Which join algorithm requires sorting?",
                "selected_option": "Nested Loop Join",
                "correct_option": "Sort-Merge Join",
                "is_correct": False,
                "topic": "Join Algorithms",
            },
        ]

        submit_session_quiz(session=session, question_results=mock_answers)
        session.refresh_from_db()

        self.assertTrue(session.quiz_taken)
        self.assertEqual(session.quiz_score, 1)
        self.assertEqual(session.quiz_accuracy, 50.0)
        self.assertIn("weak_topics", session.quiz_results)
        self.assertIn("mastered_topics", session.quiz_results)

    def test_api_endpoints_start_complete_extend(self):
        today = date.today()
        session = StudySession.objects.create(
            user=self.user,
            course=self.course,
            material=self.material,
            subject="Web APIs",
            session_date=today,
            duration_minutes=30,
            status="scheduled",
        )

        # Start API
        res_start = self.client.post(f"/api/tracker/sessions/{session.id}/start/")
        self.assertEqual(res_start.status_code, 200)
        self.assertEqual(res_start.data["status"], "in_progress")

        # Complete API
        res_comp = self.client.post(f"/api/tracker/sessions/{session.id}/complete/")
        self.assertEqual(res_comp.status_code, 200)
        self.assertEqual(res_comp.data["status"], "completed")

        # Extend API
        res_ext = self.client.post(
            f"/api/tracker/sessions/{session.id}/extend/",
            {"extra_minutes": 30},
            format="json",
        )
        self.assertEqual(res_ext.status_code, 200)
        self.assertEqual(res_ext.data["extended_minutes"], 30)
        self.assertEqual(res_ext.data["effective_duration_minutes"], 60)
