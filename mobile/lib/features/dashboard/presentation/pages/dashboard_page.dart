import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:percent_indicator/circular_percent_indicator.dart';
import 'package:percent_indicator/linear_percent_indicator.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/widgets/app_button.dart';
import '../../../../core/widgets/glass_card.dart';
import '../../../../core/widgets/notifications_sheet.dart';
import '../../../../core/widgets/responsive.dart';
import '../../../../core/widgets/student_brain_loader.dart';
import '../../../../core/widgets/user_avatar.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../providers/dashboard_provider.dart';

class DashboardPage extends ConsumerWidget {
  const DashboardPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider).user;
    final dashState = ref.watch(dashboardProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    if (dashState.isLoading && dashState.upcomingClasses.isEmpty && dashState.todayMinutes == 0) {
      return const Scaffold(
        body: StudentBrainLoader.fullScreen(
          message: 'Synchronizing your UIU Scholar Dashboard...',
        ),
      );
    }

    final progressRatio = dashState.dailyGoalMinutes > 0
        ? (dashState.todayMinutes / dashState.dailyGoalMinutes).clamp(0.0, 1.0)
        : 0.0;

    return Scaffold(
      appBar: AppBar(
        titleSpacing: 16,
        title: Row(
          children: [
            Stack(
              children: [
                UserAvatar(
                  name: user?.fullName ?? 'Scholar',
                  size: 38,
                ),
                Positioned(
                  right: 0,
                  bottom: 0,
                  child: Container(
                    width: 10,
                    height: 10,
                    decoration: BoxDecoration(
                      color: AppColors.success,
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
                        width: 1.8,
                      ),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Flexible(
                        child: Text(
                          'Hello, ${user?.fullName.split(' ').first ?? 'Scholar'}',
                          style: const TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w800,
                            letterSpacing: -0.2,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 4),
                      const Icon(Icons.waving_hand_rounded, color: AppColors.accent, size: 16),
                    ],
                  ),
                  const SizedBox(height: 1),
                  Text(
                    user?.department ?? 'UIU Academic Portal',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w500,
                      color: isDark ? AppColors.textDarkMuted : AppColors.textLightMuted,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          Stack(
            alignment: Alignment.center,
            children: [
              IconButton(
                icon: const Icon(Icons.notifications_none_rounded, size: 22),
                tooltip: 'Notifications',
                onPressed: () => NotificationsSheet.show(context),
              ),
              Positioned(
                top: 13,
                right: 13,
                child: Container(
                  width: 7,
                  height: 7,
                  decoration: const BoxDecoration(
                    color: AppColors.primary,
                    shape: BoxShape.circle,
                  ),
                ),
              ),
            ],
          ),
          IconButton(
            icon: const Icon(Icons.tune_rounded, size: 21),
            tooltip: 'Settings',
            onPressed: () => context.push('/settings'),
          ),
          const SizedBox(width: 4),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          await ref.read(dashboardProvider.notifier).loadDashboard();
        },
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
                  // 1. Streak & Today Focus Row
                  Row(
                    children: [
                      // Streak Card (Taps to Analytics Heatmap)
                      Expanded(
                        child: GlassCard(
                          onTap: () => context.go('/analytics'),
                          padding: const EdgeInsets.all(14),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Container(
                                    padding: const EdgeInsets.all(6),
                                    decoration: BoxDecoration(
                                      color: AppColors.flame.withValues(alpha: 0.15),
                                      shape: BoxShape.circle,
                                    ),
                                    child: const Icon(Icons.local_fire_department_rounded, color: AppColors.flame, size: 18),
                                  ),
                                  const SizedBox(width: 8),
                                  Text(
                                    'Streak',
                                    style: TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w700,
                                      color: isDark ? AppColors.textDarkMuted : AppColors.textLightMuted,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 10),
                              Text(
                                '${dashState.currentStreak} Days',
                                style: const TextStyle(
                                  fontSize: 22,
                                  fontWeight: FontWeight.w900,
                                  color: AppColors.flame,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                'Record: ${dashState.longestStreak} days',
                                style: TextStyle(
                                  fontSize: 11,
                                  color: isDark ? AppColors.textDarkSubtle : AppColors.textLightSubtle,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),

                      // Today's Focus Card
                      Expanded(
                        child: GlassCard(
                          padding: const EdgeInsets.all(14),
                          child: Row(
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'Today Focus',
                                      style: TextStyle(
                                        fontSize: 12,
                                        fontWeight: FontWeight.w700,
                                        color: isDark ? AppColors.textDarkMuted : AppColors.textLightMuted,
                                      ),
                                    ),
                                    const SizedBox(height: 10),
                                    Text(
                                      '${dashState.todayMinutes}m',
                                      style: TextStyle(
                                        fontSize: 22,
                                        fontWeight: FontWeight.w900,
                                        color: isDark ? AppColors.textDark : AppColors.textLight,
                                      ),
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      'Goal: ${dashState.dailyGoalMinutes}m',
                                      style: TextStyle(
                                        fontSize: 11,
                                        color: isDark ? AppColors.textDarkSubtle : AppColors.textLightSubtle,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              CircularPercentIndicator(
                                radius: 24.0,
                                lineWidth: 4.5,
                                percent: progressRatio,
                                center: Text(
                                  '${(progressRatio * 100).toInt()}%',
                                  style: const TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.w800,
                                  ),
                                ),
                                progressColor: AppColors.primary,
                                backgroundColor: isDark ? AppColors.borderDark : AppColors.borderLight,
                                circularStrokeCap: CircularStrokeCap.round,
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),

                  // 2. GPA Trajectory Snapshot
                  GlassCard(
                    onTap: () => context.push('/grades'),
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Row(
                              children: [
                                const Icon(Icons.analytics_outlined, size: 18, color: AppColors.primary),
                                const SizedBox(width: 8),
                                const Text(
                                  'GPA Trajectory Forecast',
                                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800),
                                ),
                              ],
                            ),
                            const Icon(Icons.arrow_forward_ios_rounded, size: 13, color: AppColors.primary),
                          ],
                        ),
                        const SizedBox(height: 14),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceAround,
                          children: [
                            _buildStatItem('Current', dashState.currentGpa.toStringAsFixed(2), AppColors.primary),
                            _buildStatItem('Target', dashState.targetGpa.toStringAsFixed(2), AppColors.warning),
                            _buildStatItem('Required', dashState.requiredGpa.toStringAsFixed(2), AppColors.accent),
                          ],
                        ),
                        const SizedBox(height: 10),
                        LinearPercentIndicator(
                          lineHeight: 6.0,
                          percent: (dashState.currentGpa / 4.0).clamp(0.0, 1.0),
                          backgroundColor: isDark ? AppColors.borderDark : AppColors.borderLight,
                          progressColor: AppColors.primary,
                          barRadius: const Radius.circular(3),
                          padding: EdgeInsets.zero,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 14),

                  // 3. Quick Action Buttons
                  Row(
                    children: [
                      Expanded(
                        child: AppButton(
                          label: 'Live Focus',
                          icon: const Icon(Icons.play_arrow_rounded, size: 20),
                          onPressed: () => context.push('/tracker/live'),
                          height: 42,
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: AppButton(
                          label: 'AI Tutor',
                          variant: AppButtonVariant.secondary,
                          icon: const Icon(Icons.smart_toy_outlined, size: 18, color: AppColors.primary),
                          onPressed: () => context.go('/materials'),
                          height: 42,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // 4. AI Academic Recommendation
                  GlassCard(
                    padding: const EdgeInsets.all(14),
                    borderColor: AppColors.primary.withValues(alpha: 0.25),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(6),
                          decoration: BoxDecoration(
                            color: AppColors.primary.withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: const Icon(Icons.auto_awesome, color: AppColors.primary, size: 18),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'AI Study Recommendation',
                                style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                dashState.aiRecommendation,
                                style: TextStyle(
                                  fontSize: 12,
                                  color: isDark ? AppColors.textDarkMuted : AppColors.textLightMuted,
                                  height: 1.35,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 18),

                  // 5. Upcoming Schedule Header & List
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Upcoming Classes',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
                      ),
                      TextButton(
                        onPressed: () => context.go('/planner'),
                        child: const Text('View Routine'),
                      ),
                    ],
                  ),
                  if (dashState.upcomingClasses.isEmpty)
                    GlassCard(
                      padding: const EdgeInsets.all(16),
                      child: Center(
                        child: Text(
                          'No upcoming classes scheduled today.',
                          style: TextStyle(
                            fontSize: 13,
                            color: isDark ? AppColors.textDarkMuted : AppColors.textLightMuted,
                          ),
                        ),
                      ),
                    )
                  else
                    ...dashState.upcomingClasses.map((item) {
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 8.0),
                        child: GlassCard(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                          child: Row(
                            children: [
                              Container(
                                width: 4,
                                height: 36,
                                decoration: BoxDecoration(
                                  color: AppColors.primary,
                                  borderRadius: BorderRadius.circular(2),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      item['subject'] ?? 'Course Class',
                                      style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      'Room: ${item['room'] ?? 'TBA'} | ${item['teacher'] ?? 'Faculty'}',
                                      style: TextStyle(
                                        fontSize: 11,
                                        color: isDark ? AppColors.textDarkMuted : AppColors.textLightMuted,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              Text(
                                '${item['start_time'] ?? ''}',
                                style: const TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.primary,
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    }),
                  const SizedBox(height: 18),

                  // 6. Top 3 Scholars / Weekly Focus Podium Section
                  GlassCard(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(6),
                                  decoration: BoxDecoration(
                                    color: AppColors.gold.withValues(alpha: 0.15),
                                    shape: BoxShape.circle,
                                  ),
                                  child: const Icon(Icons.emoji_events_rounded, color: AppColors.gold, size: 18),
                                ),
                                const SizedBox(width: 8),
                                const Text(
                                  'Top Weekly Scholars',
                                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800),
                                ),
                              ],
                            ),
                            IconButton(
                              icon: const Icon(Icons.arrow_forward_rounded, size: 18, color: AppColors.primary),
                              tooltip: 'Full Leaderboard',
                              onPressed: () => context.push('/community/leaderboard'),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            // #2 Silver
                            Expanded(
                              child: _buildScholarPodium(
                                rank: 2,
                                name: 'Sadia R.',
                                hours: '28.5h',
                                badgeColor: AppColors.silver,
                                isDark: isDark,
                              ),
                            ),
                            const SizedBox(width: 8),
                            // #1 Gold
                            Expanded(
                              child: _buildScholarPodium(
                                rank: 1,
                                name: 'Tanvir A.',
                                hours: '34.2h',
                                badgeColor: AppColors.gold,
                                isDark: isDark,
                                isTop: true,
                              ),
                            ),
                            const SizedBox(width: 8),
                            // #3 Bronze
                            Expanded(
                              child: _buildScholarPodium(
                                rank: 3,
                                name: 'Mehedi H.',
                                hours: '24.0h',
                                badgeColor: AppColors.bronze,
                                isDark: isDark,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
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

  Widget _buildScholarPodium({
    required int rank,
    required String name,
    required String hours,
    required Color badgeColor,
    required bool isDark,
    bool isTop = false,
  }) {
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 8, vertical: isTop ? 14 : 10),
      decoration: BoxDecoration(
        color: isTop
            ? AppColors.primary.withValues(alpha: isDark ? 0.15 : 0.08)
            : (isDark ? Colors.white.withValues(alpha: 0.04) : Colors.black.withValues(alpha: 0.03)),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isTop ? AppColors.primary.withValues(alpha: 0.4) : (isDark ? AppColors.borderDark : AppColors.borderLight),
        ),
      ),
      child: Column(
        children: [
          Stack(
            alignment: Alignment.topRight,
            children: [
              UserAvatar(name: name, size: isTop ? 44 : 36),
              Container(
                padding: const EdgeInsets.all(3),
                decoration: BoxDecoration(
                  color: badgeColor,
                  shape: BoxShape.circle,
                ),
                child: Text(
                  '$rank',
                  style: const TextStyle(
                    fontSize: 9,
                    fontWeight: FontWeight.w900,
                    color: Colors.white,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            name,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w800,
              color: isDark ? AppColors.textDark : AppColors.textLight,
            ),
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 2),
          Text(
            hours,
            style: const TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w800,
              color: AppColors.primary,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatItem(String label, String value, Color color) {
    return Column(
      children: [
        Text(
          value,
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: color),
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Colors.grey),
        ),
      ],
    );
  }
}
