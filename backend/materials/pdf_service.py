import io
import re
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    HRFlowable,
)
from reportlab.pdfgen import canvas


def safe_pdf_text(text) -> str:
    """Escapes raw ampersands and special XML characters so ReportLab Paragraph never fails to parse."""
    if not text:
        return ""
    s = str(text)
    # Replace unescaped & with &amp;
    s = re.sub(r"&(?!(?:amp|lt|gt|quot|apos|bull|nbsp|#\d+|#x[0-9a-fA-F]+);)", "&amp;", s)
    return s


class NumberedCanvas(canvas.Canvas):
    """
    Two-pass canvas to dynamically compute and print exact 'Page X of Y',
    brand-compliant running headers on pages 2+, and professional footer
    branding on every single page.
    """
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()

        # Running Header (pages 2+)
        if self._pageNumber > 1:
            self.setStrokeColor(colors.HexColor("#cbd5e1"))
            self.setLineWidth(0.75)
            self.line(40, 756, 572, 756)

            self.setFont("Helvetica-Bold", 7.5)
            self.setFillColor(colors.HexColor("#4338ca"))
            self.drawString(40, 762, "STUDENT BRAIN")

            self.setFont("Helvetica", 7.5)
            self.setFillColor(colors.HexColor("#64748b"))
            self.drawString(108, 762, "•  Academic Knowledge Intelligence Suite  |  AI Synthesis Report")

            self.setFont("Helvetica-Bold", 7.5)
            self.setFillColor(colors.HexColor("#475569"))
            self.drawRightString(572, 762, f"Section Continued • Page {self._pageNumber}")

        # Running Footer on EVERY page
        self.setStrokeColor(colors.HexColor("#e2e8f0"))
        self.setLineWidth(0.75)
        self.line(40, 46, 572, 46)

        # Brand Accent Dot & Title
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#4f46e5"))
        self.drawString(40, 32, "STUDENT BRAIN")

        self.setFont("Helvetica", 7.5)
        self.setFillColor(colors.HexColor("#64748b"))
        self.drawString(114, 32, "•  Verified Study Intelligence Platform  |  Personal Study Synthesis")

        # Page Number Pill
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#334155"))
        self.drawRightString(572, 32, page_str)

        self.restoreState()


def generate_material_analysis_pdf(material) -> bytes:
    """
    Generates a publication-grade, beautifully formatted academic PDF report
    synthesizing the AI study analysis for a given StudyMaterial.
    Total content width is calibrated to 532 points (Letter: 612 - 2*40).
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        leftMargin=40,
        rightMargin=40,
        topMargin=42,
        bottomMargin=54,
    )

    styles = getSampleStyleSheet()

    # Color Palette Definitions
    c_primary = colors.HexColor("#0f172a")       # Slate 900
    c_indigo = colors.HexColor("#4f46e5")        # Indigo 600
    c_indigo_dark = colors.HexColor("#312e81")   # Indigo 900
    c_cyan = colors.HexColor("#0891b2")          # Cyan 600
    c_emerald = colors.HexColor("#059669")       # Emerald 600
    c_slate_dark = colors.HexColor("#1e293b")    # Slate 800
    c_slate_muted = colors.HexColor("#64748b")   # Slate 500
    c_bg_light = colors.HexColor("#f8fafc")      # Slate 50
    c_border = colors.HexColor("#e2e8f0")        # Slate 200

    # Typography Styles
    report_badge_style = ParagraphStyle(
        "ReportBadge",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=7,
        leading=9,
        textColor=colors.HexColor("#a5b4fc"),
    )

    hero_title_style = ParagraphStyle(
        "HeroTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=14,
        leading=17,
        textColor=colors.white,
    )

    hero_meta_style = ParagraphStyle(
        "HeroMeta",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=7.5,
        leading=10,
        alignment=2,
        textColor=colors.HexColor("#cbd5e1"),
    )

    verified_pill_style = ParagraphStyle(
        "VerifiedPill",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=7.5,
        leading=9,
        alignment=2,
        textColor=colors.HexColor("#34d399"),
    )

    material_type_style = ParagraphStyle(
        "MaterialType",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=7.5,
        leading=9.5,
        textColor=c_indigo,
        spaceAfter=3,
    )

    doc_title_style = ParagraphStyle(
        "DocTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=16,
        leading=20,
        textColor=c_primary,
        spaceAfter=8,
    )

    section_header_style = ParagraphStyle(
        "SectionHeader",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=10.5,
        leading=13,
        textColor=c_indigo_dark,
        spaceBefore=11,
        spaceAfter=5,
    )

    summary_text_style = ParagraphStyle(
        "SummaryText",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=13.5,
        textColor=c_slate_dark,
    )

    meta_label_style = ParagraphStyle(
        "MetaLabel",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=6.5,
        leading=8,
        textColor=c_slate_muted,
    )

    meta_val_style = ParagraphStyle(
        "MetaVal",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8,
        leading=10.5,
        textColor=c_slate_dark,
    )

    topic_num_style = ParagraphStyle(
        "TopicNum",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=7.5,
        leading=9,
        alignment=1,
        textColor=colors.HexColor("#4338ca"),
    )

    topic_title_style = ParagraphStyle(
        "TopicTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=11,
        textColor=c_slate_dark,
    )

    formula_code_style = ParagraphStyle(
        "FormulaCode",
        parent=styles["Normal"],
        fontName="Courier",
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#065f46"),
    )

    checklist_item_style = ParagraphStyle(
        "ChecklistItem",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8,
        leading=11,
        textColor=c_slate_dark,
    )

    elements = []

    # ---------------------------------------------------------
    # 1. LUXURIOUS EXECUTIVE BRAND HEADER BANNER (532pt)
    # ---------------------------------------------------------
    now_dt = datetime.now()
    date_str = now_dt.strftime("%B %d, %Y")
    report_id = f"SB-AI-{getattr(material, 'id', 1):04d}-{now_dt.strftime('%y%m')}"

    header_table_data = [
        [
            Paragraph("STUDENT BRAIN &bull; ACADEMIC KNOWLEDGE SUITE", report_badge_style),
            Paragraph("&bull; &nbsp; VERIFIED AI SYNTHESIS REPORT", verified_pill_style),
        ],
        [
            Paragraph("AI Study Synthesis & Knowledge Architecture", hero_title_style),
            Paragraph(f"Date: <b>{date_str}</b><br/>Ref: <b>{report_id}</b>", hero_meta_style),
        ],
    ]
    hero_table = Table(header_table_data, colWidths=[342, 190])
    hero_table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#0f172a")),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING", (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ("LEFTPADDING", (0, 0), (-1, -1), 12),
            ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ])
    )
    elements.append(hero_table)

    # Gradient Accent Bar
    elements.append(HRFlowable(width="100%", thickness=2.5, color=c_indigo, spaceBefore=0, spaceAfter=2))
    elements.append(HRFlowable(width="100%", thickness=1, color=c_cyan, spaceBefore=0, spaceAfter=8))

    # ---------------------------------------------------------
    # 2. DOCUMENT TITLE & SCOPE CLASSIFICATION
    # ---------------------------------------------------------
    mat_type = getattr(material, "material_type", "document")
    type_labels = {
        "document": "LECTURE MATERIAL & DOCUMENT SLIDES",
        "link": "CURATED WEB STUDY REFERENCE",
        "note": "PERSONAL COURSE STUDY NOTE & SCRATCHPAD",
    }
    type_label = type_labels.get(mat_type, "ACADEMIC STUDY MATERIAL")

    elements.append(Paragraph(f"&bull; &nbsp; {type_label}", material_type_style))
    raw_doc_title = getattr(material, "title", None) or "Study Material Analysis"
    doc_title = safe_pdf_text(raw_doc_title)
    elements.append(Paragraph(doc_title, doc_title_style))

    # ---------------------------------------------------------
    # 3. ACADEMIC METADATA MATRIX (532pt)
    # ---------------------------------------------------------
    course_name = safe_pdf_text(material.course.title if getattr(material, "course", None) else "Academic Coursework")
    course_code = safe_pdf_text(getattr(material.course, "code", "") if getattr(material, "course", None) else "")
    semester_name = safe_pdf_text(getattr(material.course.semester, "name", "") if getattr(material, "course", None) and getattr(material.course.semester, "name", None) else "Active Academic Term")
    analysis = getattr(material, "ai_analysis", {}) or {}
    difficulty = safe_pdf_text(analysis.get("difficulty", "Intermediate"))
    key_topics = analysis.get("key_topics", []) or []
    formulas = analysis.get("key_formulas_or_definitions", []) or []

    meta_matrix = [
        [
            Paragraph("COURSE & SUBJECT", meta_label_style),
            Paragraph("ACADEMIC TERM", meta_label_style),
            Paragraph("COMPREHENSION LEVEL", meta_label_style),
            Paragraph("INDEXED TOPICS", meta_label_style),
        ],
        [
            Paragraph(f"<b>{course_name}</b> {f'[{course_code}]' if course_code else ''}", meta_val_style),
            Paragraph(f"<b>{semester_name}</b>", meta_val_style),
            Paragraph(f"<b>{difficulty}</b>", meta_val_style),
            Paragraph(f"<b>{len(key_topics)} Key Topics</b>", meta_val_style),
        ],
    ]
    meta_table = Table(meta_matrix, colWidths=[160, 124, 124, 124])
    meta_table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f1f5f9")),
            ("BACKGROUND", (0, 1), (-1, 1), colors.HexColor("#ffffff")),
            ("BOX", (0, 0), (-1, -1), 1, c_border),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#f1f5f9")),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
            ("LINEABOVE", (0, 0), (-1, 0), 1.5, c_indigo),
        ])
    )
    elements.append(meta_table)
    elements.append(Spacer(1, 8))

    # ---------------------------------------------------------
    # 4. SECTION 01: EXECUTIVE ACADEMIC SUMMARY
    # ---------------------------------------------------------
    raw_summary_text = (
        analysis.get("summary")
        or getattr(material, "content_text", None)
        or "No comprehensive study summary is available for this material yet. Generate AI analysis in the Study Center to produce a structured executive synthesis."
    )
    summary_text = safe_pdf_text(raw_summary_text)

    elements.append(Paragraph("<b>01 &nbsp;|&nbsp; EXECUTIVE ACADEMIC SUMMARY</b>", section_header_style))

    summary_table = Table(
        [[Paragraph(summary_text, summary_text_style)]],
        colWidths=[532],
    )
    summary_table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), c_bg_light),
            ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#cbd5e1")),
            ("LINELEFT", (0, 0), (0, -1), 3.5, c_indigo),
            ("TOPPADDING", (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ("LEFTPADDING", (0, 0), (-1, -1), 12),
            ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ])
    )
    elements.append(summary_table)
    elements.append(Spacer(1, 8))

    # ---------------------------------------------------------
    # 5. SECTION 02: EXTRACTED CORE TOPICS & CONCEPT BREAKDOWN
    # ---------------------------------------------------------
    if key_topics:
        elements.append(
            Paragraph(f"<b>02 &nbsp;|&nbsp; EXTRACTED CORE TOPICS & CONCEPTS ({len(key_topics)})</b>", section_header_style)
        )

        topics_data = []
        for idx, topic in enumerate(key_topics, 1):
            num_pill = f"#{idx:02d}"
            topics_data.append([
                Paragraph(f"<b>{num_pill}</b>", topic_num_style),
                Paragraph(safe_pdf_text(topic), topic_title_style),
            ])

        topics_table = Table(topics_data, colWidths=[36, 496])
        topics_table.setStyle(
            TableStyle([
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("TOPPADDING", (0, 0), (-1, -1), 4.5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4.5),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("BOX", (0, 0), (-1, -1), 1, c_border),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#f1f5f9")),
                ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#eef2ff")),
            ])
        )
        elements.append(topics_table)
        elements.append(Spacer(1, 8))

    # ---------------------------------------------------------
    # 6. SECTION 03: KEY FORMULAS & CRITICAL DEFINITIONS
    # ---------------------------------------------------------
    if formulas:
        elements.append(
            Paragraph(f"<b>03 &nbsp;|&nbsp; KEY FORMULAS & CRITICAL DEFINITIONS ({len(formulas)})</b>", section_header_style)
        )

        formula_data = []
        for item in formulas:
            formula_data.append([
                Paragraph("&bull;", ParagraphStyle("Bul", parent=meta_label_style, textColor=c_emerald, fontSize=8)),
                Paragraph(safe_pdf_text(item), formula_code_style),
            ])

        formula_table = Table(formula_data, colWidths=[18, 514])
        formula_table.setStyle(
            TableStyle([
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f0fdf4")),
                ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#bbf7d0")),
                ("LINELEFT", (0, 0), (0, -1), 3, c_emerald),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#dcfce7")),
            ])
        )
        elements.append(formula_table)
        elements.append(Spacer(1, 8))

    # ---------------------------------------------------------
    # 7. SECTION 04: ACTIVE RECALL & REVISION CHECKLIST
    # ---------------------------------------------------------
    elements.append(Paragraph("<b>04 &nbsp;|&nbsp; ACTIVE RECALL & RETENTION CHECKLIST</b>", section_header_style))

    checklist_items = [
        "<b>Concept Articulation:</b> Explain core topics above in your own words without reading the summary.",
        "<b>Formulas & Key Laws:</b> Derive or write down each key formula/definition from memory on a blank sheet.",
        "<b>Study Partner Peer Review:</b> Share and discuss key insights in the Student Brain Community channel.",
        "<b>Practice Exam Generation:</b> Open the Course Study Assistant to generate dynamic 5-question review quizzes.",
    ]

    check_table_data = []
    for item in checklist_items:
        check_table_data.append([
            Paragraph("[ &nbsp; ]", ParagraphStyle("BoxSym", parent=meta_label_style, textColor=c_indigo, fontSize=8)),
            Paragraph(item, checklist_item_style),
        ])

    check_table = Table(check_table_data, colWidths=[24, 508])
    check_table.setStyle(
        TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("TOPPADDING", (0, 0), (-1, -1), 3.5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 3.5),
            ("LEFTPADDING", (0, 0), (-1, -1), 6),
            ("RIGHTPADDING", (0, 0), (-1, -1), 6),
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
            ("BOX", (0, 0), (-1, -1), 1, c_border),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#f1f5f9")),
        ])
    )
    elements.append(check_table)

    # Build the PDF using NumberedCanvas
    doc.build(elements, canvasmaker=NumberedCanvas)
    pdf_value = buffer.getvalue()
    buffer.close()
    return pdf_value
