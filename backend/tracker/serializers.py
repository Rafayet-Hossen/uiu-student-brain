from rest_framework import serializers
from materials.models import Course, StudyMaterial
from .models import StudyGoal, StudySession


class StudySessionSerializer(serializers.ModelSerializer):
    course = serializers.PrimaryKeyRelatedField(
        queryset=Course.objects.all(),
        required=False,
        allow_null=True,
    )
    material = serializers.PrimaryKeyRelatedField(
        queryset=StudyMaterial.objects.all(),
        required=False,
        allow_null=True,
    )
    course_details = serializers.SerializerMethodField()
    material_details = serializers.SerializerMethodField()
    effective_duration_minutes = serializers.ReadOnlyField()

    class Meta:
        model = StudySession
        fields = [
            "id",
            "course",
            "course_details",
            "material",
            "material_details",
            "subject",
            "duration_minutes",
            "session_date",
            "start_time",
            "end_time",
            "actual_started_at",
            "actual_completed_at",
            "extended_minutes",
            "status",
            "notes",
            "quiz_taken",
            "quiz_score",
            "quiz_accuracy",
            "quiz_results",
            "effective_duration_minutes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "course_details",
            "material_details",
            "actual_started_at",
            "actual_completed_at",
            "extended_minutes",
            "quiz_taken",
            "quiz_score",
            "quiz_accuracy",
            "quiz_results",
            "effective_duration_minutes",
            "created_at",
            "updated_at",
        ]

    def get_course_details(self, obj):
        if not obj.course:
            return None
        return {
            "id": obj.course.id,
            "title": obj.course.title,
            "code": obj.course.code,
            "color": obj.course.color,
        }

    def get_material_details(self, obj):
        if not obj.material:
            return None
        return {
            "id": obj.material.id,
            "title": obj.material.title,
            "category": obj.material.category,
            "material_type": obj.material.material_type,
            "difficulty_level": obj.material.difficulty_level,
            "key_topics": obj.material.key_topics or [],
            "summary": obj.material.summary or "",
        }

    def validate_duration_minutes(self, value):
        if value <= 0:
            raise serializers.ValidationError(
                "Duration must be greater than 0 minutes."
            )
        return value

    def validate(self, attrs):
        request = self.context.get("request")
        user = request.user if request and hasattr(request, "user") else None

        course = attrs.get("course")
        material = attrs.get("material")

        if user and course and course.user != user:
            raise serializers.ValidationError({"course": "Invalid course selected."})

        if user and material and material.user != user:
            raise serializers.ValidationError({"material": "Invalid study material selected."})

        if material and not attrs.get("subject"):
            attrs["subject"] = material.title
        elif course and not attrs.get("subject"):
            code_prefix = f"[{course.code}] " if course.code else ""
            attrs["subject"] = f"{code_prefix}{course.title}"

        return attrs


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
