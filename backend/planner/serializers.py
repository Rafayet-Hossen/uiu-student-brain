from rest_framework import serializers

from .models import Schedule


class ScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Schedule
        fields = [
            "id",
            "subject",
            "start_time",
            "end_time",
            "deadline",
            "days",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate(self, attrs):
        instance = self.instance

        start_time = attrs.get(
            "start_time",
            instance.start_time if instance else None,
        )
        end_time = attrs.get(
            "end_time",
            instance.end_time if instance else None,
        )

        if start_time and end_time and start_time >= end_time:
            raise serializers.ValidationError("End time must be after start time.")

        if "days" in attrs:
            days = attrs["days"]

            if not isinstance(days, list) or not days:
                raise serializers.ValidationError(
                    {"days": "At least one day is required."}
                )

            valid_days = {
                "Saturday",
                "Sunday",
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
            }

            invalid_days = set(days) - valid_days

            if invalid_days:
                raise serializers.ValidationError({"days": "Invalid day provided."})

        return attrs
