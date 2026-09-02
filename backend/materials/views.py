from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from . import services
from .serializers import MaterialStatsSerializer, StudyMaterialSerializer


class MaterialListCreateView(generics.ListCreateAPIView):
    serializer_class = StudyMaterialSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        subject = self.request.query_params.get("subject")
        category = self.request.query_params.get("category")
        search = self.request.query_params.get("search")
        return services.list_materials(
            user=self.request.user,
            subject=subject,
            category=category,
            search=search,
        )

    def perform_create(self, serializer):
        file_obj = self.request.FILES.get("file")
        material = services.create_material(
            user=self.request.user,
            validated_data=serializer.validated_data,
            file=file_obj,
        )
        serializer.instance = material


class MaterialDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = StudyMaterialSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return services.get_material_by_id(
            user=self.request.user,
            material_id=self.kwargs["pk"],
        )

    def perform_update(self, serializer):
        material = services.update_material(
            material=self.get_object(),
            user=self.request.user,
            validated_data=serializer.validated_data,
        )
        serializer.instance = material

    def perform_destroy(self, instance):
        services.delete_material(
            material=instance,
            user=self.request.user,
        )


class MaterialAnalyzeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        material = services.get_material_by_id(
            user=request.user,
            material_id=pk,
        )
        analyzed = services.analyze_material(material=material)
        serializer = StudyMaterialSerializer(analyzed)
        return Response(serializer.data, status=status.HTTP_200_OK)


class MaterialStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        stats_data = services.get_material_stats(user=request.user)
        serializer = MaterialStatsSerializer(stats_data)
        return Response(serializer.data, status=status.HTTP_200_OK)
