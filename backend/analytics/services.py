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

    schedule_adherence = {
        "active_schedules_count": active_schedules_count,
        "scheduled_subjects": list(scheduled_subjects),
        "covered_subjects_this_week": list(covered_scheduled_subjects),
        "adherence_rate": adherence_rate,
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
                insights.append(f"🎓 Target GPA Goal: Maintain a {gpa_summary['required_gpa']:.2f} average on remaining {gpa_summary['remaining_credits']} credits.")
            elif not gpa_summary["possible"]:
                insights.append("⚠️ Target GPA Alert: Target GPA requires higher than 4.0 average. Consider adjusting target GPA.")

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
