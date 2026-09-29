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

  Future<void> rsvpEvent(int eventId) async {
    await _dioClient.post(ApiEndpoints.eventRsvp(eventId));
  }

  Future<StudyEventModel> createEvent(Map<String, dynamic> data) async {
    final response = await _dioClient.post(ApiEndpoints.events, data: data);
    return StudyEventModel.fromJson(response.data as Map<String, dynamic>);
  }
}
