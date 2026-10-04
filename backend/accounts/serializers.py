from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])

    class Meta:
        model = User
        fields = ["id", "email", "password", "full_name"]
        read_only_fields = ["id"]


class CustomTokenObtainPairSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs.get("email", "").strip().lower()
        password = attrs.get("password")

        if not email or not password:
            raise serializers.ValidationError({"detail": "Email and password are required."})

        # Instant database lookup without unnecessary hashing delay
        user = User.objects.filter(email__iexact=email).first()
        if not user:
            raise serializers.ValidationError({"detail": "No account found with this email address."})

        if not user.check_password(password):
            raise serializers.ValidationError({"detail": "Incorrect password. Please try again."})

        if not user.is_active:
            raise serializers.ValidationError({"detail": "This user account is inactive."})

        refresh = RefreshToken.for_user(user)

        return {
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "user": UserSerializer(user).data,
        }


class UserSerializer(serializers.ModelSerializer):
    followers_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()

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
            "followers_count",
            "following_count",
            "date_joined",
        ]
        read_only_fields = ["id", "email", "date_joined", "followers_count", "following_count"]

    def get_followers_count(self, obj):
        try:
            return obj.followers_set.count()
        except Exception:
            return 0

    def get_following_count(self, obj):
        try:
            return obj.following_set.count()
        except Exception:
            return 0


class UpdateProfileSerializer(serializers.ModelSerializer):
    target_gpa = serializers.FloatField(required=False, allow_null=True)
    current_gpa = serializers.FloatField(required=False, allow_null=True)
    completed_credits = serializers.FloatField(required=False, allow_null=True)
    total_credits = serializers.FloatField(required=False, allow_null=True)
    is_onboarded = serializers.BooleanField(required=False)
    opt_in_leaderboard = serializers.BooleanField(required=False)

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

