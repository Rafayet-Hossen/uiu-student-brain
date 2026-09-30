class StudyMaterialModel {
  final int id;
  final String title;
  final String materialType;
  final String category;
  final String contentText;
  final String summary;
  final List<String> keyTopics;
  final List<Map<String, dynamic>> keyConcepts;
  final List<Map<String, dynamic>> keyQuestions;
  final String difficultyLevel;
  final int estimatedReadingTime;
  final String? fileUrl;
  final bool isAnalyzed;
  final Map<String, dynamic>? aiAnalysis;

  StudyMaterialModel({
    required this.id,
    required this.title,
    required this.materialType,
    required this.category,
    this.contentText = '',
    this.summary = '',
    this.keyTopics = const [],
    this.keyConcepts = const [],
    this.keyQuestions = const [],
    this.difficultyLevel = 'Intermediate',
    this.estimatedReadingTime = 5,
    this.fileUrl,
    this.isAnalyzed = false,
    this.aiAnalysis,
  });

  factory StudyMaterialModel.fromJson(Map<String, dynamic> json) {
    List<String> topics = [];
    if (json['key_topics'] is List) {
      topics = (json['key_topics'] as List).map((e) => e.toString()).toList();
    }

    List<Map<String, dynamic>> concepts = [];
    if (json['key_concepts'] is List) {
      for (final item in json['key_concepts'] as List) {
        if (item is Map<String, dynamic>) {
          concepts.add(item);
        } else if (item is Map) {
          concepts.add(Map<String, dynamic>.from(item));
        }
      }
    }

    List<Map<String, dynamic>> questions = [];
    if (json['key_questions'] is List) {
      for (final item in json['key_questions'] as List) {
        if (item is Map<String, dynamic>) {
          questions.add(item);
        } else if (item is Map) {
          questions.add(Map<String, dynamic>.from(item));
        }
      }
    }

    final rawAnalysis = json['ai_analysis'];
    Map<String, dynamic>? analysisMap;
    if (rawAnalysis is Map<String, dynamic>) {
      analysisMap = rawAnalysis;
    } else if (rawAnalysis is Map) {
      analysisMap = Map<String, dynamic>.from(rawAnalysis);
    }

    // Fallbacks from ai_analysis if top-level fields are empty
    if (concepts.isEmpty && analysisMap != null && analysisMap['key_concepts'] is List) {
      for (final item in analysisMap['key_concepts'] as List) {
        if (item is Map<String, dynamic>) {
          concepts.add(item);
        } else if (item is Map) {
          concepts.add(Map<String, dynamic>.from(item));
        }
      }
    }

    if (questions.isEmpty && analysisMap != null && analysisMap['key_questions'] is List) {
      for (final item in analysisMap['key_questions'] as List) {
        if (item is Map<String, dynamic>) {
          questions.add(item);
        } else if (item is Map) {
          questions.add(Map<String, dynamic>.from(item));
        }
      }
    }

    final bool analyzed = (json['is_analyzed'] as bool?) ??
        (json['analyzed_at'] != null) ||
        (json['summary'] != null && (json['summary'] as String).isNotEmpty);

    return StudyMaterialModel(
      id: json['id'] as int? ?? 0,
      title: json['title'] as String? ?? 'Lecture Notes',
      materialType: json['material_type'] as String? ?? 'document',
      category: json['category'] as String? ?? 'Lecture Note',
      contentText: json['content_text'] as String? ?? json['content'] as String? ?? '',
      summary: json['summary'] as String? ?? (analysisMap?['summary'] as String? ?? ''),
      keyTopics: topics.isNotEmpty ? topics : (analysisMap?['key_topics'] is List ? (analysisMap!['key_topics'] as List).map((e) => e.toString()).toList() : []),
      keyConcepts: concepts,
      keyQuestions: questions,
      difficultyLevel: json['difficulty_level'] as String? ?? (analysisMap?['difficulty_level'] as String? ?? 'Intermediate'),
      estimatedReadingTime: json['estimated_reading_time'] as int? ?? (analysisMap?['estimated_reading_time'] as int? ?? 5),
      fileUrl: json['file_url'] as String? ?? json['file'] as String?,
      isAnalyzed: analyzed,
      aiAnalysis: analysisMap,
    );
  }
}
