from django.urls import path

from .views import StudySessionDetailView, StudySessionListCreateView

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
]
