import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/network/dio_client.dart';
import '../models/material_model.dart';

class MaterialsRepository {
  final DioClient _dioClient;

  MaterialsRepository(this._dioClient);

  Future<List<StudyMaterialModel>> getMaterials() async {
    final response = await _dioClient.get(ApiEndpoints.globalMaterials);
    if (response.data is List) {
      return (response.data as List)
          .map((e) => StudyMaterialModel.fromJson(e as Map<String, dynamic>))
          .toList();
    }
    return [];
  }

  Future<StudyMaterialModel> getMaterialDetail(int id) async {
    final response = await _dioClient.get(ApiEndpoints.materialDetail(id));
    return StudyMaterialModel.fromJson(response.data as Map<String, dynamic>);
  }

  Future<Map<String, dynamic>> analyzeMaterial(int id) async {
    final response = await _dioClient.post(ApiEndpoints.materialAnalyze(id));
    return Map<String, dynamic>.from(response.data as Map);
  }

  Future<List<Map<String, dynamic>>> getCourses() async {
    final response = await _dioClient.get(ApiEndpoints.globalCourses);
    if (response.data is List) {
      return (response.data as List)
          .map((e) => Map<String, dynamic>.from(e as Map))
          .toList();
    }
    return [];
  }

  Future<List<Map<String, dynamic>>> getSemesters() async {
    final response = await _dioClient.get(ApiEndpoints.semesters);
    if (response.data is List) {
      return (response.data as List)
          .map((e) => Map<String, dynamic>.from(e as Map))
          .toList();
    }
    return [];
  }

  Future<Map<String, dynamic>> createSemester(Map<String, dynamic> data) async {
    final response = await _dioClient.post(ApiEndpoints.semesters, data: data);
    return Map<String, dynamic>.from(response.data as Map);
  }

  Future<Map<String, dynamic>> createCourse(int semesterId, Map<String, dynamic> data) async {
    final response = await _dioClient.post(ApiEndpoints.semesterCourses(semesterId), data: data);
    return Map<String, dynamic>.from(response.data as Map);
  }

  Future<Map<String, dynamic>> updateSemester(int id, Map<String, dynamic> data) async {
    final response = await _dioClient.patch('${ApiEndpoints.semesters}$id/', data: data);
    return Map<String, dynamic>.from(response.data as Map);
  }

  Future<void> deleteSemester(int id) async {
    await _dioClient.delete('${ApiEndpoints.semesters}$id/');
  }

  Future<Map<String, dynamic>> updateCourse(int id, Map<String, dynamic> data) async {
    final response = await _dioClient.patch('${ApiEndpoints.globalCourses}$id/', data: data);
    return Map<String, dynamic>.from(response.data as Map);
  }

  Future<void> deleteCourse(int id) async {
    await _dioClient.delete('${ApiEndpoints.globalCourses}$id/');
  }
}
