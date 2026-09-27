from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import GoogleLoginView, MeView, NotificationStateView, ProfileSummaryView, RegisterView

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", TokenObtainPairView.as_view(), name="login"),
    path("google/", GoogleLoginView.as_view(), name="google_login"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("me/", MeView.as_view(), name="me"),
    path("profile-summary/", ProfileSummaryView.as_view(), name="profile_summary"),
    path("notifications/", NotificationStateView.as_view(), name="notification_state"),
]


