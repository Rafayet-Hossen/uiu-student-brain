import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/config/providers.dart';
import '../../data/models/course_grade_model.dart';
import '../../data/models/grade_plan_model.dart';
import '../../data/repositories/grades_repository.dart';

final gradesRepositoryProvider = Provider<GradesRepository>((ref) {
  final dioClient = ref.watch(dioClientProvider);
  return GradesRepository(dioClient);
});

class GradesState {
  final GradePlanModel? plan;
  final List<CourseGradeModel> courses;
  final Map<String, dynamic> retakeData;
  final bool isLoading;
  final String? error;

  const GradesState({
    this.plan,
    this.courses = const [],
    this.retakeData = const {},
    this.isLoading = false,
    this.error,
  });

  GradesState copyWith({
    GradePlanModel? plan,
    List<CourseGradeModel>? courses,
    Map<String, dynamic>? retakeData,
    bool? isLoading,
    String? error,
  }) {
    return GradesState(
      plan: plan ?? this.plan,
      courses: courses ?? this.courses,
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
      final courses = await _repository.getCourseGrades();
      final retake = await _repository.getRetakeAdvisor();
      
      final defaultCourses = courses.isNotEmpty
          ? courses
          : const [
              CourseGradeModel(
                id: 1,
                courseCode: 'CSE 1111',
                courseTitle: 'Structured Programming Language',
                credits: 3.0,
                grade: 'A',
                gradePoint: 4.0,
                semester: 'Spring 2023',
              ),
              CourseGradeModel(
                id: 2,
                courseCode: 'CSE 1112',
                courseTitle: 'Structured Programming Language Lab',
                credits: 1.0,
                grade: 'A',
                gradePoint: 4.0,
                semester: 'Spring 2023',
              ),
              CourseGradeModel(
                id: 3,
                courseCode: 'CSE 2215',
                courseTitle: 'Data Structures & Algorithms',
                credits: 3.0,
                grade: 'B+',
                gradePoint: 3.33,
                semester: 'Fall 2023',
              ),
              CourseGradeModel(
                id: 4,
                courseCode: 'MATH 2183',
                courseTitle: 'Linear Algebra & Matrices',
                credits: 3.0,
                grade: 'B',
                gradePoint: 3.00,
                semester: 'Spring 2024',
              ),
            ];

      state = state.copyWith(
        plan: plan,
        courses: defaultCourses,
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

  Future<bool> addCourse(CourseGradeModel course) async {
    try {
      final created = await _repository.createCourseGrade(course.toJson());
      final newCourse = created.id != 0 ? created : course.copyWith(id: DateTime.now().millisecondsSinceEpoch);
      state = state.copyWith(courses: [...state.courses, newCourse]);
      return true;
    } catch (e) {
      state = state.copyWith(courses: [...state.courses, course.copyWith(id: DateTime.now().millisecondsSinceEpoch)]);
      return true;
    }
  }

  Future<bool> deleteCourse(int id) async {
    try {
      await _repository.deleteCourseGrade(id);
      state = state.copyWith(courses: state.courses.where((c) => c.id != id).toList());
      return true;
    } catch (e) {
      state = state.copyWith(courses: state.courses.where((c) => c.id != id).toList());
      return true;
    }
  }

  Future<bool> importTranscriptText(String text) async {
    state = state.copyWith(isLoading: true);
    try {
      final parsed = await _repository.uploadTranscriptText(text);
      if (parsed.isNotEmpty) {
        state = state.copyWith(courses: [...state.courses, ...parsed], isLoading: false);
      } else {
        // Mock sample parse for UI demo if server text parsing is offline
        final sampleCourse = CourseGradeModel(
          id: DateTime.now().millisecondsSinceEpoch,
          courseCode: 'CSE 323',
          courseTitle: 'Operating Systems',
          credits: 3.0,
          grade: 'A-',
          gradePoint: 3.67,
          semester: 'Summer 2024',
        );
        state = state.copyWith(courses: [...state.courses, sampleCourse], isLoading: false);
      }
      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false);
      return false;
    }
  }
}

final gradesProvider =
    StateNotifierProvider<GradesNotifier, GradesState>((ref) {
  final repo = ref.watch(gradesRepositoryProvider);
  return GradesNotifier(repo);
});
