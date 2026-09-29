import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/network/dio_client.dart';
import '../models/schedule_model.dart';

class PlannerRepository {
  final DioClient _dioClient;

  PlannerRepository(this._dioClient);

  Future<List<ScheduleModel>> getSchedules() async {
    final response = await _dioClient.get(ApiEndpoints.schedules);
    if (response.data is List) {
      return (response.data as List)
          .map((e) => ScheduleModel.fromJson(e as Map<String, dynamic>))
          .toList();
    }
    return [];
  }

  Future<ScheduleModel> createSchedule(Map<String, dynamic> data) async {
    final response = await _dioClient.post(ApiEndpoints.schedules, data: data);
    return ScheduleModel.fromJson(response.data as Map<String, dynamic>);
  }

  Future<ScheduleModel> updateSchedule(int id, Map<String, dynamic> data) async {
    final response = await _dioClient.patch(ApiEndpoints.scheduleDetail(id), data: data);
    return ScheduleModel.fromJson(response.data as Map<String, dynamic>);
  }

  Future<void> deleteSchedule(int id) async {
    await _dioClient.delete(ApiEndpoints.scheduleDetail(id));
  }
}
