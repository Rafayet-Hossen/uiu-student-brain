import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/config/providers.dart';
import '../../data/models/schedule_model.dart';
import '../../data/repositories/planner_repository.dart';

final plannerRepositoryProvider = Provider<PlannerRepository>((ref) {
  final dioClient = ref.watch(dioClientProvider);
  return PlannerRepository(dioClient);
});

class PlannerState {
  final List<ScheduleModel> schedules;
  final String selectedDay;
  final bool isLoading;
  final String? error;

  const PlannerState({
    this.schedules = const [],
    this.selectedDay = 'All',
    this.isLoading = false,
    this.error,
  });

  PlannerState copyWith({
    List<ScheduleModel>? schedules,
    String? selectedDay,
    bool? isLoading,
    String? error,
  }) {
    return PlannerState(
      schedules: schedules ?? this.schedules,
      selectedDay: selectedDay ?? this.selectedDay,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }

  List<ScheduleModel> get filteredSchedules {
    if (selectedDay == 'All') return schedules;
    return schedules.where((s) => s.days.contains(selectedDay)).toList();
  }
}

class PlannerNotifier extends StateNotifier<PlannerState> {
  final PlannerRepository _repository;

  PlannerNotifier(this._repository) : super(const PlannerState()) {
    loadSchedules();
  }

  Future<void> loadSchedules() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final items = await _repository.getSchedules();
      state = state.copyWith(schedules: items, isLoading: false);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  void selectDay(String day) {
    state = state.copyWith(selectedDay: day);
  }

  Future<bool> addSchedule(Map<String, dynamic> data) async {
    try {
      final item = await _repository.createSchedule(data);
      state = state.copyWith(schedules: [...state.schedules, item]);
      return true;
    } catch (e) {
      state = state.copyWith(error: e.toString());
      return false;
    }
  }

  Future<bool> deleteSchedule(int id) async {
    try {
      await _repository.deleteSchedule(id);
      state = state.copyWith(
        schedules: state.schedules.where((s) => s.id != id).toList(),
      );
      return true;
    } catch (e) {
      state = state.copyWith(error: e.toString());
      return false;
    }
  }
}

final plannerProvider =
    StateNotifierProvider<PlannerNotifier, PlannerState>((ref) {
  final repo = ref.watch(plannerRepositoryProvider);
  return PlannerNotifier(repo);
});
