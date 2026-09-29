import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/widgets/app_button.dart';
import '../../../../core/widgets/error_card.dart';
import '../../../../core/widgets/glass_card.dart';
import '../../../../core/widgets/responsive.dart';
import '../../../../core/widgets/student_brain_loader.dart';
import '../providers/quiz_provider.dart';

class QuizPage extends ConsumerStatefulWidget {
  final int sessionId;

  const QuizPage({super.key, required this.sessionId});

  @override
  ConsumerState<QuizPage> createState() => _QuizPageState();
}

class _QuizPageState extends ConsumerState<QuizPage> {
  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    final quizState = ref.watch(quizProviderFamily(widget.sessionId));
    final notifier = ref.read(quizProviderFamily(widget.sessionId).notifier);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    if (quizState.result != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        context.pushReplacement('/ai/quiz/${widget.sessionId}/result');
      });
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('AI Diagnostic Assessment'),
      ),
      body: SafeArea(
        child: Builder(
          builder: (context) {
            if (quizState.isLoading) {
              return const StudentBrainLoader.fullScreen(
                message: 'Gemini AI is generating your Diagnostic Quiz...',
              );
            }

            if (quizState.error != null) {
              return Center(
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: ErrorCard(
                    message: quizState.error!,
                    onRetry: () => notifier.loadQuiz(widget.sessionId),
                  ),
                ),
              );
            }

            final questions = quizState.questions;
            if (questions.isEmpty) {
              return const Center(child: Text('No quiz questions generated.'));
            }

            final currentQ = questions[_currentIndex];
            final selectedOption = quizState.selectedAnswers[currentQ.id];
            final isLastQuestion = _currentIndex == questions.length - 1;

            return Padding(
              padding: Responsive.padding(context),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Progress indicator
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Question ${_currentIndex + 1} of ${questions.length}',
                        style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(9999),
                        ),
                        child: Text(
                          currentQ.topic,
                          style: const TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            color: AppColors.primary,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  LinearProgressIndicator(
                    value: (_currentIndex + 1) / questions.length,
                    backgroundColor: isDark ? AppColors.surfaceDarkSubtle : AppColors.surfaceLightSubtle,
                    color: AppColors.primary,
                    borderRadius: BorderRadius.circular(4),
                  ),
                  const SizedBox(height: 20),

                  // Question Card
                  Expanded(
                    child: SingleChildScrollView(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          GlassCard(
                            padding: const EdgeInsets.all(18),
                            child: Text(
                              currentQ.questionText,
                              style: TextStyle(
                                fontSize: Responsive.font(context, 16),
                                fontWeight: FontWeight.w800,
                                height: 1.4,
                              ),
                            ),
                          ),
                          const SizedBox(height: 16),

                          // Options
                          ...currentQ.options.map((opt) {
                            final isSelected = selectedOption == opt;
                            return Padding(
                              padding: const EdgeInsets.only(bottom: 10.0),
                              child: GlassCard(
                                onTap: () => notifier.selectOption(currentQ.id, opt),
                                color: isSelected
                                    ? AppColors.primary.withValues(alpha: 0.12)
                                    : null,
                                borderColor: isSelected
                                    ? AppColors.primary
                                    : (isDark ? AppColors.borderDark : AppColors.borderLight),
                                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                                child: Row(
                                  children: [
                                    Container(
                                      width: 22,
                                      height: 22,
                                      decoration: BoxDecoration(
                                        shape: BoxShape.circle,
                                        border: Border.all(
                                          color: isSelected
                                              ? AppColors.primary
                                              : (isDark ? AppColors.borderDark : AppColors.borderLight),
                                          width: 2,
                                        ),
                                        color: isSelected ? AppColors.primary : Colors.transparent,
                                      ),
                                      child: isSelected
                                          ? const Icon(Icons.check, size: 14, color: Colors.white)
                                          : null,
                                    ),
                                    const SizedBox(width: 14),
                                    Expanded(
                                      child: Text(
                                        opt,
                                        style: TextStyle(
                                          fontSize: 14,
                                          fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                                          color: isDark ? AppColors.textDark : AppColors.textLight,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            );
                          }),
                        ],
                      ),
                    ),
                  ),

                  // Navigation Bar: Prev / Next / Submit
                  Row(
                    children: [
                      if (_currentIndex > 0)
                        Expanded(
                          child: OutlinedButton(
                            onPressed: () {
                              setState(() => _currentIndex--);
                            },
                            child: const Text('Previous'),
                          ),
                        ),
                      if (_currentIndex > 0) const SizedBox(width: 12),
                      Expanded(
                        flex: 2,
                        child: AppButton(
                          label: isLastQuestion ? 'Submit Quiz' : 'Next Question',
                          isLoading: quizState.isSubmitting,
                          onPressed: () {
                            if (isLastQuestion) {
                              notifier.submitQuiz();
                            } else {
                              setState(() => _currentIndex++);
                            }
                          },
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                ],
              ),
            );
          },
        ),
      ),
    );
  }
}
