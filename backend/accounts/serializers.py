from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])

    class Meta:
        model = User
        fields = ["id", "email", "password", "full_name"]
        read_only_fields = ["id"]


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "full_name",
            "department",
            "bio",
            "target_daily_minutes",
            "date_joined",
        ]
        read_only_fields = ["id", "email", "date_joined"]


class UpdateProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["full_name", "department", "bio", "target_daily_minutes"]


class ProfileSummarySerializer(serializers.Serializer):
    user = UserSerializer()
    performance = serializers.DictField()
