import json
from rest_framework import serializers
from .models import Course, CourseChatMessage, Semester, StudyMaterial


class SemesterSerializer(serializers.ModelSerializer):
    courses_count = serializers.SerializerMethodField()

    class Meta:
        model = Semester
        fields = [
            "id",
            "user",
            "name",
            "is_current",
            "courses_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "user", "courses_count", "created_at", "updated_at"]

    def get_courses_count(self, obj) -> int:
        return obj.courses.count()


class CourseSerializer(serializers.ModelSerializer):
    semester_name = serializers.CharField(source="semester.name", read_only=True)
    materials_count = serializers.SerializerMethodField()
    analyzed_materials_count = serializers.SerializerMethodField()
    extracted_topics = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = [
            "id",
            "semester",
            "semester_name",
            "user",
            "code",
            "title",
            "color",
            "description",
            "materials_count",
            "analyzed_materials_count",
            "extracted_topics",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "semester",
            "user",
            "semester_name",
            "materials_count",
            "analyzed_materials_count",
            "extracted_topics",
            "created_at",
            "updated_at",
        ]

    def get_materials_count(self, obj) -> int:
        return obj.materials.count()

    def get_analyzed_materials_count(self, obj) -> int:
        return obj.materials.filter(analyzed_at__isnull=False).count()

    def get_extracted_topics(self, obj) -> list[str]:
        topics = set()
        for mat in obj.materials.all():
            if mat.key_topics:
                for t in mat.key_topics:
                    if t and isinstance(t, str):
                        topics.add(t.strip())
            elif mat.ai_analysis:
                for t in mat.ai_analysis.get("key_topics", []):
                    if t and isinstance(t, str):
                        topics.add(t.strip())
        return sorted(list(topics))


class StudyMaterialSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()
    formatted_file_size = serializers.SerializerMethodField()
    course_title = serializers.CharField(source="course.title", read_only=True)
    content = serializers.CharField(source="content_text", required=False, allow_blank=True, default="")
    is_analyzed = serializers.BooleanField(read_only=True)

    class Meta:
        model = StudyMaterial
        fields = [
            "id",
            "course",
            "course_title",
            "user",
            "title",
            "material_type",
            "category",
            "file",
            "file_url",
            "file_size_bytes",
            "formatted_file_size",
            "link_url",
            "content_text",
            "content",
            "tags",
            "word_count",
            "is_analyzed",
            "summary",
            "key_topics",
            "key_concepts",
            "key_questions",
            "difficulty_level",
            "estimated_reading_time",
            "ai_analysis",
            "analyzed_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "user",
            "course",
            "course_title",
            "file_size_bytes",
            "formatted_file_size",
            "word_count",
            "is_analyzed",
            "ai_analysis",
            "analyzed_at",
            "created_at",
            "updated_at",
        ]

    def get_file_url(self, obj) -> str | None:
        if obj.file:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None

    def get_formatted_file_size(self, obj) -> str:
        bytes_size = obj.file_size_bytes or 0
        if bytes_size <= 0 and obj.file:
            try:
                bytes_size = obj.file.size
            except Exception:
                bytes_size = 0

        if bytes_size == 0:
            return ""
        if bytes_size < 1024:
            return f"{bytes_size} B"
        if bytes_size < 1024 * 1024:
            return f"{round(bytes_size / 1024, 1)} KB"
        return f"{round(bytes_size / (1024 * 1024), 1)} MB"


class StudyMaterialCreateSerializer(serializers.ModelSerializer):
    content = serializers.CharField(source="content_text", required=False, allow_blank=True, default="")
    tags = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        default=list,
    )

    class Meta:
        model = StudyMaterial
        fields = [
            "title",
            "material_type",
            "category",
            "file",
            "link_url",
            "content_text",
            "content",
            "tags",
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

    def validate(self, attrs):
        m_type = attrs.get("material_type", "document")
        file_obj = attrs.get("file")
        link_url = attrs.get("link_url")
        content_text = attrs.get("content_text", "").strip()

        if m_type == "document" and not file_obj and not content_text:
            raise serializers.ValidationError("Please upload a file or provide document text.")
        if m_type == "link" and not link_url:
            raise serializers.ValidationError("A valid URL is required for resource link materials.")
        if m_type == "note" and not content_text:
            raise serializers.ValidationError("Note content cannot be empty.")

        return attrs


class CourseChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = CourseChatMessage
        fields = [
            "id",
            "course",
            "user",
            "role",
            "content",
            "created_at",
        ]
        read_only_fields = ["id", "course", "user", "created_at"]


class MaterialStatsSerializer(serializers.Serializer):
    total_materials = serializers.IntegerField()
    total_topics_extracted = serializers.IntegerField()
    total_reading_minutes = serializers.IntegerField()
    total_words_analyzed = serializers.IntegerField()
    subjects = serializers.ListField(child=serializers.DictField())
