from django.contrib import admin

from .models import StudySession


@admin.register(StudySession)
class StudySessionAdmin(admin.ModelAdmin):
    list_display = (
        "subject",
        "user",
        "duration_minutes",
        "session_date",
        "created_at",
    )
    list_filter = ("session_date",)
    search_fields = ("subject", "user__email")
