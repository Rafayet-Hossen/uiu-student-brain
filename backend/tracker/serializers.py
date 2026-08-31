from rest_framework import serializers
from .models import StudyGoal, StudySession


class StudySessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudySession
        fields = [
            "id",
            "subject",
            "duration_minutes",
            "session_date",
            "notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]

    def validate_duration_minutes(self, value):
        if value <= 0:
            raise serializers.ValidationError(
                "Duration must be greater than 0 minutes."
            )
        return value


class StudyGoalSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudyGoal
        fields = [
            "id",
            "daily_goal_minutes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_daily_goal_minutes(self, value):
        if value <= 0 or value > 1440:
            raise serializers.ValidationError(
                "Daily goal must be between 1 and 1440 minutes."
            )
        return value


class DayConsistencySerializer(serializers.Serializer):
    date = serializers.CharField()
    day_name = serializers.CharField()
    studied = serializers.BooleanField()
    minutes = serializers.IntegerField()
    goal_met = serializers.BooleanField()


class StreakSummarySerializer(serializers.Serializer):
    current_streak = serializers.IntegerField()
    longest_streak = serializers.IntegerField()
    total_study_days = serializers.IntegerField()
    total_sessions = serializers.IntegerField()
    total_minutes = serializers.IntegerField()
    today_minutes = serializers.IntegerField()
    daily_goal_minutes = serializers.IntegerField()
    daily_goal_achieved = serializers.BooleanField()
    studied_today = serializers.BooleanField()
    weekly_consistency = DayConsistencySerializer(many=True)


class RewardBadgeSerializer(serializers.Serializer):
    id = serializers.CharField()
    name = serializers.CharField()
    description = serializers.CharField()
    icon = serializers.CharField()
    category = serializers.CharField()
    unlocked = serializers.BooleanField()
    progress = serializers.IntegerField()
    current_value = serializers.IntegerField()
    target_value = serializers.IntegerField()
    unit = serializers.CharField()
