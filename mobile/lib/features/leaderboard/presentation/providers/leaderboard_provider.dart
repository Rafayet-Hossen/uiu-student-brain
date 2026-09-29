import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/config/providers.dart';
import '../../data/models/leaderboard_model.dart';
import '../../data/repositories/leaderboard_repository.dart';

final leaderboardRepositoryProvider = Provider<LeaderboardRepository>((ref) {
  final dioClient = ref.watch(dioClientProvider);
  return LeaderboardRepository(dioClient);
});

class LeaderboardState {
  final List<LeaderboardEntryModel> rankings;
  final String timeframe;
  final bool isOptedIn;
  final String customQuote;
  final bool isLoading;
  final String? error;

  const LeaderboardState({
    this.rankings = const [],
    this.timeframe = 'weekly',
    this.isOptedIn = true,
    this.customQuote = '',
    this.isLoading = false,
    this.error,
  });

  LeaderboardState copyWith({
    List<LeaderboardEntryModel>? rankings,
    String? timeframe,
    bool? isOptedIn,
    String? customQuote,
    bool? isLoading,
    String? error,
  }) {
    return LeaderboardState(
      rankings: rankings ?? this.rankings,
      timeframe: timeframe ?? this.timeframe,
      isOptedIn: isOptedIn ?? this.isOptedIn,
      customQuote: customQuote ?? this.customQuote,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }

  List<LeaderboardEntryModel> get topThree {
    return rankings.take(3).toList();
  }

  List<LeaderboardEntryModel> get remainingRankings {
    return rankings.skip(3).toList();
  }
}

class LeaderboardNotifier extends StateNotifier<LeaderboardState> {
  final LeaderboardRepository _repository;

  LeaderboardNotifier(this._repository) : super(const LeaderboardState()) {
    loadLeaderboard('weekly');
  }

  Future<void> loadLeaderboard(String timeframe) async {
    state = state.copyWith(timeframe: timeframe, isLoading: true, error: null);
    try {
      final res = await _repository.getLeaderboard(timeframe);
      state = state.copyWith(
        rankings: res['rankings'] as List<LeaderboardEntryModel>,
        isOptedIn: res['is_opted_in'] as bool,
        customQuote: res['custom_quote'] as String,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<void> toggleOptIn(bool optedIn) async {
    try {
      await _repository.toggleOptIn(optedIn, state.customQuote);
      state = state.copyWith(isOptedIn: optedIn);
      loadLeaderboard(state.timeframe);
    } catch (_) {}
  }
}

final leaderboardProvider =
    StateNotifierProvider<LeaderboardNotifier, LeaderboardState>((ref) {
  final repo = ref.watch(leaderboardRepositoryProvider);
  return LeaderboardNotifier(repo);
});
