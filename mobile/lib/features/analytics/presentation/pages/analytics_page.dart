import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:percent_indicator/linear_percent_indicator.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/widgets/error_card.dart';
import '../../../../core/widgets/glass_card.dart';
import '../../../../core/widgets/responsive.dart';
import '../../../../core/widgets/student_brain_loader.dart';
import '../providers/analytics_provider.dart';

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
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Academic Analytics & Insights'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: () => ref.read(analyticsProvider.notifier).loadAnalytics(),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => ref.read(analyticsProvider.notifier).loadAnalytics(),
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

                      // 2. Weekly Bar Chart (fl_chart)
                      GlassCard(
                        padding: const EdgeInsets.all(18),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Weekly Focus Histogram (Last 7 Days)',
                              style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Focus duration in minutes per day',
                              style: TextStyle(fontSize: 11, color: isDark ? AppColors.textDarkMuted : AppColors.textLightMuted),
                            ),
                            const SizedBox(height: 24),
                            SizedBox(
                              height: 180,
                              child: state.weeklyTrend.isEmpty
                                  ? const Center(child: Text('No study logs recorded this week'))
                                  : BarChart(
                                      BarChartData(
                                        barTouchData: BarTouchData(
                                          touchTooltipData: BarTouchTooltipData(
                                            getTooltipItem: (group, groupIndex, rod, rodIndex) {
                                              return BarTooltipItem(
                                                '${rod.toY.toInt()} mins',
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
                                                if (idx >= 0 && idx < state.weeklyTrend.length) {
                                                  return Padding(
                                                    padding: const EdgeInsets.only(top: 6),
                                                    child: Text(
                                                      state.weeklyTrend[idx]['day_name'] ?? '',
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
                                        barGroups: state.weeklyTrend.asMap().entries.map((entry) {
                                          final idx = entry.key;
                                          final item = entry.value;
                                          final mins = double.tryParse('${item['minutes']}') ?? 0.0;
                                          return BarChartGroupData(
                                            x: idx,
                                            barRods: [
                                              BarChartRodData(
                                                toY: mins,
                                                color: mins > 0 ? AppColors.primary : (isDark ? Colors.white10 : Colors.black12),
                                                width: 18,
                                                borderRadius: const BorderRadius.vertical(top: Radius.circular(6)),
                                              ),
                                            ],
                                          );
                                        }).toList(),
                                      ),
                                    ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 18),

                      // 3. Subject Investment Distribution (Pie Chart & Legend)
                      if (state.subjectDistribution.isNotEmpty) ...[
                        GlassCard(
                          padding: const EdgeInsets.all(18),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Subject Investment Allocation',
                                style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800),
                              ),
                              const SizedBox(height: 16),
                              SizedBox(
                                height: 160,
                                child: PieChart(
                                  PieChartData(
                                    sectionsSpace: 2,
                                    centerSpaceRadius: 36,
                                    sections: state.subjectDistribution.asMap().entries.map((entry) {
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
                              const SizedBox(height: 16),

                              // Legends list
                              ...state.subjectDistribution.asMap().entries.map((entry) {
                                final idx = entry.key;
                                final item = entry.value;
                                final color = _chartColors[idx % _chartColors.length];
                                final subj = item['subject'] ?? 'Subject';
                                final mins = item['minutes'] ?? 0;
                                final pct = item['percentage'] ?? 0;

                                return Padding(
                                  padding: const EdgeInsets.only(bottom: 8.0),
                                  child: Row(
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
                                          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                                        ),
                                      ),
                                      Text(
                                        '${mins}m ($pct%)',
                                        style: TextStyle(
                                          fontSize: 11,
                                          color: isDark ? AppColors.textDarkMuted : AppColors.textLightMuted,
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
