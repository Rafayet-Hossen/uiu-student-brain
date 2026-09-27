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
            "current_gpa",
            "target_gpa",
            "completed_credits",
            "total_credits",
            "is_onboarded",
            "date_joined",
        ]
        read_only_fields = ["id", "email", "date_joined"]


class UpdateProfileSerializer(serializers.ModelSerializer):
    target_gpa = serializers.FloatField(required=False, allow_null=True)
    current_gpa = serializers.FloatField(required=False, allow_null=True)
    completed_credits = serializers.FloatField(required=False, allow_null=True)
    total_credits = serializers.FloatField(required=False, allow_null=True)
    opt_in_leaderboard = serializers.BooleanField(required=False, allow_null=True)

    class Meta:
        model = User
        fields = [
            "full_name",
            "department",
            "bio",
            "target_daily_minutes",
            "target_gpa",
            "current_gpa",
            "completed_credits",
            "total_credits",
            "opt_in_leaderboard",
            "is_onboarded",
        ]


class OnboardingSerializer(serializers.Serializer):
    current_gpa = serializers.FloatField(required=True, min_value=0.0, max_value=4.0)
    target_gpa = serializers.FloatField(required=True, min_value=0.0, max_value=4.0)
    completed_credits = serializers.FloatField(required=True, min_value=0.0)
    total_credits = serializers.FloatField(required=False, default=140.0, min_value=1.0)
    opt_in_leaderboard = serializers.BooleanField(required=False, default=True)
    department = serializers.CharField(required=False, allow_blank=True, default="")
    bio = serializers.CharField(required=False, allow_blank=True, default="")
    target_daily_minutes = serializers.IntegerField(required=False, default=120)


class ProfileSummarySerializer(serializers.Serializer):
    user = UserSerializer()
    performance = serializers.DictField()


class NotificationSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source="sender.full_name", read_only=True)
    sender_avatar = serializers.CharField(source="sender.avatar", read_only=True, default="")

    class Meta:
        from .models import Notification
        model = Notification
        fields = [
            "id",
            "category",
            "title",
            "message",
            "link",
            "metadata",
            "is_read",
            "created_at",
            "sender_name",
            "sender_avatar",
        ]

