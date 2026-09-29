import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/config/providers.dart';
import '../../data/models/quiz_model.dart';
import '../../data/repositories/ai_repository.dart';

final aiRepositoryProvider = Provider<AiRepository>((ref) {
  final dioClient = ref.watch(dioClientProvider);
  return AiRepository(dioClient);
});

class QuizState {
  final int sessionId;
  final List<QuizQuestionModel> questions;
  final Map<int, String> selectedAnswers;
  final QuizResultModel? result;
  final bool isLoading;
  final bool isSubmitting;
  final String? error;

  const QuizState({
    required this.sessionId,
    this.questions = const [],
    this.selectedAnswers = const {},
    this.result,
    this.isLoading = false,
    this.isSubmitting = false,
    this.error,
  });

  QuizState copyWith({
    int? sessionId,
    List<QuizQuestionModel>? questions,
    Map<int, String>? selectedAnswers,
    QuizResultModel? result,
    bool? isLoading,
    bool? isSubmitting,
    String? error,
  }) {
    return QuizState(
      sessionId: sessionId ?? this.sessionId,
      questions: questions ?? this.questions,
      selectedAnswers: selectedAnswers ?? this.selectedAnswers,
      result: result ?? this.result,
      isLoading: isLoading ?? this.isLoading,
      isSubmitting: isSubmitting ?? this.isSubmitting,
      error: error,
    );
  }
}

class QuizNotifier extends StateNotifier<QuizState> {
  final AiRepository _repository;

  QuizNotifier(this._repository, int sessionId)
      : super(QuizState(sessionId: sessionId)) {
    loadQuiz(sessionId);
  }

  Future<void> loadQuiz(int sessionId) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final qs = await _repository.generateQuiz(sessionId);
      state = state.copyWith(questions: qs, isLoading: false);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  void selectOption(int questionId, String option) {
    final updated = Map<int, String>.from(state.selectedAnswers);
    updated[questionId] = option;
    state = state.copyWith(selectedAnswers: updated);
  }

  Future<bool> submitQuiz() async {
    state = state.copyWith(isSubmitting: true, error: null);
    try {
      final answersList = state.selectedAnswers.entries.map((entry) {
        return {
          'question_id': entry.key,
          'selected_option': entry.value,
        };
      }).toList();

      final res = await _repository.submitQuiz(state.sessionId, answersList);
      state = state.copyWith(result: res, isSubmitting: false);
      return true;
    } catch (e) {
      state = state.copyWith(isSubmitting: false, error: e.toString());
      return false;
    }
  }
}

final quizProviderFamily =
    StateNotifierProvider.family<QuizNotifier, QuizState, int>((ref, sessionId) {
  final repo = ref.watch(aiRepositoryProvider);
  return QuizNotifier(repo, sessionId);
});
