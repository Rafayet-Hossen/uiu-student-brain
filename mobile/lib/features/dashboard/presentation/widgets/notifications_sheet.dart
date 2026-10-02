import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/config/providers.dart';
import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/widgets/student_brain_loader.dart';
import '../../../planner/presentation/providers/planner_provider.dart';
import '../providers/dashboard_provider.dart';

class NotificationsSheet extends ConsumerStatefulWidget {
  const NotificationsSheet({super.key});

  static Future<void> show(BuildContext context) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => const NotificationsSheet(),
    );
  }

  @override
  ConsumerState<NotificationsSheet> createState() => _NotificationsSheetState();
}

class _NotificationsSheetState extends ConsumerState<NotificationsSheet> {
  bool _isLoading = true;
  List<Map<String, dynamic>> _notifications = [];
  int _unreadCount = 0;

  @override
  void initState() {
    super.initState();
    _fetchNotifications();
  }

  String _cleanRsvp(String text) {
    return text
        .replaceAll(RegExp(r'\brsvp\b', caseSensitive: false), 'attendance')
        .replaceAll(RegExp(r'\brsvped\b', caseSensitive: false), 'joined')
        .replaceAll(RegExp(r'\brsvps\b', caseSensitive: false), 'attendees');
  }

  Future<void> _fetchNotifications() async {
    setState(() => _isLoading = true);
    final dio = ref.read(dioClientProvider);

    try {
      final response = await dio.get(ApiEndpoints.notifications);
      final data = response.data;

      List<Map<String, dynamic>> remoteList = [];
      if (data is Map && data['notifications'] is List) {
        remoteList = (data['notifications'] as List)
            .map((e) => Map<String, dynamic>.from(e as Map))
            .toList();
      }

      // Check upcoming events from planner for tomorrow (1 day ahead reminder)
      final plannerState = ref.read(plannerProvider);
      final now = DateTime.now();
      final tomorrow = now.add(const Duration(days: 1));
      final tomorrowWeekday = _getWeekdayName(tomorrow.weekday);

      final List<Map<String, dynamic>> generatedReminders = [];

      for (final schedule in plannerState.schedules) {
        final isEvent = schedule.subject.toLowerCase().startsWith('[event]') ||
            schedule.notes.toLowerCase().contains('campus study event');

        // Check if event is scheduled for tomorrow
        bool isTomorrow = false;
        if (isEvent && schedule.days.contains(tomorrowWeekday)) {
          isTomorrow = true;
        }
        if (schedule.deadline != null) {
          try {
            final d = DateTime.parse(schedule.deadline!);
            if (d.year == tomorrow.year && d.month == tomorrow.month && d.day == tomorrow.day) {
              isTomorrow = true;
            }
          } catch (_) {}
        }

        if (isTomorrow) {
          final cleanTitle = schedule.subject.replaceFirst(RegExp(r'^\[Event\]\s*'), '');
          generatedReminders.add({
            'id': 'upcoming_${schedule.id}',
            'category': 'event',
            'title': '🗓️ Upcoming Event Tomorrow: $cleanTitle',
            'message': 'Your scheduled session starts tomorrow at ${schedule.startTime}. Make sure your study materials are ready!',
            'link': '/planner',
            'is_read': false,
            'created_at': now.toIso8601String(),
          });
        }
      }

      // Combine reminders at the top, then remote notifications
      final allList = <Map<String, dynamic>>[...generatedReminders, ...remoteList];

      // Sanitize any RSVP text
      for (final n in allList) {
        if (n['title'] is String) {
          n['title'] = _cleanRsvp(n['title'] as String);
        }
        if (n['message'] is String) {
          n['message'] = _cleanRsvp(n['message'] as String);
        }
      }

      final unread = allList.where((n) => n['is_read'] != true).length;
      ref.read(dashboardProvider.notifier).setUnreadNotifications(unread);

      if (mounted) {
        setState(() {
          _notifications = allList;
          _unreadCount = unread;
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  String _getWeekdayName(int weekday) {
    const days = [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ];
    return days[(weekday - 1) % 7];
  }

  Future<void> _markAllAsRead() async {
    final dio = ref.read(dioClientProvider);
    try {
      await dio.post(ApiEndpoints.notifications, data: {'mark_all': true});
    } catch (_) {}

    ref.read(dashboardProvider.notifier).clearUnreadNotifications();

    if (mounted) {
      setState(() {
        for (final n in _notifications) {
          n['is_read'] = true;
        }
        _unreadCount = 0;
      });
    }
  }

  IconData _getIconForCategory(String? category) {
    switch (category?.toLowerCase()) {
      case 'event':
        return Icons.event_available_rounded;
      case 'session':
        return Icons.timer_outlined;
      case 'social':
      case 'comment':
      case 'like':
        return Icons.favorite_rounded;
      case 'follow':
        return Icons.person_add_rounded;
      case 'academic':
        return Icons.school_rounded;
      default:
        return Icons.notifications_active_outlined;
    }
  }

  Color _getColorForCategory(String? category) {
    switch (category?.toLowerCase()) {
      case 'event':
        return AppColors.accent;
      case 'session':
        return AppColors.primary;
      case 'social':
      case 'comment':
      case 'like':
        return Colors.pinkAccent;
      case 'follow':
        return Colors.teal;
      case 'academic':
        return Colors.amber.shade700;
      default:
        return AppColors.primary;
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.85,
      ),
      decoration: BoxDecoration(
        color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Drag handle
          Center(
            child: Container(
              margin: const EdgeInsets.only(top: 10, bottom: 6),
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: isDark ? Colors.white24 : Colors.black12,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),

          // Header
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
            child: Row(
              children: [
                const Icon(Icons.notifications_active_rounded, color: AppColors.primary, size: 22),
                const SizedBox(width: 8),
                const Text(
                  'Notifications',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
                ),
                if (_unreadCount > 0) ...[
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                    decoration: BoxDecoration(
                      color: AppColors.primary,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text(
                      '$_unreadCount new',
                      style: const TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w800,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ],
                const Spacer(),
                if (_unreadCount > 0)
                  TextButton.icon(
                    onPressed: _markAllAsRead,
                    icon: const Icon(Icons.done_all_rounded, size: 16),
                    label: const Text('Mark read', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
                    style: TextButton.styleFrom(
                      foregroundColor: AppColors.primary,
                      padding: const EdgeInsets.symmetric(horizontal: 8),
                    ),
                  ),
              ],
            ),
          ),
          const Divider(height: 1),

          // Body
          Expanded(
            child: _isLoading
                ? const Center(child: StudentBrainLoader(message: 'Checking notifications...'))
                : _notifications.isEmpty
                    ? Center(
                        child: Padding(
                          padding: const EdgeInsets.all(32),
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                Icons.notifications_none_rounded,
                                size: 48,
                                color: isDark ? Colors.white24 : Colors.black26,
                              ),
                              const SizedBox(height: 12),
                              const Text(
                                'You\'re All Caught Up!',
                                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                'No new alerts, event updates, or social interactions.',
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                  fontSize: 12,
                                  color: isDark ? AppColors.textDarkMuted : AppColors.textLightMuted,
                                ),
                              ),
                            ],
                          ),
                        ),
                      )
                    : ListView.separated(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        itemCount: _notifications.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 8),
                        itemBuilder: (context, index) {
                          final item = _notifications[index];
                          final isRead = item['is_read'] == true;
                          final category = item['category']?.toString();
                          final icon = _getIconForCategory(category);
                          final color = _getColorForCategory(category);
                          final title = item['title']?.toString() ?? 'Notification';
                          final message = item['message']?.toString() ?? '';
                          final link = item['link']?.toString();

                          return InkWell(
                            onTap: () {
                              setState(() {
                                item['is_read'] = true;
                                _unreadCount = _notifications.where((n) => n['is_read'] != true).length;
                              });
                              ref.read(dashboardProvider.notifier).setUnreadNotifications(_unreadCount);
                              if (link != null && link.isNotEmpty) {
                                Navigator.pop(context);
                                if (link.startsWith('/planner')) {
                                  context.push('/planner');
                                } else if (link.startsWith('/community')) {
                                  context.push('/community');
                                } else if (link.startsWith('/study-center')) {
                                  context.push('/tracker');
                                }
                              }
                            },
                            borderRadius: BorderRadius.circular(14),
                            child: Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: isRead
                                    ? (isDark ? AppColors.surfaceDarkSubtle : AppColors.surfaceLightSubtle)
                                    : (isDark
                                        ? AppColors.primary.withValues(alpha: 0.12)
                                        : AppColors.primary.withValues(alpha: 0.06)),
                                borderRadius: BorderRadius.circular(14),
                                border: Border.all(
                                  color: isRead
                                      ? (isDark ? AppColors.borderDark : AppColors.borderLight)
                                      : AppColors.primary.withValues(alpha: 0.3),
                                  width: isRead ? 0.8 : 1.2,
                                ),
                              ),
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Container(
                                    padding: const EdgeInsets.all(8),
                                    decoration: BoxDecoration(
                                      color: color.withValues(alpha: 0.15),
                                      shape: BoxShape.circle,
                                    ),
                                    child: Icon(icon, size: 18, color: color),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          title,
                                          style: TextStyle(
                                            fontSize: 13,
                                            fontWeight: isRead ? FontWeight.w700 : FontWeight.w900,
                                          ),
                                        ),
                                        if (message.isNotEmpty) ...[
                                          const SizedBox(height: 3),
                                          Text(
                                            message,
                                            style: TextStyle(
                                              fontSize: 11,
                                              height: 1.4,
                                              color: isDark ? AppColors.textDarkMuted : AppColors.textLightMuted,
                                            ),
                                          ),
                                        ],
                                      ],
                                    ),
                                  ),
                                  if (!isRead)
                                    Container(
                                      margin: const EdgeInsets.only(top: 4, left: 6),
                                      width: 8,
                                      height: 8,
                                      decoration: const BoxDecoration(
                                        color: AppColors.primary,
                                        shape: BoxShape.circle,
                                      ),
                                    ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
          ),
        ],
      ),
    );
  }
}
