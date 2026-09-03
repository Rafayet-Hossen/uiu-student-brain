from unittest.mock import patch
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from .models import Course, CourseChatMessage, Semester, StudyMaterial

User = get_user_model()


class MaterialsHierarchyAndChatTests(TestCase):
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

        self.semester = Semester.objects.create(
            user=self.user,
            name="Summer 2026",
            is_current=True,
        )
        self.course = Course.objects.create(
            semester=self.semester,
            user=self.user,
            code="CSE 220",
            title="Data Structures & Algorithms",
            color="#2563eb",
            description="Core syllabus covering Graph Theory, Dynamic Programming, and Trees.",
        )

    def test_semester_and_course_crud(self):
        """Verify semester and course listing and creation."""
        # 1. List semesters
        sem_url = reverse("materials-semester-list-create")
        res = self.client.get(sem_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)
        self.assertEqual(res.data[0]["name"], "Summer 2026")

        # 2. Create another semester
        res2 = self.client.post(sem_url, data={"name": "Fall 2026", "is_current": False}, format="json")
        self.assertEqual(res2.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res2.data["name"], "Fall 2026")

        # 3. Create course under semester
        course_url = reverse("materials-semester-course-list-create", kwargs={"semester_id": self.semester.id})
        payload = {
            "code": "MATH 201",
            "title": "Linear Algebra & Differential Equations",
            "color": "#10b981",
        }
        res_course = self.client.post(course_url, data=payload, format="json")
        self.assertEqual(res_course.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res_course.data["code"], "MATH 201")

    def test_materials_creation_and_ai_analysis(self):
        """Verify creating materials under a course and triggering AI analysis."""
        url = reverse("materials-course-material-list-create", kwargs={"course_id": self.course.id})

        # 1. Create document
        dummy_file = SimpleUploadedFile(
            "graph_theory.pdf",
            b"%PDF-1.4 dummy graph notes...",
            content_type="application/pdf",
        )
        res_doc = self.client.post(
            url,
            data={"title": "Graph Theory Lecture Notes.pdf", "material_type": "document", "file": dummy_file},
            format="multipart",
        )
        self.assertEqual(res_doc.status_code, status.HTTP_201_CREATED)
        mat_id = res_doc.data["id"]

        # 2. Trigger AI analysis with mock
        with patch("ai.services.extract_material_topics") as mock_ai:
            mock_ai.return_value = {
                "title": "Graph Algorithms & BFS/DFS",
                "summary": "Covers graph traversal fundamentals and topological sorting.",
                "difficulty": "Intermediate",
                "key_topics": ["Breadth-First Search", "Depth-First Search", "Topological Sort"],
                "key_formulas_or_definitions": ["O(V + E) time complexity for adjacency lists"],
            }
            analyze_url = reverse("materials-material-analyze", kwargs={"pk": mat_id})
            res_analysis = self.client.post(analyze_url)
            self.assertEqual(res_analysis.status_code, status.HTTP_200_OK)
            self.assertEqual(res_analysis.data["ai_analysis"]["difficulty"], "Intermediate")
            self.assertIn("Breadth-First Search", res_analysis.data["ai_analysis"]["key_topics"])

    @patch("ai.services.chat_with_course_tutor")
    def test_course_ai_chat(self, mock_chat):
        """Verify chatting with the course AI tutor."""
        mock_chat.return_value = "Dijkstra's algorithm finds the shortest path in a weighted graph with non-negative edge weights."

        chat_url = reverse("materials-course-chat", kwargs={"course_id": self.course.id})

        # Send question
        res = self.client.post(chat_url, data={"message": "Can you explain Dijkstra's algorithm?"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["role"], "assistant")
        self.assertIn("Dijkstra", res.data["content"])

        # Fetch chat history
        hist_res = self.client.get(chat_url)
        self.assertEqual(hist_res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(hist_res.data), 2)  # User question + assistant reply
        self.assertEqual(hist_res.data[0]["role"], "user")
        self.assertEqual(hist_res.data[1]["role"], "assistant")

    def test_user_isolation(self):
        """User B cannot access or modify User A's semester or course."""
        other_client = APIClient()
        other_client.force_authenticate(user=self.other_user)

        course_url = reverse("materials-course-detail", kwargs={"pk": self.course.id})
        res = other_client.get(course_url)
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)
