from django.conf import settings
from django.db import models


class Semester(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="semesters",
    )
    name = models.CharField(max_length=100)  # e.g., "Summer 2026", "Spring 2026"
    is_current = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-is_current", "-created_at"]

    def __str__(self):
        return f"{self.name} ({self.user.email})"


class Course(models.Model):
    semester = models.ForeignKey(
        Semester,
        on_delete=models.CASCADE,
        related_name="courses",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="courses",
    )
    code = models.CharField(max_length=50, blank=True)  # e.g., "CSE 220", "BIO 101"
    title = models.CharField(max_length=255)  # e.g., "Data Structures & Algorithms"
    color = models.CharField(max_length=50, default="#2563eb")
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]

    def __str__(self):
        code_prefix = f"[{self.code}] " if self.code else ""
        return f"{code_prefix}{self.title}"


class StudyMaterial(models.Model):
    MATERIAL_TYPES = [
        ("document", "Document / PDF"),
        ("link", "Resource Link"),
        ("note", "Study Note"),
    ]

    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name="materials",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="study_materials",
    )
    title = models.CharField(max_length=255)
    material_type = models.CharField(
        max_length=20,
        choices=MATERIAL_TYPES,
        default="document",
    )
    file = models.FileField(
        upload_to="materials/%Y/%m/",
        null=True,
        blank=True,
    )
    file_size_bytes = models.BigIntegerField(default=0)
    link_url = models.URLField(max_length=1000, null=True, blank=True)
    content_text = models.TextField(blank=True)
    ai_analysis = models.JSONField(default=dict, blank=True)
    analyzed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} [{self.material_type}]"


class CourseChatMessage(models.Model):
    ROLE_CHOICES = [
        ("user", "User"),
        ("assistant", "AI Assistant"),
    ]

    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name="chat_messages",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="course_chat_messages",
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.role.capitalize()}: {self.content[:50]}"
