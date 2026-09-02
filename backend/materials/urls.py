from django.urls import path

from .views import (
    MaterialAnalyzeView,
    MaterialDetailView,
    MaterialListCreateView,
    MaterialStatsView,
)

urlpatterns = [
    path("", MaterialListCreateView.as_view(), name="material-list-create"),
    path("stats/", MaterialStatsView.as_view(), name="material-stats"),
    path("<int:pk>/", MaterialDetailView.as_view(), name="material-detail"),
    path("<int:pk>/analyze/", MaterialAnalyzeView.as_view(), name="material-analyze"),
]

