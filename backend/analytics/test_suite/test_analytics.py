from datetime import date, timedelta
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User
from grades.models import GradePlan
from planner.models import Schedule
from tracker.models import StudySession
from analytics.services import get_analytics_dashboard_data


class AnalyticsDashboardTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="analyst@example.com",
            password="StrongPass123!",
            full_name="Analytics User",
        )

        login_response = self.client.post(
            reverse("login"),
            {
                "email": "analyst@example.com",
                "password": "StrongPass123!",
            },
        )
        self.access = login_response.data["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access}")

        self.dashboard_url = reverse("analytics-dashboard")

    def test_dashboard_with_no_data(self):
        response = self.client.get(self.dashboard_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["summary"]["total_study_minutes"], 0)
        self.assertEqual(response.data["summary"]["total_sessions"], 0)
        self.assertEqual(response.data["subject_distribution"], [])
        self.assertIsNone(response.data["gpa_summary"])
        self.assertEqual(len(response.data["weekly_trend"]), 7)

    def test_dashboard_aggregates_study_and_grades(self):
        today = date.today()

        # Create sessions
        StudySession.objects.create(
            user=self.user,
            subject="Algorithms",
            duration_minutes=120,
            session_date=today,
        )
        StudySession.objects.create(
            user=self.user,
            subject="Algorithms",
            duration_minutes=60,
            session_date=today - timedelta(days=1),
        )
        StudySession.objects.create(
            user=self.user,
            subject="Databases",
            duration_minutes=90,
            session_date=today,
        )

        # Create grade plan
        GradePlan.objects.create(
            user=self.user,
            name="CS Degree",
            current_gpa="3.20",
            target_gpa="3.60",
            completed_credits="60",
            total_credits="120",
        )

        # Create schedule
        Schedule.objects.create(
            user=self.user,
            subject="Algorithms",
            start_time="10:00",
            end_time="12:00",
            deadline=today + timedelta(days=10),
            days=["Monday", "Wednesday"],
        )

        response = self.client.get(self.dashboard_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        summary = response.data["summary"]
        self.assertEqual(summary["total_study_minutes"], 270)
        self.assertEqual(summary["total_sessions"], 3)
        self.assertEqual(summary["total_subjects"], 2)
        self.assertEqual(summary["active_schedules_count"], 1)

        # Subject distribution check
        distribution = response.data["subject_distribution"]
        self.assertEqual(len(distribution), 2)
        top = distribution[0]
        self.assertEqual(top["subject"], "Algorithms")
        self.assertEqual(top["minutes"], 180)
        self.assertAlmostEqual(top["percentage"], 66.7, places=1)

        # GPA summary check
        gpa = response.data["gpa_summary"]
        self.assertIsNotNone(gpa)
        self.assertEqual(gpa["target_gpa"], 3.60)
        self.assertEqual(gpa["percent_complete"], 50.0)
        self.assertTrue(gpa["possible"])

        # Schedule adherence check
        adherence = response.data["schedule_adherence"]
        self.assertEqual(adherence["adherence_rate"], 100.0)
        self.assertIn("Algorithms", adherence["covered_subjects_this_week"])

        # Insights check
        self.assertTrue(len(response.data["insights"]) >= 2)
