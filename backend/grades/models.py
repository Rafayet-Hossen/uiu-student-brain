from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class GradePlan(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="grade_plans",
    )
    name = models.CharField(max_length=100, default="My Grade Plan")
    target_gpa = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        validators=[
            MinValueValidator(0),
            MaxValueValidator(4),
        ],
    )
    total_credits = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        validators=[MinValueValidator(0)],
    )
    completed_credits = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        default=0,
    )
    current_gpa = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        validators=[
            MinValueValidator(0),
            MaxValueValidator(4),
        ],
        default=0,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]

    def __str__(self):
        return f"{self.name} - {self.user}"


class CourseGrade(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="course_grades",
    )
    plan = models.ForeignKey(
        GradePlan,
        on_delete=models.CASCADE,
        related_name="courses",
        null=True,
        blank=True,
    )
    course_code = models.CharField(max_length=50)
    course_name = models.CharField(max_length=255)
    credits = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        default=3.0,
        validators=[MinValueValidator(0.5), MaxValueValidator(6.0)],
    )
    grade_point = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        validators=[MinValueValidator(0.0), MaxValueValidator(4.0)],
    )
    grade_letter = models.CharField(max_length=10, blank=True, default="")
    semester = models.CharField(max_length=100, blank=True, default="")
    is_retake = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.course_code} - {self.course_name} ({self.grade_point})"
