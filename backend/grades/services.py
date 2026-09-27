import json
import re
from decimal import Decimal
import logging
from typing import Any, Dict, List, Optional
from .models import CourseGrade, GradePlan

logger = logging.getLogger(__name__)

DEFAULT_COURSE_CATALOG = [
    {
        "course_code": "CSE 220",
        "course_name": "Data Structures & Algorithms",
        "credits": Decimal("3.0"),
        "grade_point": Decimal("2.33"),
        "grade_letter": "C+",
        "semester": "Spring 2026",
    },
    {
        "course_code": "MATH 187",
        "course_name": "Linear Algebra & Differential Equations",
        "credits": Decimal("3.0"),
        "grade_point": Decimal("2.67"),
        "grade_letter": "B-",
        "semester": "Fall 2025",
    },
    {
        "course_code": "CSE 225",
        "course_name": "Algorithm Design & Analysis",
        "credits": Decimal("3.0"),
        "grade_point": Decimal("2.00"),
        "grade_letter": "C",
        "semester": "Spring 2026",
    },
    {
        "course_code": "PHY 102",
        "course_name": "Physics II: Electromagnetism & Optics",
        "credits": Decimal("3.0"),
        "grade_point": Decimal("2.33"),
        "grade_letter": "C+",
        "semester": "Summer 2025",
    },
    {
        "course_code": "ENG 101",
        "course_name": "Academic English & Technical Writing",
        "credits": Decimal("3.0"),
        "grade_point": Decimal("3.33"),
        "grade_letter": "B+",
        "semester": "Fall 2025",
    },
    {
        "course_code": "CSE 111",
        "course_name": "Object-Oriented Programming (OOP)",
        "credits": Decimal("3.0"),
        "grade_point": Decimal("3.70"),
        "grade_letter": "A-",
        "semester": "Fall 2025",
    },
]
GRADE_POINTS_MAP = {
    "A": Decimal("4.00"),
    "A-": Decimal("3.67"),
    "B+": Decimal("3.33"),
    "B": Decimal("3.00"),
    "B-": Decimal("2.67"),
    "C+": Decimal("2.33"),
    "C": Decimal("2.00"),
    "C-": Decimal("1.67"),
    "D+": Decimal("1.33"),
    "D": Decimal("1.00"),
    "F": Decimal("0.00"),
}


def seed_initial_courses_for_user(user):
    """Auto-seeds realistic university courses with varied grades if the user has no recorded courses."""
    if CourseGrade.objects.filter(user=user).exists():
        return
def letter_to_point(letter: str) -> Decimal:
    clean = letter.strip().upper()
    return GRADE_POINTS_MAP.get(clean, Decimal("2.00"))


def point_to_letter(point: float) -> str:
    if point >= 3.85:
        return "A"
    elif point >= 3.50:
        return "A-"
    elif point >= 3.15:
        return "B+"
    elif point >= 2.85:
        return "B"
    elif point >= 2.50:
        return "B-"
    elif point >= 2.15:
        return "C+"
    elif point >= 1.85:
        return "C"
    elif point >= 1.50:
        return "C-"
    elif point >= 1.15:
        return "D+"
    elif point >= 0.70:
        return "D"
    return "F"


def parse_and_import_transcript(user, file_obj=None, raw_text: str = "") -> List[CourseGrade]:
    """
    Parses a student transcript (PDF, screenshot images: PNG, JPG, JPEG, WEBP, HEIC, HEIF, HEUC, CSV, TXT)
    or raw pasted text, and creates/updates CourseGrade records for the user.
    Courses with low or failing grades are automatically designated as is_retake=True.
    """
    extracted_text = ""
    is_multimodal = False
    file_bytes = None
    mime_type = ""

    if file_obj:
        fname = getattr(file_obj, "name", "").lower()

        # 1. HEIC / HEIF / HEUC screenshots from iPhone/mobile
        if fname.endswith((".heic", ".heif", ".heuc")):
            try:
                import io
                from PIL import Image
                import pillow_heif
                pillow_heif.register_heif_opener()
                img = Image.open(file_obj)
                buf = io.BytesIO()
                img.convert("RGB").save(buf, format="JPEG")
                file_bytes = buf.getvalue()
                mime_type = "image/jpeg"
                is_multimodal = True
            except Exception as e:
                logger.warning(f"HEIC/HEIF conversion fallback: {e}")
                try:
                    file_obj.seek(0)
                    file_bytes = file_obj.read()
                    mime_type = "image/heic"
                    is_multimodal = True
                except Exception:
                    pass

        # 2. Standard and extended image formats (PNG, JPG, JPEG, WEBP, BMP, TIFF, GIF)
        elif fname.endswith((".png", ".jpg", ".jpeg", ".webp", ".bmp", ".tiff", ".tif", ".gif")):
            try:
                file_bytes = file_obj.read()
                ext = fname.split(".")[-1]
                if ext in ["jpg", "jpeg"]:
                    mime_type = "image/jpeg"
                elif ext in ["tiff", "tif"]:
                    mime_type = "image/tiff"
                else:
                    mime_type = f"image/{ext}"
                is_multimodal = True
            except Exception as e:
                logger.warning(f"Image read error: {e}")

        # 3. PDF document (UIU portal printout or scanned transcript)
        elif fname.endswith(".pdf"):
            try:
                import pypdf
                reader = pypdf.PdfReader(file_obj)
                extracted_text = "\n".join(page.extract_text() or "" for page in reader.pages)
            except Exception as e:
                logger.warning(f"PDF extraction error in transcript: {e}")

            try:
                file_obj.seek(0)
                file_bytes = file_obj.read()
                mime_type = "application/pdf"
                is_multimodal = True
            except Exception as e:
                logger.warning(f"PDF bytes read failed: {e}")

        # 4. CSV spreadsheet
        elif fname.endswith((".csv", ".tsv")):
            try:
                raw_bytes = file_obj.read()
                if isinstance(raw_bytes, bytes):
                    for enc in ["utf-8-sig", "utf-8", "cp1252", "latin-1", "iso-8859-1"]:
                        try:
                            extracted_text = raw_bytes.decode(enc)
                            break
                        except (UnicodeDecodeError, LookupError):
                            continue
                    if not extracted_text:
                        extracted_text = raw_bytes.decode("utf-8", errors="ignore")
                else:
                    extracted_text = str(raw_bytes)
            except Exception as e:
                logger.warning(f"CSV read error in transcript: {e}")

        # 5. TXT or generic MIME fallback
        else:
            content_type = getattr(file_obj, "content_type", "").lower()
            if content_type.startswith("image/"):
                try:
                    file_bytes = file_obj.read()
                    mime_type = content_type
                    is_multimodal = True
                except Exception:
                    pass
            elif "pdf" in content_type:
                try:
                    import pypdf
                    reader = pypdf.PdfReader(file_obj)
                    extracted_text = "\n".join(page.extract_text() or "" for page in reader.pages)
                except Exception:
                    pass
                try:
                    file_obj.seek(0)
                    file_bytes = file_obj.read()
                    mime_type = "application/pdf"
                    is_multimodal = True
                except Exception:
                    pass
            else:
                try:
                    raw_content = file_obj.read()
                    if isinstance(raw_content, bytes):
                        for enc in ["utf-8-sig", "utf-8", "cp1252", "latin-1"]:
                            try:
                                extracted_text = raw_content.decode(enc)
                                break
                            except (UnicodeDecodeError, LookupError):
                                continue
                        if not extracted_text:
                            extracted_text = raw_content.decode("utf-8", errors="ignore")
                    else:
                        extracted_text = str(raw_content)
                except Exception:
                    extracted_text = ""

    elif raw_text:
        extracted_text = raw_text.strip()

    if not is_multimodal and not extracted_text:
        return []

    plan = GradePlan.objects.filter(user=user).first()
    lines = [l.strip() for l in extracted_text.splitlines() if l.strip()]
    parsed_items = []

    # 1. Check if Gemini AI can structure the transcript (multimodal image/PDF or text)
    try:
        from ai.client import FALLBACK_MODEL, PRIMARY_MODEL, get_gemini_client
        from google.genai import types

        client = get_gemini_client()
        if client:
            ai_prompt = (
                "You are an expert university transcript and grade report analyzer. "
                "Carefully inspect this academic transcript, grade sheet, or student portal screenshot.\n"
                "Extract ALL university courses listed (completed, failed, or retaken).\n"
                "For each course, extract:\n"
                "- course_code: Course code string (e.g. 'CSE 220', 'MATH 187', 'PHY 101')\n"
                "- course_name: Course title string (e.g. 'Data Structures', 'Linear Algebra')\n"
                "- credits: float credit hours (e.g. 3.0, 1.5, 1.0, 4.0; default 3.0)\n"
                "- grade_point: float GPA point from 0.00 to 4.00 (e.g. 2.00, 2.33, 3.67, 0.00)\n"
                "- grade_letter: letter grade string (e.g. 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'F')\n"
                "- semester: semester string if visible (e.g. 'Fall 2025', 'Spring 2025') or empty string\n"
                "- is_retake: boolean, set to true if grade_point < 3.00, grade is F/D/C, or explicitly marked as retake/repeated/failed\n\n"
                "Return ONLY a strict JSON array of objects with keys: "
                "[\"course_code\", \"course_name\", \"credits\", \"grade_point\", \"grade_letter\", \"semester\", \"is_retake\"]."
            )

            contents = []
            if is_multimodal and file_bytes:
                contents.append(types.Part.from_bytes(data=file_bytes, mime_type=mime_type))
            if extracted_text:
                contents.append(f"Transcript Content:\n{extracted_text[:15000]}")
            contents.append(ai_prompt)

            models_to_try = [PRIMARY_MODEL, FALLBACK_MODEL]
            for m in models_to_try:
                try:
                    response = client.models.generate_content(
                        model=m,
                        contents=contents,
                    )
                    raw_resp = (response.text or "").strip()
                    if "```json" in raw_resp:
                        raw_resp = raw_resp.split("```json")[1].split("```")[0].strip()
                    elif "```" in raw_resp:
                        raw_resp = raw_resp.split("```")[1].split("```")[0].strip()
                    data = json.loads(raw_resp)
                    if isinstance(data, list) and len(data) > 0:
                        parsed_items = data
                        break
                except Exception as gen_err:
                    logger.warning(f"AI transcript extraction model {m} failed: {gen_err}")
    except Exception as e:
        logger.warning(f"AI transcript extraction fallback: {e}")

    # 2. Smart CSV & Delimiter fallback parsing for text/CSV
    if not parsed_items and extracted_text:
        # 2a. Attempt structured CSV parsing (handles quotes, commas, header rows)
        try:
            import csv
            import io
            csv_reader = csv.reader(io.StringIO(extracted_text))
            header_map = {}
            for row in csv_reader:
                if not row:
                    continue
                cleaned = [c.strip() for c in row if c.strip()]
                if not cleaned:
                    continue
                row_lower = [c.lower() for c in cleaned]
                row_str = " ".join(row_lower)
                # Check if this row is a header
                if ("code" in row_str or "course" in row_str) and ("grade" in row_str or "gpa" in row_str or "credit" in row_str or "point" in row_str):
                    for idx, col in enumerate(row_lower):
                        if "code" in col or (col == "course" and "name" not in col and "title" not in col):
                            header_map["code"] = idx
                        elif "title" in col or "name" in col or "course name" in col:
                            header_map["name"] = idx
                        elif "credit" in col or "cr" in col or "unit" in col:
                            header_map["credits"] = idx
                        elif "grade point" in col or "gpa" in col or "point" in col:
                            header_map["gp"] = idx
                        elif "grade" in col or "letter" in col or "letter grade" in col:
                            header_map["gl"] = idx
                        elif "sem" in col or "trimester" in col or "term" in col:
                            header_map["sem"] = idx
                    continue

                code = ""
                name = ""
                cr = 3.0
                gp = 2.50
                gl = "B-"
                sem = ""

                if header_map and "code" in header_map:
                    if header_map["code"] < len(cleaned):
                        code = cleaned[header_map["code"]].upper()
                    if "name" in header_map and header_map["name"] < len(cleaned):
                        name = cleaned[header_map["name"]]
                    if "credits" in header_map and header_map["credits"] < len(cleaned):
                        try:
                            cr = float(cleaned[header_map["credits"]])
                        except ValueError:
                            cr = 3.0
                    if "gp" in header_map and header_map["gp"] < len(cleaned):
                        try:
                            gp = float(cleaned[header_map["gp"]])
                            gl = point_to_letter(gp)
                        except ValueError:
                            pass
                    if "gl" in header_map and header_map["gl"] < len(cleaned):
                        raw_gl = cleaned[header_map["gl"]]
                        try:
                            gp = float(raw_gl)
                            gl = point_to_letter(gp)
                        except ValueError:
                            gl = raw_gl.upper()
                            if "gp" not in header_map:
                                gp = float(letter_to_point(gl))
                    if "sem" in header_map and header_map["sem"] < len(cleaned):
                        sem = cleaned[header_map["sem"]]

                if not code and len(cleaned) >= 3:
                    potential_code = cleaned[0].upper()
                    if re.match(r'^[A-Z]{2,5}\s*\d{2,4}', potential_code):
                        code = potential_code
                        name = cleaned[1]
                        try:
                            cr = float(cleaned[2])
                        except ValueError:
                            cr = 3.0
                        if len(cleaned) >= 4:
                            val = cleaned[3]
                            try:
                                gp = float(val)
                                gl = point_to_letter(gp)
                            except ValueError:
                                gl = val.upper()
                                gp = float(letter_to_point(gl))
                        if len(cleaned) >= 5:
                            sem = cleaned[4]

                if code and name and re.match(r'^[A-Z]{2,5}\s*\d{2,4}', code):
                    parsed_items.append({
                        "course_code": code,
                        "course_name": name,
                        "credits": cr,
                        "grade_point": gp,
                        "grade_letter": gl,
                        "semester": sem,
                        "is_retake": gp < 3.0 or gl in ["F", "D", "D+", "C-", "C", "C+", "B-"],
                    })
        except Exception as csv_err:
            logger.warning(f"CSV reader fallback exception: {csv_err}")

        # 2b. Regex and line split fallback parsing for raw unformatted text
        if not parsed_items:
            course_pattern = re.compile(
                r'([A-Za-z]{2,5}\s*\d{2,4}[A-Za-z]?)[,\t\s]+'
                r'([A-Za-z0-9\s&/\-:\.\(\)]+?)[,\t\s]+'
                r'(\d(?:\.\d+)?)[,\t\s]+'
                r'([A-D][\+\-]?|F|\d\.\d{1,2})'
                r'(?:[,\t\s]+([A-D][\+\-]?|F|\d\.\d{1,2}))?'
                r'(?:[,\t\s]+([A-Za-z0-9\s]+))?$',
                re.MULTILINE,
            )

            for line in lines:
                parts = [p.strip() for p in re.split(r'[,;\t|]', line) if p.strip()]
                if len(parts) >= 3:
                    code = parts[0].upper()
                    if re.match(r'^[A-Z]{2,5}\s*\d{2,4}', code):
                        name = parts[1]
                        try:
                            cr = float(parts[2])
                        except ValueError:
                            cr = 3.0
                        gp = 2.50
                        gl = "B-"
                        sem = ""
                        if len(parts) >= 4:
                            val = parts[3]
                            try:
                                gp = float(val)
                                gl = point_to_letter(gp)
                            except ValueError:
                                gl = val.upper()
                                gp = float(letter_to_point(gl))
                        if len(parts) >= 5:
                            sem = parts[4]
                        parsed_items.append({
                            "course_code": code,
                            "course_name": name,
                            "credits": cr,
                            "grade_point": gp,
                            "grade_letter": gl,
                            "semester": sem,
                            "is_retake": gp < 3.0 or gl in ["F", "D", "D+", "C-", "C", "C+", "B-"],
                        })
                        continue

                m = course_pattern.search(line)
                if m:
                    code = m.group(1).upper()
                    name = m.group(2).strip()
                    try:
                        cr = float(m.group(3))
                    except ValueError:
                        cr = 3.0
                    g_raw = m.group(4)
                    try:
                        gp = float(g_raw)
                        gl = point_to_letter(gp)
                    except ValueError:
                        gl = g_raw.upper()
                        gp = float(letter_to_point(gl))
                    sem = (m.group(6) or "").strip()
                    parsed_items.append({
                        "course_code": code,
                        "course_name": name,
                        "credits": cr,
                        "grade_point": gp,
                        "grade_letter": gl,
                        "semester": sem,
                        "is_retake": gp < 3.0 or gl in ["F", "D", "D+", "C-", "C", "C+", "B-"],
                    })

    if not parsed_items:
        return []

    # If user previously had only the default 6 mock catalog courses, clean them up
    # so their actual transcript completely takes over their profile
    default_mock_codes = {c["course_code"] for c in DEFAULT_COURSE_CATALOG}
    existing_user_courses = list(CourseGrade.objects.filter(user=user))
    if (
        len(existing_user_courses) == 6
        and all(c.course_code in default_mock_codes for c in existing_user_courses)
        and len(parsed_items) > 0
    ):
        CourseGrade.objects.filter(user=user).delete()

    imported_courses = []
    for item in parsed_items:
        code = str(item.get("course_code", "")).strip().upper()
        name = str(item.get("course_name", code)).strip()
        if not code or len(code) < 3:
            continue
        try:
            cr = Decimal(str(item.get("credits", 3.0)))
        except Exception:
            cr = Decimal("3.0")
        try:
            gp = Decimal(str(item.get("grade_point", 2.33)))
        except Exception:
            gp = Decimal("2.33")
        gl = str(item.get("grade_letter") or point_to_letter(float(gp))).strip().upper()
        sem = str(item.get("semester", "")).strip()

        # Mark course for retake if grade is low (< 3.00, or F/D/C) or flagged by AI
        retake_flag = bool(item.get("is_retake", False))
        if float(gp) < 3.00 or gl in ["F", "D", "D+", "C-", "C", "C+", "B-"]:
            retake_flag = True

        obj, _ = CourseGrade.objects.update_or_create(
            user=user,
            course_code=code,
            defaults={
                "plan": plan,
                "course_name": name,
                "credits": cr,
                "grade_point": gp,
                "grade_letter": gl,
                "semester": sem,
                "is_retake": retake_flag,
            },
        )
        imported_courses.append(obj)

    return imported_courses


def calculate_projected_gpa(
    current_gpa,
    completed_credits,
    target_gpa,
    total_credits,
):
    current_gpa = Decimal(str(current_gpa))
    completed_credits = Decimal(str(completed_credits))
    target_gpa = Decimal(str(target_gpa))
    total_credits = Decimal(str(total_credits))

    remaining_credits = total_credits - completed_credits

    if remaining_credits <= 0:
        return {
            "remaining_credits": Decimal("0"),
            "required_gpa": None,
            "possible": current_gpa >= target_gpa,
        }

    required_quality_points = (
        target_gpa * total_credits
    ) - (
        current_gpa * completed_credits
    )

    required_gpa = required_quality_points / remaining_credits

    return {
        "remaining_credits": remaining_credits,
        "required_gpa": required_gpa,
        "possible": required_gpa <= Decimal("4.00"),
    }


def get_course_retake_analysis(user) -> Dict[str, Any]:
    """
    Analyzes student's low course grades (e.g. 2.00, 2.33, 2.67), cross-references their
    study habits from tracker sessions, calculates exact mathematical CGPA jumps,
    and returns an AI strategic advisor recovery plan.
    """
    # 1. Ensure courses exist
    seed_initial_courses_for_user(user)

    courses_qs = CourseGrade.objects.filter(user=user).order_by("grade_point")
    plan = GradePlan.objects.filter(user=user).first()

    target_gpa = float(plan.target_gpa) if plan else 3.50
    plan_total_credits = float(plan.total_credits) if plan else 140.0

    # 2. Gather student study logs per subject
    # 1. Gather student study logs per subject
    study_mins_by_subj = {}
    total_tracked_mins = 0
    streak_days = 0
    try:
        from tracker.models import StudySession
        from tracker.services import calculate_user_streaks

        sessions = StudySession.objects.filter(user=user)
        for s in sessions:
            name_key = (s.subject or "").lower()
            study_mins_by_subj[name_key] = study_mins_by_subj.get(name_key, 0) + s.duration_minutes
            total_tracked_mins += s.duration_minutes
        streaks = calculate_user_streaks(user=user)
        streak_days = streaks.get("current_streak", 0)
    except Exception as e:
        logger.warning(f"Tracker habits query in retake advisor: {e}")

    # If user has not uploaded or recorded any courses yet
    if not courses_qs.exists():
        return {
            "has_courses": False,
            "baseline_cgpa": 0.0,
            "target_gpa": target_gpa,
            "effective_credits": 0.0,
            "all_courses": [],
            "retake_candidates": [],
            "top_single": None,
            "recommended_duo": None,
            "advisor_narrative": None,
            "study_habits": {
                "streak_days": streak_days,
                "total_tracked_hours": round(total_tracked_mins / 60.0, 1),
            },
        }

    # 3. Calculate baseline completed credits & CGPA
    all_courses_list = list(courses_qs)
    total_completed_credits = sum(float(c.credits) for c in all_courses_list)
    if plan and float(plan.completed_credits) > total_completed_credits:
        # Use plan completed credits if larger to be realistic for upperclassmen
        effective_credits = float(plan.completed_credits)
    else:
        effective_credits = total_completed_credits if total_completed_credits > 0 else 18.0

    total_quality_points = sum(float(c.credits) * float(c.grade_point) for c in all_courses_list)
    # If student has a plan current_gpa set, calculate effective quality points
    if plan and float(plan.current_gpa) > 0:
        baseline_cgpa = float(plan.current_gpa)
        effective_qp = baseline_cgpa * effective_credits
    else:
        baseline_cgpa = round(total_quality_points / total_completed_credits, 2) if total_completed_credits > 0 else 2.70
        effective_qp = total_quality_points

    # 4. Evaluate each course for retake potential
    retake_candidates = []
    all_courses_data = []

    for c in all_courses_list:
        cr = float(c.credits)
        gp = float(c.grade_point)
        code = c.course_code
        name = c.course_name

        # Match tracked hours
        code_lower = code.lower()
        name_lower = name.lower()
        matched_mins = 0
        for subj_key, mins in study_mins_by_subj.items():
            if subj_key in code_lower or code_lower in subj_key or subj_key in name_lower or name_lower in subj_key:
                matched_mins += mins
        tracked_hours = round(matched_mins / 60.0, 1)

        # Familiarity categorization
        if tracked_hours >= 8.0:
            familiarity = "High"
            familiarity_label = f"High ({tracked_hours}h studied - concepts familiar)"
            ease_score = 90
        elif tracked_hours >= 2.5:
            familiarity = "Moderate"
            familiarity_label = f"Moderate ({tracked_hours}h studied - needs concept review)"
            ease_score = 70
        else:
            familiarity = "Fresh / Demanding"
            familiarity_label = f"Low ({tracked_hours}h studied - requires structured schedule)"
            ease_score = 50

        # Mathematical boost if upgraded to 4.00 (A)
        qp_gain_4 = cr * (4.00 - gp)
        cgpa_jump_4 = round(qp_gain_4 / effective_credits, 3)
        projected_4 = round((effective_qp + qp_gain_4) / effective_credits, 2)

        # Mathematical boost if upgraded to 3.70 (A-)
        qp_gain_3_7 = cr * (3.70 - gp)
        cgpa_jump_3_7 = round(qp_gain_3_7 / effective_credits, 3)
        projected_3_7 = round((effective_qp + qp_gain_3_7) / effective_credits, 2)

        is_retake_eligible = gp < 3.50

        # Strategic tag & efficiency score
        # Priority formula: 65% CGPA Jump + 35% Habit/Familiarity Ease
        priority_score = round((cgpa_jump_4 * 100 * 0.65) + (ease_score * 0.35), 1)

        if cgpa_jump_4 >= 0.08 and ease_score >= 70:
            strategy_tag = "🌟 Top Pick: High ROI & Familiar"
            tag_color = "emerald"
        elif cgpa_jump_4 >= 0.08:
            strategy_tag = "🔥 Max CGPA Jump (High Impact)"
            tag_color = "primary"
        elif gp <= 2.00:
            strategy_tag = "⚠️ Core Prerequisite Recovery"
            tag_color = "amber"
        else:
            strategy_tag = "⚡ Moderate Jump (Quick Win)"
            tag_color = "indigo"

        item_data = {
            "id": c.id,
            "course_code": code,
            "course_name": name,
            "credits": cr,
            "current_grade_point": gp,
            "current_grade_letter": c.grade_letter or ("C" if gp <= 2.0 else "C+" if gp <= 2.33 else "B-" if gp <= 2.67 else "B"),
            "semester": c.semester,
            "is_retake": bool(c.is_retake),
            "is_retake_eligible": is_retake_eligible or bool(c.is_retake),
            "tracked_hours": tracked_hours,
            "familiarity": familiarity,
            "familiarity_label": familiarity_label,
            "qp_gain_4": round(qp_gain_4, 2),
            "cgpa_jump_4": cgpa_jump_4,
            "projected_cgpa_4": min(4.00, projected_4),
            "qp_gain_3_7": round(qp_gain_3_7, 2),
            "cgpa_jump_3_7": cgpa_jump_3_7,
            "projected_cgpa_3_7": min(4.00, projected_3_7),
            "priority_score": priority_score,
            "strategy_tag": strategy_tag,
            "tag_color": tag_color,
        }

        all_courses_data.append(item_data)
        if is_retake_eligible or c.is_retake:
            retake_candidates.append(item_data)

    # Sort retake candidates by priority score descending
    retake_candidates.sort(key=lambda x: x["priority_score"], reverse=True)

    # 5. Determine Top Single & Recommended Duo Combination
    top_single = retake_candidates[0] if retake_candidates else None

    recommended_duo = None
    if len(retake_candidates) >= 2:
        c1 = retake_candidates[0]
        c2 = retake_candidates[1]
        duo_qp_gain = c1["qp_gain_4"] + c2["qp_gain_4"]
        duo_jump = round(duo_qp_gain / effective_credits, 3)
        duo_projected = round((effective_qp + duo_qp_gain) / effective_credits, 2)
        recommended_duo = {
            "courses": [c1, c2],
            "combined_credits": c1["credits"] + c2["credits"],
            "combined_cgpa_jump": duo_jump,
            "projected_cgpa": min(4.00, duo_projected),
            "target_gap_closed_percent": min(
                100,
                int((duo_jump / max(0.01, target_gpa - baseline_cgpa)) * 100)
            ) if target_gpa > baseline_cgpa else 100,
        }

    # 6. Generate AI Advisor Recommendation Synthesis
    advisor_narrative = _generate_ai_advisor_narrative(
        baseline_cgpa=baseline_cgpa,
        target_gpa=target_gpa,
        effective_credits=effective_credits,
        retake_candidates=retake_candidates,
        top_single=top_single,
        recommended_duo=recommended_duo,
        streak_days=streak_days,
        total_tracked_mins=total_tracked_mins,
    )

    return {
        "has_courses": True,
        "baseline_cgpa": baseline_cgpa,
        "target_gpa": target_gpa,
        "effective_credits": effective_credits,
        "all_courses": all_courses_data,
        "retake_candidates": retake_candidates,
        "top_single": top_single,
        "recommended_duo": recommended_duo,
        "advisor_narrative": advisor_narrative,
        "study_habits": {
            "streak_days": streak_days,
            "total_tracked_hours": round(total_tracked_mins / 60.0, 1),
        },
    }


def _generate_ai_advisor_narrative(
    *,
    baseline_cgpa: float,
    target_gpa: float,
    effective_credits: float,
    retake_candidates: List[Dict[str, Any]],
    top_single: Optional[Dict[str, Any]],
    recommended_duo: Optional[Dict[str, Any]],
    streak_days: int,
    total_tracked_mins: int,
) -> Dict[str, Any]:
    """
    Generates realistic, personalized, and mathematically-grounded academic advice.
    Avoids repetitive static boilerplate by evaluating actual course credits, past grades,
    subject discipline, tracked study habits, and specific GPA targets.
    """
    gap = round(max(0.0, target_gpa - baseline_cgpa), 2)

    if not top_single:
        return {
            "headline": "Outstanding Academic Standing",
            "summary": f"Your current cumulative GPA of **{baseline_cgpa:.2f}** is exceptionally strong and meets your targets. No retakes are currently required.",
            "action_plan": [
                "Focus on upcoming advanced capstone, thesis, or specialized elective courses.",
                "Maintain your active study habits to secure graduation academic honors.",
            ],
            "workload_warning": "Keep your regular enrollment pace without taking on unnecessary retake burdens.",
        }

    # 1. Course specific attributes
    top_code = top_single["course_code"]
    top_name = top_single["course_name"]
    top_cr = float(top_single.get("credits", 3.0))
    top_gp = float(top_single.get("current_grade_point", 2.0))
    top_letter = top_single.get("current_grade_letter", "C")
    top_jump = top_single["cgpa_jump_4"]
    top_proj = top_single["projected_cgpa_4"]
    top_qp = top_single["qp_gain_4"]
    tracked_h = float(top_single.get("tracked_hours", 0.0))

    # Calculate recommended weekly study hours tailored to credits and current deficiency
    if top_gp <= 1.5:
        multiplier = 2.0
    elif top_gp <= 2.33:
        multiplier = 1.6
    else:
        multiplier = 1.3
    rec_weekly_hours = round(top_cr * multiplier, 1)

    # Subject classification for customized pedagogical strategies
    name_and_code = f"{top_code} {top_name}".lower()
    is_cs = any(k in name_and_code for k in ["cse", "program", "software", "algorithm", "data struct", "oop", "database", "web", "os", "network", "system"])
    is_math = any(k in name_and_code for k in ["math", "calculus", "linear", "discrete", "algebra", "stat", "prob", "differen"])
    is_circuits = any(k in name_and_code for k in ["circuit", "electron", "digital", "logic", "micro", "physics", "eee"])

    if is_cs:
        subject_advice = f"Focus on hands-on coding and lab test cases early: solve at least 2 practical implementation exercises weekly for {top_name} to lock in core concept mastery before midterms."
    elif is_math:
        subject_advice = f"Prioritize step-by-step problem sets and past paper solving for {top_name}; maintain a formula-proof cheatsheet to ace the weekly quizzes."
    elif is_circuits:
        subject_advice = f"Spend regular simulation lab time (Multisim/Logisim) to verify hardware behaviors ahead of practical midterms in {top_name}."
    else:
        subject_advice = f"Break {top_name} lecture materials into weekly synthesis notes and review using active recall flashcards every weekend."

    # Study habit reflection
    if tracked_h >= 5.0:
        habit_reflection = f"You already have solid familiarity ({tracked_h}h logged in Study Tracker). Re-orienting your focus toward high-weight exam topics can convert this to an A without starting from zero."
    elif tracked_h > 0:
        habit_reflection = f"With {tracked_h}h currently tracked for this course, stepping up to {rec_weekly_hours} hours/week in the Study Tracker will bridge the gap to an A."
    else:
        habit_reflection = f"No study sessions currently logged for {top_code}. We recommend logging {rec_weekly_hours} focused hours per week split into 2–3 regular study blocks."

    # Duo synergy summary
    duo_summary = ""
    duo_action = None
    if recommended_duo:
        d1 = recommended_duo["courses"][0]["course_code"]
        d2 = recommended_duo["courses"][1]["course_code"]
        d2_name = recommended_duo["courses"][1]["course_name"]
        d2_gp = recommended_duo["courses"][1]["current_grade_point"]
        duo_jump = recommended_duo["combined_cgpa_jump"]
        duo_proj = recommended_duo["projected_cgpa"]
        duo_pct = recommended_duo["target_gap_closed_percent"]
        duo_cr = recommended_duo["combined_credits"]

        duo_summary = (
            f"If you retake both **{d1}** and **{d2}** in the upcoming semester, your cumulative CGPA will leap by **+{duo_jump:.2f}** "
            f"reaching **{duo_proj:.2f}**, immediately closing **{duo_pct}%** of your target gap to {target_gpa:.2f}."
        )
        duo_action = (
            f"Strategic Dual Combination: Taking {d1} and {d2} ({duo_cr} credits total) covers {duo_pct}% of your {target_gpa:.2f} target gap. "
            f"Pair them with at most 2 regular courses to prevent academic overload."
        )

    # Try Gemini if API key is present
    try:
        from ai.client import get_gemini_client
        import json
        client = get_gemini_client()

        prompt = f"""You are an elite academic advisor. Analyze this student's grade data and generate tailored, realistic retake advice in strict JSON format:
Student baseline CGPA: {baseline_cgpa:.2f}
Target CGPA: {target_gpa:.2f} (Gap: {gap:.2f})
Top retake priority: {top_code} - {top_name} ({top_cr} credits, current grade: {top_gp:.2f} / {top_letter})
Mathematical jump if retaken with A (4.00): +{top_jump:.2f} (New CGPA: {top_proj:.2f}, QP Gain: {top_qp:.1f})
Tracked study hours in tracker: {tracked_h}h
Recommended weekly study hours: {rec_weekly_hours}h
Active study streak: {streak_days} days
{"Second retake recommended: " + recommended_duo['courses'][1]['course_code'] + " (" + str(recommended_duo['combined_cgpa_jump']) + " total boost)" if recommended_duo else "Single retake focus"}

Provide strict JSON with keys:
"headline": Concise motivating title mentioning course code
"summary": 2-3 sentences explaining current vs target GPA, exact CGPA jump from retaking {top_code}, and realistic grade safety net (mentioning A- gives +{top_single.get('cgpa_jump_3_7', 0):.2f})
"action_plan": Array of 3-4 distinct actionable tips (1: math target & safety net, 2: weekly tracker study hours & study habit, 3: discipline-specific advice for this subject, 4: semester workload balance)
"workload_warning": 1 realistic sentence regarding workload, credit limits, and study streak reality check.
Return ONLY valid JSON."""

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
        )
        text = response.text.strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[-1].rsplit("```", 1)[0].strip()
        data = json.loads(text)
        if "headline" in data and "summary" in data and "action_plan" in data:
            return data
    except Exception as e:
        logger.debug(f"Gemini retake advisor fallback triggered: {e}")

    # Rich Dynamic Pedagogical Fallback
    action_items = [
        f"Target an A (4.00) in {top_code} to secure a +{top_jump:.2f} CGPA surge (gaining {top_qp:.1f} quality points). Even an A- (3.70) adds +{top_single.get('cgpa_jump_3_7', 0):.2f}, lifting your CGPA to {top_single.get('projected_cgpa_3_7', baseline_cgpa):.2f}.",
        f"Allocate {rec_weekly_hours} hours weekly in your Study Tracker for {top_name}. {habit_reflection}",
        subject_advice,
    ]
    if duo_action:
        action_items.append(duo_action)
    else:
        action_items.append(
            f"Semester pacing: Cap retakes at 1–2 courses alongside your normal enrollment to safeguard study bandwidth and prevent burnout."
        )

    return {
        "headline": f"Priority 1 Retake: {top_code} ({top_name})",
        "summary": (
            f"Your current CGPA is **{baseline_cgpa:.2f}** and your target graduation goal is **{target_gpa:.2f}** (gap of {gap:.2f}). "
            f"Retaking **{top_code}** ({top_gp:.2f} / {top_letter}) and upgrading to an **A (4.00)** "
            f"yields the highest mathematical return on investment, elevating your cumulative CGPA to **{top_proj:.2f}** "
            f"(an immediate boost of **+{top_jump:.2f}**). {duo_summary}"
        ),
        "action_plan": action_items,
        "workload_warning": (
            f"With your active {streak_days}-day study streak, dedicating {rec_weekly_hours} hours weekly for {top_code} "
            "is achievable by establishing consistent 45-to-60-minute daily focus blocks."
        ) if streak_days > 0 else (
            f"Before enrolling, build daily study momentum using 25-minute Pomodoro sessions in your Study Tracker to sustain the {rec_weekly_hours} weekly hours needed."
        ),
    }


