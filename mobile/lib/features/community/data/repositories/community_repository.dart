import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/network/dio_client.dart';
import '../models/community_models.dart';

class CommunityRepository {
  final DioClient _dioClient;

  CommunityRepository(this._dioClient);

  Future<List<PostModel>> getPosts() async {
    final response = await _dioClient.get(ApiEndpoints.posts);
    if (response.data is List) {
      return (response.data as List)
          .map((e) => PostModel.fromJson(e as Map<String, dynamic>))
          .toList();
    }
    return [];
  }

  Future<PostModel> createPost(Map<String, dynamic> data) async {
    final response = await _dioClient.post(ApiEndpoints.posts, data: data);
    return PostModel.fromJson(response.data as Map<String, dynamic>);
  }

  Future<PostModel> updatePost(int postId, Map<String, dynamic> data) async {
    final response = await _dioClient.patch(ApiEndpoints.postDetail(postId), data: data);
    return PostModel.fromJson(response.data as Map<String, dynamic>);
  }

  Future<void> deletePost(int postId) async {
    await _dioClient.delete(ApiEndpoints.postDetail(postId));
  }

  Future<void> reactToPost(int id) async {
    await _dioClient.post(ApiEndpoints.postReact(id));
  }

  Future<List<CommentModel>> getComments(int postId) async {
    final response = await _dioClient.get(ApiEndpoints.postComments(postId));
    if (response.data is List) {
      return (response.data as List)
          .map((e) => CommentModel.fromJson(e as Map<String, dynamic>))
          .toList();
    }
    return [];
  }

  Future<CommentModel> addComment(int postId, String content) async {
    final response = await _dioClient.post(
      ApiEndpoints.postComments(postId),
      data: {'content': content},
    );
    return CommentModel.fromJson(response.data as Map<String, dynamic>);
  }

  Future<List<StudyEventModel>> getEvents() async {
    final response = await _dioClient.get(ApiEndpoints.events);
    if (response.data is List) {
      return (response.data as List)
          .map((e) => StudyEventModel.fromJson(e as Map<String, dynamic>))
          .toList();
    }
    return [];
  }

  Future<void> rsvpEvent(int eventId, [String status = 'going']) async {
    await _dioClient.post(
      ApiEndpoints.eventRsvp(eventId),
      data: {'status': status},
    );
  }

  Future<StudyEventModel> createEvent(Map<String, dynamic> data) async {
    final response = await _dioClient.post(ApiEndpoints.events, data: data);
    return StudyEventModel.fromJson(response.data as Map<String, dynamic>);
  }

  Future<StudyEventModel> updateEvent(int eventId, Map<String, dynamic> data) async {
    final response = await _dioClient.patch(ApiEndpoints.eventDetail(eventId), data: data);
    return StudyEventModel.fromJson(response.data as Map<String, dynamic>);
  }

  Future<void> deleteEvent(int eventId) async {
    await _dioClient.delete(ApiEndpoints.eventDetail(eventId));
  }

  Future<Map<String, dynamic>> toggleFollowStudent(int studentId) async {
    final response = await _dioClient.post(ApiEndpoints.studentFollow(studentId));
    if (response.data is Map) {
      return Map<String, dynamic>.from(response.data as Map);
    }
    return {};
  }

  Future<List<StudentProfileModel>> getStudents({String? search}) async {
    final response = await _dioClient.get(
      ApiEndpoints.students,
      queryParameters: search != null && search.isNotEmpty ? {'search': search} : null,
    );
    if (response.data is List) {
      return (response.data as List)
          .map((e) => StudentProfileModel.fromJson(e as Map<String, dynamic>))
          .toList();
    }
    return [];
  }

  Future<List<StudentProfileModel>> getFollowers() async {
    try {
      final response = await _dioClient.get(ApiEndpoints.followers);
      if (response.data is List) {
        return (response.data as List)
            .map((e) => StudentProfileModel.fromJson(e as Map<String, dynamic>))
            .toList();
      }
    } catch (_) {}
    return [];
  }

  Future<List<StudentProfileModel>> getFollowing() async {
    try {
      final response = await _dioClient.get(ApiEndpoints.following);
      if (response.data is List) {
        return (response.data as List)
            .map((e) => StudentProfileModel.fromJson(e as Map<String, dynamic>))
            .toList();
      }
    } catch (_) {}
    return [];
  }

  Future<bool> removeFollower(int followerId) async {
    final response = await _dioClient.post(ApiEndpoints.followerRemove(followerId));
    if (response.data is Map) {
      return response.data['removed'] as bool? ?? true;
    }
    return true;
  }
}
