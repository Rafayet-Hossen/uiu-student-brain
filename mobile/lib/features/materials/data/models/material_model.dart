class StudyMaterialModel {
  final int id;
  final String title;
  final String materialType;
  final String category;
  final String contentText;
  final String summary;
  final List<String> keyTopics;
  final String difficultyLevel;
  final int estimatedReadingTime;
  final String? fileUrl;

  StudyMaterialModel({
    required this.id,
    required this.title,
    required this.materialType,
    required this.category,
    this.contentText = '',
    this.summary = '',
    this.keyTopics = const [],
    this.difficultyLevel = 'Intermediate',
    this.estimatedReadingTime = 5,
    this.fileUrl,
  });

  factory StudyMaterialModel.fromJson(Map<String, dynamic> json) {
    List<String> topics = [];
    if (json['key_topics'] is List) {
      topics = (json['key_topics'] as List).map((e) => e.toString()).toList();
    }

    return StudyMaterialModel(
      id: json['id'] as int? ?? 0,
      title: json['title'] as String? ?? 'Lecture Notes',
      materialType: json['material_type'] as String? ?? 'document',
      category: json['category'] as String? ?? 'Lecture Note',
      contentText: json['content_text'] as String? ?? json['content'] as String? ?? '',
      summary: json['summary'] as String? ?? '',
      keyTopics: topics,
      difficultyLevel: json['difficulty_level'] as String? ?? 'Intermediate',
      estimatedReadingTime: json['estimated_reading_time'] as int? ?? 5,
      fileUrl: json['file'] as String?,
    );
  }
}
