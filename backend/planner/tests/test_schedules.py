from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()


class ScheduleTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="planner@example.com",
            password="StrongPass123!",
            full_name="Planner User",
        )

        self.client.force_authenticate(user=self.user)

        self.url = "/api/planner/schedules/"

    def test_create_schedule(self):
        payload = {
            "subject": "Data Structures",
            "start_time": "18:00",
            "end_time": "20:00",
            "deadline": "2026-08-20",
            "days": ["Saturday", "Monday"],
            "notes": "Review binary trees and graph traversals",
            "resources": [
                {
                    "title": "Lecture Slides Drive Folder",
                    "url": "https://drive.google.com/drive/folders/example123",
                    "type": "drive",
                },
                {
                    "title": "Algorithms Video Lecture",
                    "url": "https://youtube.com/watch?v=example456",
                    "type": "video",
                },
            ],
        }

        response = self.client.post(
            self.url,
            payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )
        self.assertEqual(
            response.data["subject"],
            "Data Structures",
        )
        self.assertEqual(
            response.data["notes"],
            "Review binary trees and graph traversals",
        )
        self.assertEqual(
            len(response.data["resources"]),
            2,
        )
        self.assertEqual(
            response.data["resources"][0]["type"],
            "drive",
        )

    def test_list_schedules(self):
        self.client.post(
            self.url,
            {
                "subject": "Database Systems",
                "start_time": "20:00",
                "end_time": "21:30",
                "deadline": "2026-08-25",
                "days": ["Sunday", "Tuesday"],
            },
            format="json",
        )

        response = self.client.get(self.url)

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )
        self.assertEqual(len(response.data), 1)
        self.assertEqual(
            response.data[0]["subject"],
            "Database Systems",
        )

    def test_update_schedule(self):
        create_response = self.client.post(
            self.url,
            {
                "subject": "Operating Systems",
                "start_time": "16:00",
                "end_time": "18:00",
                "deadline": "2026-08-30",
                "days": ["Monday"],
            },
            format="json",
        )

        schedule_id = create_response.data["id"]

        response = self.client.patch(
            f"{self.url}{schedule_id}/",
            {
                "start_time": "17:00",
                "end_time": "19:00",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )
        self.assertEqual(
            response.data["start_time"],
            "17:00:00",
        )
        self.assertEqual(
            response.data["end_time"],
            "19:00:00",
        )

    def test_delete_schedule(self):
        create_response = self.client.post(
            self.url,
            {
                "subject": "Software Engineering",
                "start_time": "14:00",
                "end_time": "16:00",
                "deadline": "2026-09-01",
                "days": ["Wednesday"],
            },
            format="json",
        )

        schedule_id = create_response.data["id"]

        response = self.client.delete(f"{self.url}{schedule_id}/")

        self.assertEqual(
            response.status_code,
            status.HTTP_204_NO_CONTENT,
        )

        list_response = self.client.get(self.url)

        self.assertEqual(
            list_response.status_code,
            status.HTTP_200_OK,
        )
        self.assertEqual(
            len(list_response.data),
            0,
        )

    def test_schedule_requires_authentication(self):
        self.client.force_authenticate(user=None)

        response = self.client.get(self.url)

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )
