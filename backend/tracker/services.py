from datetime import date, datetime, timedelta
from typing import Any, Dict, List
from django.core.cache import cache
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import F, QuerySet, Sum
from django.shortcuts import get_object_or_404
from django.utils import timezone

from ai.services import analyze_quiz_weakness, generate_topic_quiz
from .models import StudyGoal, StudySession


def expire_overdue_sessions(*, user=None) -> int:
    """Auto-expires scheduled sessions whose booked time window has passed without being started."""
    today = timezone.localdate() if hasattr(timezone, "localdate") else date.today()
    now_time = timezone.localtime().time() if hasattr(timezone, "localtime") else datetime.now().time()

    query = StudySession.objects.filter(status="scheduled")
    if user is not None:
        query = query.filter(user=user)

    expired_count = 0
    sessions_to_update = []

    for session in query:
        is_overdue = False
        if session.session_date < today:
            is_overdue = True
        elif session.session_date == today:
            if session.end_time and now_time > session.end_time:
                is_overdue = True
            elif session.start_time:
                # Add duration buffer
                expected_end = (
                    datetime.combine(today, session.start_time)
                    + timedelta(minutes=session.duration_minutes)
                ).time()
                if now_time > expected_end:
                    is_overdue = True

        if is_overdue:
            session.status = "missed"
            sessions_to_update.append(session)
            expired_count += 1

    if sessions_to_update:
        StudySession.objects.bulk_update(sessions_to_update, ["status", "updated_at"])

    return expired_count


def get_user_study_sessions(*, user) -> QuerySet[StudySession]:
    expire_overdue_sessions(user=user)
    return StudySession.objects.filter(user=user).select_related("course", "material")


def get_user_study_session(*, user, session_id: int) -> StudySession:
    expire_overdue_sessions(user=user)
    return get_object_or_404(
        StudySession.objects.select_related("course", "material"),
        id=session_id,
        user=user,
    )


def create_study_session(*, user, validated_data) -> StudySession:
    # Auto calculate end_time if start_time provided and end_time missing
    start_time = validated_data.get("start_time")
    duration = validated_data.get("duration_minutes", 60)
    if start_time and not validated_data.get("end_time"):
        today = date.today()
        end_dt = datetime.combine(today, start_time) + timedelta(minutes=duration)
        validated_data["end_time"] = end_dt.time()

    return StudySession.objects.create(user=user, **validated_data)


def update_study_session(*, session: StudySession, validated_data) -> StudySession:
    for field, value in validated_data.items():
        setattr(session, field, value)

    if session.start_time and not session.end_time:
        today = date.today()
        end_dt = datetime.combine(today, session.start_time) + timedelta(
            minutes=session.duration_minutes
        )
        session.end_time = end_dt.time()

    session.save()
    return session


def delete_study_session(*, session: StudySession) -> None:
    session.delete()


def start_study_session(*, session: StudySession) -> StudySession:
    if session.status not in ["scheduled", "in_progress"]:
        raise ValidationError(f"Session with status '{session.status}' cannot be started.")

    session.status = "in_progress"
    if not session.actual_started_at:
        session.actual_started_at = timezone.now()
    session.save(update_fields=["status", "actual_started_at", "updated_at"])
    return session


def complete_study_session(*, session: StudySession) -> StudySession:
    if not session.actual_started_at:
        session.actual_started_at = timezone.now()
    session.actual_completed_at = timezone.now()
    session.status = "completed"
    session.save(update_fields=["status", "actual_started_at", "actual_completed_at", "updated_at"])

    # Check for newly unlocked milestones / badges and notify user
    try:
        from accounts.models import create_user_notification
        rewards = get_user_rewards(user=session.user)
        for r in rewards:
            if r.get("unlocked"):
                badge_name = r.get("name", "Study Badge")
                badge_desc = r.get("description", "")
                badge_icon = r.get("icon", "🏆")
                create_user_notification(
                    recipient=session.user,
                    category="milestone",
                    title=f"{badge_icon} Badge Unlocked: {badge_name}!",
                    message=f"Outstanding work! You've unlocked the '{badge_name}' milestone: {badge_desc}",
                    link="/study-center?tab=tracker",
                    metadata={
                        "dedup_key": f"badge_{r.get('id')}_{session.user.id}",
                        "reward_id": r.get("id"),
                    },
                )
    except Exception:
        pass

    return session



def extend_study_session(*, session: StudySession, extra_minutes: int) -> StudySession:
    if extra_minutes <= 0:
        raise ValidationError("Extra study minutes must be greater than 0.")

    session.extended_minutes += extra_minutes
    session.save(update_fields=["extended_minutes", "updated_at"])
    return session


def generate_session_quiz(*, session: StudySession, force_refresh: bool = False) -> Dict[str, Any]:
    # 1. Instant return if session already has generated quiz questions
    if not force_refresh and session.quiz_results and isinstance(session.quiz_results, dict):
        saved_questions = session.quiz_results.get("questions")
        if saved_questions and len(saved_questions) >= 3:
            return session.quiz_results

    # 2. Check material-level cache if material is linked
    mat_cache_key = None
    if session.material_id:
        mat_cache_key = f"quiz_mat_{session.material_id}"
        if not force_refresh:
            cached_quiz = cache.get(mat_cache_key)
            if cached_quiz and isinstance(cached_quiz, dict) and cached_quiz.get("questions"):
                return cached_quiz

    topics: List[str] = []
    difficulty = "Intermediate"
    subject = session.subject or "Study Session"

    if session.material:
        material = session.material
        if material.key_topics:
            topics.extend([str(t) for t in material.key_topics if str(t).strip()])
        if not topics and material.title:
            topics.append(material.title)
        if material.difficulty_level:
            difficulty = material.difficulty_level
        if session.course:
            subject = f"{session.course.title} - {material.title}"
        else:
            subject = material.title
    elif session.course:
        subject = session.course.title
        course_materials = session.course.materials.all()
        for cm in course_materials:
            if cm.key_topics:
                topics.extend([str(t) for t in cm.key_topics if str(t).strip()])
            elif cm.title:
                topics.append(cm.title)
        if not topics and session.subject:
            topics = [session.subject]
    else:
        topics = [session.subject]

    if not topics:
        topics = [subject]

    quiz_result = generate_topic_quiz(
        subject=subject,
        topics=topics,
        num_questions=5,
        difficulty=difficulty,
        force_refresh=force_refresh,
    )

    if mat_cache_key and quiz_result and quiz_result.get("questions"):
        cache.set(mat_cache_key, quiz_result, timeout=86400 * 7)

    return quiz_result


def submit_session_quiz(*, session: StudySession, question_results: List[Dict[str, Any]]) -> StudySession:
    if not question_results:
        raise ValidationError("Quiz question answers are required.")

    total = len(question_results)
    correct_count = sum(1 for q in question_results if q.get("is_correct", False))
    accuracy = round((correct_count / total * 100), 1) if total > 0 else 0.0

    try:
        analysis = analyze_quiz_weakness(
            subject=session.subject,
            question_results=question_results,
        )
    except Exception:
        weak_topics = []
        mastered_topics = []
        for q in question_results:
            topic = q.get("topic") or session.subject
            if q.get("is_correct"):
                if topic not in mastered_topics:
                    mastered_topics.append(topic)
            else:
                if topic not in weak_topics:
                    weak_topics.append(topic)
        analysis = {
            "weak_topics": weak_topics or ["Core definitions and concepts"],
            "mastered_topics": mastered_topics or ["Foundational review"],
            "recommendations": [
                "Review the linked study notes on identified weak topics.",
                "Practice active recall problems before exam day.",
            ],
        }

    session.quiz_taken = True
    session.quiz_score = correct_count
    session.quiz_accuracy = accuracy
    session.quiz_results = {
        "total_questions": total,
        "correct_count": correct_count,
        "accuracy": accuracy,
        "weak_topics": analysis.get("weak_topics", []),
        "mastered_topics": analysis.get("mastered_topics", []),
        "recommendations": analysis.get("recommendations", []),
        "questions": question_results,
    }
    session.save(
        update_fields=[
            "quiz_taken",
            "quiz_score",
            "quiz_accuracy",
            "quiz_results",
            "updated_at",
        ]
    )
    return session


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
        reference_date = timezone.localdate() if hasattr(timezone, "localdate") else date.today()

    expire_overdue_sessions(user=user)

    # STRICT RULE: Only completed sessions count towards streaks, goals, and statistics!
    completed_sessions = StudySession.objects.filter(user=user, status="completed")
    session_dates = set(completed_sessions.values_list("session_date", flat=True))

    total_sessions_count = completed_sessions.count()
    total_minutes = (
        completed_sessions.aggregate(
            total=Sum(F("duration_minutes") + F("extended_minutes"))
        )["total"]
        or 0
    )

    today_minutes = (
        completed_sessions.filter(session_date=reference_date).aggregate(
            total=Sum(F("duration_minutes") + F("extended_minutes"))
        )["total"]
        or 0
    )

    goal = get_or_create_user_goal(user=user)
    daily_goal_minutes = goal.daily_goal_minutes
    daily_goal_achieved = today_minutes >= daily_goal_minutes and today_minutes > 0
    studied_today = reference_date in session_dates

    # Current streak calculation
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
            completed_sessions.filter(session_date=day_date).aggregate(
                total=Sum(F("duration_minutes") + F("extended_minutes"))
            )["total"]
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
            "description": "Complete your first scheduled study session to ignite your learning journey.",
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
            "description": "Accumulate at least 5 hours (300 minutes) of completed study time.",
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
