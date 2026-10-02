import io
import logging
import mimetypes
import re
import xml.etree.ElementTree as ET
import zipfile
from typing import Any, Dict, List, Optional
from django.db.models import Count, Q, QuerySet, Sum
from django.utils import timezone
from rest_framework.exceptions import NotFound, ValidationError

from ai import services as ai_services
from .models import Course, CourseChatMessage, Semester, StudyMaterial

logger = logging.getLogger(__name__)


def estimate_reading_time(text: str) -> int:
    """Estimates reading time in minutes based on average 200 words/minute."""
    words = len(text.split())
    return max(1, round(words / 200))


def extract_text_from_uploaded_file(file_obj) -> str:
    """
    Extracts text cleanly from PDF, DOCX, Markdown, Plain Text, Code, CSV, etc.
    """
    if not file_obj:
        return ""

    filename = getattr(file_obj, "name", "").lower()

    # 1. PDF Extraction via pypdf
    if filename.endswith(".pdf"):
        try:
            from pypdf import PdfReader

            if hasattr(file_obj, "seek"):
                file_obj.seek(0)
            reader = PdfReader(file_obj)
            extracted_pages = []
            for i, page in enumerate(reader.pages):
                text = page.extract_text()
                if text:
                    extracted_pages.append(text.strip())
                if i >= 60:  # Cap at 60 pages for performance
                    break
            if extracted_pages:
                return "\n\n".join(extracted_pages)
        except Exception as e:
            print(f"PDF extraction error: {e}")

    # 2. DOCX Extraction via standard zipfile and xml parsing
    if filename.endswith(".docx") or filename.endswith(".doc"):
        try:
            if hasattr(file_obj, "seek"):
                file_obj.seek(0)
            with zipfile.ZipFile(file_obj) as docx_zip:
                xml_content = docx_zip.read("word/document.xml")
                tree = ET.fromstring(xml_content)
                namespaces = {
                    "w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
                }
                paragraphs = []
                for p in tree.iterfind(".//w:p", namespaces):
                    texts = [
                        node.text
                        for node in p.iterfind(".//w:t", namespaces)
                        if node.text
                    ]
                    if texts:
                        paragraphs.append("".join(texts))
                if paragraphs:
                    return "\n\n".join(paragraphs)
        except Exception as e:
            print(f"DOCX extraction error: {e}")

    # 3. Plain Text, Markdown, CSV, Code files
    try:
        if hasattr(file_obj, "seek"):
            file_obj.seek(0)
        raw_bytes = file_obj.read()
        if isinstance(raw_bytes, bytes):
            for encoding in ("utf-8", "utf-8-sig", "latin-1", "cp1252", "ascii"):
                try:
                    return raw_bytes.decode(encoding)
                except UnicodeDecodeError:
                    continue
            return raw_bytes.decode("utf-8", errors="ignore")
        return str(raw_bytes)
    except Exception as e:
        print(f"Text file read error: {e}")

    return f"Study material document: {getattr(file_obj, 'name', 'Document')}"


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


def update_user_semester(*, user, semester_id: int, name: str | None = None, is_current: bool | None = None) -> Semester:
    sem = get_user_semester(user=user, semester_id=semester_id)
    if name is not None:
        clean_name = name.strip()
        if not clean_name:
            raise ValidationError({"name": ["Semester name cannot be blank."]})
        sem.name = clean_name
    if is_current is not None:
        if is_current:
            Semester.objects.filter(user=user, is_current=True).exclude(id=sem.id).update(is_current=False)
        sem.is_current = is_current
    sem.save()
    return sem


# ============================================================
# COURSE SERVICES
# ============================================================

def list_user_courses(*, user) -> QuerySet[Course]:
    return Course.objects.filter(user=user).select_related("semester").prefetch_related("materials").order_by("-semester__is_current", "title")


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


def update_course(
    *,
    user,
    course_id: int,
    title: Optional[str] = None,
    code: Optional[str] = None,
    color: Optional[str] = None,
    description: Optional[str] = None,
) -> Course:
    course = get_user_course(user=user, course_id=course_id)
    if title is not None:
        clean_title = title.strip()
        if not clean_title:
            raise ValidationError({"title": ["Course title cannot be blank."]})
        course.title = clean_title
    if code is not None:
        course.code = code.strip().upper()
    if color is not None:
        course.color = color.strip() if color else "#2563eb"
    if description is not None:
        course.description = description.strip()
    course.save()
    return course


# ============================================================
# MATERIAL SERVICES
# ============================================================

def list_course_materials(
    *,
    user,
    course_id: int,
    material_type: Optional[str] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
) -> QuerySet[StudyMaterial]:
    course = get_user_course(user=user, course_id=course_id)
    queryset = StudyMaterial.objects.filter(course=course, user=user)

    if material_type and material_type != "all":
        queryset = queryset.filter(material_type=material_type)

    if category and category != "all":
        queryset = queryset.filter(category=category)

    if search and search.strip():
        term = search.strip()
        queryset = queryset.filter(
            Q(title__icontains=term) | Q(content_text__icontains=term) | Q(summary__icontains=term)
        )

    return queryset


def list_user_all_materials(
    *,
    user,
    category: Optional[str] = None,
    search: Optional[str] = None,
) -> QuerySet[StudyMaterial]:
    queryset = StudyMaterial.objects.filter(user=user).select_related("course", "course__semester")

    if category and category != "all":
        queryset = queryset.filter(category=category)

    if search and search.strip():
        term = search.strip()
        queryset = queryset.filter(
            Q(title__icontains=term) | Q(content_text__icontains=term) | Q(summary__icontains=term)
        )

    return queryset


def get_user_material(*, user, material_id: int) -> StudyMaterial:
    try:
        return StudyMaterial.objects.select_related("course", "course__semester").get(id=material_id, user=user)
    except StudyMaterial.DoesNotExist:
        raise NotFound("Study material not found.")


def create_study_material(
    *,
    user,
    course_id: Optional[int] = None,
    title: str,
    material_type: str = "document",
    category: str = "Lecture Note",
    file=None,
    link_url: Optional[str] = None,
    content_text: str = "",
    tags: Optional[List[str]] = None,
) -> StudyMaterial:
    course = None
    if course_id is not None:
        try:
            course = get_user_course(user=user, course_id=int(course_id))
        except Exception:
            course = None

    if not course:
        curr_sem = Semester.objects.filter(user=user, is_current=True).first() or Semester.objects.filter(user=user).first()
        if not curr_sem:
            curr_sem = Semester.objects.create(user=user, name="Current Semester", is_current=True)
        course = Course.objects.filter(semester=curr_sem, user=user).first()
        if not course:
            course = Course.objects.create(semester=curr_sem, user=user, code="GEN 101", title="General Studies")

    file_size_bytes = 0
    extracted_text = content_text.strip()
    if file:
        file_size_bytes = file.size
        if not extracted_text:
            try:
                extracted_text = extract_text_from_uploaded_file(file)
            except Exception:
                pass

    words = extracted_text.split()
    word_count = len(words)
    reading_time = estimate_reading_time(extracted_text)

    # Dynamic initial difficulty heuristic before AI analysis
    combined_info = f"{title} {category} {extracted_text[:500]}".lower()
    if any(w in combined_info for w in [
        "intro", "introduction", "basics", "fundamental", "overview", "cheat sheet",
        "beginner", "starter", "syllabus", "lab 1", "chapter 1"
    ]):
        initial_difficulty = "Beginner"
    elif any(w in combined_info for w in [
        "advanced", "research", "proof", "thesis", "cryptography", "compiler",
        "deep learning", "neural", "quantum", "optimization", "distributed"
    ]) or category == "Research Paper":
        initial_difficulty = "Advanced"
    else:
        initial_difficulty = "Intermediate"

    return StudyMaterial.objects.create(
        course=course,
        user=user,
        title=title.strip(),
        material_type=material_type,
        category=category,
        difficulty_level=initial_difficulty,
        file=file,
        file_size_bytes=file_size_bytes,
        link_url=link_url.strip() if link_url else None,
        content_text=extracted_text,
        tags=tags or [],
        word_count=word_count,
        estimated_reading_time=reading_time,
    )


def update_study_material(
    *,
    user,
    material_id: int,
    title: Optional[str] = None,
    content_text: Optional[str] = None,
    category: Optional[str] = None,
    tags: Optional[List[str]] = None,
) -> StudyMaterial:
    material = get_user_material(user=user, material_id=material_id)
    update_fields = ["updated_at"]
    if title is not None and title.strip():
        material.title = title.strip()
        update_fields.append("title")
    if content_text is not None:
        material.content_text = content_text
        material.word_count = len(content_text.split())
        material.estimated_reading_time = estimate_reading_time(content_text)
        update_fields.extend(["content_text", "word_count", "estimated_reading_time"])
    if category is not None and category.strip():
        material.category = category.strip()
        update_fields.append("category")
    if tags is not None:
        material.tags = tags
        update_fields.append("tags")
    material.save(update_fields=list(set(update_fields)))
    return material


def update_study_material_notepad(*, user, material_id: int, content_text: str) -> StudyMaterial:
    return update_study_material(user=user, material_id=material_id, content_text=content_text)


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
            if hasattr(material.file, "open"):
                material.file.open("rb")
                file_bytes = material.file.read()
                material.file.close()

            guessed, _ = mimetypes.guess_type(material.file.name)
            if guessed:
                mime_type = guessed
        except Exception as e:
            logger.warning(
                f"Could not read physical file '{material.file.name}': {e}. Falling back to text content."
            )
            file_bytes = None

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
    material.summary = analysis_result.get("summary", "")
    material.key_topics = analysis_result.get("key_topics", [])
    material.difficulty_level = analysis_result.get("difficulty", "Intermediate")
    material.analyzed_at = timezone.now()
    material.save(
        update_fields=[
            "ai_analysis",
            "summary",
            "key_topics",
            "difficulty_level",
            "analyzed_at",
            "updated_at",
        ]
    )

    return material


def get_materials_stats(*, user) -> Dict[str, Any]:
    """Feature statistics for materials across all courses."""
    materials = StudyMaterial.objects.filter(user=user)
    total_materials = materials.count()
    total_reading_minutes = materials.aggregate(total=Sum("estimated_reading_time"))["total"] or 0
    total_words = materials.aggregate(total=Sum("word_count"))["total"] or 0

    # Count total unique topics
    topics_set = set()
    for mat in materials:
        if mat.key_topics:
            for t in mat.key_topics:
                topics_set.add(t)
        elif mat.ai_analysis and mat.ai_analysis.get("key_topics"):
            for t in mat.ai_analysis.get("key_topics"):
                topics_set.add(t)

    # Subject breakdown
    courses = Course.objects.filter(user=user).annotate(mat_count=Count("materials"))
    subjects_data = [
        {"subject": f"{c.code} {c.title}".strip(), "count": c.mat_count, "color": c.color}
        for c in courses
    ]

    return {
        "total_materials": total_materials,
        "total_topics_extracted": len(topics_set),
        "total_reading_minutes": total_reading_minutes,
        "total_words_analyzed": total_words,
        "subjects": subjects_data,
    }


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
        if mat.summary:
            item_text += f"\nSummary: {mat.summary}"
        elif mat.ai_analysis and mat.ai_analysis.get("summary"):
            item_text += f"\nSummary: {mat.ai_analysis.get('summary')}"
        if mat.key_topics:
            item_text += f"\nKey Topics: {', '.join(mat.key_topics)}"
        elif mat.ai_analysis and mat.ai_analysis.get("key_topics"):
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
