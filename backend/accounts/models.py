from django.contrib.auth.base_user import AbstractBaseUser, BaseUserManager
from django.contrib.auth.models import PermissionsMixin
from django.db import models


class UserManager(BaseUserManager):
    use_in_migrations = True

    def _create_user(self, email, password, **extra_fields):
        if not email:
            raise ValueError("The Email field must be set")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        return self._create_user(email, password, **extra_fields)

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")

        return self._create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=255, blank=True)
    department = models.CharField(max_length=255, blank=True, default="")
    bio = models.TextField(blank=True, default="")
    target_daily_minutes = models.IntegerField(default=120)
    current_gpa = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True, default=None)
    target_gpa = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True, default=None)
    completed_credits = models.DecimalField(max_digits=5, decimal_places=1, null=True, blank=True, default=None)
    total_credits = models.DecimalField(max_digits=5, decimal_places=1, null=True, blank=True, default=140.0)
    is_onboarded = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["full_name"]

    def __str__(self):
        return self.email


class UserNotificationState(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="notification_state")
    read_notification_ids = models.JSONField(default=list, blank=True)
    preferences = models.JSONField(default=dict, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"NotificationState for {self.user.email}"


class Notification(models.Model):
    CATEGORY_CHOICES = [
        ("session", "Study Session"),
        ("milestone", "Milestone / Badge"),
        ("comment", "Comment"),
        ("reaction", "Reaction"),
        ("event", "Study Event"),
        ("academic", "Academic"),
        ("system", "System"),
    ]

    recipient = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    sender = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="sent_notifications",
    )
    category = models.CharField(
        max_length=50,
        choices=CATEGORY_CHOICES,
        default="system",
    )
    title = models.CharField(max_length=255)
    message = models.TextField()
    link = models.CharField(max_length=500, blank=True, default="")
    metadata = models.JSONField(default=dict, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"[{self.category}] {self.title} -> {self.recipient.email}"


def create_user_notification(
    *,
    recipient,
    title: str,
    message: str,
    category: str = "system",
    link: str = "",
    sender=None,
    metadata: dict = None,
) -> Notification:
    """Safely create notification with deduplication key support."""
    if metadata is None:
        metadata = {}

    dedup_key = metadata.get("dedup_key")
    if dedup_key:
        exists = Notification.objects.filter(
            recipient=recipient,
            category=category,
            metadata__dedup_key=dedup_key,
        ).exists()
        if exists:
            return None

    return Notification.objects.create(
        recipient=recipient,
        sender=sender,
        category=category,
        title=title,
        message=message,
        link=link,
        metadata=metadata,
    )

