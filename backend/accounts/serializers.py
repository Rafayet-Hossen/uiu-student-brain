from decimal import Decimal
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
            "current_trimester",
            "opt_in_leaderboard",
            "is_onboarded",
            "date_joined",
        ]
        read_only_fields = ["id", "email", "date_joined"]


class OnboardingSerializer(serializers.Serializer):
    current_gpa = serializers.DecimalField(
        max_digits=4, decimal_places=2, required=True, min_value=Decimal("0.00"), max_value=Decimal("4.00")
    )
    target_gpa = serializers.DecimalField(
        max_digits=4, decimal_places=2, required=True, min_value=Decimal("0.00"), max_value=Decimal("4.00")
    )
    completed_credits = serializers.DecimalField(
        max_digits=5, decimal_places=1, required=True, min_value=Decimal("0.0")
    )
    total_credits = serializers.DecimalField(
        max_digits=5, decimal_places=1, required=True, min_value=Decimal("1.0")
    )
    current_trimester = serializers.CharField(max_length=50, required=True)
    opt_in_leaderboard = serializers.BooleanField(required=False, default=True)
    department = serializers.CharField(
        max_length=255, required=False, allow_blank=True, default=""
    )


class UpdateProfileSerializer(serializers.ModelSerializer):
    target_gpa = serializers.FloatField(required=False, allow_null=True)
    current_gpa = serializers.FloatField(required=False, allow_null=True)
    completed_credits = serializers.FloatField(required=False, allow_null=True)
    total_credits = serializers.FloatField(required=False, allow_null=True)

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
            "current_trimester",
            "opt_in_leaderboard",
            "is_onboarded",
        ]


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

