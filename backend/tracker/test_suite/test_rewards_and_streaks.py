from datetime import date, timedelta
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User
from tracker.models import StudySession
from tracker.services import calculate_user_streaks, get_user_rewards, update_user_goal


class RewardsAndStreaksTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="scholar@example.com",
            password="StrongPass123!",
            full_name="Scholar User",
        )

        login_response = self.client.post(
            reverse("login"),
            {
                "email": "scholar@example.com",
                "password": "StrongPass123!",
            },
        )
        self.access = login_response.data["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access}")

        self.streaks_url = reverse("tracker-streaks")
        self.rewards_url = reverse("tracker-rewards")
        self.goal_url = reverse("tracker-goal")

    def test_streak_calculation_active_streak(self):
        today = date.today()
        # 3 consecutive days including today
        StudySession.objects.create(user=self.user, subject="Math", duration_minutes=60, session_date=today)
        StudySession.objects.create(user=self.user, subject="Physics", duration_minutes=45, session_date=today - timedelta(days=1))
        StudySession.objects.create(user=self.user, subject="Chemistry", duration_minutes=50, session_date=today - timedelta(days=2))

        stats = calculate_user_streaks(user=self.user, reference_date=today)
        self.assertEqual(stats["current_streak"], 3)
        self.assertEqual(stats["longest_streak"], 3)
        self.assertEqual(stats["total_study_days"], 3)
        self.assertEqual(stats["total_minutes"], 155)
        self.assertEqual(stats["today_minutes"], 60)
        self.assertTrue(stats["studied_today"])
        self.assertTrue(stats["daily_goal_achieved"])  # default 60 min

    def test_streak_calculation_streak_alive_from_yesterday(self):
        today = date.today()
        # Studied yesterday and 2 days ago, but not today yet
        StudySession.objects.create(user=self.user, subject="Math", duration_minutes=40, session_date=today - timedelta(days=1))
        StudySession.objects.create(user=self.user, subject="Physics", duration_minutes=40, session_date=today - timedelta(days=2))

        stats = calculate_user_streaks(user=self.user, reference_date=today)
        self.assertEqual(stats["current_streak"], 2)
        self.assertEqual(stats["today_minutes"], 0)
        self.assertFalse(stats["studied_today"])

    def test_streak_breaks_after_missed_day(self):
        today = date.today()
        # Studied 3 days ago and 4 days ago, but missed yesterday and today
        StudySession.objects.create(user=self.user, subject="Math", duration_minutes=60, session_date=today - timedelta(days=3))
        StudySession.objects.create(user=self.user, subject="Physics", duration_minutes=60, session_date=today - timedelta(days=4))

        stats = calculate_user_streaks(user=self.user, reference_date=today)
        self.assertEqual(stats["current_streak"], 0)
        self.assertEqual(stats["longest_streak"], 2)

    def test_rewards_unlock_dynamically(self):
        today = date.today()
        # 1 session of 300 minutes (5 hours) today
        StudySession.objects.create(user=self.user, subject="Algorithms", duration_minutes=300, session_date=today)

        rewards = get_user_rewards(user=self.user, reference_date=today)
        rewards_map = {r["id"]: r for r in rewards}

        # First Step & Focus 5h should be unlocked
        self.assertTrue(rewards_map["first_step"]["unlocked"])
        self.assertTrue(rewards_map["focus_5h"]["unlocked"])
        self.assertTrue(rewards_map["daily_champion"]["unlocked"])

        # 3-Day streak should still be locked (progress = 33%)
        self.assertFalse(rewards_map["streak_3"]["unlocked"])
        self.assertEqual(rewards_map["streak_3"]["progress"], 33)

    def test_streak_summary_endpoint(self):
        response = self.client.get(self.streaks_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("current_streak", response.data)
        self.assertIn("weekly_consistency", response.data)
        self.assertEqual(len(response.data["weekly_consistency"]), 7)

    def test_rewards_list_endpoint(self):
        response = self.client.get(self.rewards_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
        self.assertTrue(len(response.data) >= 8)

    def test_study_goal_get_and_patch(self):
        # GET default goal
        get_res = self.client.get(self.goal_url)
        self.assertEqual(get_res.status_code, status.HTTP_200_OK)
        self.assertEqual(get_res.data["daily_goal_minutes"], 60)

        # PATCH update goal to 90 min
        patch_res = self.client.patch(self.goal_url, {"daily_goal_minutes": 90})
        self.assertEqual(patch_res.status_code, status.HTTP_200_OK)
        self.assertEqual(patch_res.data["daily_goal_minutes"], 90)
