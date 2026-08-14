from rest_framework import serializers

from .models import GradePlan


class GradePlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = GradePlan
        fields = [
            "id",
            "name",
            "target_gpa",
            "total_credits",
            "completed_credits",
            "current_gpa",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]

    def validate(self, attrs):
        total_credits = attrs.get(
            "total_credits",
            getattr(self.instance, "total_credits", None),
        )
        completed_credits = attrs.get(
            "completed_credits",
            getattr(self.instance, "completed_credits", None),
        )

        if (
            total_credits is not None
            and completed_credits is not None
            and completed_credits > total_credits
        ):
            raise serializers.ValidationError(
                {
                    "completed_credits": (
                        "Completed credits cannot exceed total credits."
                    )
                }
            )

        return attrs
