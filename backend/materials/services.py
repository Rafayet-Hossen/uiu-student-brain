import mimetypes
from typing import Any, Dict, List, Optional
from django.db.models import Q, QuerySet
from django.utils import timezone
from rest_framework.exceptions import NotFound, ValidationError

from ai import services as ai_services
from .models import Course, CourseChatMessage, Semester, StudyMaterial


# ============================================================
# SEMESTER SERVICES
# ============================================================

def list_user_semesters(*, user) -> QuerySet[Semester]:
    return Semester.objects.filter(user=user).prefetch_related("courses")


def get_user_semester(*, user, semester_id: int) -> Semester:
    try:
        return Semester.objects.prefetch_related("courses").get(id=semester_id, user=user)
    except Semester.DoesNotExist:
        raise NotFound("Semester not found.")


def create_user_semester(*, user, name: str, is_current: bool = True) -> Semester:
    clean_name = name.strip()
    if not clean_name:
        raise ValidationError({"name": ["Semester name cannot be blank."]})

    if is_current:
        # Mark other semesters as not current
        Semester.objects.filter(user=user, is_current=True).update(is_current=False)

    return Semester.objects.create(
        user=user,
        name=clean_name,
        is_current=is_current,
    )


def delete_user_semester(*, user, semester_id: int) -> None:
    sem = get_user_semester(user=user, semester_id=semester_id)
    sem.delete()


# ============================================================
# COURSE SERVICES
# ============================================================

def list_semester_courses(*, user, semester_id: int) -> QuerySet[Course]:
    sem = get_user_semester(user=user, semester_id=semester_id)
    return Course.objects.filter(semester=sem, user=user).prefetch_related("materials")


def get_user_course(*, user, course_id: int) -> Course:
    try:
        return Course.objects.select_related("semester").prefetch_related("materials").get(id=course_id, user=user)
    except Course.DoesNotExist:
        raise NotFound("Course not found.")


def create_course(
    *,
    user,
    semester_id: int,
    title: str,
    code: str = "",
    color: str = "#2563eb",
    description: str = "",
) -> Course:
    sem = get_user_semester(user=user, semester_id=semester_id)
    clean_title = title.strip()
    if not clean_title:
        raise ValidationError({"title": ["Course title cannot be blank."]})

    return Course.objects.create(
        semester=sem,
        user=user,
        code=code.strip().upper(),
        title=clean_title,
        color=color.strip() if color else "#2563eb",
        description=description.strip(),
    )


def delete_course(*, user, course_id: int) -> None:
    course = get_user_course(user=user, course_id=course_id)
    for mat in course.materials.all():
        if mat.file:
            try:
                mat.file.delete(save=False)
            except Exception:
                pass
    course.delete()


# ============================================================
# MATERIAL SERVICES
# ============================================================

def list_course_materials(
    *,
    user,
    course_id: int,
    material_type: Optional[str] = None,
    search: Optional[str] = None,
) -> QuerySet[StudyMaterial]:
    course = get_user_course(user=user, course_id=course_id)
    queryset = StudyMaterial.objects.filter(course=course, user=user)

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
        return StudyMaterial.objects.select_related("course").get(id=material_id, user=user)
    except StudyMaterial.DoesNotExist:
        raise NotFound("Study material not found.")


def create_study_material(
    *,
    user,
    course_id: int,
    title: str,
    material_type: str = "document",
    file=None,
    link_url: Optional[str] = None,
    content_text: str = "",
) -> StudyMaterial:
    course = get_user_course(user=user, course_id=course_id)

    file_size_bytes = 0
    if file:
        file_size_bytes = file.size

    return StudyMaterial.objects.create(
        course=course,
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
    subject_hint = f"{material.course.code} {material.course.title}".strip()

    file_bytes = None
    mime_type = "application/pdf"
    raw_text = None

    if material.file:
        try:
            material.file.open("rb")
            file_bytes = material.file.read()
            material.file.close()

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
        raw_text = f"Study document titled: {material.title} for course {subject_hint}"

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


# ============================================================
# COURSE AI CHAT SERVICES
# ============================================================

def list_course_chat_messages(*, user, course_id: int) -> QuerySet[CourseChatMessage]:
    course = get_user_course(user=user, course_id=course_id)
    return CourseChatMessage.objects.filter(course=course, user=user)


def send_course_chat_message(*, user, course_id: int, user_message: str) -> CourseChatMessage:
    clean_msg = user_message.strip()
    if not clean_msg:
        raise ValidationError({"message": ["Message cannot be empty."]})

    course = get_user_course(user=user, course_id=course_id)

    # 1. Save student message
    CourseChatMessage.objects.create(
        course=course,
        user=user,
        role="user",
        content=clean_msg,
    )

    # 2. Gather course knowledge base context
    materials_context = []
    for mat in course.materials.all()[:8]:
        item_text = f"Title: {mat.title} ({mat.material_type})"
        if mat.ai_analysis and mat.ai_analysis.get("summary"):
            item_text += f"\nSummary: {mat.ai_analysis.get('summary')}"
        if mat.ai_analysis and mat.ai_analysis.get("key_topics"):
            item_text += f"\nKey Topics: {', '.join(mat.ai_analysis.get('key_topics'))}"
        if mat.content_text:
            item_text += f"\nExcerpt: {mat.content_text[:400]}"
        materials_context.append(item_text)

    # 3. Gather recent chat history
    recent_msgs = list(
        CourseChatMessage.objects.filter(course=course, user=user).order_by("-created_at")[:6]
    )
    recent_msgs.reverse()
    chat_history = [{"role": m.role, "content": m.content} for m in recent_msgs]

    # 4. Invoke AI course tutor
    ai_reply_text = ai_services.chat_with_course_tutor(
        course_title=course.title,
        course_code=course.code,
        materials_context=materials_context,
        chat_history=chat_history,
        user_message=clean_msg,
    )

    # 5. Save assistant reply
    return CourseChatMessage.objects.create(
        course=course,
        user=user,
        role="assistant",
        content=ai_reply_text,
    )
