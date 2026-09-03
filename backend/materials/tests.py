from unittest.mock import patch
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from .models import StudyMaterial, StudyProject

User = get_user_model()


class MaterialsFeatureTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email="researcher@example.com",
            password="Password123!",
            full_name="Rafiq Al Mustafa",
        )
        self.other_user = User.objects.create_user(
            email="other@example.com",
            password="Password123!",
            full_name="Other Student",
        )
        self.client.force_authenticate(user=self.user)

        self.project = StudyProject.objects.create(
            user=self.user,
            title="Machine Learning Foundations",
            subject="Computer Science",
            description="Supervised, unsupervised, and deep learning notes.",
            color="#2563eb",
        )

    def test_list_and_create_project(self):
        """Verify project listing and creation."""
        url = reverse("materials-project-list-create")
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)
        self.assertEqual(res.data[0]["title"], "Machine Learning Foundations")

        # Create new project
        payload = {
            "title": "Biochemistry",
            "subject": "Chemistry",
            "description": "Enzyme kinetics and metabolic pathways.",
            "color": "#10b981",
        }
        res2 = self.client.post(url, data=payload, format="json")
        self.assertEqual(res2.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res2.data["title"], "Biochemistry")

    def test_create_link_and_note_materials(self):
        """Verify adding resource links and notes."""
        url = reverse("materials-material-list-create", kwargs={"project_id": self.project.id})

        # Add link
        link_payload = {
            "title": "Stanford CS229 Lecture Notes",
            "material_type": "link",
            "link_url": "https://cs229.stanford.edu/notes2022fall/notes.pdf",
            "content_text": "Comprehensive linear algebra & probability review.",
        }
        res_link = self.client.post(url, data=link_payload, format="json")
        self.assertEqual(res_link.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res_link.data["material_type"], "link")
        self.assertEqual(res_link.data["link_url"], "https://cs229.stanford.edu/notes2022fall/notes.pdf")

        # Add note
        note_payload = {
            "title": "Gradient Descent Quick Summary",
            "material_type": "note",
            "content_text": "Gradient descent computes the gradient of the loss function with respect to weights.",
        }
        res_note = self.client.post(url, data=note_payload, format="json")
        self.assertEqual(res_note.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res_note.data["material_type"], "note")

    def test_create_file_material(self):
        """Verify uploading a file/document."""
        url = reverse("materials-material-list-create", kwargs={"project_id": self.project.id})
        dummy_file = SimpleUploadedFile(
            "sample_syllabus.pdf",
            b"%PDF-1.4 ... dummy content ...",
            content_type="application/pdf",
        )
        payload = {
            "title": "Course Syllabus PDF",
            "material_type": "document",
            "file": dummy_file,
        }
        res = self.client.post(url, data=payload, format="multipart")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertIn("sample_syllabus", res.data["file"])
        self.assertGreater(res.data["file_size_bytes"], 0)

    @patch("ai.services.extract_material_topics")
    def test_analyze_material_with_ai(self, mock_ai):
        """Verify calling AI analysis endpoint extracts topics and saves to database."""
        mock_ai.return_value = {
            "title": "Backpropagation & Neural Networks",
            "summary": "Covers gradient computation, activation functions, and layer weights.",
            "difficulty": "Advanced",
            "key_topics": ["Backpropagation", "Chain Rule", "Activation Functions", "Loss Gradients"],
            "key_formulas_or_definitions": ["w = w - lr * grad"],
        }

        mat = StudyMaterial.objects.create(
            project=self.project,
            user=self.user,
            title="Neural Nets Chapter",
            material_type="note",
            content_text="Detailed derivation of backpropagation using multi-variable chain rule.",
        )

        url = reverse("materials-material-analyze", kwargs={"pk": mat.id})
        res = self.client.post(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIsNotNone(res.data["analyzed_at"])
        self.assertEqual(res.data["ai_analysis"]["difficulty"], "Advanced")
        self.assertEqual(len(res.data["ai_analysis"]["key_topics"]), 4)

        # Check project aggregated topics
        proj_url = reverse("materials-project-detail", kwargs={"pk": self.project.id})
        proj_res = self.client.get(proj_url)
        self.assertEqual(proj_res.status_code, status.HTTP_200_OK)
        self.assertEqual(proj_res.data["analyzed_materials_count"], 1)
        self.assertIn("Backpropagation", proj_res.data["extracted_topics"])

    def test_user_isolation(self):
        """User B cannot access or modify User A's project."""
        other_client = APIClient()
        other_client.force_authenticate(user=self.other_user)

        url = reverse("materials-project-detail", kwargs={"pk": self.project.id})
        res = other_client.get(url)
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

        del_res = other_client.delete(url)
        self.assertEqual(del_res.status_code, status.HTTP_404_NOT_FOUND)
