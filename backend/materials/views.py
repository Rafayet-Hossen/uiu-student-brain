from rest_framework import status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from . import services
from .serializers import (
    StudyMaterialCreateSerializer,
    StudyMaterialSerializer,
    StudyProjectSerializer,
)


class StudyProjectListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        projects = services.list_user_projects(user=request.user)
        serializer = StudyProjectSerializer(projects, many=True, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = StudyProjectSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        project = services.create_study_project(
            user=request.user,
            title=serializer.validated_data["title"],
            subject=serializer.validated_data["subject"],
            description=serializer.validated_data.get("description", ""),
            color=serializer.validated_data.get("color", "#2563eb"),
        )
        return Response(
            StudyProjectSerializer(project, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class StudyProjectDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        project = services.get_user_project(user=request.user, project_id=pk)
        return Response(
            StudyProjectSerializer(project, context={"request": request}).data,
            status=status.HTTP_200_OK,
        )

    def delete(self, request, pk):
        services.delete_study_project(user=request.user, project_id=pk)
        return Response(status=status.HTTP_204_NO_CONTENT)


class StudyMaterialListCreateView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request, project_id):
        m_type = request.query_params.get("type")
        search = request.query_params.get("search")
        materials = services.list_project_materials(
            user=request.user,
            project_id=project_id,
            material_type=m_type,
            search=search,
        )
        serializer = StudyMaterialSerializer(materials, many=True, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, project_id):
        serializer = StudyMaterialCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        material = services.create_study_material(
            user=request.user,
            project_id=project_id,
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
