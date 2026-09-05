from unittest.mock import patch
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase, APIClient

from materials.models import Course, CourseChatMessage, Semester, StudyMaterial

User = get_user_model()


class StudyMaterialAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="scholar@example.com",
            password="StrongPassword123!",
            full_name="Alex Rivera",
        )
        self.other_user = User.objects.create_user(
            email="other@example.com",
            password="StrongPassword123!",
            full_name="Sam Taylor",
        )
        self.semester = Semester.objects.create(
            user=self.user,
            name="Spring 2026",
            is_current=True,
        )
        self.course = Course.objects.create(
            semester=self.semester,
            user=self.user,
            code="CSE 101",
            title="Algorithms",
        )
        self.other_semester = Semester.objects.create(
            user=self.other_user,
            name="Spring 2026",
            is_current=True,
        )
        self.other_course = Course.objects.create(
            semester=self.other_semester,
            user=self.other_user,
            code="SEC 101",
            title="Secret Course",
        )
        self.client.force_authenticate(user=self.user)
        self.url = "/api/materials/"

    def test_create_and_analyze_material(self):
        payload = {
            "title": "Binary Search Trees & Balancing",
            "category": "Lecture Note",
            "content": """
            Binary Search Tree (BST) is a rooted binary tree data structure where the key of each internal node is greater than all keys in the left subtree and less than all keys in the right subtree.
            
            AVL Tree: A self-balancing binary search tree where the difference between heights of left and right subtrees cannot be more than one for all nodes.
            
            Time Complexity: In a balanced BST, searching, insertion, and deletion take O(log n) time. In a degenerate tree, it degrades to O(n).
            
            Tree Rotations: Used during insertion and deletion to rebalance AVL trees without violating BST ordering properties.
            """,
            "tags": ["BST", "AVL Tree", "Trees"],
        }
        response = self.client.post(self.url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["title"], "Binary Search Trees & Balancing")
        self.assertGreater(response.data["word_count"], 10)

    def test_list_materials_with_filters(self):
        StudyMaterial.objects.create(
            user=self.user,
            course=self.course,
            title="Database Normalization 1NF to 3NF",
            category="Cheat Sheet",
            content_text="Normalization is the process of organizing data in a database.",
        )
        StudyMaterial.objects.create(
            user=self.user,
            course=self.course,
            title="Operating Systems Memory Virtualization",
            category="Lecture Note",
            content_text="Virtual memory allows executing processes that are not completely in memory.",
        )
        StudyMaterial.objects.create(
            user=self.other_user,
            course=self.other_course,
            title="Other User Confidential Notes",
            category="Lecture Note",
            content_text="Should not be visible to Alex.",
        )

        # 1. List all for current user
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 2)

        # 2. Filter by category
        res_cat = self.client.get(f"{self.url}?category=Cheat Sheet")
        self.assertEqual(res_cat.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_cat.data), 1)
        self.assertEqual(res_cat.data[0]["title"], "Database Normalization 1NF to 3NF")

        # 3. Filter by search keyword
        res_search = self.client.get(f"{self.url}?search=Virtualization")
        self.assertEqual(res_search.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_search.data), 1)
        self.assertEqual(res_search.data[0]["title"], "Operating Systems Memory Virtualization")

    def test_get_and_update_material(self):
        material = StudyMaterial.objects.create(
            user=self.user,
            course=self.course,
            title="Graph Theory Introduction",
            category="Lecture Note",
            content_text="A graph is a non-linear data structure consisting of vertices and edges.",
        )

        # Detail GET
        res = self.client.get(f"{self.url}{material.id}/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["title"], "Graph Theory Introduction")

        # Update PATCH
        res_patch = self.client.patch(
            f"{self.url}{material.id}/",
            {"content": "Updated graph theory note content with Dijkstra algorithm."},
            format="json",
        )
        self.assertEqual(res_patch.status_code, status.HTTP_200_OK)
        self.assertIn("Dijkstra", res_patch.data["content"])

    @patch("ai.services.extract_material_topics")
    def test_reanalyze_material_endpoint(self, mock_ai):
        mock_ai.return_value = {
            "title": "Quantum Physics Basics",
            "summary": "Wave-particle duality summary.",
            "difficulty": "Advanced",
            "key_topics": ["Wave-particle duality", "Quantum Mechanics"],
            "key_formulas_or_definitions": ["E = hf"],
        }
        material = StudyMaterial.objects.create(
            user=self.user,
            course=self.course,
            title="Quantum Physics Basics",
            category="Research Paper",
            content_text="Wave-particle duality posits that every particle or quantum entity may be described as either a particle or a wave.",
        )
        res = self.client.post(f"{self.url}{material.id}/analyze/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res.data["is_analyzed"])
        self.assertGreater(len(res.data["key_topics"]), 0)

    def test_material_stats_endpoint(self):
        StudyMaterial.objects.create(
            user=self.user,
            course=self.course,
            title="Note 1",
            content_text="Derivative: Rate of change.",
            key_topics=["Derivatives", "Calculus"],
            estimated_reading_time=10,
            word_count=200,
        )
        StudyMaterial.objects.create(
            user=self.user,
            course=self.course,
            title="Note 2",
            content_text="Kinematics: Study of motion.",
            key_topics=["Kinematics", "Motion"],
            estimated_reading_time=15,
            word_count=350,
        )

        res = self.client.get(f"{self.url}stats/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["total_materials"], 2)
        self.assertEqual(res.data["total_reading_minutes"], 25)
        self.assertEqual(res.data["total_words_analyzed"], 550)
        self.assertEqual(len(res.data["subjects"]), 1)

    def test_delete_material(self):
        material = StudyMaterial.objects.create(
            user=self.user,
            course=self.course,
            title="Note to delete",
            content_text="Temporary notes.",
        )
        res = self.client.delete(f"{self.url}{material.id}/")
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(StudyMaterial.objects.filter(id=material.id).exists())

    def test_materials_require_authentication(self):
        self.client.force_authenticate(user=None)
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_upload_material_file(self):
        from django.core.files.uploadedfile import SimpleUploadedFile
        fake_file = SimpleUploadedFile(
            "discrete_math.txt",
            b"Graph coloring is the assignment of labels called colors to elements of a graph.",
            content_type="text/plain",
        )
        data = {
            "title": "Discrete Math Graph Coloring",
            "category": "Lecture Note",
            "file": fake_file,
            "tags": '["Math", "Graphs"]',
        }
        res = self.client.post(self.url, data, format="multipart")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["title"], "Discrete Math Graph Coloring")
        self.assertIn("Graph", res.data["content"])


class MaterialsHierarchyAndChatTests(APITestCase):
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
        from django.core.files.uploadedfile import SimpleUploadedFile
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


