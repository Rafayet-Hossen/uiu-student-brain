from django.urls import path

from .views import (
    RewardsListView,
    StreakSummaryView,
    StudyGoalView,
    StudySessionDetailView,
    StudySessionListCreateView,
)

urlpatterns = [
    path(
        "sessions/",
        StudySessionListCreateView.as_view(),
        name="study-session-list-create",
    ),
    path(
        "sessions/<int:pk>/",
        StudySessionDetailView.as_view(),
        name="study-session-detail",
    ),
    path(
        "streaks/",
        StreakSummaryView.as_view(),
        name="tracker-streaks",
    ),
    path(
        "rewards/",
        RewardsListView.as_view(),
        name="tracker-rewards",
    ),
    path(
        "goal/",
        StudyGoalView.as_view(),
        name="tracker-goal",
    ),
]
