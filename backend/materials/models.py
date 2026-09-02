from django.conf import settings
from django.db import models


class StudyMaterial(models.Model):
    CATEGORIES = [
        ("Lecture Note", "Lecture Note"),
        ("Textbook Chapter", "Textbook Chapter"),
        ("Cheat Sheet", "Cheat Sheet"),
        ("Lab Report", "Lab Report"),
        ("Research Paper", "Research Paper"),
        ("Other", "Other"),
    ]

    DIFFICULTY_CHOICES = [
        ("Beginner", "Beginner"),
        ("Intermediate", "Intermediate"),
        ("Advanced", "Advanced"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="study_materials",
    )
    title = models.CharField(max_length=255)
    subject = models.CharField(max_length=255)
    category = models.CharField(
        max_length=50,
        choices=CATEGORIES,
        default="Lecture Note",
    )
    content = models.TextField(blank=True, default="")
    file = models.FileField(upload_to="materials/", null=True, blank=True)
    tags = models.JSONField(default=list, blank=True)

    word_count = models.IntegerField(default=0)
    is_analyzed = models.BooleanField(default=False)
    summary = models.TextField(blank=True, default="")
    key_topics = models.JSONField(default=list, blank=True)
    key_concepts = models.JSONField(default=list, blank=True)
    key_questions = models.JSONField(default=list, blank=True)
    difficulty_level = models.CharField(
        max_length=20,
        choices=DIFFICULTY_CHOICES,
        default="Intermediate",
    )
    estimated_reading_time = models.IntegerField(default=5)  # in minutes

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} ({self.subject})"
