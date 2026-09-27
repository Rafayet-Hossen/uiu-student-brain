import json
from rest_framework import status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from . import services
from .serializers import (
    CourseChatMessageSerializer,
    CourseSerializer,
    MaterialStatsSerializer,
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

class GlobalCourseListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        courses = services.list_user_courses(user=request.user)
        serializer = CourseSerializer(courses, many=True, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)


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

    def patch(self, request, pk):
        serializer = CourseSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        course = services.update_course(
            user=request.user,
            course_id=pk,
            title=serializer.validated_data.get("title"),
            code=serializer.validated_data.get("code"),
            color=serializer.validated_data.get("color"),
            description=serializer.validated_data.get("description"),
        )
        return Response(
            CourseSerializer(course, context={"request": request}).data,
            status=status.HTTP_200_OK,
        )

    def put(self, request, pk):
        return self.patch(request, pk)

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
        category = request.query_params.get("category")
        search = request.query_params.get("search")
        materials = services.list_course_materials(
            user=request.user,
            course_id=course_id,
            material_type=m_type,
            category=category,
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
            category=serializer.validated_data.get("category", "Lecture Note"),
            file=serializer.validated_data.get("file"),
            link_url=serializer.validated_data.get("link_url"),
            content_text=serializer.validated_data.get("content_text", ""),
            tags=serializer.validated_data.get("tags", []),
        )
        return Response(
            StudyMaterialSerializer(material, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class GlobalMaterialListCreateView(APIView):
    """Top-level access to list all user materials across all courses."""
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        category = request.query_params.get("category")
        search = request.query_params.get("search")
        materials = services.list_user_all_materials(
            user=request.user,
            category=category,
            search=search,
        )
        serializer = StudyMaterialSerializer(materials, many=True, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = StudyMaterialCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        course_id = request.data.get("course") or request.data.get("course_id")
        parsed_course_id = None
        if course_id is not None:
            try:
                parsed_course_id = int(course_id)
            except (ValueError, TypeError):
                parsed_course_id = None
        material = services.create_study_material(
            user=request.user,
            course_id=parsed_course_id,
            title=serializer.validated_data["title"],
            material_type=serializer.validated_data.get("material_type", "document"),
            category=serializer.validated_data.get("category", "Lecture Note"),
            file=serializer.validated_data.get("file"),
            link_url=serializer.validated_data.get("link_url"),
            content_text=serializer.validated_data.get("content_text", ""),
            tags=serializer.validated_data.get("tags", []),
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

    def patch(self, request, pk):
        title = request.data.get("title")
        content_text = request.data.get("content", request.data.get("content_text"))
        category = request.data.get("category")
        tags = request.data.get("tags")
        if isinstance(tags, str):
            try:
                tags = json.loads(tags)
            except Exception:
                tags = [t.strip() for t in tags.split(",") if t.strip()]

        material = services.update_study_material(
            user=request.user,
            material_id=pk,
            title=title,
            content_text=content_text,
            category=category,
            tags=tags,
        )
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


class MaterialStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        stats_data = services.get_materials_stats(user=request.user)
        serializer = MaterialStatsSerializer(stats_data)
        return Response(serializer.data, status=status.HTTP_200_OK)


class MaterialsBundleView(APIView):
    """
    High-performance unified bundle endpoint for Study Center Materials.
    Returns semesters, active courses, active materials, and stats in a single fast query.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        requested_sem_id = request.query_params.get("semester_id")
        requested_course_id = request.query_params.get("course_id")

        # 1. Fetch user semesters with prefetched courses & materials
        semesters_qs = (
            Semester.objects.filter(user=request.user)
            .prefetch_related("courses__materials")
            .order_by("-is_current", "-created_at")
        )
        semesters_list = list(semesters_qs)
        sem_data = SemesterSerializer(semesters_list, many=True, context={"request": request}).data

        # 2. Determine active semester
        selected_sem = None
        if requested_sem_id:
            try:
                selected_sem = next((s for s in semesters_list if str(s.id) == str(requested_sem_id)), None)
            except Exception:
                selected_sem = None

        if not selected_sem and semesters_list:
            selected_sem = next((s for s in semesters_list if s.is_current), semesters_list[0])

        # 3. Get courses for active semester
        courses_list = list(selected_sem.courses.all()) if selected_sem else []
        courses_data = CourseSerializer(courses_list, many=True, context={"request": request}).data

        # 4. Determine active course
        selected_course = None
        if requested_course_id:
            try:
                selected_course = next((c for c in courses_list if str(c.id) == str(requested_course_id)), None)
            except Exception:
                selected_course = None

        if not selected_course and courses_list:
            selected_course = courses_list[0]

        # 5. Get materials for active course
        materials_list = list(selected_course.materials.all().order_by("-created_at")) if selected_course else []
        materials_data = StudyMaterialSerializer(materials_list, many=True, context={"request": request}).data

        # 6. Material stats
        stats_data = services.get_materials_stats(user=request.user)
        stats_serializer = MaterialStatsSerializer(stats_data)

        return Response(
            {
                "semesters": sem_data,
                "selected_semester_id": selected_sem.id if selected_sem else None,
                "courses": courses_data,
                "selected_course_id": selected_course.id if selected_course else None,
                "materials": materials_data,
                "stats": stats_serializer.data,
            },
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


# ============================================================
# EXPORT PDF & FILE DOWNLOAD VIEWS
# ============================================================

class StudyMaterialExportPDFView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        material = services.get_user_material(user=request.user, material_id=pk)
        from .pdf_service import generate_material_analysis_pdf
        from django.http import HttpResponse

        try:
            pdf_bytes = generate_material_analysis_pdf(material)
        except Exception as e:
            import logging
            logging.getLogger(__name__).error(f"PDF export error for material {pk}: {e}", exc_info=True)
            return Response(
                {"error": f"Failed to generate study analysis PDF: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        safe_title = "".join(
            c for c in (material.title or "study_analysis") if c.isalnum() or c in ("-", "_")
        ).rstrip()
        filename = f"{safe_title}_analysis_report.pdf"

        response = HttpResponse(pdf_bytes, content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        return response


class StudyMaterialDownloadView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        material = services.get_user_material(user=request.user, material_id=pk)
        from django.http import FileResponse, HttpResponse, Http404

        if material.file and material.file.storage.exists(material.file.name):
            return FileResponse(
                material.file.open("rb"),
                as_attachment=True,
                filename=material.file.name.split("/")[-1],
            )

        if material.content_text:
            safe_title = "".join(
                c for c in (material.title or "material") if c.isalnum() or c in ("-", "_")
            ).rstrip()
            response = HttpResponse(material.content_text, content_type="text/plain; charset=utf-8")
            response["Content-Disposition"] = f'attachment; filename="{safe_title}.txt"'
            return response

        raise Http404("Document file not found on server.")
