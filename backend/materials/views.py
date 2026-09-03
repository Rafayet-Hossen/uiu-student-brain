from rest_framework import status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from . import services
from .serializers import (
    CourseChatMessageSerializer,
    CourseSerializer,
    SemesterSerializer,
    StudyMaterialCreateSerializer,
    StudyMaterialSerializer,
)


# ============================================================
# SEMESTER VIEWS
# ============================================================

class SemesterListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        semesters = services.list_user_semesters(user=request.user)
        serializer = SemesterSerializer(semesters, many=True, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = SemesterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        sem = services.create_user_semester(
            user=request.user,
            name=serializer.validated_data["name"],
            is_current=serializer.validated_data.get("is_current", True),
        )
        return Response(
            SemesterSerializer(sem, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class SemesterDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        sem = services.get_user_semester(user=request.user, semester_id=pk)
        return Response(
            SemesterSerializer(sem, context={"request": request}).data,
            status=status.HTTP_200_OK,
        )

    def delete(self, request, pk):
        services.delete_user_semester(user=request.user, semester_id=pk)
        return Response(status=status.HTTP_204_NO_CONTENT)


# ============================================================
# COURSE VIEWS
# ============================================================

class CourseListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, semester_id):
        courses = services.list_semester_courses(user=request.user, semester_id=semester_id)
        serializer = CourseSerializer(courses, many=True, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, semester_id):
        serializer = CourseSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        course = services.create_course(
            user=request.user,
            semester_id=semester_id,
            title=serializer.validated_data["title"],
            code=serializer.validated_data.get("code", ""),
            color=serializer.validated_data.get("color", "#2563eb"),
            description=serializer.validated_data.get("description", ""),
        )
        return Response(
            CourseSerializer(course, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class CourseDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        course = services.get_user_course(user=request.user, course_id=pk)
        return Response(
            CourseSerializer(course, context={"request": request}).data,
            status=status.HTTP_200_OK,
        )

    def delete(self, request, pk):
        services.delete_course(user=request.user, course_id=pk)
        return Response(status=status.HTTP_204_NO_CONTENT)


# ============================================================
# MATERIAL VIEWS
# ============================================================

class StudyMaterialListCreateView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request, course_id):
        m_type = request.query_params.get("type")
        search = request.query_params.get("search")
        materials = services.list_course_materials(
            user=request.user,
            course_id=course_id,
            material_type=m_type,
            search=search,
        )
        serializer = StudyMaterialSerializer(materials, many=True, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, course_id):
        serializer = StudyMaterialCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        material = services.create_study_material(
            user=request.user,
            course_id=course_id,
            title=serializer.validated_data["title"],
            material_type=serializer.validated_data.get("material_type", "document"),
            file=serializer.validated_data.get("file"),
            link_url=serializer.validated_data.get("link_url"),
            content_text=serializer.validated_data.get("content_text", ""),
        )
        return Response(
            StudyMaterialSerializer(material, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class StudyMaterialDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        material = services.get_user_material(user=request.user, material_id=pk)
        return Response(
            StudyMaterialSerializer(material, context={"request": request}).data,
            status=status.HTTP_200_OK,
        )

    def delete(self, request, pk):
        services.delete_study_material(user=request.user, material_id=pk)
        return Response(status=status.HTTP_204_NO_CONTENT)


class StudyMaterialAnalyzeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        material = services.analyze_material_with_ai(user=request.user, material_id=pk)
        return Response(
            StudyMaterialSerializer(material, context={"request": request}).data,
            status=status.HTTP_200_OK,
        )


# ============================================================
# COURSE AI CHAT VIEW
# ============================================================

class CourseChatView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, course_id):
        messages = services.list_course_chat_messages(user=request.user, course_id=course_id)
        serializer = CourseChatMessageSerializer(messages, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, course_id):
        user_message = request.data.get("message", "")
        reply = services.send_course_chat_message(
            user=request.user,
            course_id=course_id,
            user_message=user_message,
        )
        return Response(
            CourseChatMessageSerializer(reply).data,
            status=status.HTTP_201_CREATED,
        )
