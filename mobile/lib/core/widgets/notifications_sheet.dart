import 'package:flutter/material.dart';
import '../constants/app_colors.dart';
import '../services/notification_service.dart';
import 'glass_card.dart';

class NotificationsSheet extends StatefulWidget {
  const NotificationsSheet({super.key});

  static Future<void> show(BuildContext context) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => const NotificationsSheet(),
    );
  }

  @override
  State<NotificationsSheet> createState() => _NotificationsSheetState();
}

class _NotificationsSheetState extends State<NotificationsSheet> {
  final List<Map<String, dynamic>> _notifications = [
    {
      'id': '1',
      'title': 'AI Study Room: Data Structures Lab',
      'message': 'Tomorrow at 10:00 AM. You RSVP\'d "Going". Don\'t forget your laptop and lecture notes!',
      'type': 'event_reminder',
      'time': '10 mins ago',
      'isRead': false,
      'icon': Icons.event_available_rounded,
      'color': AppColors.primary,
    },
    {
      'id': '2',
      'title': 'New Attendee in Competitive Programming',
      'message': 'Tanvir Ahmed joined the UIU ICPC Bootcamp event you organized.',
      'type': 'event_attend',
      'time': '1 hour ago',
      'isRead': false,
      'icon': Icons.people_alt_rounded,
      'color': AppColors.accent,
    },
    {
      'id': '3',
      'title': 'New Follower & Study Partner',
      'message': 'Sadia Rahman started following your study activity & public notes.',
      'type': 'follow',
      'time': '3 hours ago',
      'isRead': true,
      'icon': Icons.person_add_alt_1_rounded,
      'color': AppColors.flame,
    },
    {
      'id': '4',
      'title': 'Post Reaction',
      'message': '5 scholars liked your summary notes on "Database Normalization & B+ Trees".',
      'type': 'post_like',
      'time': '5 hours ago',
      'isRead': true,
      'icon': Icons.favorite_rounded,
      'color': Colors.pinkAccent,
    },
    {
      'id': '5',
      'title': 'Welcome to StudentBrain UIU!',
      'message': 'Your smart academic portal is configured. Track GPA, automate routines, and collaborate seamlessly.',
      'type': 'welcome',
      'time': 'Yesterday',
      'isRead': true,
      'icon': Icons.school_rounded,
      'color': AppColors.gold,
    },
  ];

  void _markAllAsRead() {
    setState(() {
      for (var n in _notifications) {
        n['isRead'] = true;
      }
    });
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('All notifications marked as read.'),
        duration: Duration(seconds: 2),
      ),
    );
  }

  Future<void> _sendTestNotification() async {
    await NotificationService().showNotification(
      id: 999,
      title: 'StudentBrain Alert',
      body: 'Upcoming Event: CSE 323 Design Review tomorrow at 02:00 PM.',
    );
    setState(() {
      _notifications.insert(0, {
        'id': DateTime.now().millisecondsSinceEpoch.toString(),
        'title': 'CSE 323 Design Review Alert',
        'message': 'Event reminder triggered for tomorrow at 02:00 PM.',
        'type': 'event_reminder',
        'time': 'Just now',
        'isRead': false,
        'icon': Icons.alarm_rounded,
        'color': AppColors.primary,
      });
    });
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Test notification dispatched! Check your status bar.'),
          duration: Duration(seconds: 2),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final unreadCount = _notifications.where((n) => n['isRead'] == false).length;

    return DraggableScrollableSheet(
      initialChildSize: 0.75,
      minChildSize: 0.45,
      maxChildSize: 0.95,
      builder: (context, scrollController) {
        return Container(
          decoration: BoxDecoration(
            color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
            border: Border.all(
              color: isDark ? AppColors.borderDark : AppColors.borderLight,
              width: 1.2,
            ),
          ),
          child: Column(
            children: [
              // Drag Handle
              const SizedBox(height: 12),
              Container(
                width: 44,
                height: 4.5,
                decoration: BoxDecoration(
                  color: Colors.grey.withValues(alpha: 0.4),
                  borderRadius: BorderRadius.circular(999),
                ),
              ),
              const SizedBox(height: 12),

              // Header
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        const Text(
                          'Notifications',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w900,
                            letterSpacing: -0.3,
                          ),
                        ),
                        if (unreadCount > 0) ...[
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: AppColors.primary,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(
                              '$unreadCount new',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 10,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                    Row(
                      children: [
                        IconButton(
                          icon: const Icon(Icons.send_rounded, size: 18, color: AppColors.primary),
                          tooltip: 'Test Notification',
                          onPressed: _sendTestNotification,
                        ),
                        TextButton(
                          onPressed: _markAllAsRead,
                          child: const Text(
                            'Mark all read',
                            style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const Divider(height: 1),

              // List of Notifications
              Expanded(
                child: _notifications.isEmpty
                    ? Center(
                        child: Text(
                          'No notifications yet',
                          style: TextStyle(
                            color: isDark ? AppColors.textDarkMuted : AppColors.textLightMuted,
                          ),
                        ),
                      )
                    : ListView.separated(
                        controller: scrollController,
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        itemCount: _notifications.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 10),
                        itemBuilder: (context, index) {
                          final item = _notifications[index];
                          final isRead = item['isRead'] as bool;

                          return GlassCard(
                            padding: const EdgeInsets.all(12),
                            color: isRead
                                ? null
                                : AppColors.primary.withValues(alpha: isDark ? 0.08 : 0.04),
                            borderColor: isRead
                                ? null
                                : AppColors.primary.withValues(alpha: 0.35),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(8),
                                  decoration: BoxDecoration(
                                    color: (item['color'] as Color).withValues(alpha: 0.15),
                                    shape: BoxShape.circle,
                                  ),
                                  child: Icon(
                                    item['icon'] as IconData,
                                    color: item['color'] as Color,
                                    size: 20,
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        children: [
                                          Expanded(
                                            child: Text(
                                              item['title'] as String,
                                              style: TextStyle(
                                                fontSize: 13,
                                                fontWeight: isRead ? FontWeight.w700 : FontWeight.w900,
                                                color: isDark ? AppColors.textDark : AppColors.textLight,
                                              ),
                                              overflow: TextOverflow.ellipsis,
                                            ),
                                          ),
                                          Text(
                                            item['time'] as String,
                                            style: TextStyle(
                                              fontSize: 10,
                                              color: isDark ? AppColors.textDarkSubtle : AppColors.textLightSubtle,
                                            ),
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        item['message'] as String,
                                        style: TextStyle(
                                          fontSize: 11,
                                          height: 1.35,
                                          color: isDark ? AppColors.textDarkMuted : AppColors.textLightMuted,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          );
                        },
                      ),
              ),
            ],
          ),
        );
      },
    );
  }
}
