import 'package:dio/dio.dart';
import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/network/dio_client.dart';
import '../models/course_grade_model.dart';
import '../models/grade_plan_model.dart';

class GradesRepository {
  final DioClient _dioClient;

  GradesRepository(this._dioClient);

  Future<GradePlanModel?> getGradePlan() async {
    final response = await _dioClient.get(ApiEndpoints.gradePlans);
    if (response.data is List && (response.data as List).isNotEmpty) {
      return GradePlanModel.fromJson(
        (response.data as List).first as Map<String, dynamic>,
      );
    }
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

  Future<Map<String, dynamic>> getRetakeAdvisor() async {
    final response = await _dioClient.get(ApiEndpoints.retakeAdvisor);
    if (response.data is Map) {
      return Map<String, dynamic>.from(response.data as Map);
    }
    return {};
  }

  Future<List<CourseGradeModel>> getCourseGrades() async {
    final response = await _dioClient.get(ApiEndpoints.courseGrades);
    if (response.data is List) {
      return (response.data as List)
          .map((e) => CourseGradeModel.fromJson(e as Map<String, dynamic>))
          .toList();
    }
    return [];
  }

  Future<CourseGradeModel> createCourseGrade(Map<String, dynamic> data) async {
    final response = await _dioClient.post(ApiEndpoints.courseGrades, data: data);
    return CourseGradeModel.fromJson(response.data as Map<String, dynamic>);
  }

  Future<CourseGradeModel> updateCourseGrade(int id, Map<String, dynamic> data) async {
    final response = await _dioClient.patch(ApiEndpoints.courseGradeDetail(id), data: data);
    return CourseGradeModel.fromJson(response.data as Map<String, dynamic>);
  }

  Future<void> deleteCourseGrade(int id) async {
    await _dioClient.delete(ApiEndpoints.courseGradeDetail(id));
  }

  Future<Map<String, dynamic>> uploadTranscript({
    String? filePath,
    String? fileName,
    String? rawText,
  }) async {
    dynamic postData;
    if (filePath != null && filePath.isNotEmpty) {
      postData = FormData.fromMap({
        'file': await MultipartFile.fromFile(filePath, filename: fileName ?? 'transcript.pdf'),
        if (rawText != null && rawText.isNotEmpty) 'raw_text': rawText,
      });
    } else {
      postData = {
        'raw_text': rawText ?? '',
      };
    }

    final response = await _dioClient.post(
      ApiEndpoints.uploadTranscript,
      data: postData,
    );
    if (response.data is Map) {
      return Map<String, dynamic>.from(response.data as Map);
    }
    return {};
  }
}

