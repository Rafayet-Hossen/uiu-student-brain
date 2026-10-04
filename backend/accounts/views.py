from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import (
    CustomTokenObtainPairSerializer,
    ProfileSummarySerializer,
    RegisterSerializer,
    UpdateProfileSerializer,
    UserSerializer,
)
from .services import get_user_profile_summary, register_user, update_user_profile


class CustomTokenObtainPairView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = CustomTokenObtainPairSerializer(data=request.data)
        if not serializer.is_valid():
            errors = serializer.errors
            detail = "Invalid credentials."
            if "detail" in errors:
                d = errors["detail"]
                detail = d[0] if isinstance(d, list) and d else str(d)
            elif "non_field_errors" in errors:
                d = errors["non_field_errors"]
                detail = d[0] if isinstance(d, list) and d else str(d)
            else:
                first_key = next(iter(errors.keys()), None)
                if first_key:
                    val = errors[first_key]
                    detail = val[0] if isinstance(val, list) and val else str(val)
            return Response({"detail": detail}, status=status.HTTP_401_UNAUTHORIZED)

        return Response(serializer.validated_data, status=status.HTTP_200_OK)


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = register_user(
            email=serializer.validated_data["email"],
            password=serializer.validated_data["password"],
            full_name=serializer.validated_data.get("full_name", ""),
        )
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)


class MeView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

    def get_serializer_class(self):
        if self.request.method in ["PATCH", "PUT"]:
            return UpdateProfileSerializer
        return UserSerializer

    def perform_update(self, serializer):
        user = update_user_profile(
            user=self.request.user,
            validated_data=serializer.validated_data,
        )
        serializer.instance = user


class ProfileSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        data = get_user_profile_summary(request.user)
        serializer = ProfileSummarySerializer(data)
        return Response(serializer.data, status=status.HTTP_200_OK)


class NotificationStateView(APIView):
    permission_classes = [IsAuthenticated]

    def _check_session_alerts(self, user):
        """Auto-detect upcoming (<=15m) and active window sessions for today, issuing alerts."""
        try:
            from datetime import datetime, time
            from django.utils import timezone
            from tracker.models import StudySession
            from .models import create_user_notification

            now_dt = timezone.localtime(timezone.now())
            today_date = now_dt.date()
            current_time = now_dt.time()

            today_sessions = StudySession.objects.filter(
                user=user,
                session_date=today_date,
                status="scheduled",
            )

            for sess in today_sessions:
                if not sess.start_time:
                    continue

                sh = sess.start_time.hour
                sm = sess.start_time.minute
                start_dt = now_dt.replace(hour=sh, minute=sm, second=0, microsecond=0)

                eh = sess.end_time.hour if sess.end_time else ((sh + 1) % 24)
                em = sess.end_time.minute if sess.end_time else sm
                end_dt = now_dt.replace(hour=eh, minute=em, second=0, microsecond=0)

                diff_seconds = (start_dt - now_dt).total_seconds()
                diff_minutes = diff_seconds / 60.0

                # 1) Advance notice: within 15 minutes before start
                if 0 <= diff_minutes <= 15:
                    create_user_notification(
                        recipient=user,
                        category="session",
                        title=f"⏰ Study Session in {int(max(1, round(diff_minutes)))}m: {sess.subject}",
                        message=f"Your scheduled session '{sess.subject}' starts in {int(max(1, round(diff_minutes)))} minutes! Prepare your environment.",
                        link="/study-center?tab=tracker",
                        metadata={
                            "dedup_key": f"session_15m_{sess.id}_{today_date}",
                            "session_id": sess.id,
                        },
                    )

                # 2) Active window now
                elif now_dt >= start_dt and now_dt <= end_dt:
                    create_user_notification(
                        recipient=user,
                        category="session",
                        title=f"⚡ Focus Window Active Now: {sess.subject}",
                        message=f"Your scheduled window for '{sess.subject}' is open right now! Launch your focus session to maintain your streak.",
                        link="/study-center?tab=tracker",
                        metadata={
                            "dedup_key": f"session_active_{sess.id}_{today_date}",
                            "session_id": sess.id,
                        },
                    )
        except Exception as e:
            # Non-blocking check
            pass

    def _check_event_alerts(self, user):
        """Auto-detect study events scheduled for tomorrow (1 day before) and starting in <=60m today, issuing persistent alerts."""
        try:
            from datetime import timedelta
            from django.utils import timezone
            from django.db.models import Q
            from community.models import StudyEvent, EventRSVP
            from .models import create_user_notification

            now_dt = timezone.localtime(timezone.now())
            today_date = now_dt.date()
            tomorrow_date = today_date + timedelta(days=1)

            relevant_event_ids = set(
                EventRSVP.objects.filter(user=user, status__in=["going", "interested"]).values_list("event_id", flat=True)
            )
            created_event_ids = set(
                StudyEvent.objects.filter(creator=user).values_list("id", flat=True)
            )
            all_target_ids = relevant_event_ids | created_event_ids
            events_qs = StudyEvent.objects.filter(
                Q(id__in=all_target_ids) | Q(event_date__in=[today_date, tomorrow_date])
            ).distinct()

            for evt in events_qs:
                if evt.event_date == tomorrow_date:
                    time_str = evt.start_time.strftime("%I:%M %p") if evt.start_time else "Scheduled Time"
                    loc_str = evt.location or "Campus Room"
                    create_user_notification(
                        recipient=user,
                        category="event",
                        title=f"🗓️ Event Tomorrow: {evt.title}",
                        message=f"Reminder: '{evt.title}' takes place tomorrow at {time_str}. Location: {loc_str}.",
                        link="/community?tab=events",
                        metadata={
                            "dedup_key": f"event_tomorrow_{evt.id}_{evt.event_date}_{user.id}",
                            "event_id": evt.id,
                        },
                    )
                elif evt.event_date == today_date and evt.start_time:
                    sh = evt.start_time.hour
                    sm = evt.start_time.minute
                    evt_start_dt = now_dt.replace(hour=sh, minute=sm, second=0, microsecond=0)
                    diff_minutes = (evt_start_dt - now_dt).total_seconds() / 60.0
                    if 0 <= diff_minutes <= 60:
                        mins_left = int(max(1, round(diff_minutes)))
                        loc_str = evt.location or "Campus Room"
                        create_user_notification(
                            recipient=user,
                            category="event",
                            title=f"⏰ Event in {mins_left}m: {evt.title}",
                            message=f"Campus event '{evt.title}' begins in {mins_left} minutes at {loc_str}. Get ready!",
                            link="/community?tab=events",
                            metadata={
                                "dedup_key": f"event_1hr_{evt.id}_{evt.event_date}_{user.id}",
                                "event_id": evt.id,
                            },
                        )
        except Exception:
            pass

    def get(self, request):
        from .models import Notification, UserNotificationState
        from .serializers import NotificationSerializer

        # 1. Trigger session-based and event alerts
        self._check_session_alerts(request.user)
        self._check_event_alerts(request.user)

        state, _ = UserNotificationState.objects.get_or_create(user=request.user)

        # 2. Check if notifications exist
        base_qs = Notification.objects.filter(recipient=request.user)
        
        # Seed default guidance notifications if completely empty for this user
        if not base_qs.exists():
            from .models import create_user_notification
            create_user_notification(
                recipient=request.user,
                category="academic",
                title="🎓 Welcome to Student Brain Notification Hub",
                message="Stay on top of scheduled study windows, habit milestones, and peer discussions in real time.",
                link="/study-center?tab=tracker",
                metadata={"dedup_key": f"welcome_{request.user.id}"},
            )
            base_qs = Notification.objects.filter(recipient=request.user)

        unread_count = base_qs.filter(is_read=False).count()
        notifs_qs = base_qs.order_by("-created_at")[:50]
        serializer = NotificationSerializer(notifs_qs, many=True)

        return Response({
            "notifications": serializer.data,
            "unread_count": unread_count,
            "read_notification_ids": state.read_notification_ids or [],
            "preferences": state.preferences or {},
        }, status=status.HTTP_200_OK)

    def post(self, request):
        from .models import Notification, UserNotificationState
        from .serializers import NotificationSerializer
        state, _ = UserNotificationState.objects.get_or_create(user=request.user)
        data = request.data

        # Normalize existing IDs
        current_raw = state.read_notification_ids or []
        if isinstance(current_raw, str):
            current_raw = [current_raw]
        elif not isinstance(current_raw, (list, tuple, set)):
            current_raw = []
        current_ids = set(str(x) for x in current_raw if len(str(x)) > 0)

        # Mark all as read:
        if data.get("mark_all") or data.get("all") or data.get("mark_all_read"):
            Notification.objects.filter(recipient=request.user, is_read=False).update(is_read=True)
            all_ids = list(Notification.objects.filter(recipient=request.user).values_list("id", flat=True))
            current_ids.update(str(x) for x in all_ids)
            current_ids.update(["notif-1", "notif-2", "notif-3", "notif-4", "notif-5"])
            if data.get("all_ids"):
                current_ids.update(str(x) for x in data.get("all_ids"))
            state.read_notification_ids = list(current_ids)

        # Mark all as unread:
        elif data.get("mark_all_unread"):
            Notification.objects.filter(recipient=request.user, is_read=True).update(is_read=False)
            current_ids.clear()
            state.read_notification_ids = []

        # Mark single ID read:
        read_id = data.get("read_id") or data.get("notification_id")
        if read_id:
            try:
                Notification.objects.filter(recipient=request.user, id=int(read_id)).update(is_read=True)
            except (ValueError, TypeError):
                pass
            current_ids.add(str(read_id))
            state.read_notification_ids = list(current_ids)

        # Mark single ID unread:
        unread_id = data.get("unread_id")
        if unread_id:
            try:
                Notification.objects.filter(recipient=request.user, id=int(unread_id)).update(is_read=False)
            except (ValueError, TypeError):
                pass
            current_ids.discard(str(unread_id))
            state.read_notification_ids = list(current_ids)

        # If updating preferences:
        if "preferences" in data:
            current_prefs = state.preferences or {}
            current_prefs.update(data["preferences"])
            state.preferences = current_prefs

        state.save()

        base_qs = Notification.objects.filter(recipient=request.user)
        unread_count = base_qs.filter(is_read=False).count()
        notifs_qs = base_qs.order_by("-created_at")[:50]
        serializer = NotificationSerializer(notifs_qs, many=True)

        return Response({
            "success": True,
            "notifications": serializer.data,
            "unread_count": unread_count,
            "read_notification_ids": state.read_notification_ids,
            "preferences": state.preferences or {},
        }, status=status.HTTP_200_OK)



