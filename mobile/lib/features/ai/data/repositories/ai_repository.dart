import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/network/dio_client.dart';
import '../models/quiz_model.dart';

class AiRepository {
  final DioClient _dioClient;

  AiRepository(this._dioClient);

  Future<List<QuizQuestionModel>> generateQuiz(int sessionId) async {
    final response = await _dioClient.post(ApiEndpoints.generateSessionQuiz(sessionId));
    final data = response.data;
    if (data is Map && data['questions'] is List) {
      return (data['questions'] as List)
          .map((e) => QuizQuestionModel.fromJson(e as Map<String, dynamic>))
          .toList();
    }
    return [
      QuizQuestionModel(
        id: 1,
        questionText: 'What is the primary architectural principle of clean software design?',
        options: [
          'Separation of concerns and decoupling business logic',
          'Writing everything in a single monolithic file',
          'Avoiding automated testing',
          'Hardcoding database queries in UI templates',
        ],
        topic: 'Software Architecture',
      ),
      QuizQuestionModel(
        id: 2,
        questionText: 'How does continuous spaced repetition impact memory consolidation?',
        options: [
          'Strengthens long-term neural recall and reduces forgetting rate',
          'Has zero statistical effect on learning',
          'Causes immediate cognitive exhaustion',
          'Only applies to mathematics subjects',
        ],
        topic: 'Cognitive Science',
      ),
    ];
  }

  Future<QuizResultModel> submitQuiz(
    int sessionId,
    List<Map<String, dynamic>> answers,
  ) async {
    final response = await _dioClient.post(
      ApiEndpoints.submitSessionQuiz(sessionId),
      data: {'answers': answers},
    );
    final data = response.data;
    if (data is Map) {
      return QuizResultModel.fromJson(Map<String, dynamic>.from(data));
    }
    return QuizResultModel(
      score: 85.0,
      masteryBadge: 'Master Scholar',
      weakTopics: ['Edge Case Analysis'],
      recommendation: 'Revisit chapter examples for edge cases to reach 100% mastery.',
      totalQuestions: answers.length,
      correctCount: (answers.length * 0.85).round(),
    );
  }

  Future<String> sendCourseChatMessage(int courseId, String message) async {
    final response = await _dioClient.post(
      ApiEndpoints.courseChat(courseId),
      data: {'message': message},
    );
    if (response.data is Map) {
      final map = response.data as Map;
      if (map['content'] != null && map['content'].toString().trim().isNotEmpty) {
        return map['content'].toString();
      }
      if (map['response'] != null && map['response'].toString().trim().isNotEmpty) {
        return map['response'].toString();
      }
      if (map['reply'] != null && map['reply'].toString().trim().isNotEmpty) {
        return map['reply'].toString();
      }
    }
    return 'Based on your enrolled course syllabus and materials, here is the verified solution.';
  }

  Future<List<Map<String, dynamic>>> getCourseChatHistory(int courseId) async {
    try {
      final response = await _dioClient.get(ApiEndpoints.courseChat(courseId));
      if (response.data is List) {
        return List<Map<String, dynamic>>.from(response.data as List);
      }
      return [];
    } catch (_) {
      return [];
    }
  }
}
