import 'package:flutter_riverpod/flutter_riverpod.dart';
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
  final String searchQuery;
  final String selectedCategory;
  final bool isLoading;
  final String? error;

  const MaterialsState({
    this.materials = const [],
    this.courses = const [],
    this.searchQuery = '',
    this.selectedCategory = 'All',
    this.isLoading = false,
    this.error,
  });

  MaterialsState copyWith({
    List<StudyMaterialModel>? materials,
    List<Map<String, dynamic>>? courses,
    String? searchQuery,
    String? selectedCategory,
    bool? isLoading,
    String? error,
  }) {
    return MaterialsState(
      materials: materials ?? this.materials,
      courses: courses ?? this.courses,
      searchQuery: searchQuery ?? this.searchQuery,
      selectedCategory: selectedCategory ?? this.selectedCategory,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }

  List<StudyMaterialModel> get filteredMaterials {
    return materials.where((m) {
      final matchesSearch = searchQuery.isEmpty ||
          m.title.toLowerCase().contains(searchQuery.toLowerCase()) ||
          m.summary.toLowerCase().contains(searchQuery.toLowerCase());
      final matchesCat =
          selectedCategory == 'All' || m.category == selectedCategory;
      return matchesSearch && matchesCat;
    }).toList();
  }
}

class MaterialsNotifier extends StateNotifier<MaterialsState> {
  final MaterialsRepository _repository;

  MaterialsNotifier(this._repository) : super(const MaterialsState()) {
    loadMaterialsData();
  }

  Future<void> loadMaterialsData() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final mats = await _repository.getMaterials();
      final crs = await _repository.getCourses();
      state = state.copyWith(
        materials: mats,
        courses: crs,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  void setSearchQuery(String query) {
    state = state.copyWith(searchQuery: query);
  }

  void selectCategory(String cat) {
    state = state.copyWith(selectedCategory: cat);
  }
}

final materialsProvider =
    StateNotifierProvider<MaterialsNotifier, MaterialsState>((ref) {
  final repo = ref.watch(materialsRepositoryProvider);
  return MaterialsNotifier(repo);
});
