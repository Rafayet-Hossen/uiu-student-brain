from django.db.models import QuerySet
from django.shortcuts import get_object_or_404
from .models import StudySession


def get_user_study_sessions(*, user) -> QuerySet[StudySession]:
    return StudySession.objects.filter(user=user)


def get_user_study_session(*, user, session_id: int) -> StudySession:
    return get_object_or_404(StudySession, id=session_id, user=user)


def create_study_session(*, user, validated_data) -> StudySession:
    return StudySession.objects.create(user=user, **validated_data)


def update_study_session(*, session: StudySession, validated_data) -> StudySession:
    for field, value in validated_data.items():
        setattr(session, field, value)
    session.save()
    return session


def delete_study_session(*, session: StudySession) -> None:
    session.delete()
