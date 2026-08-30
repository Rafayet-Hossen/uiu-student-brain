from rest_framework import generics, permissions

from .serializers import StudySessionSerializer
from .services import (
    create_study_session,
    delete_study_session,
    get_user_study_session,
    get_user_study_sessions,
    update_study_session,
)


class StudySessionListCreateView(generics.ListCreateAPIView):
    serializer_class = StudySessionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return get_user_study_sessions(user=self.request.user)

    def perform_create(self, serializer):
        serializer.instance = create_study_session(
            user=self.request.user,
            validated_data=serializer.validated_data,
        )


class StudySessionDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = StudySessionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return get_user_study_session(
            user=self.request.user,
            session_id=self.kwargs["pk"],
        )

    def perform_update(self, serializer):
        serializer.instance = update_study_session(
            session=self.get_object(),
            validated_data=serializer.validated_data,
        )

    def perform_destroy(self, instance):
        delete_study_session(session=instance)

