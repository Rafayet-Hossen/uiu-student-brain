from django.contrib.auth import get_user_model
from django.core.exceptions import PermissionDenied, ValidationError
from django.db.models import Count, Exists, OuterRef, Q, QuerySet

from .models import Comment, EventRSVP, Follow, Post, Reaction, StudyEvent

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

