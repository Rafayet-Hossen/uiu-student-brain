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

    class Meta:
        model = Post
        fields = [
            "id",
            "author",
            "title",
            "content",
            "category",
            "comments_count",
            "likes_count",
            "is_liked",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "author",
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
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "post", "author", "created_at", "updated_at"]


class StudyEventSerializer(serializers.ModelSerializer):
    creator = AuthorSummarySerializer(read_only=True)
    rsvp_count = serializers.IntegerField(read_only=True, default=0)
    is_rsvped = serializers.BooleanField(read_only=True, default=False)

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
            "is_rsvped",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "creator",
            "rsvp_count",
            "is_rsvped",
            "created_at",
            "updated_at",
        ]

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

