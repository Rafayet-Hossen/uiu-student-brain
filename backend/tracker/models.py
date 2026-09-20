from django.conf import settings
from django.db import models


class StudySession(models.Model):
    STATUS_CHOICES = [
        ("scheduled", "Scheduled"),
        ("in_progress", "In Progress"),
        ("completed", "Completed"),
        ("missed", "Missed / Expired"),
        ("cancelled", "Cancelled"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="study_sessions",
    )
    course = models.ForeignKey(
        "materials.Course",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="study_sessions",
    )
    material = models.ForeignKey(
        "materials.StudyMaterial",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="study_sessions",
    )
    subject = models.CharField(max_length=255)
    duration_minutes = models.PositiveIntegerField(default=60)
    session_date = models.DateField()
    start_time = models.TimeField(null=True, blank=True)
    end_time = models.TimeField(null=True, blank=True)
    actual_started_at = models.DateTimeField(null=True, blank=True)
    actual_completed_at = models.DateTimeField(null=True, blank=True)
    extended_minutes = models.PositiveIntegerField(default=0)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="scheduled",
    )
    notes = models.TextField(blank=True)

    # Post-session Quiz performance
    quiz_taken = models.BooleanField(default=False)
    quiz_score = models.FloatField(null=True, blank=True)
    quiz_accuracy = models.FloatField(null=True, blank=True)
    quiz_results = models.JSONField(default=dict, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-session_date", "start_time", "-created_at"]

    def __str__(self):
        return f"{self.subject} ({self.status}) - {self.duration_minutes} min on {self.session_date}"

    @property
    def effective_duration_minutes(self) -> int:
        if self.status == "completed":
            return self.duration_minutes + self.extended_minutes
        return 0


class StudyGoal(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="study_goal",
    )
    daily_goal_minutes = models.PositiveIntegerField(default=60)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user} - {self.daily_goal_minutes} min/day"