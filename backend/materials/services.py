import os
import mimetypes
from typing import Any, Dict, Optional
from django.db.models import QuerySet, Q
from django.utils import timezone
from rest_framework.exceptions import NotFound, PermissionDenied, ValidationError

from ai import services as ai_services
from .models import StudyMaterial, StudyProject


# ============================================================
# PROJECT SERVICES
# ============================================================

def list_user_projects(*, user) -> QuerySet[StudyProject]:
    return StudyProject.objects.filter(user=user).prefetch_related("materials")


def get_user_project(*, user, project_id: int) -> StudyProject:
    try:
        return StudyProject.objects.prefetch_related("materials").get(id=project_id, user=user)
    except StudyProject.DoesNotExist:
        raise NotFound("Study project not found.")


def create_study_project(
    *,
    user,
    title: str,
    subject: str,
    description: str = "",
    color: str = "#2563eb",
) -> StudyProject:
    if not title.strip():
        raise ValidationError({"title": ["Title cannot be blank."]})
    if not subject.strip():
        raise ValidationError({"subject": ["Subject cannot be blank."]})

    return StudyProject.objects.create(
        user=user,
        title=title.strip(),
        subject=subject.strip(),
        description=description.strip(),
        color=color.strip() if color else "#2563eb",
    )


def delete_study_project(*, user, project_id: int) -> None:
    project = get_user_project(user=user, project_id=project_id)
    # Delete uploaded files on disk if any
    for mat in project.materials.all():
        if mat.file:
            try:
                mat.file.delete(save=False)
            except Exception:
                pass
    project.delete()


# ============================================================
# MATERIAL SERVICES
# ============================================================

def list_project_materials(
    *,
    user,
    project_id: int,
    material_type: Optional[str] = None,
    search: Optional[str] = None,
) -> QuerySet[StudyMaterial]:
    project = get_user_project(user=user, project_id=project_id)
    queryset = StudyMaterial.objects.filter(project=project, user=user)

    if material_type and material_type != "all":
        queryset = queryset.filter(material_type=material_type)

    if search and search.strip():
        term = search.strip()
        queryset = queryset.filter(
            Q(title__icontains=term) | Q(content_text__icontains=term)
        )

    return queryset


def get_user_material(*, user, material_id: int) -> StudyMaterial:
    try:
        return StudyMaterial.objects.select_related("project").get(id=material_id, user=user)
    except StudyMaterial.DoesNotExist:
        raise NotFound("Study material not found.")


def create_study_material(
    *,
    user,
    project_id: int,
    title: str,
    material_type: str = "document",
    file=None,
    link_url: Optional[str] = None,
    content_text: str = "",
) -> StudyMaterial:
    project = get_user_project(user=user, project_id=project_id)

    file_size_bytes = 0
    if file:
        file_size_bytes = file.size

    return StudyMaterial.objects.create(
        project=project,
        user=user,
        title=title.strip(),
        material_type=material_type,
        file=file,
        file_size_bytes=file_size_bytes,
        link_url=link_url.strip() if link_url else None,
        content_text=content_text.strip(),
    )


def delete_study_material(*, user, material_id: int) -> None:
    material = get_user_material(user=user, material_id=material_id)
    if material.file:
        try:
            material.file.delete(save=False)
        except Exception:
            pass
    material.delete()


def analyze_material_with_ai(*, user, material_id: int) -> StudyMaterial:
    """Invokes Gemini AI to extract topics, summary, formulas, and difficulty."""
    material = get_user_material(user=user, material_id=material_id)
    subject_hint = material.project.subject

    file_bytes = None
    mime_type = "application/pdf"
    raw_text = None

    if material.file:
        try:
            material.file.open("rb")
            file_bytes = material.file.read()
            material.file.close()

            # Guess mime type
            guessed, _ = mimetypes.guess_type(material.file.name)
            if guessed:
                mime_type = guessed
        except Exception as e:
            raise ValidationError(f"Failed to read file for AI analysis: {e}")

    if material.content_text:
        raw_text = material.content_text

    if material.material_type == "link":
        link_info = f"Course Reference: {material.title}\nURL: {material.link_url}"
        if material.content_text:
            link_info += f"\nDescription: {material.content_text}"
        raw_text = link_info

    if not file_bytes and not raw_text:
        raw_text = f"Subject topic study document titled: {material.title}"

    # Call AI service
    analysis_result = ai_services.extract_material_topics(
        raw_text=raw_text,
        file_bytes=file_bytes,
        mime_type=mime_type,
        subject_hint=subject_hint,
    )

    material.ai_analysis = analysis_result
    material.analyzed_at = timezone.now()
    material.save(update_fields=["ai_analysis", "analyzed_at", "updated_at"])

    return material
