from django.urls import path
from . import views

urlpatterns = [
    # Projects
    path("projects/", views.StudyProjectListCreateView.as_view(), name="materials-project-list-create"),
    path("projects/<int:pk>/", views.StudyProjectDetailView.as_view(), name="materials-project-detail"),
    path("projects/<int:project_id>/materials/", views.StudyMaterialListCreateView.as_view(), name="materials-material-list-create"),

    # Materials
    path("materials/<int:pk>/", views.StudyMaterialDetailView.as_view(), name="materials-material-detail"),
    path("materials/<int:pk>/analyze/", views.StudyMaterialAnalyzeView.as_view(), name="materials-material-analyze"),
]
