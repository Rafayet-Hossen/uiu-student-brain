from datetime import date

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User
from tracker.models import StudySession


class StudySessionViewTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="tracker@example.com",
            password="StrongPass123!",
            full_name="Tracker User",
        )

        self.other_user = User.objects.create_user(
            email="other@example.com",
            password="StrongPass123!",
            full_name="Other User",
        )

        self.list_url = reverse("study-session-list-create")

    def authenticate(self, user=None):
        user = user or self.user
        response = self.client.post(
            reverse("login"),
            {
                "email": user.email,
                "password": "StrongPass123!",
            },
        )
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {response.data['access']}"
        )

    def test_list_requires_authentication(self):
        response = self.client.get(self.list_url)

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    def test_create_study_session(self):
        self.authenticate()

        payload = {
            "subject": "Software Engineering",
            "duration_minutes": 90,
            "session_date": date.today().isoformat(),
            "notes": "Worked on tracker feature.",
        }

        response = self.client.post(self.list_url, payload)

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )
        self.assertEqual(response.data["subject"], payload["subject"])
        self.assertEqual(response.data["duration_minutes"], 90)

        self.assertTrue(
            StudySession.objects.filter(
                user=self.user,
                subject="Software Engineering",
            ).exists()
        )

    def test_rejects_zero_duration(self):
        self.authenticate()

        payload = {
            "subject": "Database",
            "duration_minutes": 0,
            "session_date": date.today().isoformat(),
            "notes": "",
        }

        response = self.client.post(self.list_url, payload)

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    def test_user_only_sees_own_sessions(self):
        StudySession.objects.create(
            user=self.user,
            subject="My Subject",
            duration_minutes=60,
            session_date=date.today(),
        )

        StudySession.objects.create(
            user=self.other_user,
            subject="Other Subject",
            duration_minutes=120,
            session_date=date.today(),
        )

        self.authenticate()

        response = self.client.get(self.list_url)

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["subject"], "My Subject")

    def test_user_cannot_access_other_users_session(self):
        other_session = StudySession.objects.create(
            user=self.other_user,
            subject="Private Subject",
            duration_minutes=120,
            session_date=date.today(),
        )

        self.authenticate()

        detail_url = reverse(
            "study-session-detail",
            kwargs={"pk": other_session.id},
        )

        response = self.client.get(detail_url)

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )
