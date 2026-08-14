from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from .serializers import ScheduleSerializer
from .services import (
    create_schedule,
    delete_schedule,
    get_user_schedule,
    get_user_schedules,
    update_schedule,
)


class ScheduleListCreateView(generics.ListCreateAPIView):
    serializer_class = ScheduleSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return get_user_schedules(user=self.request.user)

    def perform_create(self, serializer):
        serializer.instance = create_schedule(
            user=self.request.user,
            validated_data=serializer.validated_data,
        )


class ScheduleDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ScheduleSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return get_user_schedule(
            user=self.request.user,
            schedule_id=self.kwargs["pk"],
        )

    def perform_update(self, serializer):
        serializer.instance = update_schedule(
            schedule=self.get_object(),
            validated_data=serializer.validated_data,
        )

    def perform_destroy(self, instance):
        delete_schedule(schedule=instance)
