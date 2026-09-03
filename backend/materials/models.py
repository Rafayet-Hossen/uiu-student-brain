from django.conf import settings
from django.db import models


class StudyProject(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="study_projects",
    )
    title = models.CharField(max_length=255)
    subject = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    color = models.CharField(max_length=50, default="#2563eb")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]

    def __str__(self):
        return f"{self.title} ({self.subject})"


class StudyMaterial(models.Model):
    MATERIAL_TYPES = [
        ("document", "Document / PDF"),
        ("link", "Resource Link"),
        ("note", "Study Note"),
    ]

    project = models.ForeignKey(
        StudyProject,
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
