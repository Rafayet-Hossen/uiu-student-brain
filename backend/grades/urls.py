from django.urls import path

from .views import GradePlanDetailView, GradePlanListCreateView

urlpatterns = [
    path("plans/", GradePlanListCreateView.as_view(), name="grade-plan-list-create"),
    path("plans/<int:pk>/", GradePlanDetailView.as_view(), name="grade-plan-detail"),
]
