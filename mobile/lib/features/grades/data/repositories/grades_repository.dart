import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/network/dio_client.dart';
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
}
