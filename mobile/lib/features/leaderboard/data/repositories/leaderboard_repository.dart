import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/network/dio_client.dart';
import '../models/leaderboard_model.dart';

class LeaderboardRepository {
  final DioClient _dioClient;

  LeaderboardRepository(this._dioClient);

  Future<Map<String, dynamic>> getLeaderboard(String timeframe) async {
    final response = await _dioClient.get(
      ApiEndpoints.leaderboard,
      queryParameters: {'timeframe': timeframe},
    );
    final data = response.data as Map<String, dynamic>;

    List<LeaderboardEntryModel> entries = [];
    if (data['rankings'] is List) {
      entries = (data['rankings'] as List)
          .map((e) => LeaderboardEntryModel.fromJson(e as Map<String, dynamic>))
          .toList();
    }

    bool isOptedIn = true;
    String quote = '';
    if (data['user_status'] is Map) {
      isOptedIn = data['user_status']['is_opted_in'] ?? true;
      quote = data['user_status']['custom_quote'] ?? '';
    }

    return {
      'rankings': entries,
      'is_opted_in': isOptedIn,
      'custom_quote': quote,
    };
  }

  Future<void> toggleOptIn(bool isOptedIn, String customQuote) async {
    await _dioClient.post(
      ApiEndpoints.leaderboardOptIn,
      data: {
        'is_opted_in': isOptedIn,
        'custom_quote': customQuote,
      },
    );
  }
}
