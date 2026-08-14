from django.urls import path

from .views import ScheduleDetailView, ScheduleListCreateView

urlpatterns = [
    path(
        "schedules/",
        ScheduleListCreateView.as_view(),
        name="schedule-list-create",
    ),
    path(
        "schedules/<int:pk>/",
        ScheduleDetailView.as_view(),
        name="schedule-detail",
    ),
]
