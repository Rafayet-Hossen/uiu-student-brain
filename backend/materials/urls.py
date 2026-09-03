from django.urls import path
from . import views

urlpatterns = [
    # Semesters
    path("semesters/", views.SemesterListCreateView.as_view(), name="materials-semester-list-create"),
    path("semesters/<int:pk>/", views.SemesterDetailView.as_view(), name="materials-semester-detail"),
    path("semesters/<int:semester_id>/courses/", views.CourseListCreateView.as_view(), name="materials-semester-course-list-create"),

    # Courses
    path("courses/<int:pk>/", views.CourseDetailView.as_view(), name="materials-course-detail"),
    path("courses/<int:course_id>/materials/", views.StudyMaterialListCreateView.as_view(), name="materials-course-material-list-create"),
    path("courses/<int:course_id>/chat/", views.CourseChatView.as_view(), name="materials-course-chat"),

    # Materials
    path("materials/<int:pk>/", views.StudyMaterialDetailView.as_view(), name="materials-material-detail"),
    path("materials/<int:pk>/analyze/", views.StudyMaterialAnalyzeView.as_view(), name="materials-material-analyze"),
]
