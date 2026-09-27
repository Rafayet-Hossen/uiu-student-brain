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

    def test_google_login_missing_token(self):
        google_url = reverse("google_login")
        response = self.client.post(google_url, {})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_google_login_mocked_success(self):
        from unittest.mock import patch
        google_url = reverse("google_login")
        fake_idinfo = {
            "email": "googlestudent@university.edu",
            "name": "Google Student Scholar",
            "sub": "1234567890",
        }
        with patch("google.oauth2.id_token.verify_oauth2_token", return_value=fake_idinfo):
            response = self.client.post(google_url, {"credential": "fake-google-id-token"})
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertIn("access", response.data)
            self.assertIn("refresh", response.data)
            self.assertEqual(response.data["user"]["email"], "googlestudent@university.edu")
            self.assertEqual(response.data["user"]["full_name"], "Google Student Scholar")
            self.assertTrue(User.objects.filter(email="googlestudent@university.edu").exists())

