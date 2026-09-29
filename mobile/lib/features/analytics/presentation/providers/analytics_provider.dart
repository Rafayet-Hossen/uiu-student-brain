import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/config/providers.dart';
import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/network/dio_client.dart';

class AnalyticsState {
  final int totalSessions;
  final int totalMinutes;
  final double avgSessionMinutes;
  final List<Map<String, dynamic>> subjectDistribution;
  final List<Map<String, dynamic>> weeklyTrend;
  final double adherenceRate;
  final List<String> aiRecommendations;
  final bool isLoading;
  final String? error;

  const AnalyticsState({
    this.totalSessions = 0,
    this.totalMinutes = 0,
    this.avgSessionMinutes = 0,
    this.subjectDistribution = const [],
    this.weeklyTrend = const [],
    this.adherenceRate = 85.0,
    this.aiRecommendations = const [],
    this.isLoading = false,
    this.error,
  });

  AnalyticsState copyWith({
    int? totalSessions,
    int? totalMinutes,
    double? avgSessionMinutes,
    List<Map<String, dynamic>>? subjectDistribution,
    List<Map<String, dynamic>>? weeklyTrend,
    double? adherenceRate,
    List<String>? aiRecommendations,
    bool? isLoading,
    String? error,
  }) {
    return AnalyticsState(
      totalSessions: totalSessions ?? this.totalSessions,
      totalMinutes: totalMinutes ?? this.totalMinutes,
      avgSessionMinutes: avgSessionMinutes ?? this.avgSessionMinutes,
      subjectDistribution: subjectDistribution ?? this.subjectDistribution,
      weeklyTrend: weeklyTrend ?? this.weeklyTrend,
      adherenceRate: adherenceRate ?? this.adherenceRate,
      aiRecommendations: aiRecommendations ?? this.aiRecommendations,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

class AnalyticsNotifier extends StateNotifier<AnalyticsState> {
  final DioClient _dioClient;

  AnalyticsNotifier(this._dioClient) : super(const AnalyticsState()) {
    loadAnalytics();
  }

  Future<void> loadAnalytics() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final res = await _dioClient.get(ApiEndpoints.analyticsDashboard);
      final data = res.data as Map<String, dynamic>;

      final tSessions = data['total_sessions'] as int? ?? 0;
      final tMinutes = data['total_minutes'] as int? ?? 0;
      final avgMins = double.tryParse('${data['avg_session_minutes']}') ?? 0.0;

      List<Map<String, dynamic>> dist = [];
      if (data['subject_distribution'] is List) {
        dist = (data['subject_distribution'] as List)
            .map((e) => Map<String, dynamic>.from(e as Map))
            .toList();
      }

      List<Map<String, dynamic>> trend = [];
      if (data['weekly_trend'] is List) {
        trend = (data['weekly_trend'] as List)
            .map((e) => Map<String, dynamic>.from(e as Map))
            .toList();
      }

      double adh = 85.0;
      if (data['schedule_adherence'] is Map) {
        adh = double.tryParse('${data['schedule_adherence']['adherence_percentage']}') ?? 85.0;
      }

      List<String> recs = [];
      if (data['ai_recommendations'] is List) {
        recs = (data['ai_recommendations'] as List).map((e) => e.toString()).toList();
      }

      state = state.copyWith(
        totalSessions: tSessions,
        totalMinutes: tMinutes,
        avgSessionMinutes: avgMins,
        subjectDistribution: dist,
        weeklyTrend: trend,
        adherenceRate: adh,
        aiRecommendations: recs,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }
}

final analyticsProvider =
    StateNotifierProvider<AnalyticsNotifier, AnalyticsState>((ref) {
  final dioClient = ref.watch(dioClientProvider);
  return AnalyticsNotifier(dioClient);
});
