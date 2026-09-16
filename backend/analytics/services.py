from datetime import date, timedelta
from decimal import Decimal
from typing import Any, Dict, List
from django.db.models import Count, Sum

from grades.models import GradePlan
from grades.services import calculate_projected_gpa
from planner.models import Schedule
from tracker.models import StudySession


def get_analytics_dashboard_data(*, user, reference_date: date = None) -> Dict[str, Any]:
    if reference_date is None:
        reference_date = date.today()

    # 1. Tracker Data Aggregations
    sessions = StudySession.objects.filter(user=user)
    total_sessions = sessions.count()
    total_minutes = sessions.aggregate(total=Sum("duration_minutes"))["total"] or 0
    avg_session_minutes = round(total_minutes / total_sessions, 1) if total_sessions > 0 else 0

    # Distinct subjects studied
    distinct_subjects = list(sessions.order_by().values_list("subject", flat=True).distinct())

    # Subject Distribution
    subject_stats = (
        sessions.values("subject")
        .annotate(total_mins=Sum("duration_minutes"), session_count=Count("id"))
        .order_by("-total_mins")
    )

    subject_distribution: List[Dict[str, Any]] = []
    for item in subject_stats:
        mins = item["total_mins"] or 0
        pct = round((mins / total_minutes) * 100, 1) if total_minutes > 0 else 0
        subject_distribution.append(
            {
                "subject": item["subject"],
                "minutes": mins,
                "percentage": pct,
                "sessions_count": item["session_count"],
            }
        )

    # Weekly Focus Trend (Past 7 Days)
    weekly_trend: List[Dict[str, Any]] = []
    week_start_date = reference_date - timedelta(days=6)
    week_sessions = sessions.filter(session_date__gte=week_start_date, session_date__lte=reference_date)

    for i in range(6, -1, -1):
        day_date = reference_date - timedelta(days=i)
        day_sessions = week_sessions.filter(session_date=day_date)
        day_minutes = day_sessions.aggregate(total=Sum("duration_minutes"))["total"] or 0
        weekly_trend.append(
            {
                "date": day_date.isoformat(),
                "day_name": day_date.strftime("%a"),
                "minutes": day_minutes,
                "sessions": day_sessions.count(),
            }
        )

    # 2. Grade Planner Analytics
    grade_plan = GradePlan.objects.filter(user=user).order_by("-updated_at").first()
    gpa_summary = None

    if grade_plan:
        projection = calculate_projected_gpa(
            current_gpa=grade_plan.current_gpa,
            completed_credits=grade_plan.completed_credits,
            target_gpa=grade_plan.target_gpa,
            total_credits=grade_plan.total_credits,
        )

        completed_cr = float(grade_plan.completed_credits)
        total_cr = float(grade_plan.total_credits)
        percent_complete = min(100.0, max(0.0, round((completed_cr / total_cr) * 100, 1))) if total_cr > 0 else 0.0

        required_gpa_float = (
            float(projection["required_gpa"])
            if projection["required_gpa"] is not None
            else None
        )

        gpa_summary = {
            "plan_name": grade_plan.name,
            "current_gpa": float(grade_plan.current_gpa),
            "target_gpa": float(grade_plan.target_gpa),
            "completed_credits": completed_cr,
            "total_credits": total_cr,
            "remaining_credits": float(projection["remaining_credits"]),
            "required_gpa": required_gpa_float,
            "possible": projection["possible"],
            "percent_complete": percent_complete,
        }

    # 3. Schedule Adherence Analytics
    schedules = Schedule.objects.filter(user=user)
    active_schedules_count = schedules.count()
    scheduled_subjects = set(schedules.values_list("subject", flat=True))

    studied_subjects_this_week = set(week_sessions.values_list("subject", flat=True))
    covered_scheduled_subjects = scheduled_subjects.intersection(studied_subjects_this_week)

    adherence_rate = 0.0
    if scheduled_subjects:
        adherence_rate = round((len(covered_scheduled_subjects) / len(scheduled_subjects)) * 100, 1)

    # Detailed per-course adherence breakdown
    subject_details = []
    total_sched_mins = 0
    total_covered_mins = 0

    for subj in sorted(scheduled_subjects):
        subj_schedules = schedules.filter(subject=subj)
        subj_sched_mins = 0
        slot_days_count = 0
        for s in subj_schedules:
            if s.start_time and s.end_time:
                slot_duration = (s.end_time.hour * 60 + s.end_time.minute) - (s.start_time.hour * 60 + s.start_time.minute)
                if slot_duration > 0:
                    days_mult = len(s.days) if isinstance(s.days, list) and len(s.days) > 0 else 1
                    subj_sched_mins += (slot_duration * days_mult)
                    slot_days_count += days_mult
                else:
                    slot_days_count += 1
            else:
                slot_days_count += 1

        studied_mins = week_sessions.filter(subject__iexact=subj).aggregate(total=Sum("duration_minutes"))["total"] or 0
        total_sched_mins += subj_sched_mins
        total_covered_mins += studied_mins
        is_covered = studied_mins > 0 or subj in studied_subjects_this_week

        progress_pct = 0.0
        if subj_sched_mins > 0:
            progress_pct = round(min(100.0, (studied_mins / subj_sched_mins) * 100), 1)
        elif is_covered:
            progress_pct = 100.0

        status_tag = "Completed" if progress_pct >= 100 else ("In Progress" if progress_pct > 0 else "Pending")

        subject_details.append({
            "subject": subj,
            "scheduled_slots": slot_days_count,
            "scheduled_hours": round(subj_sched_mins / 60, 1),
            "logged_hours_this_week": round(studied_mins / 60, 1),
            "is_covered": is_covered,
            "progress_percent": progress_pct,
            "status": status_tag,
        })

    total_sched_hours = round(total_sched_mins / 60, 1)
    total_studied_hours = round(total_covered_mins / 60, 1)

    if adherence_rate >= 80:
        consistency_label = "Optimal Adherence"
        motivational_tip = "Outstanding routine discipline! You're consistently hitting your planned curriculum targets."
    elif adherence_rate >= 50:
        consistency_label = "Moderate Progress"
        uncovered = list(scheduled_subjects - studied_subjects_this_week)
        tip_subj = uncovered[0] if uncovered else "your remaining courses"
        motivational_tip = f"Good progress! Complete a focus session for '{tip_subj}' to maximize your adherence score."
    else:
        consistency_label = "Attention Needed"
        motivational_tip = "You have scheduled routines waiting. Log a quick study session in the Study Tracker to get started."

    schedule_adherence = {
        "active_schedules_count": active_schedules_count,
        "scheduled_subjects": list(scheduled_subjects),
        "covered_subjects_this_week": list(covered_scheduled_subjects),
        "adherence_rate": adherence_rate,
        "subject_details": subject_details,
        "total_scheduled_hours": total_sched_hours,
        "total_studied_hours_this_week": total_studied_hours,
        "consistency_label": consistency_label,
        "motivational_tip": motivational_tip,
    }

    # 4. Productivity Insights Generator
    insights: List[str] = []
    if total_sessions == 0:
        insights.append("🌱 Log your first study session to unlock subject analytics and focus charts.")
    else:
        week_minutes = week_sessions.aggregate(total=Sum("duration_minutes"))["total"] or 0
        insights.append(f"⏱️ You logged {round(week_minutes / 60, 1)} hours of focus time across the past 7 days.")

        if subject_distribution:
            top_subject = subject_distribution[0]
            insights.append(f"📚 Top course: '{top_subject['subject']}' accounts for {top_subject['percentage']}% of total focus.")

        if scheduled_subjects:
            uncovered = scheduled_subjects - studied_subjects_this_week
            if uncovered:
                insights.append(f"🎯 Routine balance check: You have not logged study sessions for '{', '.join(uncovered)}' yet this week.")
            else:
                insights.append("⭐ Fantastic balance! You have covered all of your scheduled routine subjects this week.")

        if gpa_summary:
            if gpa_summary["possible"] and gpa_summary["required_gpa"] is not None:
                insights.append(f"🎓 Target GPA Goal: Maintain a {gpa_summary['required_gpa']:.2f} average on remaining {gpa_summary['remaining_credits']:.0f} credits.")
            elif not gpa_summary["possible"]:
                completed_cr = gpa_summary["completed_credits"]
                total_cr = gpa_summary["total_credits"]
                curr_gpa = gpa_summary["current_gpa"]
                rem_cr = gpa_summary["remaining_credits"]
                max_cgpa = round(((curr_gpa * completed_cr) + (4.0 * rem_cr)) / total_cr, 2) if total_cr > 0 else 4.0
                insights.append(f"🎓 Target GPA Strategy: Reaching {gpa_summary['target_gpa']:.2f} requires >4.0 GPA. Max possible without retakes is {max_cgpa:.2f}. Retaking 1–2 previous courses or setting target to {max_cgpa:.2f} will make your goal achievable.")

    return {
        "summary": {
            "total_study_minutes": total_minutes,
            "total_sessions": total_sessions,
            "total_subjects": len(distinct_subjects),
            "active_schedules_count": active_schedules_count,
            "avg_session_minutes": avg_session_minutes,
        },
        "gpa_summary": gpa_summary,
        "subject_distribution": subject_distribution,
        "weekly_trend": weekly_trend,
        "schedule_adherence": schedule_adherence,
        "insights": insights,
    }
