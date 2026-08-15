from rest_framework import serializers

from .models import StudySession


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
