from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import AnalyticsDashboardSerializer
from .services import get_analytics_dashboard_data


class AnalyticsDashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        data = get_analytics_dashboard_data(user=request.user)
        serializer = AnalyticsDashboardSerializer(data)
        return Response(serializer.data, status=status.HTTP_200_OK)
