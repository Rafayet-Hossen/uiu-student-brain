from django.urls import path

from .views import (
    CommentDetailView,
    CommentListCreateView,
    PostDetailView,
    PostListCreateView,
    PostReactionToggleView,
    StudentFollowToggleView,
    StudentListView,
    StudyEventDetailView,
    StudyEventListCreateView,
    StudyEventRSVPToggleView,
)

urlpatterns = [
    # Posts & Q&A
    path("posts/", PostListCreateView.as_view(), name="community-post-list-create"),
    path("posts/<int:pk>/", PostDetailView.as_view(), name="community-post-detail"),
    path("posts/<int:pk>/react/", PostReactionToggleView.as_view(), name="community-post-react"),
    path("posts/<int:pk>/comments/", CommentListCreateView.as_view(), name="community-comment-list-create"),
    path("comments/<int:pk>/", CommentDetailView.as_view(), name="community-comment-detail"),

    # Study Events & Meetups
    path("events/", StudyEventListCreateView.as_view(), name="community-event-list-create"),
    path("events/<int:pk>/", StudyEventDetailView.as_view(), name="community-event-detail"),
    path("events/<int:pk>/rsvp/", StudyEventRSVPToggleView.as_view(), name="community-event-rsvp"),

    # Student Network
    path("students/", StudentListView.as_view(), name="community-student-list"),
    path("students/<int:pk>/follow/", StudentFollowToggleView.as_view(), name="community-student-follow"),
]

