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
