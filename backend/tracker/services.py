from datetime import date, timedelta
from typing import Any, Dict, List
from django.db.models import QuerySet, Sum
from django.shortcuts import get_object_or_404
from .models import StudyGoal, StudySession


def get_user_study_sessions(*, user) -> QuerySet[StudySession]:
    return StudySession.objects.filter(user=user)


def get_user_study_session(*, user, session_id: int) -> StudySession:
    return get_object_or_404(StudySession, id=session_id, user=user)


def create_study_session(*, user, validated_data) -> StudySession:
    return StudySession.objects.create(user=user, **validated_data)


def update_study_session(*, session: StudySession, validated_data) -> StudySession:
    for field, value in validated_data.items():
        setattr(session, field, value)
    session.save()
    return session


def delete_study_session(*, session: StudySession) -> None:
    session.delete()


def get_or_create_user_goal(*, user) -> StudyGoal:
    goal, _ = StudyGoal.objects.get_or_create(user=user, defaults={"daily_goal_minutes": 60})
    return goal


def update_user_goal(*, user, daily_goal_minutes: int) -> StudyGoal:
    goal = get_or_create_user_goal(user=user)
    goal.daily_goal_minutes = daily_goal_minutes
    goal.save()
    return goal


def calculate_user_streaks(*, user, reference_date: date = None) -> Dict[str, Any]:
    if reference_date is None:
        reference_date = date.today()

    sessions = StudySession.objects.filter(user=user)
    session_dates = set(sessions.values_list("session_date", flat=True))

    total_sessions_count = sessions.count()
    total_minutes = sessions.aggregate(total=Sum("duration_minutes"))["total"] or 0

    today_minutes = (
        sessions.filter(session_date=reference_date).aggregate(total=Sum("duration_minutes"))["total"]
        or 0
    )

    goal = get_or_create_user_goal(user=user)
    daily_goal_minutes = goal.daily_goal_minutes
    daily_goal_achieved = today_minutes >= daily_goal_minutes
    studied_today = reference_date in session_dates

    # Current streak calculation:
    # If studied today -> count backwards from reference_date
    # If not studied today, but studied yesterday -> streak is still active, count backwards from yesterday
    # Otherwise -> 0
    current_streak = 0
    if reference_date in session_dates:
        check_date = reference_date
        while check_date in session_dates:
            current_streak += 1
            check_date -= timedelta(days=1)
    elif (reference_date - timedelta(days=1)) in session_dates:
        check_date = reference_date - timedelta(days=1)
        while check_date in session_dates:
            current_streak += 1
            check_date -= timedelta(days=1)

    # Longest streak calculation across all time
    longest_streak = 0
    if session_dates:
        sorted_dates = sorted(session_dates)
        temp_streak = 1
        longest_streak = 1
        for i in range(1, len(sorted_dates)):
            if sorted_dates[i] == sorted_dates[i - 1] + timedelta(days=1):
                temp_streak += 1
            else:
                temp_streak = 1
            if temp_streak > longest_streak:
                longest_streak = temp_streak

    # Past 7 days consistency array
    weekly_consistency: List[Dict[str, Any]] = []
    for i in range(6, -1, -1):
        day_date = reference_date - timedelta(days=i)
        day_minutes = (
            sessions.filter(session_date=day_date).aggregate(total=Sum("duration_minutes"))["total"]
            or 0
        )
        weekly_consistency.append(
            {
                "date": day_date.isoformat(),
                "day_name": day_date.strftime("%a"),
                "studied": day_date in session_dates,
                "minutes": day_minutes,
                "goal_met": day_minutes >= daily_goal_minutes if day_minutes > 0 else False,
            }
        )

    return {
        "current_streak": current_streak,
        "longest_streak": longest_streak,
        "total_study_days": len(session_dates),
        "total_sessions": total_sessions_count,
        "total_minutes": total_minutes,
        "today_minutes": today_minutes,
        "daily_goal_minutes": daily_goal_minutes,
        "daily_goal_achieved": daily_goal_achieved,
        "studied_today": studied_today,
        "weekly_consistency": weekly_consistency,
    }


def get_user_rewards(*, user, reference_date: date = None) -> List[Dict[str, Any]]:
    stats = calculate_user_streaks(user=user, reference_date=reference_date)

    total_sessions = stats["total_sessions"]
    longest_streak = stats["longest_streak"]
    current_streak = stats["current_streak"]
    total_minutes = stats["total_minutes"]
    today_minutes = stats["today_minutes"]
    daily_goal_minutes = stats["daily_goal_minutes"]

    best_streak = max(longest_streak, current_streak)

    def calc_progress(current_val, target_val):
        if target_val <= 0:
            return 100
        pct = int((current_val / target_val) * 100)
        return min(100, max(0, pct))

    rewards_def = [
        {
            "id": "first_step",
            "name": "First Step",
            "description": "Log your first study session to ignite your learning journey.",
            "icon": "🌱",
            "category": "milestone",
            "unlocked": total_sessions >= 1,
            "progress": calc_progress(total_sessions, 1),
            "current_value": total_sessions,
            "target_value": 1,
            "unit": "session",
        },
        {
            "id": "streak_3",
            "name": "Ignition Flame",
            "description": "Maintain a 3-day consecutive study streak.",
            "icon": "🔥",
            "category": "streak",
            "unlocked": best_streak >= 3,
            "progress": calc_progress(best_streak, 3),
            "current_value": best_streak,
            "target_value": 3,
            "unit": "days",
        },
        {
            "id": "streak_7",
            "name": "Unstoppable Momentum",
            "description": "Maintain a 7-day consecutive study streak.",
            "icon": "⚡",
            "category": "streak",
            "unlocked": best_streak >= 7,
            "progress": calc_progress(best_streak, 7),
            "current_value": best_streak,
            "target_value": 7,
            "unit": "days",
        },
        {
            "id": "streak_14",
            "name": "Academic Master",
            "description": "Achieve a 14-day consecutive study streak.",
            "icon": "👑",
            "category": "streak",
            "unlocked": best_streak >= 14,
            "progress": calc_progress(best_streak, 14),
            "current_value": best_streak,
            "target_value": 14,
            "unit": "days",
        },
        {
            "id": "focus_5h",
            "name": "Focus Initiate",
            "description": "Accumulate at least 5 hours (300 minutes) of dedicated study time.",
            "icon": "⏱️",
            "category": "duration",
            "unlocked": total_minutes >= 300,
            "progress": calc_progress(total_minutes, 300),
            "current_value": total_minutes,
            "target_value": 300,
            "unit": "minutes",
        },
        {
            "id": "focus_20h",
            "name": "Deep Scholar",
            "description": "Accumulate 20 hours (1,200 minutes) of deep academic study.",
            "icon": "📚",
            "category": "duration",
            "unlocked": total_minutes >= 1200,
            "progress": calc_progress(total_minutes, 1200),
            "current_value": total_minutes,
            "target_value": 1200,
            "unit": "minutes",
        },
        {
            "id": "focus_100h",
            "name": "Centurion of Knowledge",
            "description": "Accumulate 100 hours (6,000 minutes) of study mastery.",
            "icon": "🏆",
            "category": "duration",
            "unlocked": total_minutes >= 6000,
            "progress": calc_progress(total_minutes, 6000),
            "current_value": total_minutes,
            "target_value": 6000,
            "unit": "minutes",
        },
        {
            "id": "daily_champion",
            "name": "Daily Champion",
            "description": "Hit your target daily study goal today.",
            "icon": "🎯",
            "category": "daily",
            "unlocked": today_minutes >= daily_goal_minutes and today_minutes > 0,
            "progress": calc_progress(today_minutes, daily_goal_minutes),
            "current_value": today_minutes,
            "target_value": daily_goal_minutes,
            "unit": "minutes",
        },
    ]

    return rewards_def
