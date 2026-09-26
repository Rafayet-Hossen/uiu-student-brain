"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.http import JsonResponse
from django.shortcuts import redirect
from django.urls import include, path


def home_view(request):
    """
    Return API status for health monitors and visitors, avoiding broken localhost redirects.
    """
    return JsonResponse({
        "service": "StudentBrain Backend API",
        "status": "healthy",
        "endpoints": {
            "api": "/api/",
            "admin": "/admin/",
            "health": "/healthz/",
        }
    }, status=200)


def health_check_view(request):
    return JsonResponse({"status": "ok", "healthy": True}, status=200)


def api_root_view(request):
    return JsonResponse({
        "service": "StudentBrain API",
        "status": "healthy",
        "endpoints": {
            "accounts": "/api/accounts/",
            "planner": "/api/planner/",
            "grades": "/api/grades/",
            "tracker": "/api/tracker/",
            "community": "/api/community/",
            "analytics": "/api/analytics/",
            "ai": "/api/ai/",
            "materials": "/api/materials/",
            "admin": "/admin/",
        }
    })


urlpatterns = [
    path('', home_view, name='home'),
    path('healthz/', health_check_view, name='healthz'),
    path('health/', health_check_view, name='health'),
    path('api/', api_root_view, name='api-root'),
    path('admin/', admin.site.urls),
    path('api/accounts/', include('accounts.urls')),
    path('api/planner/', include('planner.urls')),
    path('api/grades/', include('grades.urls')),
    path('api/tracker/', include('tracker.urls')),
    path('api/community/', include('community.urls')),
    path('api/analytics/', include('analytics.urls')),
    path('api/ai/', include('ai.urls')),
    path('api/materials/', include('materials.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)


