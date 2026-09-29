import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/config/providers.dart';
import '../../data/models/study_session_model.dart';
import '../../data/repositories/tracker_repository.dart';

final trackerRepositoryProvider = Provider<TrackerRepository>((ref) {
  final dioClient = ref.watch(dioClientProvider);
  return TrackerRepository(dioClient);
});

class TrackerState {
  final List<StudySessionModel> sessions;
  final Map<String, dynamic> streaks;
  final Map<String, dynamic> rewards;
  final StudySessionModel? activeSession;
  final bool isLoading;
  final String? error;

  const TrackerState({
    this.sessions = const [],
    this.streaks = const {},
    this.rewards = const {},
    this.activeSession,
    this.isLoading = false,
    this.error,
  });

  TrackerState copyWith({
    List<StudySessionModel>? sessions,
    Map<String, dynamic>? streaks,
    Map<String, dynamic>? rewards,
    StudySessionModel? activeSession,
    bool? isLoading,
    String? error,
  }) {
    return TrackerState(
      sessions: sessions ?? this.sessions,
      streaks: streaks ?? this.streaks,
      rewards: rewards ?? this.rewards,
      activeSession: activeSession ?? this.activeSession,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

class TrackerNotifier extends StateNotifier<TrackerState> {
  final TrackerRepository _repository;

  TrackerNotifier(this._repository) : super(const TrackerState()) {
    loadTrackerData();
  }

  Future<void> loadTrackerData() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final sessions = await _repository.getSessions();
      final streaks = await _repository.getStreaks();
      final rewards = await _repository.getRewards();

      // Check if any session is in progress
      StudySessionModel? active;
      for (final s in sessions) {
        if (s.isInProgress) {
          active = s;
          break;
        }
      }

      state = state.copyWith(
        sessions: sessions,
        streaks: streaks,
        rewards: rewards,
        activeSession: active,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<bool> createSession(Map<String, dynamic> data) async {
    try {
      final session = await _repository.createSession(data);
      state = state.copyWith(sessions: [session, ...state.sessions]);
      return true;
    } catch (e) {
      state = state.copyWith(error: e.toString());
      return false;
    }
  }

  Future<String?> startSession(int id) async {
    try {
      final started = await _repository.startSession(id);
      state = state.copyWith(
        activeSession: started,
        sessions: state.sessions.map((s) => s.id == id ? started : s).toList(),
      );
      return null; // Success (no error)
    } catch (e) {
      return e.toString();
    }
  }

  Future<bool> completeActiveSession() async {
    final active = state.activeSession;
    if (active == null) return false;

    try {
      final completed = await _repository.completeSession(active.id);
      state = state.copyWith(
        activeSession: null,
        sessions: state.sessions.map((s) => s.id == active.id ? completed : s).toList(),
      );
      await loadTrackerData(); // reload rewards and streaks
      return true;
    } catch (e) {
      state = state.copyWith(error: e.toString());
      return false;
    }
  }

  Future<bool> extendActiveSession(int minutes) async {
    final active = state.activeSession;
    if (active == null) return false;

    try {
      final updated = await _repository.extendSession(active.id, minutes);
      state = state.copyWith(activeSession: updated);
      return true;
    } catch (e) {
      state = state.copyWith(error: e.toString());
      return false;
    }
  }
}

final trackerProvider =
    StateNotifierProvider<TrackerNotifier, TrackerState>((ref) {
  final repo = ref.watch(trackerRepositoryProvider);
  return TrackerNotifier(repo);
});
