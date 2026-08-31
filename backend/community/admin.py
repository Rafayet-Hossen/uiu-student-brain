from django.contrib import admin

from .models import Comment, EventRSVP, Follow, LeaderboardProfile, Post, Reaction, StudyEvent


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ["title", "author", "category", "created_at"]
    list_filter = ["category", "created_at"]
    search_fields = ["title", "content", "author__email", "author__full_name"]


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ["post", "author", "created_at"]
    search_fields = ["content", "author__email"]


@admin.register(Reaction)
class ReactionAdmin(admin.ModelAdmin):
    list_display = ["post", "user", "created_at"]


@admin.register(Follow)
class FollowAdmin(admin.ModelAdmin):
    list_display = ["follower", "following", "created_at"]


@admin.register(StudyEvent)
class StudyEventAdmin(admin.ModelAdmin):
    list_display = ["title", "creator", "subject", "event_date", "start_time", "end_time"]
    list_filter = ["event_date", "subject"]
    search_fields = ["title", "description", "location"]


@admin.register(EventRSVP)
class EventRSVPAdmin(admin.ModelAdmin):
    list_display = ["event", "user", "status", "created_at"]


@admin.register(LeaderboardProfile)
class LeaderboardProfileAdmin(admin.ModelAdmin):
    list_display = ["user", "is_opted_in", "custom_quote", "updated_at"]
    list_filter = ["is_opted_in", "created_at"]
    search_fields = ["user__email", "user__full_name", "custom_quote"]

