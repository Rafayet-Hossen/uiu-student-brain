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
  final int? courseId;
  final String? courseCode;
  final String? courseTitle;

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
    this.courseId,
    this.courseCode,
    this.courseTitle,
  });

  factory StudyMaterialModel.fromJson(Map<String, dynamic> json) {
    List<String> topics = [];
    if (json['key_topics'] is List) {
      topics = (json['key_topics'] as List).map((e) => e.toString()).toList();
    }

    final rawAnalysis = json['ai_analysis'];
    Map<String, dynamic>? analysisMap;
    if (rawAnalysis is Map<String, dynamic>) {
      analysisMap = rawAnalysis;
    } else if (rawAnalysis is Map) {
      analysisMap = Map<String, dynamic>.from(rawAnalysis);
    }

    if (topics.isEmpty && analysisMap != null && analysisMap['key_topics'] is List) {
      topics = (analysisMap['key_topics'] as List).map((e) => e.toString()).toList();
    }

    List<Map<String, dynamic>> concepts = [];
    if (json['key_concepts'] is List) {
      for (final item in json['key_concepts'] as List) {
        if (item is Map<String, dynamic>) {
          concepts.add(item);
        } else if (item is Map) {
          concepts.add(Map<String, dynamic>.from(item));
        } else if (item is String && item.trim().isNotEmpty) {
          final parts = item.split(RegExp(r'[:\-]'));
          if (parts.length >= 2) {
            concepts.add({
              'term': parts[0].trim(),
              'definition': parts.sublist(1).join(':').trim(),
            });
          } else {
            concepts.add({
              'term': item.trim(),
              'definition': 'Core academic principle and analytical foundation.',
            });
          }
        }
      }
    }

    // Fallbacks from ai_analysis if top-level key_concepts is empty
    if (concepts.isEmpty && analysisMap != null) {
      if (analysisMap['key_concepts'] is List) {
        for (final item in analysisMap['key_concepts'] as List) {
          if (item is Map<String, dynamic>) {
            concepts.add(item);
          } else if (item is Map) {
            concepts.add(Map<String, dynamic>.from(item));
          } else if (item is String && item.trim().isNotEmpty) {
            final parts = item.split(RegExp(r'[:\-]'));
            if (parts.length >= 2) {
              concepts.add({
                'term': parts[0].trim(),
                'definition': parts.sublist(1).join(':').trim(),
              });
            } else {
              concepts.add({
                'term': item.trim(),
                'definition': 'Core academic principle and analytical foundation.',
              });
            }
          }
        }
      }

      // Check key_formulas_or_definitions in ai_analysis
      if (concepts.isEmpty && analysisMap['key_formulas_or_definitions'] is List) {
        for (final item in analysisMap['key_formulas_or_definitions'] as List) {
          if (item is String && item.trim().isNotEmpty) {
            final parts = item.split(RegExp(r'[:\-]'));
            if (parts.length >= 2) {
              concepts.add({
                'term': parts[0].trim(),
                'definition': parts.sublist(1).join(':').trim(),
              });
            } else {
              concepts.add({
                'term': item.trim(),
                'definition': 'Essential academic formula and definition extracted from material.',
              });
            }
          } else if (item is Map) {
            concepts.add(Map<String, dynamic>.from(item));
          }
        }
      }
    }

    // Synthesize concepts from extracted topics if still empty
    if (concepts.isEmpty && topics.isNotEmpty) {
      for (final t in topics) {
        if (t.trim().isNotEmpty) {
          concepts.add({
            'term': t.trim(),
            'definition': 'Essential curricular topic evaluating principles, structural models, and computational problem solving.',
          });
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

    if (questions.isEmpty && analysisMap != null) {
      final rawQ = analysisMap['key_questions'] ?? analysisMap['questions'];
      if (rawQ is List) {
        for (final item in rawQ) {
          if (item is Map<String, dynamic>) {
            questions.add(item);
          } else if (item is Map) {
            questions.add(Map<String, dynamic>.from(item));
          }
        }
      }
    }

    // Synthesize high-yield practice questions from topics if empty
    if (questions.isEmpty && topics.isNotEmpty) {
      final docTitle = json['title'] as String? ?? 'this study unit';
      for (int i = 0; i < topics.length && i < 4; i++) {
        final t = topics[i];
        questions.add({
          'question': 'In the context of $docTitle, what is the primary conceptual objective of $t?',
          'answer': 'The primary objective is rigorous structural modeling, systematic validation, and domain-specific problem solving.',
          'explanation': 'Mastery of $t requires applying foundational principles and verifying boundary constraints.',
        });
      }
    }

    final bool analyzed = (json['is_analyzed'] as bool?) ??
        (json['analyzed_at'] != null) ||
        (json['summary'] != null && (json['summary'] as String).isNotEmpty);

    int? cId;
    String? cCode;
    String? cTitle;
    if (json['course'] is Map) {
      cId = json['course']['id'] as int?;
      cCode = json['course']['code']?.toString();
      cTitle = json['course']['title']?.toString();
    } else if (json['course'] is int) {
      cId = json['course'] as int?;
    }
    if (json['course_id'] != null) {
      cId = json['course_id'] as int?;
    }
    if (json['course_code'] != null) {
      cCode = json['course_code']?.toString();
    }
    if (json['course_title'] != null) {
      cTitle = json['course_title']?.toString();
    }

    return StudyMaterialModel(
      id: json['id'] as int? ?? 0,
      title: json['title'] as String? ?? 'Lecture Notes',
      materialType: json['material_type'] as String? ?? 'document',
      category: json['category'] as String? ?? 'Lecture Note',
      contentText: json['content_text'] as String? ?? json['content'] as String? ?? '',
      summary: json['summary'] as String? ?? (analysisMap?['summary'] as String? ?? ''),
      keyTopics: topics,
      keyConcepts: concepts,
      keyQuestions: questions,
      difficultyLevel: json['difficulty_level'] as String? ?? (analysisMap?['difficulty_level'] as String? ?? 'Intermediate'),
      estimatedReadingTime: json['estimated_reading_time'] as int? ?? (analysisMap?['estimated_reading_time'] as int? ?? 5),
      fileUrl: json['file_url'] as String? ?? json['file'] as String?,
      isAnalyzed: analyzed,
      aiAnalysis: analysisMap,
      courseId: cId,
      courseCode: cCode,
      courseTitle: cTitle,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'material_type': materialType,
      'category': category,
      'content_text': contentText,
      'summary': summary,
      'key_topics': keyTopics,
      'key_concepts': keyConcepts,
      'key_questions': keyQuestions,
      'difficulty_level': difficultyLevel,
      'estimated_reading_time': estimatedReadingTime,
      'file_url': fileUrl,
      'is_analyzed': isAnalyzed,
      'ai_analysis': aiAnalysis,
      'course_id': courseId,
      'course_code': courseCode,
      'course_title': courseTitle,
    };
  }
}
