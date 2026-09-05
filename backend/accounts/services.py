from typing import Any, Dict
from django.contrib.auth import get_user_model
from django.db.models import Sum

User = get_user_model()


def register_user(email, password, full_name):
    return User.objects.create_user(email=email, password=password, full_name=full_name)


def update_user_profile(user, validated_data: Dict[str, Any]):
    for field, value in validated_data.items():
        setattr(user, field, value)
    user.save()
    return user


def get_user_profile_summary(user) -> Dict[str, Any]:
    """
    Computes a comprehensive performance and profile summary across all features.
    """
    # 1. Tracker & Habit stats
    total_study_minutes = 0
    total_sessions = 0
    current_streak = 0
    badges_earned = 0
    try:
        from tracker.models import Habit, RewardBadge, StudySession
        from tracker.services import calculate_user_streak

        sessions = StudySession.objects.filter(user=user)
        total_sessions = sessions.count()
        total_study_minutes = sessions.aggregate(total=Sum("duration_minutes"))["total"] or 0
        current_streak = calculate_user_streak(user=user)
        badges_earned = RewardBadge.objects.filter(user=user).count()
    except Exception:
        pass

    # 2. Grade Planner stats
    target_gpa = None
    current_cgpa = None
    total_courses = 0
    try:
        from grades.models import CourseGrade, GradePlan

        plan = GradePlan.objects.filter(user=user).first()
        if plan:
            target_gpa = float(plan.target_gpa)
            current_cgpa = float(plan.current_gpa)
        total_courses = CourseGrade.objects.filter(user=user).count()
    except Exception:
        pass

    # 3. Planner routines
    routines_count = 0
    try:
        from planner.models import Schedule

        routines_count = Schedule.objects.filter(user=user).count()
    except Exception:
        pass

    # 4. Materials & Topics
    materials_count = 0
    topics_count = 0
    try:
        from materials.models import StudyMaterial

        materials = StudyMaterial.objects.filter(user=user)
        materials_count = materials.count()
        topics_set = set()
        for m in materials:
            for t in m.key_topics:
                topics_set.add(t)
        topics_count = len(topics_set)
    except Exception:
        pass

    # 5. Community & Ranking stats
    community_rank = 1
    total_xp = 0
    posts_count = 0
    rsvps_count = 0
    try:
        from community.models import EventRSVP, Post
        from community.services import get_leaderboard

        posts_count = Post.objects.filter(author=user).count()
        rsvps_count = EventRSVP.objects.filter(user=user).count()

        leaderboard = get_leaderboard(limit=100)
        for entry in leaderboard:
            if entry.get("user_id") == user.id:
                community_rank = entry.get("rank", 1)
                total_xp = entry.get("total_points", 0)
                break
    except Exception:
        pass

    return {
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "department": getattr(user, "department", ""),
            "bio": getattr(user, "bio", ""),
            "target_daily_minutes": getattr(user, "target_daily_minutes", 120),
            "date_joined": user.date_joined,
        },
        "performance": {
            "total_study_minutes": total_study_minutes,
            "total_study_hours": round(total_study_minutes / 60, 1),
            "total_sessions": total_sessions,
            "current_streak_days": current_streak,
            "badges_earned": badges_earned,
            "target_gpa": target_gpa,
            "current_cgpa": current_cgpa,
            "total_courses": total_courses,
            "routines_count": routines_count,
            "materials_count": materials_count,
            "topics_count": topics_count,
            "community_rank": community_rank,
            "total_xp": total_xp,
            "posts_count": posts_count,
            "rsvps_count": rsvps_count,
        },
    }
