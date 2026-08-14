from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User
from grades.models import GradePlan


class GradePlanApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="student@example.com",
            password="StrongPass123!",
            full_name="Student User",
        )

        self.other_user = User.objects.create_user(
            email="other@example.com",
            password="StrongPass123!",
            full_name="Other User",
        )

        self.list_url = reverse("grade-plan-list-create")

        login_response = self.client.post(
            reverse("login"),
            {
                "email": "student@example.com",
                "password": "StrongPass123!",
            },
        )

        self.access = login_response.data["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access}")

    def test_list_requires_authentication(self):
        self.client.credentials()

        response = self.client.get(self.list_url)

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    def test_authenticated_user_can_create_grade_plan(self):
        payload = {
            "name": "Fall 2026 Plan",
            "target_gpa": "3.50",
            "total_credits": "120",
            "completed_credits": "60",
            "current_gpa": "3.00",
        }

        response = self.client.post(
            self.list_url,
            payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

        plan = GradePlan.objects.get(id=response.data["id"])

        self.assertEqual(plan.user, self.user)
        self.assertEqual(plan.name, payload["name"])
        self.assertEqual(
            str(plan.target_gpa),
            payload["target_gpa"],
        )

    def test_authenticated_user_can_list_own_grade_plans(self):
        own_plan = GradePlan.objects.create(
            user=self.user,
            name="My Plan",
            target_gpa="3.50",
            total_credits="120",
            completed_credits="60",
            current_gpa="3.00",
        )

        GradePlan.objects.create(
            user=self.other_user,
            name="Other Plan",
            target_gpa="3.80",
            total_credits="120",
            completed_credits="60",
            current_gpa="3.20",
        )

        response = self.client.get(self.list_url)

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["id"], own_plan.id)

    def test_user_cannot_access_another_users_grade_plan(self):
        other_plan = GradePlan.objects.create(
            user=self.other_user,
            name="Other Plan",
            target_gpa="3.80",
            total_credits="120",
            completed_credits="60",
            current_gpa="3.20",
        )

        detail_url = reverse(
            "grade-plan-detail",
            kwargs={"pk": other_plan.id},
        )

        response = self.client.get(detail_url)

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )

    def test_user_can_update_own_grade_plan(self):
        plan = GradePlan.objects.create(
            user=self.user,
            name="Old Plan",
            target_gpa="3.50",
            total_credits="120",
            completed_credits="60",
            current_gpa="3.00",
        )

        detail_url = reverse(
            "grade-plan-detail",
            kwargs={"pk": plan.id},
        )

        response = self.client.patch(
            detail_url,
            {"target_gpa": "3.70"},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        plan.refresh_from_db()

        self.assertEqual(
            str(plan.target_gpa),
            "3.70",
        )

    def test_user_can_delete_own_grade_plan(self):
        plan = GradePlan.objects.create(
            user=self.user,
            name="Delete Plan",
            target_gpa="3.50",
            total_credits="120",
            completed_credits="60",
            current_gpa="3.00",
        )

        detail_url = reverse(
            "grade-plan-detail",
            kwargs={"pk": plan.id},
        )

        response = self.client.delete(detail_url)

        self.assertEqual(
            response.status_code,
            status.HTTP_204_NO_CONTENT,
        )

        self.assertFalse(GradePlan.objects.filter(id=plan.id).exists())

    def test_cannot_create_plan_with_completed_credits_above_total(self):
        payload = {
            "name": "Invalid Plan",
            "target_gpa": "3.50",
            "total_credits": "120",
            "completed_credits": "130",
            "current_gpa": "3.00",
        }

        response = self.client.post(
            self.list_url,
            payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        self.assertIn(
            "completed_credits",
            response.data,
        )
