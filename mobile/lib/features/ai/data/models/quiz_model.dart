class QuizQuestionModel {
  final int id;
  final String questionText;
  final List<String> options;
  final String topic;

  QuizQuestionModel({
    required this.id,
    required this.questionText,
    required this.options,
    this.topic = 'General',
  });

  factory QuizQuestionModel.fromJson(Map<String, dynamic> json) {
    List<String> opts = [];
    if (json['options'] is List) {
      opts = (json['options'] as List).map((e) => e.toString()).toList();
    }

    return QuizQuestionModel(
      id: json['id'] as int? ?? json['question_id'] as int? ?? 1,
      questionText: json['question'] as String? ?? json['question_text'] as String? ?? 'Sample Question',
      options: opts,
      topic: json['topic'] as String? ?? 'Core Concept',
    );
  }
}

class QuizResultModel {
  final double score;
  final String masteryBadge;
  final List<String> weakTopics;
  final String recommendation;
  final int totalQuestions;
  final int correctCount;

  QuizResultModel({
    required this.score,
    required this.masteryBadge,
    required this.weakTopics,
    required this.recommendation,
    required this.totalQuestions,
    required this.correctCount,
  });

  factory QuizResultModel.fromJson(Map<String, dynamic> json) {
    List<String> topics = [];
    if (json['weak_topics'] is List) {
      topics = (json['weak_topics'] as List).map((e) => e.toString()).toList();
    }

    return QuizResultModel(
      score: double.tryParse('${json['score']}') ?? 80.0,
      masteryBadge: json['mastery_badge'] as String? ?? 'Proficient Scholar',
      weakTopics: topics,
      recommendation: json['recommendation'] as String? ??
          'Review the flagged concepts and revisit related chapter notes.',
      totalQuestions: json['total_questions'] as int? ?? 5,
      correctCount: json['correct_count'] as int? ?? 4,
    );
  }
}
