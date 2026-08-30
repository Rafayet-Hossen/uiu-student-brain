from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import (
    CommentSerializer,
    PostSerializer,
    StudentProfileSerializer,
    StudyEventSerializer,
)
from . import services


class PostListCreateView(generics.ListCreateAPIView):
    serializer_class = PostSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        category = self.request.query_params.get("category")
        search = self.request.query_params.get("search")
        return services.list_posts(
            user=self.request.user,
            category=category,
            search=search,
        )

    def perform_create(self, serializer):
        post = services.create_post(
            user=self.request.user,
            validated_data=serializer.validated_data,
        )
        serializer.instance = post


class PostDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = PostSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return services.get_post_by_id(post_id=self.kwargs["pk"])

    def perform_update(self, serializer):
        post = services.update_post(
            post=self.get_object(),
            user=self.request.user,
            validated_data=serializer.validated_data,
        )
        serializer.instance = post

    def perform_destroy(self, instance):
        services.delete_post(post=instance, user=self.request.user)


class PostReactionToggleView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        post = services.get_post_by_id(post_id=pk)
        result = services.toggle_post_reaction(user=request.user, post=post)
        return Response(result, status=status.HTTP_200_OK)


class CommentListCreateView(generics.ListCreateAPIView):
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return services.list_comments_for_post(post_id=self.kwargs["pk"])

    def perform_create(self, serializer):
        comment = services.create_comment(
            user=self.request.user,
            post_id=self.kwargs["pk"],
            validated_data=serializer.validated_data,
        )
        serializer.instance = comment


class CommentDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        services.delete_comment(comment_id=pk, user=request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)


class StudyEventListCreateView(generics.ListCreateAPIView):
    serializer_class = StudyEventSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return services.list_upcoming_events(user=self.request.user)

    def perform_create(self, serializer):
        event = services.create_study_event(
            user=self.request.user,
            validated_data=serializer.validated_data,
        )
        serializer.instance = event


class StudyEventDetailView(generics.RetrieveDestroyAPIView):
    serializer_class = StudyEventSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return StudyEventSerializer.Meta.model.objects.get(id=self.kwargs["pk"])

    def perform_destroy(self, instance):
        services.delete_study_event(event_id=instance.id, user=self.request.user)


class StudyEventRSVPToggleView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        status_value = request.data.get("status", "going")
        result = services.toggle_event_rsvp(
            user=request.user,
            event_id=pk,
            status=status_value,
        )
        return Response(result, status=status.HTTP_200_OK)


class StudentListView(generics.ListAPIView):
    serializer_class = StudentProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        search = self.request.query_params.get("search")
        return services.list_students(user=self.request.user, search=search)


class StudentFollowToggleView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        result = services.toggle_follow_student(
            follower=request.user,
            target_user_id=pk,
        )
        return Response(result, status=status.HTTP_200_OK)
