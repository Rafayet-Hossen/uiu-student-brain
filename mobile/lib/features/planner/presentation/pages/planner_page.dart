import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/widgets/empty_state.dart';
import '../../../../core/widgets/error_card.dart';
import '../../../../core/widgets/responsive.dart';
import '../../../../core/widgets/student_brain_loader.dart';
import '../../data/models/schedule_model.dart';
import '../providers/planner_provider.dart';
import 'add_schedule_dialog.dart';

class PlannerPage extends ConsumerWidget {
  const PlannerPage({super.key});

  static const List<String> days = [
    'All',
    'Saturday',
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
  ];

  String _formatTo12Hour(String rawTime) {
    if (rawTime.trim().isEmpty) return '';
    try {
      final parts = rawTime.trim().split(':');
      if (parts.isNotEmpty) {
        int h = int.parse(parts[0]);
        int m = parts.length > 1 ? int.parse(parts[1]) : 0;
        final period = h >= 12 ? 'PM' : 'AM';
        final h12 = h == 0 ? 12 : (h > 12 ? h - 12 : h);
        final mStr = m.toString().padLeft(2, '0');
        return '$h12:$mStr $period';
      }
    } catch (_) {}
    return rawTime;
  }

  String _formatTimeRange(String startTime, String endTime) {
    final start = _formatTo12Hour(startTime);
    final end = _formatTo12Hour(endTime);
    if (start.isNotEmpty && end.isNotEmpty) {
      return '$start – $end';
    } else if (start.isNotEmpty) {
      return start;
    }
    return '';
  }

  bool _isEventSchedule(ScheduleModel item) {
    return item.subject.startsWith('[Event]') ||
        item.notes.contains('Campus Study Event') ||
        item.notes.contains('Host:') ||
        item.notes.contains('Location:');
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final plannerState = ref.watch(plannerProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Study Routine & Timetable'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            tooltip: 'Refresh Routine',
            onPressed: () => ref.read(plannerProvider.notifier).loadSchedules(),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => showDialog(
          context: context,
          builder: (_) => const AddScheduleDialog(),
        ),
        backgroundColor: AppColors.primary,
        icon: const Icon(Icons.add_rounded, color: Colors.white),
        label: const Text(
          'Add Class',
          style: TextStyle(fontWeight: FontWeight.w800, color: Colors.white),
        ),
      ),
      body: Column(
        children: [
          // 1. Day Selector Filter Chips
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            child: Row(
              children: days.map((day) {
                final isSelected = plannerState.selectedDay == day;
                return Padding(
                  padding: const EdgeInsets.only(right: 8.0),
                  child: FilterChip(
                    label: Text(day),
                    selected: isSelected,
                    onSelected: (_) {
                      ref.read(plannerProvider.notifier).selectDay(day);
                    },
                    selectedColor: AppColors.primary.withValues(alpha: 0.2),
                    checkmarkColor: AppColors.primary,
                    labelStyle: TextStyle(
                      fontSize: 12,
                      fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                      color: isSelected
                          ? AppColors.primary
                          : (isDark ? AppColors.textDarkMuted : AppColors.textLightMuted),
                    ),
                    backgroundColor:
                        isDark ? AppColors.surfaceDarkSubtle : AppColors.surfaceLightSubtle,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(9999),
                      side: BorderSide(
                        color: isSelected ? AppColors.primary : Colors.transparent,
                        width: 1.2,
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
          const Divider(height: 1),

          // 2. Main Schedule List
          Expanded(
            child: RefreshIndicator(
              onRefresh: () => ref.read(plannerProvider.notifier).loadSchedules(),
              color: AppColors.primary,
              child: Builder(
                builder: (context) {
                  if (plannerState.isLoading) {
                    return const StudentBrainLoader.fullScreen(
                      message: 'Loading routine & class schedules...',
                    );
                  }

                  if (plannerState.error != null) {
                    return Center(
                      child: Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: ErrorCard(
                          message: plannerState.error!,
                          onRetry: () =>
                              ref.read(plannerProvider.notifier).loadSchedules(),
                        ),
                      ),
                    );
                  }

                  final schedules = plannerState.filteredSchedules;

                  if (schedules.isEmpty) {
                    return SingleChildScrollView(
                      physics: const AlwaysScrollableScrollPhysics(),
                      padding: const EdgeInsets.all(24),
                      child: EmptyState(
                        icon: Icons.calendar_today_outlined,
                        title: 'No Classes for ${plannerState.selectedDay}',
                        subtitle:
                            'You do not have any routine classes scheduled for this day.',
                        actionLabel: 'Add Class Routine',
                        onAction: () => showDialog(
                          context: context,
                          builder: (_) => const AddScheduleDialog(),
                        ),
                      ),
                    );
                  }

                  return ListView.separated(
                    padding: Responsive.padding(context),
                    physics: const AlwaysScrollableScrollPhysics(),
                    itemCount: schedules.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 14),
                    itemBuilder: (context, index) {
                      final item = schedules[index];
                      if (_isEventSchedule(item)) {
                        return _buildEventCard(context, item, isDark, ref);
                      } else {
                        return _buildClassRoutineCard(context, item, isDark, ref);
                      }
                    },
                  );
                },
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ==========================================
  // 1. DISTINCT CAMPUS EVENT RSVP CARD
  // ==========================================
  Widget _buildEventCard(
    BuildContext context,
    ScheduleModel item,
    bool isDark,
    WidgetRef ref,
  ) {
    // Clean Title
    final rawTitle = item.subject.replaceFirst(RegExp(r'^\[Event\]\s*'), '').trim();

    // Parse event attributes from multiline notes
    String rsvpStatus = 'Going';
    String topic = '';
    String location = '';
    String host = '';
    String details = '';

    final lines = item.notes.split('\n');
    for (var line in lines) {
      final trimmed = line.trim();
      if (trimmed.contains('(Going)')) {
        rsvpStatus = 'Going';
      } else if (trimmed.contains('(Interested)')) {
        rsvpStatus = 'Interested';
      } else if (trimmed.startsWith('Subject / Topic:')) {
        topic = trimmed.replaceFirst('Subject / Topic:', '').trim();
      } else if (trimmed.startsWith('Location:')) {
        location = trimmed.replaceFirst('Location:', '').trim();
      } else if (trimmed.startsWith('Host:')) {
        host = trimmed.replaceFirst('Host:', '').trim();
      } else if (trimmed.startsWith('Details:')) {
        details = trimmed.replaceFirst('Details:', '').trim();
      }
    }

    final isGoing = rsvpStatus.toLowerCase() == 'going';
    final timeFormatted = _formatTimeRange(item.startTime, item.endTime);

    return Container(
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF161E2E) : const Color(0xFFFAF5FF),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isGoing
              ? AppColors.primary.withValues(alpha: 0.5)
              : Colors.purpleAccent.withValues(alpha: 0.4),
          width: 1.4,
        ),
        boxShadow: [
          BoxShadow(
            color: (isGoing ? AppColors.primary : Colors.purpleAccent).withValues(alpha: 0.08),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header: Event Icon + Badges + Title + Delete
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Event Badge Icon
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: isGoing
                        ? [AppColors.primary, AppColors.primaryLight]
                        : [const Color(0xFF8B5CF6), const Color(0xFFA855F7)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(14),
                  boxShadow: [
                    BoxShadow(
                      color: (isGoing ? AppColors.primary : const Color(0xFF8B5CF6)).withValues(alpha: 0.3),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: const Icon(
                  Icons.event_available_rounded,
                  color: Colors.white,
                  size: 22,
                ),
              ),
              const SizedBox(width: 12),
              // Badges & Title
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        // Category Chip
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                          decoration: BoxDecoration(
                            color: (isGoing ? AppColors.primary : const Color(0xFF8B5CF6)).withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            'CAMPUS EVENT',
                            style: TextStyle(
                              fontSize: 9,
                              fontWeight: FontWeight.w900,
                              letterSpacing: 0.4,
                              color: isGoing ? AppColors.primary : const Color(0xFF8B5CF6),
                            ),
                          ),
                        ),
                        const SizedBox(width: 6),
                        // RSVP Status Chip
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: isGoing
                                ? AppColors.success.withValues(alpha: 0.18)
                                : AppColors.accent.withValues(alpha: 0.18),
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(
                              color: isGoing
                                  ? AppColors.success.withValues(alpha: 0.4)
                                  : AppColors.accent.withValues(alpha: 0.4),
                              width: 0.8,
                            ),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                isGoing ? Icons.check_circle_rounded : Icons.star_rounded,
                                size: 11,
                                color: isGoing ? AppColors.success : AppColors.accent,
                              ),
                              const SizedBox(width: 3),
                              Text(
                                rsvpStatus,
                                style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w800,
                                  color: isGoing ? AppColors.success : AppColors.accent,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      rawTitle,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w900,
                        letterSpacing: -0.2,
                      ),
                    ),
                  ],
                ),
              ),
              // Delete Button
              IconButton(
                icon: const Icon(Icons.delete_outline_rounded, size: 20, color: AppColors.error),
                tooltip: 'Remove Event from Schedule',
                onPressed: () => _confirmDelete(context, item, ref),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Time & Days Row
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: isDark ? Colors.white.withValues(alpha: 0.04) : Colors.black.withValues(alpha: 0.03),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Row(
              children: [
                const Icon(Icons.schedule_rounded, size: 15, color: AppColors.primary),
                const SizedBox(width: 6),
                Text(
                  timeFormatted,
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: AppColors.primary,
                  ),
                ),
                if (item.days.isNotEmpty) ...[
                  const SizedBox(width: 8),
                  const Text('•', style: TextStyle(color: Colors.grey)),
                  const SizedBox(width: 8),
                  Wrap(
                    spacing: 4,
                    children: item.days.map((d) {
                      return Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          d,
                          style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.primary),
                        ),
                      );
                    }).toList(),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(height: 10),

          // Event Meta Tags: Location, Host, Topic
          Wrap(
            spacing: 8,
            runSpacing: 6,
            children: [
              if (location.isNotEmpty)
                _buildEventChip(Icons.location_on_outlined, location, isDark),
              if (host.isNotEmpty)
                _buildEventChip(Icons.person_outline_rounded, 'Host: $host', isDark),
              if (topic.isNotEmpty)
                _buildEventChip(Icons.tag_rounded, topic, isDark),
            ],
          ),

          // Event Description / Details Callout
          if (details.isNotEmpty) ...[
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: isDark ? Colors.black.withValues(alpha: 0.25) : Colors.white.withValues(alpha: 0.6),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(
                  color: isDark ? AppColors.borderDark : AppColors.borderLight,
                ),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(Icons.info_outline_rounded, size: 14, color: Colors.grey),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      details,
                      style: TextStyle(
                        fontSize: 11,
                        height: 1.35,
                        color: isDark ? AppColors.textDarkMuted : AppColors.textLightMuted,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildEventChip(IconData icon, String label, bool isDark) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.black.withValues(alpha: 0.04),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 13, color: AppColors.primary),
          const SizedBox(width: 4),
          Flexible(
            child: Text(
              label,
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: isDark ? AppColors.textDark : AppColors.textLight,
              ),
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }

  // ==========================================
  // 2. DISTINCT STUDENT CLASS ROUTINE CARD
  // ==========================================
  Widget _buildClassRoutineCard(
    BuildContext context,
    ScheduleModel item,
    bool isDark,
    WidgetRef ref,
  ) {
    // Extract Room from notes if present
    String room = '';
    String cleanNotes = item.notes;
    if (cleanNotes.contains('Room:')) {
      final parts = cleanNotes.split('|');
      for (var part in parts) {
        if (part.trim().startsWith('Room:')) {
          room = part.replaceFirst('Room:', '').trim();
        }
      }
      cleanNotes = cleanNotes.replaceAll(RegExp(r'Room:[^|]*\|?'), '').trim();
    }

    final timeFormatted = _formatTimeRange(item.startTime, item.endTime);

    return Container(
      decoration: BoxDecoration(
        color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isDark ? AppColors.borderDark : AppColors.borderLight,
          width: 1.2,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.25 : 0.04),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header Row: Course Icon + Badges + Subject + Delete
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Academic Subject Badge
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(
                    color: AppColors.primary.withValues(alpha: 0.25),
                  ),
                ),
                child: const Icon(
                  Icons.menu_book_rounded,
                  color: AppColors.primary,
                  size: 22,
                ),
              ),
              const SizedBox(width: 12),
              // Subject & Badges
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                          decoration: BoxDecoration(
                            color: AppColors.primary.withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: const Text(
                            'CLASS ROUTINE',
                            style: TextStyle(
                              fontSize: 9,
                              fontWeight: FontWeight.w900,
                              letterSpacing: 0.4,
                              color: AppColors.primary,
                            ),
                          ),
                        ),
                        if (room.isNotEmpty) ...[
                          const SizedBox(width: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                            decoration: BoxDecoration(
                              color: isDark ? Colors.white.withValues(alpha: 0.08) : Colors.black.withValues(alpha: 0.06),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(Icons.meeting_room_outlined, size: 11, color: AppColors.accent),
                                const SizedBox(width: 3),
                                Text(
                                  'Room: $room',
                                  style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.w700,
                                    color: isDark ? AppColors.textDark : AppColors.textLight,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      item.subject,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w900,
                        letterSpacing: -0.2,
                      ),
                    ),
                  ],
                ),
              ),
              // Delete Button
              IconButton(
                icon: const Icon(Icons.delete_outline_rounded, size: 20, color: AppColors.error),
                tooltip: 'Delete Class Routine',
                onPressed: () => _confirmDelete(context, item, ref),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Time & Days Row
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: AppColors.primary.withValues(alpha: 0.2),
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.access_time_filled_rounded, size: 13, color: AppColors.primary),
                    const SizedBox(width: 5),
                    Text(
                      timeFormatted,
                      style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                        color: AppColors.primary,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              if (item.days.isNotEmpty)
                Expanded(
                  child: SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: item.days.map((d) {
                        return Container(
                          margin: const EdgeInsets.only(right: 4),
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: isDark ? AppColors.surfaceDarkSubtle : AppColors.surfaceLightSubtle,
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(
                              color: isDark ? AppColors.borderDark : AppColors.borderLight,
                            ),
                          ),
                          child: Text(
                            d,
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w700,
                              color: isDark ? AppColors.textDark : AppColors.textLight,
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                  ),
                ),
            ],
          ),

          // Notes / Faculty Callout
          if (cleanNotes.isNotEmpty) ...[
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
              decoration: BoxDecoration(
                color: isDark ? Colors.white.withValues(alpha: 0.03) : Colors.black.withValues(alpha: 0.02),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(
                  color: isDark ? AppColors.borderDark : AppColors.borderLight,
                ),
              ),
              child: Row(
                children: [
                  const Icon(Icons.notes_rounded, size: 14, color: Colors.grey),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      cleanNotes,
                      style: TextStyle(
                        fontSize: 11,
                        color: isDark ? AppColors.textDarkMuted : AppColors.textLightMuted,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  void _confirmDelete(BuildContext context, ScheduleModel item, WidgetRef ref) async {
    final isEvent = _isEventSchedule(item);
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(isEvent ? 'Remove Event from Schedule?' : 'Delete Class Routine?'),
        content: Text(
          isEvent
              ? 'Are you sure you want to remove "${item.subject.replaceFirst(RegExp(r'^\[Event\]\s*'), '')}" from your calendar?'
              : 'Remove "${item.subject}" from your class timetable?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.error,
              foregroundColor: Colors.white,
            ),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Remove'),
          ),
        ],
      ),
    );
    if (confirm == true) {
      ref.read(plannerProvider.notifier).deleteSchedule(item.id);
    }
  }
}
