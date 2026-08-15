from django.conf import settings
from django.db import models


class StudySession(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="study_sessions",
    )
    subject = models.CharField(max_length=255)
    duration_minutes = models.PositiveIntegerField()
    session_date = models.DateField()
    notes = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-session_date", "-created_at"]

    def __str__(self):
        return f"{self.subject} - {self.duration_minutes} min"