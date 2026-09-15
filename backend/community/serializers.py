from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Comment, Post, StudyEvent

User = get_user_model()


class AuthorSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "email", "full_name"]
        read_only_fields = fields


class PostSerializer(serializers.ModelSerializer):
    author = AuthorSummarySerializer(read_only=True)
    comments_count = serializers.IntegerField(read_only=True, default=0)
    likes_count = serializers.IntegerField(read_only=True, default=0)
    is_liked = serializers.BooleanField(read_only=True, default=False)
    code_snippet = serializers.CharField(required=False, allow_blank=True, allow_null=True, default="")
    code_language = serializers.CharField(required=False, allow_blank=True, default="python")
    vscode_liveshare_url = serializers.CharField(required=False, allow_blank=True, allow_null=True, default="")

    def validate_code_snippet(self, value):
        return value or ""

    def validate_vscode_liveshare_url(self, value):
        return value or ""

    class Meta:
        model = Post
        fields = [
            "id",
            "author",
            "title",
            "content",
            "category",
            "code_snippet",
            "code_language",
            "vscode_liveshare_url",
            "is_solved",
            "solved_comment",
            "comments_count",
            "likes_count",
            "is_liked",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "author",
            "solved_comment",
            "comments_count",
            "likes_count",
            "is_liked",
            "created_at",
            "updated_at",
        ]


class CommentSerializer(serializers.ModelSerializer):
    author = AuthorSummarySerializer(read_only=True)

    class Meta:
        model = Comment
        fields = [
            "id",
            "post",
            "author",
            "content",
            "code_solution",
            "code_language",
            "is_helpful",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "post",
            "author",
            "is_helpful",
            "created_at",
            "updated_at",
        ]


class StudyEventSerializer(serializers.ModelSerializer):
    creator = AuthorSummarySerializer(read_only=True)
    rsvp_count = serializers.IntegerField(read_only=True, default=0)
    going_count = serializers.IntegerField(read_only=True, default=0)
    interested_count = serializers.IntegerField(read_only=True, default=0)
    going_count = serializers.SerializerMethodField()
    interested_count = serializers.SerializerMethodField()
    is_rsvped = serializers.BooleanField(read_only=True, default=False)
    user_rsvp_status = serializers.SerializerMethodField()

    class Meta:
        model = StudyEvent
        fields = [
            "id",
            "creator",
            "title",
            "description",
            "subject",
            "event_date",
            "start_time",
            "end_time",
            "location",
            "rsvp_count",
            "going_count",
            "interested_count",
            "is_rsvped",
            "user_rsvp_status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "creator",
            "rsvp_count",
            "going_count",
            "interested_count",
            "is_rsvped",
            "user_rsvp_status",
            "created_at",
            "updated_at",
        ]

    def get_going_count(self, obj) -> int:
        if hasattr(obj, "going_count"):
            return obj.going_count
        return obj.rsvps.filter(status="going").count()

    def get_interested_count(self, obj) -> int:
        if hasattr(obj, "interested_count"):
            return obj.interested_count
        return obj.rsvps.filter(status__in=["interested", "going"]).count()

    def get_user_rsvp_status(self, obj) -> str | None:
        request = self.context.get("request")
        if request and request.user and request.user.is_authenticated:
            rsvp = obj.rsvps.filter(user=request.user).first()
            return rsvp.status if rsvp else None
        return None

    def validate(self, attrs):
        instance = self.instance
        start_time = attrs.get("start_time", instance.start_time if instance else None)
        end_time = attrs.get("end_time", instance.end_time if instance else None)

        if start_time and end_time and start_time >= end_time:
            raise serializers.ValidationError("End time must be after start time.")

        return attrs


class StudentProfileSerializer(serializers.ModelSerializer):
    followers_count = serializers.IntegerField(read_only=True, default=0)
    following_count = serializers.IntegerField(read_only=True, default=0)
    is_following = serializers.BooleanField(read_only=True, default=False)

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "full_name",
            "followers_count",
            "following_count",
            "is_following",
        ]
        read_only_fields = fields


class LeaderboardProfileSerializer(serializers.Serializer):
    is_opted_in = serializers.BooleanField()
    custom_quote = serializers.CharField(max_length=255, required=False, allow_blank=True)


class LeaderboardEntrySerializer(serializers.Serializer):
    rank = serializers.IntegerField()
    user_id = serializers.IntegerField()
    full_name = serializers.CharField()
    email = serializers.CharField()
    display_name = serializers.CharField()
    custom_quote = serializers.CharField(allow_blank=True)
    study_minutes = serializers.IntegerField()
    study_hours = serializers.FloatField()
    current_streak = serializers.IntegerField()
    longest_streak = serializers.IntegerField()
    total_sessions = serializers.IntegerField()
    trophies_count = serializers.IntegerField()
    is_following = serializers.BooleanField()
    is_current_user = serializers.BooleanField()


