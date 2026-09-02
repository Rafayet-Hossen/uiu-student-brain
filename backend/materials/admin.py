from django.contrib import admin

from .models import StudyMaterial


@admin.register(StudyMaterial)
class StudyMaterialAdmin(admin.ModelAdmin):
    list_display = ["id", "title", "subject", "category", "word_count", "difficulty_level", "is_analyzed", "created_at"]
    list_filter = ["subject", "category", "difficulty_level", "is_analyzed"]
    search_fields = ["title", "subject", "content", "summary"]
