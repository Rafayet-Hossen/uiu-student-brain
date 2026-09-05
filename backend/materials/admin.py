from django.contrib import admin
from .models import Course, CourseChatMessage, Semester, StudyMaterial


@admin.register(Semester)
class SemesterAdmin(admin.ModelAdmin):
    list_display = ["id", "name", "user", "is_current", "created_at"]
    list_filter = ["is_current", "created_at"]
    search_fields = ["name", "user__email"]


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ["id", "code", "title", "semester", "user", "created_at"]
    list_filter = ["semester", "created_at"]
    search_fields = ["code", "title", "user__email"]


@admin.register(StudyMaterial)
class StudyMaterialAdmin(admin.ModelAdmin):
    list_display = ["id", "title", "course", "material_type", "category", "difficulty_level", "analyzed_at", "created_at"]
    list_filter = ["material_type", "category", "difficulty_level"]
    search_fields = ["title", "course__title", "content_text", "summary"]


@admin.register(CourseChatMessage)
class CourseChatMessageAdmin(admin.ModelAdmin):
    list_display = ["id", "course", "user", "role", "created_at"]
    list_filter = ["role", "created_at"]
    search_fields = ["course__title", "user__email", "content"]
