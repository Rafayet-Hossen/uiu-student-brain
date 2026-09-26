from django.urls import path

from .views import (
    CommentDetailView,
    CommentListCreateView,
    CommentMarkHelpfulView,
    LeaderboardOptInToggleView,
    LeaderboardStatusView,
    LeaderboardView,
    PostDetailView,
    PostListCreateView,
    PostReactionToggleView,
    PostShareView,
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
    path("posts/<int:pk>/share/", PostShareView.as_view(), name="community-post-share"),
    path("posts/<int:pk>/comments/", CommentListCreateView.as_view(), name="community-comment-list-create"),
    path("comments/<int:pk>/", CommentDetailView.as_view(), name="community-comment-detail"),
    path("comments/<int:pk>/mark-helpful/", CommentMarkHelpfulView.as_view(), name="community-comment-mark-helpful"),

    # Study Events & Meetups
    path("events/", StudyEventListCreateView.as_view(), name="community-event-list-create"),
    path("events/<int:pk>/", StudyEventDetailView.as_view(), name="community-event-detail"),
    path("events/<int:pk>/rsvp/", StudyEventRSVPToggleView.as_view(), name="community-event-rsvp"),

    # Student Network
    path("students/", StudentListView.as_view(), name="community-student-list"),
    path("students/<int:pk>/follow/", StudentFollowToggleView.as_view(), name="community-student-follow"),

    # Leaderboard & Opt-in
    path("leaderboard/", LeaderboardView.as_view(), name="community-leaderboard"),
    path("leaderboard/status/", LeaderboardStatusView.as_view(), name="community-leaderboard-status"),
    path("leaderboard/opt-in/", LeaderboardOptInToggleView.as_view(), name="community-leaderboard-opt-in"),
]


