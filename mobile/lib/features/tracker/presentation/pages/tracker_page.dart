import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/widgets/app_button.dart';
import '../../../../core/widgets/empty_state.dart';
import '../../../../core/widgets/error_card.dart';
import '../../../../core/widgets/glass_card.dart';
import '../../../../core/widgets/responsive.dart';
import '../../../../core/widgets/student_brain_loader.dart';
import '../providers/tracker_provider.dart';
import 'create_session_dialog.dart';

class TrackerPage extends ConsumerWidget {
  const TrackerPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final trackerState = ref.watch(trackerProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Study Tracker & Focus Sessions'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: () => ref.read(trackerProvider.notifier).loadTrackerData(),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => showDialog(
          context: context,
          builder: (_) => const CreateSessionDialog(),
        ),
        backgroundColor: AppColors.primary,
        icon: const Icon(Icons.add_rounded, color: Colors.white),
        label: const Text(
          'Book Session',
          style: TextStyle(fontWeight: FontWeight.w700, color: Colors.white),
        ),
      ),
      body: RefreshIndicator(
        onRefresh: () => ref.read(trackerProvider.notifier).loadTrackerData(),
        color: AppColors.primary,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: Responsive.padding(context),
          child: Center(
            child: ConstrainedBox(
              constraints: BoxConstraints(maxWidth: Responsive.maxContentWidth(context)),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // 1. Streak & Rewards Banner
                  GlassCard(
                    padding: const EdgeInsets.all(18),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(10),
                              decoration: BoxDecoration(
                                color: AppColors.flame.withValues(alpha: 0.15),
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(Icons.local_fire_department_rounded, color: AppColors.flame, size: 26),
                            ),
                            const SizedBox(width: 14),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  '${trackerState.streaks['current_streak'] ?? 0} Day Active Streak',
                                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  'Best Record: ${trackerState.streaks['longest_streak'] ?? 0} days',
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: isDark ? AppColors.textDarkMuted : AppColors.textLightMuted,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                        AppButton(
                          label: 'Live Focus',
                          onPressed: () => context.push('/tracker/live'),
                          height: 38,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 18),

                  // 2. Active Session Card if in progress
                  if (trackerState.activeSession != null) ...[
                    GlassCard(
                      borderColor: AppColors.primary,
                      padding: const EdgeInsets.all(18),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Container(
                                width: 8,
                                height: 8,
                                decoration: const BoxDecoration(
                                  color: AppColors.success,
                                  shape: BoxShape.circle,
                                ),
                              ),
                              const SizedBox(width: 8),
                              const Text(
                                'SESSION CURRENTLY RUNNING',
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w900,
                                  color: AppColors.primary,
                                  letterSpacing: 0.5,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Text(
                            trackerState.activeSession!.subject,
                            style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w800),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Duration: ${trackerState.activeSession!.totalMinutes} mins',
                            style: TextStyle(
                              fontSize: 13,
                              color: isDark ? AppColors.textDarkMuted : AppColors.textLightMuted,
                            ),
                          ),
                          const SizedBox(height: 14),
                          AppButton(
                            label: 'Open Fullscreen Timer',
                            icon: const Icon(Icons.fullscreen_rounded, size: 20),
                            onPressed: () => context.push('/tracker/live'),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 18),
                  ],

                  // 3. Section Title
                  const Text(
                    'Study Sessions History & Schedule',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
                  ),
                  const SizedBox(height: 12),

                  // 4. Sessions List
                  if (trackerState.isLoading)
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 36),
                      child: StudentBrainLoader(
                        message: 'Syncing focus sessions & streaks...',
                      ),
                    )
                  else if (trackerState.error != null)
                    ErrorCard(
                      message: trackerState.error!,
                      onRetry: () => ref.read(trackerProvider.notifier).loadTrackerData(),
                    )
                  else if (trackerState.sessions.isEmpty)
                    EmptyState(
                      icon: Icons.timer_outlined,
                      title: 'No Sessions Logged Yet',
                      subtitle: 'Book a focus session to build streaks and unlock achievement badges.',
                      actionLabel: 'Book First Session',
                      onAction: () => showDialog(
                        context: context,
                        builder: (_) => const CreateSessionDialog(),
                      ),
                    )
                  else
                    ListView.separated(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: trackerState.sessions.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 10),
                      itemBuilder: (context, index) {
                        final session = trackerState.sessions[index];
                        final isScheduled = session.isScheduled;
                        final isCompleted = session.isCompleted;

                        return GlassCard(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Expanded(
                                    child: Text(
                                      session.subject,
                                      style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w800),
                                    ),
                                  ),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: (isCompleted
                                              ? AppColors.success
                                              : (isScheduled ? AppColors.warning : AppColors.primary))
                                          .withValues(alpha: 0.15),
                                      borderRadius: BorderRadius.circular(9999),
                                    ),
                                    child: Text(
                                      session.status.toUpperCase(),
                                      style: TextStyle(
                                        fontSize: 10,
                                        fontWeight: FontWeight.w800,
                                        color: isCompleted
                                            ? AppColors.success
                                            : (isScheduled ? AppColors.warning : AppColors.primary),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 6),
                              Row(
                                children: [
                                  Icon(Icons.calendar_today_outlined, size: 13, color: isDark ? AppColors.textDarkSubtle : AppColors.textLightSubtle),
                                  const SizedBox(width: 4),
                                  Text(
                                    session.sessionDate,
                                    style: TextStyle(fontSize: 12, color: isDark ? AppColors.textDarkMuted : AppColors.textLightMuted),
                                  ),
                                  const SizedBox(width: 14),
                                  Icon(Icons.access_time_rounded, size: 13, color: isDark ? AppColors.textDarkSubtle : AppColors.textLightSubtle),
                                  const SizedBox(width: 4),
                                  Text(
                                    '${session.totalMinutes} min${session.startTime != null ? " at ${session.startTime}" : ""}',
                                    style: TextStyle(fontSize: 12, color: isDark ? AppColors.textDarkMuted : AppColors.textLightMuted),
                                  ),
                                ],
                              ),
                              if (session.quizTaken && session.quizScore != null) ...[
                                const SizedBox(height: 8),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: AppColors.primary.withValues(alpha: 0.12),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: Text(
                                    'AI Quiz Mastered: ${session.quizScore!.toInt()}%',
                                    style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppColors.primary),
                                  ),
                                ),
                              ],
                              if (isScheduled) ...[
                                const SizedBox(height: 12),
                                AppButton(
                                  label: 'Start Focus Session',
                                  height: 38,
                                  onPressed: () async {
                                    final err = await ref.read(trackerProvider.notifier).startSession(session.id);
                                    if (err != null && context.mounted) {
                                      ScaffoldMessenger.of(context).showSnackBar(
                                        SnackBar(
                                          content: Text(err),
                                          backgroundColor: AppColors.error,
                                        ),
                                      );
                                    } else if (context.mounted) {
                                      context.push('/tracker/live');
                                    }
                                  },
                                ),
                              ],
                              if (isCompleted && !session.quizTaken) ...[
                                const SizedBox(height: 12),
                                AppButton(
                                  label: 'Take AI Diagnostic Quiz',
                                  variant: AppButtonVariant.outline,
                                  height: 38,
                                  icon: const Icon(Icons.quiz_outlined, size: 16),
                                  onPressed: () => context.push('/ai/quiz/${session.id}'),
                                ),
                              ],
                            ],
                          ),
                        );
                      },
                    ),
                  const SizedBox(height: 24),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
