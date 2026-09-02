import io
import re
import xml.etree.ElementTree as ET
import zipfile
from typing import Any, Dict, List, Optional
from django.db.models import Count, Q, QuerySet, Sum

from .models import StudyMaterial


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


def analyze_material_content(title: str, subject: str, content: str) -> Dict[str, Any]:
    """
    Intelligent NLP & rule-based analyzer that extracts:
    - Executive Summary
    - Key Topics / Syllabus Areas
    - Key Concept Terms & Definitions
    - Self-Study Review Questions
    - Difficulty Level
    """
    cleaned_content = content.strip() if content else ""
    words = cleaned_content.split()
    word_count = len(words)

    # 1. Topic Extraction
    extracted_topics: List[str] = []

    lines = [line.strip() for line in cleaned_content.split("\n") if line.strip()]
    for line in lines:
        if line.startswith(("#", "-", "*", "•")) or ":" in line:
            clean_line = re.sub(r"^[#\-\*•\d\.\s]+", "", line).split(":")[0].strip()
            if 3 <= len(clean_line) <= 60 and clean_line not in extracted_topics:
                extracted_topics.append(clean_line)

    term_matches = re.findall(r"\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b", cleaned_content)
    common_stops = {
        "The", "This", "That", "These", "Those", "There", "Here", "What", "When",
        "Where", "Which", "Who", "Why", "How", "Note", "Chapter", "Section", "Page",
        "Introduction", "Summary", "Conclusion", "Example", "Exercise", "Problem",
    }
    for term in term_matches:
        if term not in common_stops and len(term) > 3 and term not in extracted_topics:
            extracted_topics.append(term)
            if len(extracted_topics) >= 12:
                break

    if not extracted_topics:
        extracted_topics = [title, subject, f"{subject} Fundamentals", "Core Concepts"]

    # 2. Key Concepts Extraction (Term -> Definition)
    key_concepts: List[Dict[str, str]] = []
    for line in lines:
        if ":" in line or " - " in line or " refers to " in line or " is defined as " in line:
            parts = re.split(r":| - | refers to | is defined as ", line, maxsplit=1)
            if len(parts) == 2:
                term = parts[0].strip()
                definition = parts[1].strip()
                if 2 <= len(term.split()) <= 6 and len(definition) > 10:
                    clean_term = re.sub(r"^[#\-\*•\d\.\s]+", "", term).strip()
                    if not any(c["term"].lower() == clean_term.lower() for c in key_concepts):
                        key_concepts.append({"term": clean_term, "definition": definition})
                        if len(key_concepts) >= 8:
                            break

    if len(key_concepts) < 2:
        for topic in extracted_topics[:4]:
            if not any(c["term"].lower() == topic.lower() for c in key_concepts):
                key_concepts.append({
                    "term": topic,
                    "definition": f"Core academic concept in {subject} focusing on {topic.lower()} principles and practical applications."
                })

    # 3. Executive Summary Generation
    if len(lines) <= 2:
        summary = cleaned_content if cleaned_content else f"Summary and study notes for {title} in {subject}."
    else:
        summary_sentences = []
        for line in lines[:6]:
            if not line.startswith(("#", "http")) and len(line) > 20:
                summary_sentences.append(line)
        if not summary_sentences:
            summary_sentences = lines[:3]
        summary = " ".join(summary_sentences)
        if len(summary) > 450:
            summary = summary[:447] + "..."

    # 4. Review Questions Generation
    key_questions: List[str] = []
    for topic in extracted_topics[:5]:
        key_questions.append(f"How does {topic} function within {subject}, and what are its key properties?")
        key_questions.append(f"What is the primary significance of {topic} in practical problem solving?")

    key_questions = key_questions[:5]
    if not key_questions:
        key_questions = [
            f"What are the main foundational principles discussed in {title}?",
            f"How do the concepts in {subject} apply to exam problem sets?",
        ]

    # 5. Difficulty Level Assignment
    avg_word_length = sum(len(w) for w in words) / max(1, len(words)) if words else 5
    if word_count > 1200 or avg_word_length > 6.8:
        difficulty_level = "Advanced"
    elif word_count > 400 or avg_word_length > 5.5:
        difficulty_level = "Intermediate"
    else:
        difficulty_level = "Beginner"

    return {
        "summary": summary,
        "key_topics": extracted_topics[:10],
        "key_concepts": key_concepts[:8],
        "key_questions": key_questions[:5],
        "difficulty_level": difficulty_level,
        "word_count": word_count,
        "estimated_reading_time": estimate_reading_time(cleaned_content),
    }


def create_material(*, user, validated_data, file=None) -> StudyMaterial:
    """Creates a study material and runs automatic content analysis."""
    content = validated_data.get("content", "").strip()
    title = validated_data.get("title", "Untitled Study Material").strip()
    subject = validated_data.get("subject", "General").strip()

    # If content is empty or short and a file was uploaded, extract text from file
    if file:
        extracted_from_file = extract_text_from_uploaded_file(file)
        if not content and extracted_from_file:
            content = extracted_from_file

    if not content:
        content = f"Uploaded study document: {title} ({subject})"

    analysis = analyze_material_content(title=title, subject=subject, content=content)

    material = StudyMaterial.objects.create(
        user=user,
        title=title,
        subject=subject,
        category=validated_data.get("category", "Lecture Note"),
        content=content,
        file=file,
        tags=validated_data.get("tags", []),
        word_count=analysis["word_count"],
        is_analyzed=True,
        summary=analysis["summary"],
        key_topics=analysis["key_topics"],
        key_concepts=analysis["key_concepts"],
        key_questions=analysis["key_questions"],
        difficulty_level=analysis["difficulty_level"],
        estimated_reading_time=analysis["estimated_reading_time"],
    )
    return material


def list_materials(
    *,
    user,
    subject: Optional[str] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
) -> QuerySet[StudyMaterial]:
    """Lists study materials with subject, category, and keyword filters."""
    qs = StudyMaterial.objects.filter(user=user)

    if subject and subject != "All":
        qs = qs.filter(subject__iexact=subject)

    if category and category != "All":
        qs = qs.filter(category__iexact=category)

    if search:
        search_term = search.strip()
        qs = qs.filter(
            Q(title__icontains=search_term)
            | Q(subject__icontains=search_term)
            | Q(content__icontains=search_term)
            | Q(summary__icontains=search_term)
        )

    return qs.order_by("-created_at")


def get_material_by_id(*, user, material_id: int) -> StudyMaterial:
    """Retrieves a single material belonging to the user."""
    return StudyMaterial.objects.get(id=material_id, user=user)


def update_material(*, material: StudyMaterial, user, validated_data) -> StudyMaterial:
    """Updates a material and re-analyzes if content/title changed."""
    reanalyze = False
    new_content = validated_data.get("content", material.content)
    new_title = validated_data.get("title", material.title)
    new_subject = validated_data.get("subject", material.subject)

    if new_content != material.content or new_title != material.title or new_subject != material.subject:
        reanalyze = True

    for field, value in validated_data.items():
        setattr(material, field, value)

    if reanalyze:
        analysis = analyze_material_content(
            title=material.title,
            subject=material.subject,
            content=material.content,
        )
        material.word_count = analysis["word_count"]
        material.is_analyzed = True
        material.summary = analysis["summary"]
        material.key_topics = analysis["key_topics"]
        material.key_concepts = analysis["key_concepts"]
        material.key_questions = analysis["key_questions"]
        material.difficulty_level = analysis["difficulty_level"]
        material.estimated_reading_time = analysis["estimated_reading_time"]

    material.save()
    return material


def delete_material(*, material: StudyMaterial, user) -> None:
    """Deletes the material record."""
    material.delete()


def analyze_material(*, material: StudyMaterial) -> StudyMaterial:
    """Forces re-analysis of a study material."""
    analysis = analyze_material_content(
        title=material.title,
        subject=material.subject,
        content=material.content,
    )
    material.word_count = analysis["word_count"]
    material.is_analyzed = True
    material.summary = analysis["summary"]
    material.key_topics = analysis["key_topics"]
    material.key_concepts = analysis["key_concepts"]
    material.key_questions = analysis["key_questions"]
    material.difficulty_level = analysis["difficulty_level"]
    material.estimated_reading_time = analysis["estimated_reading_time"]
    material.save()
    return material


def get_material_stats(*, user) -> Dict[str, Any]:
    """Returns aggregated material metrics for the dashboard."""
    materials = StudyMaterial.objects.filter(user=user)
    total_materials = materials.count()

    all_topics = set()
    for m in materials:
        for t in m.key_topics:
            all_topics.add(t)

    total_reading_minutes = materials.aggregate(total=Sum("estimated_reading_time"))["total"] or 0

    subjects_count = (
        materials.values("subject")
        .annotate(count=Count("id"))
        .order_by("-count")
    )

    return {
        "total_materials": total_materials,
        "total_topics_extracted": len(all_topics),
        "total_reading_minutes": total_reading_minutes,
        "total_words_analyzed": materials.aggregate(total=Sum("word_count"))["total"] or 0,
        "subjects": list(subjects_count),
    }
