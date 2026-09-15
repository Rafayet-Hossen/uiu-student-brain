from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import (
    ProfileSummarySerializer,
    RegisterSerializer,
    UpdateProfileSerializer,
    UserSerializer,
)
from .services import get_user_profile_summary, register_user, update_user_profile


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = register_user(
            email=serializer.validated_data["email"],
            password=serializer.validated_data["password"],
            full_name=serializer.validated_data.get("full_name", ""),
        )
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)


class MeView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

    def get_serializer_class(self):
        if self.request.method in ["PATCH", "PUT"]:
            return UpdateProfileSerializer
        return UserSerializer

    def perform_update(self, serializer):
        user = update_user_profile(
            user=self.request.user,
            validated_data=serializer.validated_data,
        )
        serializer.instance = user


class ProfileSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        data = get_user_profile_summary(request.user)
        serializer = ProfileSummarySerializer(data)
        return Response(serializer.data, status=status.HTTP_200_OK)


class NotificationStateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from .models import UserNotificationState
        state, _ = UserNotificationState.objects.get_or_create(user=request.user)
        return Response({
            "read_notification_ids": state.read_notification_ids or [],
            "preferences": state.preferences or {},
        }, status=status.HTTP_200_OK)

    def post(self, request):
        from .models import UserNotificationState
        state, _ = UserNotificationState.objects.get_or_create(user=request.user)
        data = request.data

        # Normalize existing IDs
        current_raw = state.read_notification_ids or []
        if isinstance(current_raw, str):
            current_raw = [current_raw]
        elif not isinstance(current_raw, (list, tuple, set)):
            current_raw = []
        current_ids = set(str(x) for x in current_raw if len(str(x)) > 1)

        # If marking all as unread:
        if data.get("mark_all_unread"):
            current_ids.clear()
            state.read_notification_ids = []

        # If marking single ID unread:
        unread_id = data.get("unread_id")
        if unread_id:
            current_ids.discard(str(unread_id))
            state.read_notification_ids = list(current_ids)

        # If marking all as read:
        if data.get("mark_all") or data.get("all"):
            all_ids = data.get("all_ids", [])
            if isinstance(all_ids, str):
                all_ids = [all_ids]
            if all_ids:
                current_ids.update(str(x) for x in all_ids)
            else:
                current_ids.update(["notif-1", "notif-2", "notif-3", "notif-4", "notif-5"])
            state.read_notification_ids = list(current_ids)

        # If marking single ID:
        # If marking single ID read:
        read_id = data.get("read_id") or data.get("notification_id")
        if read_id:
            current_ids.add(str(read_id))
            state.read_notification_ids = list(current_ids)

        # If updating preferences:
        if "preferences" in data:
            current_prefs = state.preferences or {}
            current_prefs.update(data["preferences"])
            state.preferences = current_prefs

        state.save()
        return Response({
            "read_notification_ids": state.read_notification_ids,
            "preferences": state.preferences or {},
        }, status=status.HTTP_200_OK)

