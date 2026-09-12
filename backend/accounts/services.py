from typing import Any, Dict
from django.contrib.auth import get_user_model
from django.db.models import Sum

User = get_user_model()


def register_user(email, password, full_name):
    return User.objects.create_user(email=email, password=password, full_name=full_name)


def update_user_profile(user, validated_data: Dict[str, Any]):
    current_gpa = validated_data.pop("current_gpa", None)
    target_gpa = validated_data.pop("target_gpa", None)

    if current_gpa is not None:
        user.current_gpa = current_gpa
    if target_gpa is not None:
        user.target_gpa = target_gpa

    if current_gpa is not None or target_gpa is not None:
        try:
            from grades.models import GradePlan
            plan = GradePlan.objects.filter(user=user).first()
            if not plan:
                plan = GradePlan.objects.create(
                    user=user,
                    name="My Academic Plan",
                    target_gpa=float(target_gpa) if target_gpa is not None else 4.0,
                    total_credits=140,
                    current_gpa=float(current_gpa) if current_gpa is not None else 0.0,
                )
            else:
                if current_gpa is not None:
                    plan.current_gpa = float(current_gpa)
                if target_gpa is not None:
                    plan.target_gpa = float(target_gpa)
                plan.save()
        except Exception as e:
            print("GPA sync error in update_user_profile:", e)

    for field, value in validated_data.items():
        if hasattr(user, field):
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
        from tracker.models import StudySession
        from tracker.services import calculate_user_streaks, get_user_rewards

        sessions = StudySession.objects.filter(user=user)
        total_sessions = sessions.count()
        total_study_minutes = sessions.aggregate(total=Sum("duration_minutes"))["total"] or 0
        streaks_res = calculate_user_streaks(user=user)
        current_streak = streaks_res.get("current_streak", 0)
        rewards = get_user_rewards(user=user)
        badges_earned = sum(1 for r in rewards if r.get("unlocked"))
    except Exception as e:
        print("Tracker summary error:", e)

    # 2. Grade Planner stats
    target_gpa = float(user.target_gpa) if getattr(user, "target_gpa", None) is not None else None
    current_cgpa = float(user.current_gpa) if getattr(user, "current_gpa", None) is not None else None
    total_courses = 0
    try:
        from grades.models import GradePlan

        plan = GradePlan.objects.filter(user=user).first()
        if plan:
            if target_gpa is None:
                target_gpa = float(plan.target_gpa)
            if current_cgpa is None:
                current_cgpa = float(plan.current_gpa)
        
        try:
            from grades.models import CourseGrade
            total_courses = CourseGrade.objects.filter(user=user).count()
        except Exception:
            from materials.models import Course
            total_courses = Course.objects.filter(user=user).count()
    except Exception as e:
        print("Grades summary error:", e)

    # 3. Planner routines
    routines_count = 0
    try:
        from planner.models import Schedule

        routines_count = Schedule.objects.filter(user=user).count()
    except Exception as e:
        print("Planner summary error:", e)

    # 4. Materials & Topics
    materials_count = 0
    topics_count = 0
    try:
        from materials.models import StudyMaterial

        materials = StudyMaterial.objects.filter(user=user)
        materials_count = materials.count()
        topics_set = set()
        for m in materials:
            if m.key_topics and isinstance(m.key_topics, list):
                for t in m.key_topics:
                    if t:
                        topics_set.add(str(t).strip())
            if m.ai_analysis and isinstance(m.ai_analysis, dict):
                for t in m.ai_analysis.get("key_topics", []):
                    if t:
                        topics_set.add(str(t).strip())
        topics_count = len(topics_set)
    except Exception as e:
        print("Materials summary error:", e)

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

        leaderboard_data = get_leaderboard(user=user, timeframe="weekly")
        rankings = leaderboard_data.get("rankings", []) if isinstance(leaderboard_data, dict) else (leaderboard_data or [])
        for entry in rankings:
            if entry.get("user_id") == user.id:
                community_rank = entry.get("rank", 1)
                total_xp = entry.get("total_points", 0)
                break
    except Exception as e:
        print("Community summary error:", e)

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
