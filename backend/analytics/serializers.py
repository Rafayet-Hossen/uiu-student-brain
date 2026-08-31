from rest_framework import serializers


class GpaAnalyticsSerializer(serializers.Serializer):
    plan_name = serializers.CharField()
    current_gpa = serializers.FloatField()
    target_gpa = serializers.FloatField()
    completed_credits = serializers.FloatField()
    total_credits = serializers.FloatField()
    remaining_credits = serializers.FloatField()
    required_gpa = serializers.FloatField(allow_null=True)
    possible = serializers.BooleanField()
    percent_complete = serializers.FloatField()


class SubjectDistributionSerializer(serializers.Serializer):
    subject = serializers.CharField()
    minutes = serializers.IntegerField()
    percentage = serializers.FloatField()
    sessions_count = serializers.IntegerField()


class WeeklyTrendItemSerializer(serializers.Serializer):
    date = serializers.CharField()
    day_name = serializers.CharField()
    minutes = serializers.IntegerField()
    sessions = serializers.IntegerField()


class ScheduleAdherenceSerializer(serializers.Serializer):
    active_schedules_count = serializers.IntegerField()
    scheduled_subjects = serializers.ListField(child=serializers.CharField())
    covered_subjects_this_week = serializers.ListField(child=serializers.CharField())
    adherence_rate = serializers.FloatField()


class AnalyticsSummarySerializer(serializers.Serializer):
    total_study_minutes = serializers.IntegerField()
    total_sessions = serializers.IntegerField()
    total_subjects = serializers.IntegerField()
    active_schedules_count = serializers.IntegerField()
    avg_session_minutes = serializers.FloatField()


class AnalyticsDashboardSerializer(serializers.Serializer):
    summary = AnalyticsSummarySerializer()
    gpa_summary = GpaAnalyticsSerializer(allow_null=True)
    subject_distribution = SubjectDistributionSerializer(many=True)
    weekly_trend = WeeklyTrendItemSerializer(many=True)
    schedule_adherence = ScheduleAdherenceSerializer()
    insights = serializers.ListField(child=serializers.CharField())
