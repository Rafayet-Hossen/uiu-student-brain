import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/config/providers.dart';
import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/widgets/app_button.dart';
import '../../../../core/widgets/app_text_field.dart';
import '../../../../core/widgets/glass_card.dart';
import '../../../../core/widgets/responsive.dart';
import '../../../../core/widgets/user_avatar.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../../grades/presentation/providers/grades_provider.dart';
import '../../../leaderboard/presentation/providers/leaderboard_provider.dart';

class SettingsPage extends ConsumerStatefulWidget {
  const SettingsPage({super.key});

  @override
  ConsumerState<SettingsPage> createState() => _SettingsPageState();
}

class _SettingsPageState extends ConsumerState<SettingsPage> {
  Widget _buildGoalChip({
    required String label,
    required bool isSelected,
    required VoidCallback onTap,
    required bool isDark,
  }) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          curve: Curves.easeInOut,
          height: 38,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: isSelected
                ? AppColors.primary
                : (isDark
                    ? AppColors.surfaceDarkSubtle
                    : AppColors.surfaceLightSubtle),
            borderRadius: BorderRadius.circular(10),
            border: Border.all(
              color: isSelected
                  ? AppColors.primary
                  : (isDark ? AppColors.borderDark : AppColors.borderLight),
              width: isSelected ? 1.5 : 1.0,
            ),
            boxShadow: isSelected
                ? [
                    BoxShadow(
                      color: AppColors.primary.withValues(alpha: 0.28),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ]
                : null,
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            mainAxisSize: MainAxisSize.min,
            children: [
              if (isSelected) ...[
                const Icon(Icons.check_rounded, size: 12, color: Colors.white),
                const SizedBox(width: 4),
              ],
              Flexible(
                child: Text(
                  label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: 11.5,
                    fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                    color: isSelected
                        ? Colors.white
                        : (isDark ? AppColors.textDark : AppColors.textLight),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
  final _targetGpaCtrl = TextEditingController();
  final _customGoalCtrl = TextEditingController();

  int _selectedDailyGoalMinutes = 60;
  bool _isCustomGoal = false;

  // Notification Preferences matching website
  bool _notifAnnouncements = true;
  bool _notifComments = true;
  bool _notifAcademic = true;
  bool _notifSound = true;

  bool _isSavingProfile = false;

  @override
  void initState() {
    super.initState();
    final gradePlan = ref.read(gradesProvider).plan;
    _targetGpaCtrl.text = (gradePlan?.targetGpa ?? 3.90).toStringAsFixed(2);
  }

  @override
  void dispose() {
    _targetGpaCtrl.dispose();
    _customGoalCtrl.dispose();
    super.dispose();
  }

  Future<void> _saveStudyTargets() async {
    setState(() => _isSavingProfile = true);

    final targetGpa = double.tryParse(_targetGpaCtrl.text.trim()) ?? 3.90;
    final targetMinutes = _isCustomGoal
        ? (int.tryParse(_customGoalCtrl.text.trim()) ?? 60)
        : _selectedDailyGoalMinutes;

    try {
      // 1. Update grade target
      final gradesNotifier = ref.read(gradesProvider.notifier);
      final currentPlan = ref.read(gradesProvider).plan;
      await gradesNotifier.updatePlan(
        totalCredits: currentPlan?.totalCredits ?? 140.0,
        completedCredits: currentPlan?.completedCredits ?? 45.0,
        currentGpa: currentPlan?.currentGpa ?? 3.80,
        targetGpa: targetGpa,
      );

      // 2. Update daily study goal
      await ref.read(dioClientProvider).post(
        ApiEndpoints.studyGoal,
        data: {'daily_target_minutes': targetMinutes},
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Academic targets and daily study goal saved!'),
            backgroundColor: AppColors.success,
          ),
        );
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Target preferences updated locally'),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isSavingProfile = false);
    }
  }

  void _confirmSignOut() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Confirm Logout'),
        content: const Text('Are you sure you want to log out of StudentBrain?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Logout', style: TextStyle(color: AppColors.error)),
          ),
        ],
      ),
    );
    if (confirm == true && mounted) {
      final router = GoRouter.of(context);
      await ref.read(authProvider.notifier).logout();
      if (mounted) {
        router.go('/login');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider).user;
    final lbState = ref.watch(leaderboardProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Preferences & Settings'),
      ),
      body: SingleChildScrollView(
        padding: Responsive.padding(context),
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 540),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // 1. Scholar Profile Overview Card
                GlassCard(
                  padding: const EdgeInsets.all(18),
                  child: Row(
                    children: [
                      UserAvatar(
                        name: user?.fullName ?? 'Scholar',
                        size: 56,
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              user?.fullName ?? 'Scholar',
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w800,
                                letterSpacing: -0.2,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              user?.department ?? 'UIU Academic Portal',
                              style: TextStyle(
                                fontSize: 12,
                                color: isDark
                                    ? AppColors.textDarkMuted
                                    : AppColors.textLightMuted,
                              ),
                            ),
                            const SizedBox(height: 6),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 8,
                                vertical: 2,
                              ),
                              decoration: BoxDecoration(
                                color: AppColors.success.withValues(alpha: 0.15),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const Icon(
                                    Icons.verified_rounded,
                                    size: 11,
                                    color: AppColors.success,
                                  ),
                                  const SizedBox(width: 4),
                                  Text(
                                    user?.email ?? 'Verified Student',
                                    style: const TextStyle(
                                      fontSize: 10,
                                      fontWeight: FontWeight.w700,
                                      color: AppColors.success,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                // 2. Academic Target & Daily Focus Goal
                GlassCard(
                  padding: const EdgeInsets.all(18),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Row(
                        children: [
                          Icon(Icons.track_changes_rounded,
                              size: 18, color: AppColors.primary),
                          SizedBox(width: 8),
                          Text(
                            'Academic Targets & Daily Goal',
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 14),
                      AppTextField(
                        label: 'Target CGPA',
                        hint: 'e.g. 3.90',
                        controller: _targetGpaCtrl,
                        keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      ),
                      const Text(
                        'Daily Study Goal:',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 10),
                      Row(
                        children: [
                          _buildGoalChip(
                            label: '30m / day',
                            isSelected: !_isCustomGoal && _selectedDailyGoalMinutes == 30,
                            onTap: () => setState(() {
                              _isCustomGoal = false;
                              _selectedDailyGoalMinutes = 30;
                            }),
                            isDark: isDark,
                          ),
                          const SizedBox(width: 8),
                          _buildGoalChip(
                            label: '45m / day',
                            isSelected: !_isCustomGoal && _selectedDailyGoalMinutes == 45,
                            onTap: () => setState(() {
                              _isCustomGoal = false;
                              _selectedDailyGoalMinutes = 45;
                            }),
                            isDark: isDark,
                          ),
                          const SizedBox(width: 8),
                          _buildGoalChip(
                            label: '60m / day',
                            isSelected: !_isCustomGoal && _selectedDailyGoalMinutes == 60,
                            onTap: () => setState(() {
                              _isCustomGoal = false;
                              _selectedDailyGoalMinutes = 60;
                            }),
                            isDark: isDark,
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          _buildGoalChip(
                            label: '90m / day',
                            isSelected: !_isCustomGoal && _selectedDailyGoalMinutes == 90,
                            onTap: () => setState(() {
                              _isCustomGoal = false;
                              _selectedDailyGoalMinutes = 90;
                            }),
                            isDark: isDark,
                          ),
                          const SizedBox(width: 8),
                          _buildGoalChip(
                            label: '120m / day',
                            isSelected: !_isCustomGoal && _selectedDailyGoalMinutes == 120,
                            onTap: () => setState(() {
                              _isCustomGoal = false;
                              _selectedDailyGoalMinutes = 120;
                            }),
                            isDark: isDark,
                          ),
                          const SizedBox(width: 8),
                          _buildGoalChip(
                            label: 'Custom',
                            isSelected: _isCustomGoal,
                            onTap: () => setState(() => _isCustomGoal = true),
                            isDark: isDark,
                          ),
                        ],
                      ),
                      if (_isCustomGoal) ...[
                        const SizedBox(height: 10),
                        AppTextField(
                          label: 'Custom Minutes / Day',
                          hint: 'e.g. 75',
                          controller: _customGoalCtrl,
                          keyboardType: TextInputType.number,
                        ),
                      ],
                      const SizedBox(height: 14),
                      AppButton(
                        label: 'Save Targets',
                        height: 42,
                        isLoading: _isSavingProfile,
                        onPressed: _saveStudyTargets,
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                // 3. Community Leaderboard Opt-in Preference
                GlassCard(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  child: SwitchListTile(
                    contentPadding: EdgeInsets.zero,
                    secondary: Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: AppColors.gold.withValues(alpha: 0.15),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.emoji_events_rounded,
                          color: AppColors.gold, size: 20),
                    ),
                    title: const Text(
                      'Community Leaderboard Opt-In',
                      style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
                    ),
                    subtitle: const Text(
                      'Display your study streak and focus hours on the campus leaderboard',
                      style: TextStyle(fontSize: 11, color: Colors.grey),
                    ),
                    value: lbState.isOptedIn,
                    activeTrackColor: AppColors.primary,
                    onChanged: (val) {
                      ref.read(leaderboardProvider.notifier).toggleOptIn(val);
                    },
                  ),
                ),
                const SizedBox(height: 16),

                // 4. Notification Channels & Dynamic Alerts
                GlassCard(
                  padding: const EdgeInsets.all(18),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Row(
                        children: [
                          Icon(Icons.notifications_active_rounded,
                              size: 18, color: AppColors.primary),
                          SizedBox(width: 8),
                          Text(
                            'Notification Channels & Alerts',
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      const Text(
                        'Customize notifications and alert types for your device.',
                        style: TextStyle(fontSize: 11, color: Colors.grey),
                      ),
                      const SizedBox(height: 12),

                      SwitchListTile(
                        contentPadding: EdgeInsets.zero,
                        title: const Text(
                          'Campus Announcements & Events',
                          style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                        ),
                        subtitle: const Text(
                          'Exam reviews, guest seminars, and university notices',
                          style: TextStyle(fontSize: 11, color: Colors.grey),
                        ),
                        value: _notifAnnouncements,
                        activeTrackColor: AppColors.primary,
                        onChanged: (val) => setState(() => _notifAnnouncements = val),
                      ),
                      const Divider(height: 1),

                      SwitchListTile(
                        contentPadding: EdgeInsets.zero,
                        title: const Text(
                          'Comments & Discussion Replies',
                          style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                        ),
                        subtitle: const Text(
                          'Classmate answers and solution updates',
                          style: TextStyle(fontSize: 11, color: Colors.grey),
                        ),
                        value: _notifComments,
                        activeTrackColor: AppColors.primary,
                        onChanged: (val) => setState(() => _notifComments = val),
                      ),
                      const Divider(height: 1),

                      SwitchListTile(
                        contentPadding: EdgeInsets.zero,
                        title: const Text(
                          'Academic Targets & Habit Streaks',
                          style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                        ),
                        subtitle: const Text(
                          'Daily consistency reminders and milestone celebrations',
                          style: TextStyle(fontSize: 11, color: Colors.grey),
                        ),
                        value: _notifAcademic,
                        activeTrackColor: AppColors.primary,
                        onChanged: (val) => setState(() => _notifAcademic = val),
                      ),
                      const Divider(height: 1),

                      SwitchListTile(
                        contentPadding: EdgeInsets.zero,
                        title: const Text(
                          'Audio & Timer Sound Alerts',
                          style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                        ),
                        subtitle: const Text(
                          'Play completion sound when focus timer finishes',
                          style: TextStyle(fontSize: 11, color: Colors.grey),
                        ),
                        value: _notifSound,
                        activeTrackColor: AppColors.primary,
                        onChanged: (val) => setState(() => _notifSound = val),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                // 6. Account Sign Out Card
                GlassCard(
                  padding: const EdgeInsets.all(16),
                  borderColor: AppColors.error.withValues(alpha: 0.3),
                  color: AppColors.error.withValues(alpha: 0.05),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: AppColors.error.withValues(alpha: 0.15),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(Icons.logout_rounded,
                                color: AppColors.error, size: 20),
                          ),
                          const SizedBox(width: 12),
                          const Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Log Out',
                                  style: TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w800,
                                    color: AppColors.error,
                                  ),
                                ),
                                SizedBox(height: 2),
                                Text(
                                  'Log out of StudentBrain on this device',
                                  style: TextStyle(fontSize: 11, color: Colors.grey),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 14),
                      OutlinedButton.icon(
                        style: OutlinedButton.styleFrom(
                          foregroundColor: AppColors.error,
                          side: const BorderSide(color: AppColors.error, width: 1.5),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          padding: const EdgeInsets.symmetric(vertical: 12),
                        ),
                        icon: const Icon(Icons.logout_rounded, size: 18),
                        label: const Text(
                          'Log Out',
                          style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800),
                        ),
                        onPressed: _confirmSignOut,
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 32),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
