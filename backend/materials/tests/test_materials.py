from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from materials.models import StudyMaterial

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
        self.client.force_authenticate(user=self.user)
        self.url = "/api/materials/"

    def test_create_and_analyze_material(self):
        payload = {
            "title": "Binary Search Trees & Balancing",
            "subject": "Algorithms",
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
        self.assertEqual(response.data["subject"], "Algorithms")
        self.assertTrue(response.data["is_analyzed"])
        self.assertGreater(len(response.data["summary"]), 10)
        self.assertGreater(len(response.data["key_topics"]), 0)
        self.assertGreater(len(response.data["key_concepts"]), 0)
        self.assertGreater(len(response.data["key_questions"]), 0)
        self.assertGreater(response.data["word_count"], 10)

    def test_list_materials_with_filters(self):
        StudyMaterial.objects.create(
            user=self.user,
            title="Database Normalization 1NF to 3NF",
            subject="Database",
            category="Cheat Sheet",
            content="Normalization is the process of organizing data in a database.",
        )
        StudyMaterial.objects.create(
            user=self.user,
            title="Operating Systems Memory Virtualization",
            subject="Operating Systems",
            category="Lecture Note",
            content="Virtual memory allows executing processes that are not completely in memory.",
        )
        StudyMaterial.objects.create(
            user=self.other_user,
            title="Other User Confidential Notes",
            subject="Secret",
            category="Lecture Note",
            content="Should not be visible to Alex.",
        )

        # 1. List all for current user
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 2)

        # 2. Filter by subject
        res_subj = self.client.get(f"{self.url}?subject=Database")
        self.assertEqual(res_subj.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_subj.data), 1)
        self.assertEqual(res_subj.data[0]["subject"], "Database")

        # 3. Filter by search keyword
        res_search = self.client.get(f"{self.url}?search=Virtualization")
        self.assertEqual(res_search.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_search.data), 1)
        self.assertEqual(res_search.data[0]["title"], "Operating Systems Memory Virtualization")

    def test_get_and_update_material(self):
        material = StudyMaterial.objects.create(
            user=self.user,
            title="Graph Theory Introduction",
            subject="Discrete Math",
            category="Lecture Note",
            content="A graph is a non-linear data structure consisting of vertices and edges.",
        )

        # Detail GET
        res = self.client.get(f"{self.url}{material.id}/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["title"], "Graph Theory Introduction")

        # Update PATCH
        res_patch = self.client.patch(
            f"{self.url}{material.id}/",
            {"title": "Advanced Graph Theory & Dijkstra Algorithm"},
            format="json",
        )
        self.assertEqual(res_patch.status_code, status.HTTP_200_OK)
        self.assertEqual(res_patch.data["title"], "Advanced Graph Theory & Dijkstra Algorithm")

    def test_reanalyze_material_endpoint(self):
        material = StudyMaterial.objects.create(
            user=self.user,
            title="Quantum Physics Basics",
            subject="Physics",
            category="Research Paper",
            content="Wave-particle duality posits that every particle or quantum entity may be described as either a particle or a wave.",
        )
        res = self.client.post(f"{self.url}{material.id}/analyze/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res.data["is_analyzed"])
        self.assertGreater(len(res.data["key_topics"]), 0)

    def test_material_stats_endpoint(self):
        StudyMaterial.objects.create(
            user=self.user,
            title="Note 1",
            subject="Math",
            content="Derivative: Rate of change.",
            key_topics=["Derivatives", "Calculus"],
            estimated_reading_time=10,
            word_count=200,
        )
        StudyMaterial.objects.create(
            user=self.user,
            title="Note 2",
            subject="Physics",
            content="Kinematics: Study of motion.",
            key_topics=["Kinematics", "Motion"],
            estimated_reading_time=15,
            word_count=350,
        )

        res = self.client.get(f"{self.url}stats/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["total_materials"], 2)
        self.assertEqual(res.data["total_reading_minutes"], 25)
        self.assertEqual(res.data["total_words_analyzed"], 550)
        self.assertEqual(len(res.data["subjects"]), 2)

    def test_delete_material(self):
        material = StudyMaterial.objects.create(
            user=self.user,
            title="Note to delete",
            subject="Misc",
            content="Temporary notes.",
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
            "subject": "Discrete Math",
            "category": "Lecture Note",
            "file": fake_file,
            "tags": '["Math", "Graphs"]',
        }
        res = self.client.post(self.url, data, format="multipart")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["title"], "Discrete Math Graph Coloring")
        self.assertTrue(res.data["is_analyzed"])
        self.assertIn("Graph", res.data["content"])


