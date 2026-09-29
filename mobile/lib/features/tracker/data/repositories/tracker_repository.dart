import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/network/dio_client.dart';
import '../models/study_session_model.dart';

class TrackerRepository {
  final DioClient _dioClient;

  TrackerRepository(this._dioClient);

  Future<List<StudySessionModel>> getSessions() async {
    final response = await _dioClient.get(ApiEndpoints.studySessions);
    if (response.data is List) {
      return (response.data as List)
          .map((e) => StudySessionModel.fromJson(e as Map<String, dynamic>))
          .toList();
    }
    return [];
  }

  Future<StudySessionModel> createSession(Map<String, dynamic> data) async {
    final response = await _dioClient.post(ApiEndpoints.studySessions, data: data);
    return StudySessionModel.fromJson(response.data as Map<String, dynamic>);
  }

  Future<StudySessionModel> startSession(int id) async {
    final response = await _dioClient.post(ApiEndpoints.startSession(id));
    return StudySessionModel.fromJson(response.data as Map<String, dynamic>);
  }

  Future<StudySessionModel> completeSession(int id) async {
    final response = await _dioClient.post(ApiEndpoints.completeSession(id));
    return StudySessionModel.fromJson(response.data as Map<String, dynamic>);
  }

  Future<StudySessionModel> extendSession(int id, int additionalMinutes) async {
    final response = await _dioClient.post(
      ApiEndpoints.extendSession(id),
      data: {'additional_minutes': additionalMinutes},
    );
    return StudySessionModel.fromJson(response.data as Map<String, dynamic>);
  }

  Future<Map<String, dynamic>> generateQuiz(int sessionId) async {
    final response = await _dioClient.post(ApiEndpoints.generateSessionQuiz(sessionId));
    return Map<String, dynamic>.from(response.data as Map);
  }

  Future<Map<String, dynamic>> submitQuiz(int sessionId, List<Map<String, dynamic>> answers) async {
    final response = await _dioClient.post(
      ApiEndpoints.submitSessionQuiz(sessionId),
      data: {'answers': answers},
    );
    return Map<String, dynamic>.from(response.data as Map);
  }

  Future<Map<String, dynamic>> getStreaks() async {
    final response = await _dioClient.get(ApiEndpoints.streaks);
    if (response.data is Map) {
      return Map<String, dynamic>.from(response.data as Map);
    }
    return {};
  }

  Future<Map<String, dynamic>> getRewards() async {
    final response = await _dioClient.get(ApiEndpoints.rewards);
    if (response.data is Map) {
      return Map<String, dynamic>.from(response.data as Map);
    }
    return {};
  }

  Future<Map<String, dynamic>> getGoal() async {
    final response = await _dioClient.get(ApiEndpoints.studyGoal);
    if (response.data is Map) {
      return Map<String, dynamic>.from(response.data as Map);
    }
    return {};
  }

  Future<void> updateGoal(int dailyMinutes) async {
    await _dioClient.post(
      ApiEndpoints.studyGoal,
      data: {'daily_target_minutes': dailyMinutes},
    );
  }
}
