import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:percent_indicator/linear_percent_indicator.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/widgets/error_card.dart';
import '../../../../core/widgets/glass_card.dart';
import '../../../../core/widgets/responsive.dart';
import '../../../../core/widgets/student_brain_loader.dart';
import '../../../tracker/presentation/providers/tracker_provider.dart';
import '../providers/analytics_provider.dart';
import '../widgets/study_contribution_heatmap.dart';

class AnalyticsPage extends ConsumerWidget {
  const AnalyticsPage({super.key});

  static const List<Color> _chartColors = [
    AppColors.primary,
    Color(0xFF3B82F6),
    Color(0xFF8B5CF6),
    Color(0xFFEC4899),
    Color(0xFFF59E0B),
    Color(0xFF10B981),
  ];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(analyticsProvider);
    final trackerState = ref.watch(trackerProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Academic Analytics & Insights'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: () {
              ref.read(analyticsProvider.notifier).loadAnalytics();
              ref.read(trackerProvider.notifier).loadTrackerData();
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          await Future.wait([
            ref.read(analyticsProvider.notifier).loadAnalytics(),
            ref.read(trackerProvider.notifier).loadTrackerData(),
          ]);
        },
        color: AppColors.primary,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: Responsive.padding(context),
          child: Center(
            child: ConstrainedBox(
              constraints: BoxConstraints(maxWidth: Responsive.maxContentWidth(context)),
              child: Builder(
                builder: (context) {
                  if (state.isLoading) {
                    return const Padding(
                      padding: EdgeInsets.symmetric(vertical: 48),
                      child: StudentBrainLoader(
                        message: 'Analyzing study performance & habits...',
                      ),
                    );
                  }

                  if (state.error != null) {
                    return ErrorCard(
                      message: state.error!,
                      onRetry: () => ref.read(analyticsProvider.notifier).loadAnalytics(),
                    );
                  }

                  final totalHours = (state.totalMinutes / 60.0).toStringAsFixed(1);

                  return Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // 1. KPI Cards Row
                      Row(
                        children: [
                          Expanded(
                            child: GlassCard(
                              padding: const EdgeInsets.all(14),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text('Total Focus', style: TextStyle(fontSize: 11, color: Colors.grey)),
                                  const SizedBox(height: 6),
                                  Text(
                                    '${totalHours}h',
                                    style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    '${state.totalSessions} sessions',
                                    style: TextStyle(fontSize: 10, color: isDark ? AppColors.textDarkMuted : AppColors.textLightMuted),
                                  ),
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: GlassCard(
                              padding: const EdgeInsets.all(14),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text('Avg Session', style: TextStyle(fontSize: 11, color: Colors.grey)),
                                  const SizedBox(height: 6),
                                  Text(
                                    '${state.avgSessionMinutes.toInt()}m',
                                    style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: AppColors.primary),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    'Per study block',
                                    style: TextStyle(fontSize: 10, color: isDark ? AppColors.textDarkMuted : AppColors.textLightMuted),
                                  ),
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: GlassCard(
                              padding: const EdgeInsets.all(14),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text('Adherence', style: TextStyle(fontSize: 11, color: Colors.grey)),
                                  const SizedBox(height: 6),
                                  Text(
                                    '${state.adherenceRate.toInt()}%',
                                    style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: AppColors.success),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    'Routine sync',
                                    style: TextStyle(fontSize: 10, color: isDark ? AppColors.textDarkMuted : AppColors.textLightMuted),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 18),

                      // 1.5. GitHub-style Study Consistency Contribution Heatmap
                      StudyContributionHeatmap(sessions: trackerState.sessions),
                      const SizedBox(height: 18),

                      // 2. Weekly Bar Chart (fl_chart) - Dynamic with Empty Placeholder Bars
                      Builder(
                        builder: (context) {
                          List<Map<String, dynamic>> displayWeeklyTrend = List.from(state.weeklyTrend);
                          if (displayWeeklyTrend.isEmpty) {
                            const standardDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                            displayWeeklyTrend = standardDays.map((d) => {'day_name': d, 'minutes': 0}).toList();
                          }
                          double maxTrendMins = 60.0;
                          for (final d in displayWeeklyTrend) {
                            final m = double.tryParse('${d['minutes']}') ?? 0.0;
                            if (m > maxTrendMins) maxTrendMins = m;
                          }

                          return GlassCard(
                            padding: const EdgeInsets.all(18),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    const Text(
                                      'Weekly Focus Histogram (Last 7 Days)',
                                      style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800),
                                    ),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                      decoration: BoxDecoration(
                                        color: AppColors.primary.withValues(alpha: 0.12),
                                        borderRadius: BorderRadius.circular(6),
                                      ),
                                      child: const Text(
                                        '7 Days Active',
                                        style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: AppColors.primary),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  'Focus duration in minutes per day (showing full weekly distribution)',
                                  style: TextStyle(fontSize: 11, color: isDark ? AppColors.textDarkMuted : AppColors.textLightMuted),
                                ),
                                const SizedBox(height: 24),
                                SizedBox(
                                  height: 180,
                                  child: BarChart(
                                    BarChartData(
                                      barTouchData: BarTouchData(
                                        touchTooltipData: BarTouchTooltipData(
                                          getTooltipItem: (group, groupIndex, rod, rodIndex) {
                                            final m = rod.toY.toInt();
                                            return BarTooltipItem(
                                              m > 2 ? '$m mins' : '0 mins',
                                              const TextStyle(color: Colors.white, fontWeight: FontWeight.w800),
                                            );
                                          },
                                        ),
                                      ),
                                      titlesData: FlTitlesData(
                                        show: true,
                                        bottomTitles: AxisTitles(
                                          sideTitles: SideTitles(
                                            showTitles: true,
                                            getTitlesWidget: (val, meta) {
                                              final idx = val.toInt();
                                              if (idx >= 0 && idx < displayWeeklyTrend.length) {
                                                return Padding(
                                                  padding: const EdgeInsets.only(top: 6),
                                                  child: Text(
                                                    displayWeeklyTrend[idx]['day_name'] ?? '',
                                                    style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700),
                                                  ),
                                                );
                                              }
                                              return const SizedBox();
                                            },
                                          ),
                                        ),
                                        leftTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                                        topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                                        rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                                      ),
                                      borderData: FlBorderData(show: false),
                                      gridData: const FlGridData(show: false),
                                      barGroups: displayWeeklyTrend.asMap().entries.map((entry) {
                                        final idx = entry.key;
                                        final item = entry.value;
                                        final mins = double.tryParse('${item['minutes']}') ?? 0.0;
                                        final hasFocus = mins > 0;
                                        return BarChartGroupData(
                                          x: idx,
                                          barRods: [
                                            BarChartRodData(
                                              toY: hasFocus ? mins : (maxTrendMins * 0.04),
                                              color: hasFocus
                                                  ? AppColors.primary
                                                  : (isDark ? Colors.white.withValues(alpha: 0.12) : Colors.black.withValues(alpha: 0.08)),
                                              width: 18,
                                              borderRadius: const BorderRadius.vertical(top: Radius.circular(6)),
                                              backDrawRodData: BackgroundBarChartRodData(
                                                show: true,
                                                toY: maxTrendMins,
                                                color: isDark ? Colors.white.withValues(alpha: 0.04) : Colors.black.withValues(alpha: 0.03),
                                              ),
                                            ),
                                          ],
                                        );
                                      }).toList(),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          );
                        },
                      ),
                      const SizedBox(height: 18),

                      // 3. Subject Investment Allocation (Top 5 Courses)
                      Builder(
                        builder: (context) {
                          final top5Subjects = state.subjectDistribution.take(5).toList();
                          if (top5Subjects.isEmpty) return const SizedBox.shrink();

                          return Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              GlassCard(
                                padding: const EdgeInsets.all(18),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        const Text(
                                          'Subject Investment Allocation (Top 5)',
                                          style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800),
                                        ),
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                          decoration: BoxDecoration(
                                            color: AppColors.primary.withValues(alpha: 0.12),
                                            borderRadius: BorderRadius.circular(6),
                                          ),
                                          child: Text(
                                            '${top5Subjects.length} Courses',
                                            style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: AppColors.primary),
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 16),
                                    SizedBox(
                                      height: 160,
                                      child: PieChart(
                                        PieChartData(
                                          sectionsSpace: 2,
                                          centerSpaceRadius: 36,
                                          sections: top5Subjects.asMap().entries.map((entry) {
                                            final idx = entry.key;
                                            final item = entry.value;
                                            final pct = double.tryParse('${item['percentage']}') ?? 10.0;
                                            final color = _chartColors[idx % _chartColors.length];
                                            return PieChartSectionData(
                                              color: color,
                                              value: pct,
                                              title: '${pct.toInt()}%',
                                              radius: 40,
                                              titleStyle: const TextStyle(
                                                fontSize: 10,
                                                fontWeight: FontWeight.w800,
                                                color: Colors.white,
                                              ),
                                            );
                                          }).toList(),
                                        ),
                                      ),
                                    ),
                                    const SizedBox(height: 18),
                                    // Top 5 Legends with progress bars
                                    ...top5Subjects.asMap().entries.map((entry) {
                                      final idx = entry.key;
                                      final item = entry.value;
                                      final color = _chartColors[idx % _chartColors.length];
                                      final subj = item['subject'] ?? 'Subject';
                                      final mins = item['minutes'] ?? 0;
                                      final pct = double.tryParse('${item['percentage']}') ?? 0.0;

                                      return Padding(
                                        padding: const EdgeInsets.only(bottom: 10.0),
                                        child: Column(
                                          children: [
                                            Row(
                                              children: [
                                                Container(
                                                  width: 10,
                                                  height: 10,
                                                  decoration: BoxDecoration(color: color, shape: BoxShape.circle),
                                                ),
                                                const SizedBox(width: 8),
                                                Expanded(
                                                  child: Text(
                                                    subj,
                                                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
                                                    maxLines: 1,
                                                    overflow: TextOverflow.ellipsis,
                                                  ),
                                                ),
                                                Text(
                                                  '${mins}m (${pct.toStringAsFixed(0)}%)',
                                                  style: TextStyle(
                                                    fontSize: 11,
                                                    fontWeight: FontWeight.w600,
                                                    color: isDark ? AppColors.textDarkMuted : AppColors.textLightMuted,
                                                  ),
                                                ),
                                              ],
                                            ),
                                            const SizedBox(height: 4),
                                            ClipRRect(
                                              borderRadius: BorderRadius.circular(4),
                                              child: LinearProgressIndicator(
                                                value: (pct / 100).clamp(0.0, 1.0),
                                                backgroundColor: isDark ? Colors.white10 : Colors.black12,
                                                valueColor: AlwaysStoppedAnimation<Color>(color),
                                                minHeight: 4,
                                              ),
                                            ),
                                          ],
                                        ),
                                      );
                                    }),
                                  ],
                                ),
                              ),
                              const SizedBox(height: 18),
                            ],
                          );
                        },
                      ),

                      // 4. Schedule Adherence Audit Card
                      GlassCard(
                        padding: const EdgeInsets.all(18),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Schedule Adherence Audit',
                              style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              'Ratio of scheduled weekly courses covered in actual focus sessions',
                              style: TextStyle(fontSize: 11, color: isDark ? AppColors.textDarkMuted : AppColors.textLightMuted),
                            ),
                            const SizedBox(height: 14),
                            LinearPercentIndicator(
                              lineHeight: 10.0,
                              percent: (state.adherenceRate / 100.0).clamp(0.0, 1.0),
                              progressColor: AppColors.primary,
                              backgroundColor: isDark ? AppColors.surfaceDarkSubtle : AppColors.surfaceLightSubtle,
                              barRadius: const Radius.circular(5),
                              padding: EdgeInsets.zero,
                            ),
                            const SizedBox(height: 10),
                            Text(
                              '${state.adherenceRate.toInt()}% of scheduled routine topics were actively studied this week.',
                              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 24),
                    ],
                  );
                },
              ),
            ),
          ),
        ),
      ),
    );
  }
}
