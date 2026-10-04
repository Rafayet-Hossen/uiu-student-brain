from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    CustomTokenObtainPairView,
    MeView,
    NotificationStateView,
    ProfileSummaryView,
    RegisterView,
)

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", CustomTokenObtainPairView.as_view(), name="login"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("me/", MeView.as_view(), name="me"),
    path("profile-summary/", ProfileSummaryView.as_view(), name="profile_summary"),
    path("notifications/", NotificationStateView.as_view(), name="notification_state"),
]

