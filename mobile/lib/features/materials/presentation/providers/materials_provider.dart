import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../../core/config/providers.dart';
import '../../data/models/material_model.dart';
import '../../data/repositories/materials_repository.dart';

final materialsRepositoryProvider = Provider<MaterialsRepository>((ref) {
  final dioClient = ref.watch(dioClientProvider);
  return MaterialsRepository(dioClient);
});

class MaterialsState {
  final List<StudyMaterialModel> materials;
  final List<Map<String, dynamic>> courses;
  final List<Map<String, dynamic>> semesters;
  final int? selectedSemesterId;
  final int? selectedCourseId;
  final String searchQuery;
  final String selectedCategory;
  final Set<String> bookmarkedIds;
  final bool isLoading;
  final String? error;

  const MaterialsState({
    this.materials = const [],
    this.courses = const [],
    this.semesters = const [],
    this.selectedSemesterId,
    this.selectedCourseId,
    this.searchQuery = '',
    this.selectedCategory = 'All',
    this.bookmarkedIds = const {},
    this.isLoading = false,
    this.error,
  });

  MaterialsState copyWith({
    List<StudyMaterialModel>? materials,
    List<Map<String, dynamic>>? courses,
    List<Map<String, dynamic>>? semesters,
    int? Function()? selectedSemesterId,
    int? Function()? selectedCourseId,
    String? searchQuery,
    String? selectedCategory,
    Set<String>? bookmarkedIds,
    bool? isLoading,
    String? error,
  }) {
    return MaterialsState(
      materials: materials ?? this.materials,
      courses: courses ?? this.courses,
      semesters: semesters ?? this.semesters,
      selectedSemesterId: selectedSemesterId != null ? selectedSemesterId() : this.selectedSemesterId,
      selectedCourseId: selectedCourseId != null ? selectedCourseId() : this.selectedCourseId,
      searchQuery: searchQuery ?? this.searchQuery,
      selectedCategory: selectedCategory ?? this.selectedCategory,
      bookmarkedIds: bookmarkedIds ?? this.bookmarkedIds,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }

  List<Map<String, dynamic>> get semesterCourses {
    if (selectedSemesterId == null) return courses;
    return courses.where((c) => c['semester'] == selectedSemesterId).toList();
  }

  List<StudyMaterialModel> get filteredMaterials {
    return materials.where((m) {
      final matchesSearch = searchQuery.isEmpty ||
          m.title.toLowerCase().contains(searchQuery.toLowerCase()) ||
          m.summary.toLowerCase().contains(searchQuery.toLowerCase()) ||
          (m.courseCode != null && m.courseCode!.toLowerCase().contains(searchQuery.toLowerCase()));
      final matchesCat = selectedCategory == 'All' ||
          (selectedCategory == 'Bookmarked'
              ? bookmarkedIds.contains(m.id.toString())
              : m.category == selectedCategory);
      final matchesCourse = selectedCourseId == null || m.courseId == selectedCourseId;

      bool matchesSemester = true;
      if (selectedSemesterId != null && selectedCourseId == null) {
        final semesterCourseIds = courses
            .where((c) => c['semester'] == selectedSemesterId)
            .map((c) => c['id'] as int?)
            .toSet();
        if (semesterCourseIds.isNotEmpty) {
          matchesSemester = semesterCourseIds.contains(m.courseId);
        }
      }

      return matchesSearch && matchesCat && matchesCourse && matchesSemester;
    }).toList();
  }
}

class MaterialsNotifier extends StateNotifier<MaterialsState> {
  final MaterialsRepository _repository;
  static const String _bookmarksKey = 'bookmarked_material_ids';

  MaterialsNotifier(this._repository) : super(const MaterialsState()) {
    loadMaterialsData();
    loadBookmarks();
  }

  Future<void> loadMaterials() => loadMaterialsData();

  Future<void> loadBookmarks() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final list = prefs.getStringList(_bookmarksKey) ?? [];
      state = state.copyWith(bookmarkedIds: list.toSet());
    } catch (_) {}
  }

  Future<bool> toggleBookmark(int materialId) async {
    final idStr = materialId.toString();
    final updated = Set<String>.from(state.bookmarkedIds);
    final isAdded = !updated.contains(idStr);
    if (isAdded) {
      updated.add(idStr);
    } else {
      updated.remove(idStr);
    }
    state = state.copyWith(bookmarkedIds: updated);
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setStringList(_bookmarksKey, updated.toList());
    } catch (_) {}
    return isAdded;
  }

  Future<void> loadMaterialsData() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final mats = await _repository.getMaterials();
      final crs = await _repository.getCourses();
      final sems = await _repository.getSemesters();

      int? initialSemId = state.selectedSemesterId;
      if (initialSemId == null && sems.isNotEmpty) {
        final cur = sems.firstWhere((s) => s['is_current'] == true, orElse: () => sems.first);
        initialSemId = cur['id'] as int?;
      }

      state = state.copyWith(
        materials: mats,
        courses: crs,
        semesters: sems,
        selectedSemesterId: () => initialSemId,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  void selectSemester(int? semesterId) {
    state = state.copyWith(
      selectedSemesterId: () => semesterId,
      selectedCourseId: () => null,
    );
  }

  void selectCourse(int? courseId) {
    state = state.copyWith(
      selectedCourseId: () => courseId == state.selectedCourseId ? null : courseId,
    );
  }

  Future<bool> createSemester(String name, bool isCurrent) async {
    try {
      await _repository.createSemester({
        'name': name,
        'is_current': isCurrent,
      });
      await loadMaterialsData();
      return true;
    } catch (e) {
      state = state.copyWith(error: e.toString());
      return false;
    }
  }

  Future<bool> createCourse({
    required int semesterId,
    required String title,
    required String code,
    String? color,
  }) async {
    try {
      await _repository.createCourse(semesterId, {
        'title': title,
        'code': code,
        if (color != null) 'color': color,
      });
      await loadMaterialsData();
      return true;
    } catch (e) {
      state = state.copyWith(error: e.toString());
      return false;
    }
  }

  Future<bool> updateSemester(int id, {String? name, bool? isCurrent}) async {
    try {
      await _repository.updateSemester(id, {
        if (name != null) 'name': name,
        if (isCurrent != null) 'is_current': isCurrent,
      });
      await loadMaterialsData();
      return true;
    } catch (e) {
      state = state.copyWith(error: e.toString());
      return false;
    }
  }

  Future<bool> deleteSemester(int id) async {
    try {
      await _repository.deleteSemester(id);
      if (state.selectedSemesterId == id) {
        state = state.copyWith(selectedSemesterId: null);
      }
      await loadMaterialsData();
      return true;
    } catch (e) {
      state = state.copyWith(error: e.toString());
      return false;
    }
  }

  Future<bool> updateCourse(int id, {String? title, String? code, String? color, String? description}) async {
    try {
      await _repository.updateCourse(id, {
        if (title != null) 'title': title,
        if (code != null) 'code': code,
        if (color != null) 'color': color,
        if (description != null) 'description': description,
      });
      await loadMaterialsData();
      return true;
    } catch (e) {
      state = state.copyWith(error: e.toString());
      return false;
    }
  }

  Future<bool> deleteCourse(int id) async {
    try {
      await _repository.deleteCourse(id);
      if (state.selectedCourseId == id) {
        state = state.copyWith(selectedCourseId: null);
      }
      await loadMaterialsData();
      return true;
    } catch (e) {
      state = state.copyWith(error: e.toString());
      return false;
    }
  }

  void setSearchQuery(String query) {
    state = state.copyWith(searchQuery: query);
  }

  void selectCategory(String category) {
    state = state.copyWith(selectedCategory: category);
  }

  Future<bool> createMaterial({
    required int courseId,
    required String title,
    required String category,
    String? filePath,
    String? fileName,
    String? contentText,
  }) async {
    try {
      final mat = await _repository.createMaterial(
        courseId: courseId,
        title: title,
        category: category,
        filePath: filePath,
        fileName: fileName,
        contentText: contentText,
      );
      state = state.copyWith(materials: [mat, ...state.materials]);
      return true;
    } catch (e) {
      final localMat = StudyMaterialModel(
        id: DateTime.now().millisecondsSinceEpoch ~/ 1000,
        title: title,
        category: category,
        materialType: 'document',
        courseId: courseId,
        fileUrl: filePath,
        contentText: contentText ?? '',
      );
      state = state.copyWith(materials: [localMat, ...state.materials]);
      return true;
    }
  }

  Future<bool> deleteMaterial(int id) async {
    try {
      await _repository.deleteMaterial(id);
    } catch (_) {}
    state = state.copyWith(
      materials: state.materials.where((m) => m.id != id).toList(),
    );
    return true;
  }
}

final materialsProvider =
    StateNotifierProvider<MaterialsNotifier, MaterialsState>((ref) {
  final repo = ref.watch(materialsRepositoryProvider);
  return MaterialsNotifier(repo);
});
