import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/network/dio_client.dart';
import '../models/course_grade_model.dart';
import '../models/grade_plan_model.dart';

class GradesRepository {
  final DioClient _dioClient;

  GradesRepository(this._dioClient);

  Future<GradePlanModel?> getGradePlan() async {
    try {
      final response = await _dioClient.get(ApiEndpoints.gradePlans);
      if (response.data is List && (response.data as List).isNotEmpty) {
        return GradePlanModel.fromJson(
          (response.data as List).first as Map<String, dynamic>,
        );
      }
    } catch (_) {}
    return null;
  }

  Future<GradePlanModel> saveGradePlan(Map<String, dynamic> data, {int? id}) async {
    if (id != null && id > 0) {
      final response = await _dioClient.patch(
        ApiEndpoints.gradePlanDetail(id),
        data: data,
      );
      return GradePlanModel.fromJson(response.data as Map<String, dynamic>);
    } else {
      final response = await _dioClient.post(
        ApiEndpoints.gradePlans,
        data: data,
      );
      return GradePlanModel.fromJson(response.data as Map<String, dynamic>);
    }
  }

  Future<List<CourseGradeModel>> getCourseGrades() async {
    try {
      final response = await _dioClient.get('${ApiEndpoints.gradePlans}courses/');
      if (response.data is List) {
        return (response.data as List)
            .map((e) => CourseGradeModel.fromJson(e as Map<String, dynamic>))
            .toList();
      }
    } catch (_) {}
    return [];
  }

  Future<CourseGradeModel> createCourseGrade(Map<String, dynamic> data) async {
    try {
      final response = await _dioClient.post('${ApiEndpoints.gradePlans}courses/', data: data);
      return CourseGradeModel.fromJson(response.data as Map<String, dynamic>);
    } catch (_) {
      return CourseGradeModel.fromJson(data);
    }
  }

  Future<void> deleteCourseGrade(int id) async {
    try {
      await _dioClient.delete('${ApiEndpoints.gradePlans}courses/$id/');
    } catch (_) {}
  }

  Future<List<CourseGradeModel>> uploadTranscriptText(String transcriptText) async {
    try {
      final response = await _dioClient.post(
        '${ApiEndpoints.gradePlans}import_transcript/',
        data: {'text': transcriptText},
      );
      if (response.data is List) {
        return (response.data as List)
            .map((e) => CourseGradeModel.fromJson(e as Map<String, dynamic>))
            .toList();
      }
    } catch (_) {}
    return [];
  }

  Future<Map<String, dynamic>> getRetakeAdvisor() async {
    try {
      final response = await _dioClient.get(ApiEndpoints.retakeAdvisor);
      if (response.data is Map) {
        return Map<String, dynamic>.from(response.data as Map);
      }
    } catch (_) {}
    return {};
  }
}
