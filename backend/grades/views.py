from rest_framework import generics, permissions

from .models import GradePlan
from .serializers import GradePlanSerializer


class GradePlanListCreateView(generics.ListCreateAPIView):
    serializer_class = GradePlanSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return GradePlan.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class GradePlanDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = GradePlanSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return GradePlan.objects.filter(user=self.request.user)
