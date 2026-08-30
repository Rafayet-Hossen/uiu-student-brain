from datetime import date, time
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User
from community.models import Comment, EventRSVP, Follow, Post, Reaction, StudyEvent


class CommunityApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="alice@example.com",
            password="StrongPass123!",
            full_name="Alice Scholar",
        )
        self.bob = User.objects.create_user(
            email="bob@example.com",
            password="StrongPass123!",
            full_name="Bob Student",
        )

        login_res = self.client.post(
            reverse("login"),
            {"email": "alice@example.com", "password": "StrongPass123!"},
        )
        self.access = login_res.data["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access}")

    # ============================================================
    # POSTS & REACTIONS TESTS
    # ============================================================

    def test_post_creation_and_listing(self):
        create_res = self.client.post(
            reverse("community-post-list-create"),
            {
                "title": "Algorithms Midterm Discussion",
                "content": "Does anyone want to review Dynamic Programming together?",
                "category": "Exam Prep",
            },
            format="json",
        )
        self.assertEqual(create_res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(create_res.data["title"], "Algorithms Midterm Discussion")
        self.assertEqual(create_res.data["author"]["email"], "alice@example.com")

        # List posts
        list_res = self.client.get(reverse("community-post-list-create"))
        self.assertEqual(list_res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(list_res.data), 1)

        # Filter by category
        cat_res = self.client.get(
            reverse("community-post-list-create"),
            {"category": "Exam Prep"},
        )
        self.assertEqual(len(cat_res.data), 1)

        empty_cat_res = self.client.get(
            reverse("community-post-list-create"),
            {"category": "Resources"},
        )
        self.assertEqual(len(empty_cat_res.data), 0)

    def test_post_reaction_toggle(self):
        post = Post.objects.create(
            author=self.bob,
            title="Great CS Resources",
            content="Check out this database design cheat sheet!",
            category="Resources",
        )

        react_url = reverse("community-post-react", kwargs={"pk": post.id})

        # Like the post
        res1 = self.client.post(react_url)
        self.assertEqual(res1.status_code, status.HTTP_200_OK)
        self.assertTrue(res1.data["liked"])
        self.assertEqual(res1.data["likes_count"], 1)

        # Unlike the post
        res2 = self.client.post(react_url)
        self.assertEqual(res2.status_code, status.HTTP_200_OK)
        self.assertFalse(res2.data["liked"])
        self.assertEqual(res2.data["likes_count"], 0)

    # ============================================================
    # COMMENTS TESTS
    # ============================================================

    def test_comment_creation_and_listing(self):
        post = Post.objects.create(
            author=self.bob,
            title="Question on Graph Theory",
            content="What is Dijkstra's time complexity with a min-heap?",
            category="Course Help",
        )

        comment_url = reverse("community-comment-list-create", kwargs={"pk": post.id})

        # Add comment
        res = self.client.post(
            comment_url,
            {"content": "It is O((V + E) log V)."},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["content"], "It is O((V + E) log V).")
        self.assertEqual(res.data["author"]["email"], "alice@example.com")

        # List comments
        list_res = self.client.get(comment_url)
        self.assertEqual(list_res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(list_res.data), 1)

        # Delete own comment
        comment_id = res.data["id"]
        del_res = self.client.delete(
            reverse("community-comment-detail", kwargs={"pk": comment_id})
        )
        self.assertEqual(del_res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Comment.objects.filter(id=comment_id).exists())

    # ============================================================
    # STUDY EVENTS & RSVP TESTS
    # ============================================================

    def test_study_event_creation_and_rsvp(self):
        create_res = self.client.post(
            reverse("community-event-list-create"),
            {
                "title": "Calculus II Group Study",
                "description": "Working through integration by parts and series.",
                "subject": "MATH 201",
                "event_date": "2026-09-15",
                "start_time": "14:00:00",
                "end_time": "16:00:00",
                "location": "Library Study Room 3B",
            },
            format="json",
        )
        self.assertEqual(create_res.status_code, status.HTTP_201_CREATED)
        event_id = create_res.data["id"]

        # List events
        events_res = self.client.get(reverse("community-event-list-create"))
        self.assertEqual(events_res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(events_res.data), 1)

        # RSVP to event
        rsvp_url = reverse("community-event-rsvp", kwargs={"pk": event_id})
        rsvp_res1 = self.client.post(rsvp_url)
        self.assertEqual(rsvp_res1.status_code, status.HTTP_200_OK)
        self.assertTrue(rsvp_res1.data["rsvped"])
        self.assertEqual(rsvp_res1.data["rsvp_count"], 1)

        # Cancel RSVP
        rsvp_res2 = self.client.post(rsvp_url)
        self.assertEqual(rsvp_res2.status_code, status.HTTP_200_OK)
        self.assertFalse(rsvp_res2.data["rsvped"])
        self.assertEqual(rsvp_res2.data["rsvp_count"], 0)

    # ============================================================
    # STUDENT NETWORK & FOLLOW TESTS
    # ============================================================

    def test_student_network_and_follow(self):
        # List other students
        students_res = self.client.get(reverse("community-student-list"))
        self.assertEqual(students_res.status_code, status.HTTP_200_OK)
        # Should include bob but exclude current user alice
        bob_entry = next((s for s in students_res.data if s["id"] == self.bob.id), None)
        self.assertIsNotNone(bob_entry)
        self.assertFalse(bob_entry["is_following"])

        # Follow Bob
        follow_url = reverse("community-student-follow", kwargs={"pk": self.bob.id})
        f_res1 = self.client.post(follow_url)
        self.assertEqual(f_res1.status_code, status.HTTP_200_OK)
        self.assertTrue(f_res1.data["following"])
        self.assertEqual(f_res1.data["followers_count"], 1)

        # Unfollow Bob
        f_res2 = self.client.post(follow_url)
        self.assertEqual(f_res2.status_code, status.HTTP_200_OK)
        self.assertFalse(f_res2.data["following"])
        self.assertEqual(f_res2.data["followers_count"], 0)

