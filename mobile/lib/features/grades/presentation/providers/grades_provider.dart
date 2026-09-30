import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/config/providers.dart';
import '../../data/models/grade_plan_model.dart';
import '../../data/repositories/grades_repository.dart';

final gradesRepositoryProvider = Provider<GradesRepository>((ref) {
  final dioClient = ref.watch(dioClientProvider);
  return GradesRepository(dioClient);
});

class GradesState {
  final GradePlanModel? plan;
  final Map<String, dynamic> retakeData;
  final bool isLoading;
  final String? error;

  const GradesState({
    this.plan,
    this.retakeData = const {},
    this.isLoading = false,
    this.error,
  });

  GradesState copyWith({
    GradePlanModel? plan,
    Map<String, dynamic>? retakeData,
    bool? isLoading,
    String? error,
  }) {
    return GradesState(
      plan: plan ?? this.plan,
      retakeData: retakeData ?? this.retakeData,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

class GradesNotifier extends StateNotifier<GradesState> {
  final GradesRepository _repository;

  GradesNotifier(this._repository) : super(const GradesState()) {
    loadGradesData();
  }

  Future<void> loadGradesData() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final plan = await _repository.getGradePlan();
      final retake = await _repository.getRetakeAdvisor();
      state = state.copyWith(
        plan: plan,
        retakeData: retake,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<bool> updatePlan({
    required double totalCredits,
    required double completedCredits,
    required double currentGpa,
    required double targetGpa,
  }) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final updated = await _repository.saveGradePlan(
        {
          'name': state.plan?.name ?? 'Degree Plan',
          'total_credits': totalCredits,
          'completed_credits': completedCredits,
          'current_gpa': currentGpa,
          'target_gpa': targetGpa,
        },
        id: state.plan?.id,
      );
      state = state.copyWith(plan: updated, isLoading: false);
      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      return false;
    }
  }
}

final gradesProvider =
    StateNotifierProvider<GradesNotifier, GradesState>((ref) {
  final repo = ref.watch(gradesRepositoryProvider);
  return GradesNotifier(repo);
});
