import 'package:flutter/material.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/widgets/glass_card.dart';
import '../../../tracker/data/models/study_session_model.dart';

class StudyContributionHeatmap extends StatelessWidget {
  final List<StudySessionModel> sessions;

  const StudyContributionHeatmap({
    super.key,
    required this.sessions,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    // Group minutes by "YYYY-MM-DD"
    final Map<String, int> sessionsByDate = {};
    for (final s in sessions) {
      String dStr = s.sessionDate.trim();
      if (dStr.length >= 10) {
        dStr = dStr.substring(0, 10);
        final mins = s.totalMinutes > 0 ? s.totalMinutes : s.durationMinutes;
        sessionsByDate[dStr] = (sessionsByDate[dStr] ?? 0) + mins;
      }
    }

    // Generate 20 weeks ending on current Saturday
    const int numWeeks = 20;
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final todayDayOfWeek = today.weekday % 7; // Sunday = 0, Monday = 1, ... Saturday = 6
    final daysRemainingInWeek = 6 - todayDayOfWeek;
    final totalDays = numWeeks * 7;
    final startDate = today.subtract(Duration(days: totalDays - 1 - daysRemainingInWeek));

    final List<List<_HeatmapDay>> weekCols = [];
    List<_HeatmapDay> currentWeek = [];
    int totalActiveDays = 0;
    int totalMinutes = 0;

    for (int i = 0; i < totalDays; i++) {
      final d = startDate.add(Duration(days: i));
      final iso = "${d.year.toString().padLeft(4, '0')}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}";
      final isFuture = d.isAfter(today);
      final mins = isFuture ? 0 : (sessionsByDate[iso] ?? 0);

      if (!isFuture && mins > 0) {
        totalActiveDays++;
        totalMinutes += mins;
      }

      int level = 0;
      if (!isFuture) {
        if (mins > 0 && mins < 30) {
          level = 1;
        } else if (mins >= 30 && mins < 60) {
          level = 2;
        } else if (mins >= 60 && mins < 120) {
          level = 3;
        } else if (mins >= 120) {
          level = 4;
        }
      }

      currentWeek.add(_HeatmapDay(
        date: d,
        isoString: iso,
        minutes: mins,
        level: level,
        isFuture: isFuture,
      ));

      if (currentWeek.length == 7) {
        weekCols.add(currentWeek);
        currentWeek = [];
      }
    }

    // Determine month names
    const List<String> monthNames = [
      '', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    Color getLevelColor(int level) {
      if (level == 0) {
        return isDark ? const Color(0xFF1E2430) : const Color(0xFFF1F5F9);
      }
      if (isDark) {
        switch (level) {
          case 1:
            return const Color(0xFF7C2D12);
          case 2:
            return const Color(0xFFC2410C);
          case 3:
            return const Color(0xFFEA580C);
          case 4:
            return const Color(0xFFF97316);
          default:
            return const Color(0xFF1E2430);
        }
      } else {
        switch (level) {
          case 1:
            return const Color(0xFFFFEDD5);
          case 2:
            return const Color(0xFFFDBA74);
          case 3:
            return const Color(0xFFFB923C);
          case 4:
            return const Color(0xFFF26522);
          default:
            return const Color(0xFFF1F5F9);
        }
      }
    }

    final totalHours = (totalMinutes / 60.0).toStringAsFixed(1);

    return GlassCard(
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        color: (isDark ? const Color(0xFFF97316) : const Color(0xFFF26522)).withValues(alpha: 0.15),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(Icons.local_fire_department_rounded, color: isDark ? const Color(0xFFF97316) : const Color(0xFFF26522), size: 18),
                    ),
                    const SizedBox(width: 8),
                    const Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Study Consistency & Activity',
                            style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          Text(
                            'Academic consistency & activity tracker',
                            style: TextStyle(fontSize: 10, color: Colors.grey),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3.5),
                decoration: BoxDecoration(
                  color: (isDark ? const Color(0xFFF97316) : const Color(0xFFF26522)).withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  '$totalActiveDays Active ${totalActiveDays == 1 ? "Day" : "Days"}',
                  style: TextStyle(
                    fontSize: 10.5,
                    fontWeight: FontWeight.w800,
                    color: isDark ? const Color(0xFFF97316) : const Color(0xFFF26522),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          // Scrollable Heatmap
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            reverse: true, // Show most recent weeks first if overflowing
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Day Labels (Sun, Tue, Thu)
                Padding(
                  padding: const EdgeInsets.only(top: 20, right: 6),
                  child: Column(
                    children: [
                      _buildDayLabel('Sun'),
                      const SizedBox(height: 3.5),
                      _buildDayLabel(''),
                      const SizedBox(height: 3.5),
                      _buildDayLabel('Tue'),
                      const SizedBox(height: 3.5),
                      _buildDayLabel(''),
                      const SizedBox(height: 3.5),
                      _buildDayLabel('Thu'),
                      const SizedBox(height: 3.5),
                      _buildDayLabel(''),
                      const SizedBox(height: 3.5),
                      _buildDayLabel('Sat'),
                    ],
                  ),
                ),
                // Heatmap Weeks Columns
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: weekCols.asMap().entries.map((entry) {
                    final weekIndex = entry.key;
                    final days = entry.value;

                    // Check if month changes at this week
                    String? monthHeader;
                    if (days.isNotEmpty) {
                      final firstDay = days.first.date;
                      if (weekIndex == 0 || (firstDay.day <= 7)) {
                        monthHeader = monthNames[firstDay.month];
                      }
                    }

                    return Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 2.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Month Header
                          SizedBox(
                            height: 16,
                            child: monthHeader != null
                                ? Text(
                                    monthHeader,
                                    style: TextStyle(
                                      fontSize: 9,
                                      fontWeight: FontWeight.w700,
                                      color: isDark ? AppColors.textDarkSubtle : AppColors.textLightSubtle,
                                    ),
                                  )
                                : const SizedBox.shrink(),
                          ),
                          const SizedBox(height: 4),
                          // 7 Days
                          ...days.map((day) {
                            final cellColor = day.isFuture
                                ? Colors.transparent
                                : getLevelColor(day.level);

                            return Tooltip(
                              message: day.isFuture
                                  ? 'Future date'
                                  : '${day.isoString}\n${day.minutes > 0 ? "${day.minutes} mins studied" : "No study recorded"}',
                              preferBelow: false,
                              child: Container(
                                width: 13,
                                height: 13,
                                margin: const EdgeInsets.only(bottom: 3.5),
                                decoration: BoxDecoration(
                                  color: cellColor,
                                  borderRadius: BorderRadius.circular(2.5),
                                  border: Border.all(
                                    color: day.isFuture
                                        ? Colors.transparent
                                        : (isDark ? Colors.white.withValues(alpha: 0.05) : Colors.black.withValues(alpha: 0.05)),
                                    width: 0.5,
                                  ),
                                ),
                              ),
                            );
                          }),
                        ],
                      ),
                    );
                  }).toList(),
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),
          // Heatmap Footer: Legend & Summary
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Total: ${totalHours}h studied across $totalActiveDays days',
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w600,
                  color: isDark ? AppColors.textDarkMuted : AppColors.textLightMuted,
                ),
              ),
              Row(
                children: [
                  Text(
                    'Less',
                    style: TextStyle(
                      fontSize: 9,
                      color: isDark ? AppColors.textDarkSubtle : AppColors.textLightSubtle,
                    ),
                  ),
                  const SizedBox(width: 4),
                  ...List.generate(5, (idx) {
                    return Container(
                      width: 10,
                      height: 10,
                      margin: const EdgeInsets.symmetric(horizontal: 1.5),
                      decoration: BoxDecoration(
                        color: getLevelColor(idx),
                        borderRadius: BorderRadius.circular(2),
                      ),
                    );
                  }),
                  const SizedBox(width: 4),
                  Text(
                    'More',
                    style: TextStyle(
                      fontSize: 9,
                      color: isDark ? AppColors.textDarkSubtle : AppColors.textLightSubtle,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildDayLabel(String label) {
    return SizedBox(
      height: 13,
      child: Text(
        label,
        style: const TextStyle(
          fontSize: 8,
          fontWeight: FontWeight.w700,
          color: Colors.grey,
        ),
      ),
    );
  }
}

class _HeatmapDay {
  final DateTime date;
  final String isoString;
  final int minutes;
  final int level;
  final bool isFuture;

  _HeatmapDay({
    required this.date,
    required this.isoString,
    required this.minutes,
    required this.level,
    required this.isFuture,
  });
}

