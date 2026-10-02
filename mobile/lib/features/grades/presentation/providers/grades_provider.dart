import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/config/providers.dart';
import '../../data/models/course_grade_model.dart';
import '../../data/models/grade_plan_model.dart';
import '../../data/repositories/grades_repository.dart';

final gradesRepositoryProvider = Provider<GradesRepository>((ref) {
  final dioClient = ref.watch(dioClientProvider);
  return GradesRepository(dioClient);
});

class GradesSimulationResult {
  final double baselineCgpa;
  final double targetCgpa;
  final double projectedCgpa;
  final double cgpaJump;
  final int gapClosedPercent;
  final int selectedCount;

  const GradesSimulationResult({
    required this.baselineCgpa,
    required this.targetCgpa,
    required this.projectedCgpa,
    required this.cgpaJump,
    required this.gapClosedPercent,
    required this.selectedCount,
  });
}

class GradesState {
  final GradePlanModel? plan;
  final Map<String, dynamic> retakeData;
  final List<CourseGradeModel> courses;
  final Set<int> selectedRetakeIds;
  final bool isLoading;
  final String? error;

  const GradesState({
    this.plan,
    this.retakeData = const {},
    this.courses = const [],
    this.selectedRetakeIds = const {},
    this.isLoading = false,
    this.error,
  });

  GradesSimulationResult get simulation {
    final double baseline = (retakeData['baseline_cgpa'] as num?)?.toDouble() ??
        plan?.currentGpa ??
        2.80;
    final double target = (retakeData['target_gpa'] as num?)?.toDouble() ??
        plan?.targetGpa ??
        3.50;
    final double effCredits =
        (retakeData['effective_credits'] as num?)?.toDouble() ??
            plan?.completedCredits ??
            45.0;

    if (selectedRetakeIds.isEmpty || effCredits <= 0) {
      return GradesSimulationResult(
        baselineCgpa: baseline,
        targetCgpa: target,
        projectedCgpa: baseline,
        cgpaJump: 0.0,
        gapClosedPercent: 0,
        selectedCount: 0,
      );
    }

    double totalQpGain = 0.0;
    for (final course in courses) {
      if (selectedRetakeIds.contains(course.id)) {
        final gain = course.credits * (4.00 - course.gradePoint);
        if (gain > 0) totalQpGain += gain;
      }
    }

    final double rawProjected =
        ((baseline * effCredits) + totalQpGain) / effCredits;
    final double projected = rawProjected > 4.00 ? 4.00 : rawProjected;
    final double jump = projected - baseline;
    final double gap = target - baseline;
    int gapClosed = 0;
    if (gap > 0.001) {
      gapClosed = ((jump / gap) * 100).clamp(0, 100).round();
    } else {
      gapClosed = 100;
    }

    return GradesSimulationResult(
      baselineCgpa: baseline,
      targetCgpa: target,
      projectedCgpa: double.parse(projected.toStringAsFixed(2)),
      cgpaJump: double.parse(jump.toStringAsFixed(3)),
      gapClosedPercent: gapClosed,
      selectedCount: selectedRetakeIds.length,
    );
  }

  GradesState copyWith({
    GradePlanModel? plan,
    Map<String, dynamic>? retakeData,
    List<CourseGradeModel>? courses,
    Set<int>? selectedRetakeIds,
    bool? isLoading,
    String? error,
  }) {
    return GradesState(
      plan: plan ?? this.plan,
      retakeData: retakeData ?? this.retakeData,
      courses: courses ?? this.courses,
      selectedRetakeIds: selectedRetakeIds ?? this.selectedRetakeIds,
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
      final results = await Future.wait([
        _repository.getGradePlan(),
        _repository.getRetakeAdvisor(),
        _repository.getCourseGrades(),
      ]);
      final plan = results[0] as GradePlanModel?;
      final retake = results[1] as Map<String, dynamic>;
      final courses = results[2] as List<CourseGradeModel>;

      // Pre-select top single retake if available
      final initialSelected = <int>{};
      if (retake['top_single'] != null && retake['top_single']['id'] != null) {
        initialSelected.add(retake['top_single']['id'] as int);
      }

      state = state.copyWith(
        plan: plan,
        retakeData: retake,
        courses: courses,
        selectedRetakeIds: initialSelected,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  void toggleRetakeSelection(int courseId) {
    final updated = Set<int>.from(state.selectedRetakeIds);
    if (updated.contains(courseId)) {
      updated.remove(courseId);
    } else {
      updated.add(courseId);
    }
    state = state.copyWith(selectedRetakeIds: updated);
  }

  void selectAllRetakes() {
    final retakeIds = state.courses
        .where((c) => c.gradePoint < 3.50 || c.isRetake)
        .map((c) => c.id)
        .toSet();
    state = state.copyWith(selectedRetakeIds: retakeIds);
  }

  void clearRetakeSelection() {
    state = state.copyWith(selectedRetakeIds: {});
  }

  Future<bool> createCourseGrade(Map<String, dynamic> data) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      // If course code already exists, replace/overwrite it
      final code = (data['course_code'] ?? '').toString().trim().toUpperCase();
      if (code.isNotEmpty) {
        final existing = state.courses
            .where((c) => c.courseCode.trim().toUpperCase() == code)
            .toList();
        for (final oldCourse in existing) {
          try {
            await _repository.deleteCourseGrade(oldCourse.id);
          } catch (_) {}
        }
      }
      await _repository.createCourseGrade(data);
      await loadGradesData();
      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      return false;
    }
  }

  Future<bool> deleteCourseGrade(int id) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      await _repository.deleteCourseGrade(id);
      await loadGradesData();
      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      return false;
    }
  }

  Future<Map<String, dynamic>?> uploadTranscript({
    String? filePath,
    String? fileName,
    String? rawText,
  }) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final res = await _repository.uploadTranscript(
        filePath: filePath,
        fileName: fileName,
        rawText: rawText,
      );
      await loadGradesData();
      return res;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      return null;
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

  void restoreData({
    GradePlanModel? plan,
    List<CourseGradeModel>? courses,
    Map<String, dynamic>? retakeData,
  }) {
    state = state.copyWith(
      plan: plan ?? state.plan,
      courses: courses ?? state.courses,
      retakeData: retakeData ?? state.retakeData,
    );
  }
}

final gradesProvider =
    StateNotifierProvider<GradesNotifier, GradesState>((ref) {
  final repo = ref.watch(gradesRepositoryProvider);
  return GradesNotifier(repo);
});
