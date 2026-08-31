from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import (
    RewardBadgeSerializer,
    StreakSummarySerializer,
    StudyGoalSerializer,
    StudySessionSerializer,
)
from .services import (
    calculate_user_streaks,
    create_study_session,
    delete_study_session,
    get_or_create_user_goal,
    get_user_rewards,
    get_user_study_session,
    get_user_study_sessions,
    update_study_session,
    update_user_goal,
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


class StreakSummaryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        stats = calculate_user_streaks(user=request.user)
        serializer = StreakSummarySerializer(stats)
        return Response(serializer.data, status=status.HTTP_200_OK)


class RewardsListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        rewards = get_user_rewards(user=request.user)
        serializer = RewardBadgeSerializer(rewards, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class StudyGoalView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        goal = get_or_create_user_goal(user=request.user)
        serializer = StudyGoalSerializer(goal)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request):
        serializer = StudyGoalSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        updated_goal = update_user_goal(
            user=request.user,
            daily_goal_minutes=serializer.validated_data.get("daily_goal_minutes", 60),
        )
        return Response(StudyGoalSerializer(updated_goal).data, status=status.HTTP_200_OK)

    def put(self, request):
        return self.patch(request)
