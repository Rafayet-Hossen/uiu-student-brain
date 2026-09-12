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


def seed_initial_courses_for_user(user):
    """Auto-seeds realistic university courses with varied grades if the user has no recorded courses."""
    if CourseGrade.objects.filter(user=user).exists():
        return
    plan = GradePlan.objects.filter(user=user).first()
    for item in DEFAULT_COURSE_CATALOG:
        CourseGrade.objects.create(
            user=user,
            plan=plan,
            course_code=item["course_code"],
            course_name=item["course_name"],
            credits=item["credits"],
            grade_point=item["grade_point"],
            grade_letter=item["grade_letter"],
            semester=item["semester"],
        )


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
            "is_retake_eligible": is_retake_eligible,
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
        if is_retake_eligible:
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


