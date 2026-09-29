import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:percent_indicator/circular_percent_indicator.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/widgets/app_button.dart';
import '../../../../core/widgets/glass_card.dart';
import '../../../../core/widgets/responsive.dart';
import '../providers/quiz_provider.dart';

class QuizResultPage extends ConsumerWidget {
  final int sessionId;

  const QuizResultPage({super.key, required this.sessionId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final quizState = ref.watch(quizProviderFamily(sessionId));
    final result = quizState.result;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final score = result?.score ?? 80.0;
    final isPassed = score >= 70.0;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Diagnostic Results'),
        leading: IconButton(
          icon: const Icon(Icons.close_rounded),
          onPressed: () => context.go('/tracker'),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: Responsive.padding(context),
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 480),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // 1. Mastery Score Card
                  GlassCard(
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 28),
                    child: Column(
                      children: [
                        CircularPercentIndicator(
                          radius: 75.0,
                          lineWidth: 12.0,
                          percent: (score / 100.0).clamp(0.0, 1.0),
                          animation: true,
                          center: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                '${score.toInt()}%',
                                style: const TextStyle(
                                  fontSize: 32,
                                  fontWeight: FontWeight.w900,
                                ),
                              ),
                              Text(
                                isPassed ? 'MASTERY' : 'REVIEW',
                                style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w800,
                                  color: isPassed ? AppColors.success : AppColors.warning,
                                ),
                              ),
                            ],
                          ),
                          circularStrokeCap: CircularStrokeCap.round,
                          progressColor: isPassed ? AppColors.success : AppColors.warning,
                          backgroundColor: isDark ? AppColors.surfaceDarkSubtle : AppColors.surfaceLightSubtle,
                        ),
                        const SizedBox(height: 18),

                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                          decoration: BoxDecoration(
                            color: AppColors.primary.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(9999),
                          ),
                          child: Text(
                            result?.masteryBadge ?? 'Proficient Scholar',
                            style: const TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w800,
                              color: AppColors.primary,
                            ),
                          ),
                        ),
                        const SizedBox(height: 14),

                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceAround,
                          children: [
                            Column(
                              children: [
                                Text(
                                  '${result?.correctCount ?? 4}',
                                  style: const TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.w800,
                                    color: AppColors.success,
                                  ),
                                ),
                                const Text('Correct', style: TextStyle(fontSize: 12, color: Colors.grey)),
                              ],
                            ),
                            Column(
                              children: [
                                Text(
                                  '${(result?.totalQuestions ?? 5) - (result?.correctCount ?? 4)}',
                                  style: const TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.w800,
                                    color: AppColors.error,
                                  ),
                                ),
                                const Text('Missed', style: TextStyle(fontSize: 12, color: Colors.grey)),
                              ],
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // 2. Weak Topics Report
                  if (result != null && result.weakTopics.isNotEmpty) ...[
                    GlassCard(
                      padding: const EdgeInsets.all(18),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Row(
                            children: [
                              Icon(Icons.flag_outlined, size: 18, color: AppColors.warning),
                              SizedBox(width: 8),
                              Text(
                                'Detected Weak Topics',
                                style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800),
                              ),
                            ],
                          ),
                          const SizedBox(height: 10),
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children: result.weakTopics.map((topic) {
                              return Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                decoration: BoxDecoration(
                                  color: AppColors.warning.withValues(alpha: 0.15),
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(
                                    color: AppColors.warning.withValues(alpha: 0.3),
                                  ),
                                ),
                                child: Text(
                                  '• $topic',
                                  style: const TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w700,
                                    color: AppColors.warning,
                                  ),
                                ),
                              );
                            }).toList(),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                  ],

                  // 3. AI Recommendations Card
                  GlassCard(
                    padding: const EdgeInsets.all(18),
                    borderColor: AppColors.primary.withValues(alpha: 0.3),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Row(
                          children: [
                            Icon(Icons.auto_awesome, size: 18, color: AppColors.primary),
                            SizedBox(width: 8),
                            Text(
                              'AI Recommendation',
                              style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Text(
                          result?.recommendation ??
                              'Revisit the chapter notes for missed questions to achieve total concept mastery.',
                          style: TextStyle(
                            fontSize: 13,
                            height: 1.4,
                            color: isDark ? AppColors.textDarkMuted : AppColors.textLightMuted,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Actions
                  AppButton(
                    label: 'Return to Study Tracker',
                    onPressed: () => context.go('/tracker'),
                  ),
                  const SizedBox(height: 10),
                  AppButton(
                    label: 'Retry Quiz',
                    variant: AppButtonVariant.outline,
                    onPressed: () {
                      ref.read(quizProviderFamily(sessionId).notifier).loadQuiz(sessionId);
                      context.pushReplacement('/ai/quiz/$sessionId');
                    },
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
