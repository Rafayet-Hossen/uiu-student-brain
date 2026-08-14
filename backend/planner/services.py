from django.db.models import QuerySet

from .models import Schedule


def create_schedule(*, user, validated_data) -> Schedule:
    return Schedule.objects.create(
        user=user,
        **validated_data,
    )


def get_user_schedules(*, user) -> QuerySet[Schedule]:
    return Schedule.objects.filter(user=user).order_by(
        "deadline",
        "start_time",
    )


def get_user_schedule(*, user, schedule_id) -> Schedule:
    return Schedule.objects.get(
        id=schedule_id,
        user=user,
    )


def update_schedule(*, schedule, validated_data) -> Schedule:
    for field, value in validated_data.items():
        setattr(schedule, field, value)

    schedule.save()
    return schedule


def delete_schedule(*, schedule) -> None:
    schedule.delete()
