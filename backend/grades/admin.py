from django.contrib import admin

from .models import GradePlan


@admin.register(GradePlan)
class GradePlanAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "user",
        "target_gpa",
        "current_gpa",
        "completed_credits",
        "total_credits",
        "updated_at",
    )
    list_filter = ("updated_at",)
    search_fields = ("name", "user__email")
