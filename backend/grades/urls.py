from django.urls import path

from .views import (
    CourseGradeDetailView,
    CourseGradeListCreateView,
    GradePlanDetailView,
    GradePlanListCreateView,
    RetakeAdvisorView,
    TranscriptUploadView,
)

urlpatterns = [
    path("plans/", GradePlanListCreateView.as_view(), name="grade-plan-list-create"),
    path("plans/<int:pk>/", GradePlanDetailView.as_view(), name="grade-plan-detail"),
    path("courses/", CourseGradeListCreateView.as_view(), name="course-grade-list-create"),
    path("courses/<int:pk>/", CourseGradeDetailView.as_view(), name="course-grade-detail"),
    path("retake-advisor/", RetakeAdvisorView.as_view(), name="retake-advisor"),
    path("transcript/upload/", TranscriptUploadView.as_view(), name="transcript-upload"),
]
