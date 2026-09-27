from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User


class AccountsTests(APITestCase):
    def setUp(self):
        self.register_url = reverse("register")
        self.login_url = reverse("login")
        self.me_url = reverse("me")

    def test_register_creates_user(self):
        payload = {"email": "new@example.com", "password": "StrongPass123!", "full_name": "New User"}
        response = self.client.post(self.register_url, payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["email"], payload["email"])
        self.assertEqual(response.data["full_name"], payload["full_name"])
        self.assertTrue(User.objects.filter(email=payload["email"]).exists())

    def test_login_returns_tokens(self):
        User.objects.create_user(email="login@example.com", password="StrongPass123!", full_name="Login User")
        response = self.client.post(self.login_url, {"email": "login@example.com", "password": "StrongPass123!"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

    def test_me_requires_auth(self):
        response = self.client.get(self.me_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_me_returns_current_user_with_token(self):
        user = User.objects.create_user(email="me@example.com", password="StrongPass123!", full_name="Me User")
        login_response = self.client.post(self.login_url, {"email": "me@example.com", "password": "StrongPass123!"})
        access = login_response.data["access"]
        response = self.client.get(self.me_url, HTTP_AUTHORIZATION=f"Bearer {access}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["email"], user.email)
