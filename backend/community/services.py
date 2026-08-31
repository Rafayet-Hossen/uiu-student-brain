from datetime import date, timedelta
from typing import Any, Dict, List
from django.contrib.auth import get_user_model
from django.core.exceptions import PermissionDenied, ValidationError
from django.db.models import Count, Exists, OuterRef, Q, QuerySet, Sum

from tracker.models import StudySession
from tracker.services import calculate_user_streaks, get_user_rewards
from .models import Comment, EventRSVP, Follow, LeaderboardProfile, Post, Reaction, StudyEvent

User = get_user_model()



# ============================================================
# POST SERVICES
# ============================================================

def list_posts(*, user, category: str = None, search: str = None) -> QuerySet[Post]:
    queryset = Post.objects.select_related("author").annotate(
        comments_count=Count("comments", distinct=True),
        likes_count=Count("reactions", distinct=True),
        is_liked=Exists(
            Reaction.objects.filter(post=OuterRef("pk"), user=user)
        ),
    )

    if category and category.lower() != "all":
        queryset = queryset.filter(category__iexact=category)

    if search:
        queryset = queryset.filter(
            Q(title__icontains=search) | Q(content__icontains=search) | Q(subject__icontains=search) if hasattr(Post, 'subject') else Q(title__icontains=search) | Q(content__icontains=search)
        )

    return queryset.order_by("-created_at")


def get_post_by_id(*, post_id: int) -> Post:
    return Post.objects.select_related("author").get(id=post_id)


def create_post(*, user, validated_data: dict) -> Post:
    return Post.objects.create(author=user, **validated_data)


def update_post(*, post: Post, user, validated_data: dict) -> Post:
    if post.author != user:
        raise PermissionDenied("You do not have permission to edit this post.")

    for field, value in validated_data.items():
        setattr(post, field, value)

    post.save()
    return post


def delete_post(*, post: Post, user) -> None:
    if post.author != user:
        raise PermissionDenied("You do not have permission to delete this post.")

    post.delete()


def toggle_post_reaction(*, user, post: Post) -> dict:
    reaction = Reaction.objects.filter(post=post, user=user).first()
    if reaction:
        reaction.delete()
        liked = False
    else:
        Reaction.objects.create(post=post, user=user)
        liked = True

    likes_count = Reaction.objects.filter(post=post).count()
    return {"liked": liked, "likes_count": likes_count}


# ============================================================
# COMMENT SERVICES
# ============================================================

def list_comments_for_post(*, post_id: int) -> QuerySet[Comment]:
    return Comment.objects.filter(post_id=post_id).select_related("author").order_by("created_at")


def create_comment(*, user, post_id: int, validated_data: dict) -> Comment:
    post = Post.objects.get(id=post_id)
    return Comment.objects.create(
        post=post,
        author=user,
        **validated_data,
    )


def delete_comment(*, comment_id: int, user) -> None:
    comment = Comment.objects.select_related("author").get(id=comment_id)
    if comment.author != user:
        raise PermissionDenied("You do not have permission to delete this comment.")

    comment.delete()


# ============================================================
# STUDY EVENT SERVICES
# ============================================================

def list_upcoming_events(*, user) -> QuerySet[StudyEvent]:
    return StudyEvent.objects.select_related("creator").annotate(
        rsvp_count=Count("rsvps", distinct=True),
        is_rsvped=Exists(
            EventRSVP.objects.filter(event=OuterRef("pk"), user=user)
        ),
    ).order_by("event_date", "start_time")


def create_study_event(*, user, validated_data: dict) -> StudyEvent:
    return StudyEvent.objects.create(creator=user, **validated_data)


def delete_study_event(*, event_id: int, user) -> None:
    event = StudyEvent.objects.get(id=event_id)
    if event.creator != user:
        raise PermissionDenied("You do not have permission to delete this event.")

    event.delete()


def toggle_event_rsvp(*, user, event_id: int, status: str = "going") -> dict:
    event = StudyEvent.objects.get(id=event_id)
    rsvp = EventRSVP.objects.filter(event=event, user=user).first()

    if rsvp:
        rsvp.delete()
        rsvped = False
    else:
        EventRSVP.objects.create(event=event, user=user, status=status)
        rsvped = True

    rsvp_count = EventRSVP.objects.filter(event=event).count()
    return {"rsvped": rsvped, "rsvp_count": rsvp_count}


# ============================================================
# STUDENT NETWORK & FOLLOW SERVICES
# ============================================================

def list_students(*, user, search: str = None) -> list:
    queryset = User.objects.exclude(id=user.id).annotate(
        followers_count=Count("followers_set", distinct=True),
        following_count=Count("following_set", distinct=True),
        is_following=Exists(
            Follow.objects.filter(follower=user, following=OuterRef("pk"))
        ),
    )

    if search:
        queryset = queryset.filter(
            Q(full_name__icontains=search) | Q(email__icontains=search)
        )

    return queryset.order_by("-followers_count", "full_name")


def toggle_follow_student(*, follower, target_user_id: int) -> dict:
    if follower.id == target_user_id:
        raise ValidationError("You cannot follow yourself.")

    target_user = User.objects.get(id=target_user_id)
    follow_record = Follow.objects.filter(follower=follower, following=target_user).first()

    if follow_record:
        follow_record.delete()
        following = False
    else:
        Follow.objects.create(follower=follower, following=target_user)
        following = True

    followers_count = Follow.objects.filter(following=target_user).count()
    return {"following": following, "followers_count": followers_count}


# ============================================================
# LEADERBOARD SERVICES
# ============================================================

def get_or_create_leaderboard_profile(*, user) -> LeaderboardProfile:
    profile, _ = LeaderboardProfile.objects.get_or_create(
        user=user,
        defaults={"is_opted_in": False, "custom_quote": ""},
    )
    return profile


def toggle_leaderboard_opt_in(*, user, is_opted_in: bool, custom_quote: str = None) -> LeaderboardProfile:
    profile = get_or_create_leaderboard_profile(user=user)
    profile.is_opted_in = is_opted_in
    if custom_quote is not None:
        profile.custom_quote = custom_quote.strip()
    profile.save()
    return profile


def get_leaderboard_status(*, user) -> Dict[str, Any]:
    profile = get_or_create_leaderboard_profile(user=user)
    return {
        "is_opted_in": profile.is_opted_in,
        "custom_quote": profile.custom_quote,
        "user_id": user.id,
    }


def get_leaderboard(
    *,
    user,
    timeframe: str = "weekly",
    limit: int = 50,
    reference_date: date = None,
) -> Dict[str, Any]:
    if reference_date is None:
        reference_date = date.today()

    user_profile = get_or_create_leaderboard_profile(user=user)

    opted_in_profiles = LeaderboardProfile.objects.filter(is_opted_in=True).select_related("user")
    opted_in_user_ids = set(opted_in_profiles.values_list("user_id", flat=True))

    if user_profile.is_opted_in:
        opted_in_user_ids.add(user.id)

    following_ids = set(
        Follow.objects.filter(follower=user).values_list("following_id", flat=True)
    )

    quotes_map = {p.user_id: p.custom_quote for p in opted_in_profiles}
    if user_profile.is_opted_in:
        quotes_map[user.id] = user_profile.custom_quote

    week_start = reference_date - timedelta(days=6)
    users = User.objects.filter(id__in=opted_in_user_ids)

    entries: List[Dict[str, Any]] = []
    for u in users:
        sessions = StudySession.objects.filter(user=u)
        total_sessions = sessions.count()
        total_mins = sessions.aggregate(total=Sum("duration_minutes"))["total"] or 0

        weekly_mins = (
            sessions.filter(session_date__gte=week_start, session_date__lte=reference_date)
            .aggregate(total=Sum("duration_minutes"))["total"]
            or 0
        )

        streaks = calculate_user_streaks(user=u, reference_date=reference_date)
        current_streak = streaks["current_streak"]
        longest_streak = streaks["longest_streak"]

        rewards = get_user_rewards(user=u, reference_date=reference_date)
        trophies_count = sum(1 for r in rewards if r.get("unlocked", False))

        d_name = u.full_name.strip() if u.full_name else u.email.split("@")[0]

        entry = {
            "user_id": u.id,
            "full_name": u.full_name or "",
            "email": u.email,
            "display_name": d_name,
            "custom_quote": quotes_map.get(u.id, ""),
            "weekly_minutes": weekly_mins,
            "total_minutes": total_mins,
            "study_minutes": weekly_mins if timeframe == "weekly" else total_mins,
            "study_hours": round((weekly_mins if timeframe == "weekly" else total_mins) / 60, 1),
            "current_streak": current_streak,
            "longest_streak": longest_streak,
            "total_sessions": total_sessions,
            "trophies_count": trophies_count,
            "is_following": u.id in following_ids,
            "is_current_user": u.id == user.id,
        }
        entries.append(entry)

    # Sort based on selected timeframe
    if timeframe == "streak":
        entries.sort(
            key=lambda x: (
                -x["current_streak"],
                -x["longest_streak"],
                -x["weekly_minutes"],
                x["display_name"].lower(),
            )
        )
    elif timeframe == "all_time":
        entries.sort(
            key=lambda x: (
                -x["total_minutes"],
                -x["total_sessions"],
                -x["current_streak"],
                x["display_name"].lower(),
            )
        )
    else:
        timeframe = "weekly"
        entries.sort(
            key=lambda x: (
                -x["weekly_minutes"],
                -x["current_streak"],
                -x["total_minutes"],
                x["display_name"].lower(),
            )
        )

    rankings: List[Dict[str, Any]] = []
    current_user_rank = None
    current_user_entry = None

    for idx, e in enumerate(entries, start=1):
        ranked_entry = {**e, "rank": idx}
        rankings.append(ranked_entry)
        if e["is_current_user"]:
            current_user_rank = idx
            current_user_entry = ranked_entry

    if not user_profile.is_opted_in:
        user_sessions = StudySession.objects.filter(user=user)
        total_sessions = user_sessions.count()
        total_mins = user_sessions.aggregate(total=Sum("duration_minutes"))["total"] or 0
        weekly_mins = (
            user_sessions.filter(session_date__gte=week_start, session_date__lte=reference_date)
            .aggregate(total=Sum("duration_minutes"))["total"]
            or 0
        )
        streaks = calculate_user_streaks(user=user, reference_date=reference_date)
        rewards = get_user_rewards(user=user, reference_date=reference_date)
        trophies_count = sum(1 for r in rewards if r.get("unlocked", False))
        d_name = user.full_name.strip() if user.full_name else user.email.split("@")[0]

        current_user_entry = {
            "rank": None,
            "user_id": user.id,
            "full_name": user.full_name or "",
            "email": user.email,
            "display_name": d_name,
            "custom_quote": user_profile.custom_quote,
            "weekly_minutes": weekly_mins,
            "total_minutes": total_mins,
            "study_minutes": weekly_mins if timeframe == "weekly" else total_mins,
            "study_hours": round((weekly_mins if timeframe == "weekly" else total_mins) / 60, 1),
            "current_streak": streaks["current_streak"],
            "longest_streak": streaks["longest_streak"],
            "total_sessions": total_sessions,
            "trophies_count": trophies_count,
            "is_following": False,
            "is_current_user": True,
        }

    return {
        "timeframe": timeframe,
        "is_opted_in": user_profile.is_opted_in,
        "custom_quote": user_profile.custom_quote,
        "current_user_rank": current_user_rank,
        "current_user_entry": current_user_entry,
        "total_participants": len(rankings),
        "rankings": rankings[:limit],
    }


