from rest_framework import generics, permissions, status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import CourseGrade, GradePlan
from .serializers import CourseGradeSerializer, GradePlanSerializer
from .services import get_course_retake_analysis
from .services import get_course_retake_analysis, parse_and_import_transcript


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


class TranscriptUploadView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request):
        file_obj = request.FILES.get("file")
        raw_text = request.data.get("raw_text", "")

        imported_courses = parse_and_import_transcript(
            user=request.user,
            file_obj=file_obj,
            raw_text=raw_text,
        )

        if not imported_courses:
            return Response(
                {"error": "No course grades could be recognized from the provided transcript file or text. Please ensure lines contain course codes, credits, and grades."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        analysis = get_course_retake_analysis(request.user)
        serializer = CourseGradeSerializer(imported_courses, many=True)
        retake_courses = [c for c in imported_courses if c.is_retake]
        retake_serializer = CourseGradeSerializer(retake_courses, many=True)
        return Response(
            {
                "count": len(imported_courses),
                "retake_count": len(retake_courses),
                "retake_courses": retake_serializer.data,
                "imported_courses": serializer.data,
                "message": f"Successfully imported {len(imported_courses)} courses. {len(retake_courses)} course(s) added to Retake.",
                "analysis": analysis,
            },
            status=status.HTTP_200_OK,
        )
