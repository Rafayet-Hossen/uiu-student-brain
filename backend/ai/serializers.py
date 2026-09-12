from rest_framework import serializers


class HealthCheckSerializer(serializers.Serializer):
    status = serializers.CharField()
    active_model = serializers.CharField()
    message = serializers.CharField()


class TopicExtractionRequestSerializer(serializers.Serializer):
    text = serializers.CharField(required=True)
    subject_hint = serializers.CharField(required=False, allow_blank=True, default="")


class QuizGenerationRequestSerializer(serializers.Serializer):
    subject = serializers.CharField(required=True)
    topics = serializers.ListField(
        child=serializers.CharField(),
        required=True,
        allow_empty=False,
    )
    num_questions = serializers.IntegerField(default=5, min_value=1, max_value=20)
    difficulty = serializers.ChoiceField(
        choices=["Beginner", "Intermediate", "Advanced"],
        default="Intermediate",
    )
    force_refresh = serializers.BooleanField(required=False, default=False)


class RiskAssessmentRequestSerializer(serializers.Serializer):
    subject = serializers.CharField(required=True)
    current_gpa = serializers.FloatField(required=True, min_value=0.0, max_value=4.0)
    target_gpa = serializers.FloatField(required=True, min_value=0.0, max_value=4.0)
    completed_credits = serializers.IntegerField(required=True, min_value=0)
    total_credits = serializers.IntegerField(required=True, min_value=1)
    weekly_study_minutes = serializers.IntegerField(default=0, min_value=0)
    current_streak = serializers.IntegerField(default=0, min_value=0)
    weak_topics = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        default=list,
    )


class QuestionResultSerializer(serializers.Serializer):
    question = serializers.CharField(required=True)
    selected_option = serializers.CharField(required=True, allow_blank=True)
    correct_option = serializers.CharField(required=True)
    is_correct = serializers.BooleanField(required=True)
    topic = serializers.CharField(required=False, default="", allow_blank=True)


class QuizEvaluationRequestSerializer(serializers.Serializer):
    subject = serializers.CharField(required=True)
    question_results = QuestionResultSerializer(many=True, required=True)


