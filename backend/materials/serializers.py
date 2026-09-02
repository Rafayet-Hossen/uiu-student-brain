import json
from rest_framework import serializers

from .models import StudyMaterial


class StudyMaterialSerializer(serializers.ModelSerializer):
    content = serializers.CharField(required=False, allow_blank=True, default="")
    tags = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        default=list,
    )
    file = serializers.FileField(required=False, allow_null=True, default=None)

    class Meta:
        model = StudyMaterial
        fields = [
            "id",
            "title",
            "subject",
            "category",
            "content",
            "file",
            "tags",
            "word_count",
            "is_analyzed",
            "summary",
            "key_topics",
            "key_concepts",
            "key_questions",
            "difficulty_level",
            "estimated_reading_time",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "word_count",
            "is_analyzed",
            "summary",
            "key_topics",
            "key_concepts",
            "key_questions",
            "difficulty_level",
            "estimated_reading_time",
            "created_at",
            "updated_at",
        ]

    def to_internal_value(self, data):
        mutable_data = {}
        for key in data:
            if key == "file":
                mutable_data[key] = data.get(key)
            else:
                val = data.get(key)
                if val == "":
                    mutable_data[key] = ""
                else:
                    mutable_data[key] = val

        if "tags" in mutable_data:
            tags_val = mutable_data["tags"]
            if isinstance(tags_val, str):
                try:
                    parsed = json.loads(tags_val)
                    mutable_data["tags"] = parsed if isinstance(parsed, list) else [parsed]
                except Exception:
                    mutable_data["tags"] = [t.strip() for t in tags_val.split(",") if t.strip()]
            elif isinstance(tags_val, list):
                mutable_data["tags"] = tags_val
            else:
                mutable_data["tags"] = []

        return super().to_internal_value(mutable_data)


class MaterialStatsSerializer(serializers.Serializer):
    total_materials = serializers.IntegerField()
    total_topics_extracted = serializers.IntegerField()
    total_reading_minutes = serializers.IntegerField()
    total_words_analyzed = serializers.IntegerField()
    subjects = serializers.ListField(child=serializers.DictField())
