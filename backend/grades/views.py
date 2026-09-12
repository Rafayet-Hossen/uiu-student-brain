from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import CourseGrade, GradePlan
from .serializers import CourseGradeSerializer, GradePlanSerializer
from .services import get_course_retake_analysis


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


class CourseGradeListCreateView(generics.ListCreateAPIView):
    serializer_class = CourseGradeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return CourseGrade.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        plan = GradePlan.objects.filter(user=self.request.user).first()
        serializer.save(user=self.request.user, plan=plan)


class CourseGradeDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CourseGradeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return CourseGrade.objects.filter(user=self.request.user)


class RetakeAdvisorView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        analysis = get_course_retake_analysis(request.user)
        return Response(analysis, status=status.HTTP_200_OK)
