import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/widgets/glass_card.dart';
import '../../../../core/widgets/responsive.dart';
import '../../../../core/widgets/user_avatar.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../../grades/presentation/providers/grades_provider.dart';
import '../../../tracker/presentation/providers/tracker_provider.dart';

class ProfilePage extends ConsumerWidget {
  const ProfilePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider).user;
    final tracker = ref.watch(trackerProvider);
    final grades = ref.watch(gradesProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final streak = tracker.streaks['current_streak'] ?? 0;
    final totalHours = ((tracker.streaks['total_minutes'] ?? 0) / 60.0).toStringAsFixed(1);
    final gpa = grades.plan?.currentGpa.toStringAsFixed(2) ?? '3.80';

    final badges = [
      {'name': 'First Step', 'icon': Icons.eco_rounded, 'unlocked': true, 'color': AppColors.success},
      {'name': 'Ignition Flame', 'icon': Icons.local_fire_department_rounded, 'unlocked': streak >= 3, 'color': AppColors.flame},
      {'name': 'Unstoppable', 'icon': Icons.bolt_rounded, 'unlocked': streak >= 7, 'color': AppColors.accent},
      {'name': 'Academic Master', 'icon': Icons.workspace_premium_rounded, 'unlocked': streak >= 14, 'color': AppColors.gold},
      {'name': 'Deep Scholar', 'icon': Icons.menu_book_rounded, 'unlocked': true, 'color': AppColors.primary},
      {'name': 'Centurion', 'icon': Icons.emoji_events_rounded, 'unlocked': false, 'color': AppColors.secondary},
    ];

    return Scaffold(
      appBar: AppBar(
        title: const Text('Scholar Profile'),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings_outlined),
            onPressed: () => context.push('/settings'),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: Responsive.padding(context),
        child: Center(
          child: ConstrainedBox(
            constraints: BoxConstraints(maxWidth: Responsive.maxContentWidth(context)),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // 1. Profile Header Card
                GlassCard(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
                  child: Column(
                    children: [
                      UserAvatar(
                        name: user?.fullName ?? 'Scholar',
                        size: 76,
                      ),
                      const SizedBox(height: 14),
                      Text(
                        user?.fullName ?? 'Dedicated Scholar',
                        style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        user?.email ?? 'student@university.edu',
                        style: TextStyle(
                          fontSize: 13,
                          color: isDark ? AppColors.textDarkMuted : AppColors.textLightMuted,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(9999),
                        ),
                        child: Text(
                          user?.department ?? 'United International University',
                          style: const TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            color: AppColors.primary,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                // 2. Academic Stats Row
                Row(
                  children: [
                    Expanded(
                      child: GlassCard(
                        padding: const EdgeInsets.all(14),
                        child: Column(
                          children: [
                            Text(
                              gpa,
                              style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: AppColors.primary),
                            ),
                            const SizedBox(height: 2),
                            const Text('Current CGPA', style: TextStyle(fontSize: 11, color: Colors.grey)),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: GlassCard(
                        padding: const EdgeInsets.all(14),
                        child: Column(
                          children: [
                            Text(
                              '${totalHours}h',
                              style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: AppColors.accent),
                            ),
                            const SizedBox(height: 2),
                            const Text('Focus Studied', style: TextStyle(fontSize: 11, color: Colors.grey)),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: GlassCard(
                        padding: const EdgeInsets.all(14),
                        child: Column(
                          children: [
                            Text(
                              '${streak}d',
                              style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: AppColors.flame),
                            ),
                            const SizedBox(height: 2),
                            const Text('Active Streak', style: TextStyle(fontSize: 11, color: Colors.grey)),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 18),

                // 3. Milestone Badges Cabinet
                GlassCard(
                  padding: const EdgeInsets.all(18),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Milestone Badges & Trophy Cabinet',
                        style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800),
                      ),
                      const SizedBox(height: 14),
                      GridView.builder(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 3,
                          childAspectRatio: 0.9,
                          crossAxisSpacing: 10,
                          mainAxisSpacing: 10,
                        ),
                        itemCount: badges.length,
                        itemBuilder: (context, index) {
                          final b = badges[index];
                          final isUnlocked = b['unlocked'] as bool;

                          return Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: isUnlocked
                                  ? AppColors.primary.withValues(alpha: 0.12)
                                  : (isDark ? Colors.white.withValues(alpha: 0.04) : Colors.black.withValues(alpha: 0.04)),
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(
                                color: isUnlocked
                                    ? AppColors.primary.withValues(alpha: 0.4)
                                    : (isDark ? AppColors.borderDark : AppColors.borderLight),
                              ),
                            ),
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(
                                  b['icon'] as IconData,
                                  size: 28,
                                  color: isUnlocked ? (b['color'] as Color) : Colors.grey,
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  b['name'] as String,
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w700,
                                    color: isUnlocked ? null : Colors.grey,
                                  ),
                                  textAlign: TextAlign.center,
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ],
                            ),
                          );
                        },
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 18),

                // 4. Quick Nav Settings & Logout
                GlassCard(
                  padding: const EdgeInsets.all(8),
                  child: Column(
                    children: [
                      ListTile(
                        leading: const Icon(Icons.settings_outlined, color: AppColors.primary),
                        title: const Text('App Settings & Backend Host', style: TextStyle(fontWeight: FontWeight.w700)),
                        trailing: const Icon(Icons.arrow_forward_ios_rounded, size: 14),
                        onTap: () => context.push('/settings'),
                      ),
                      const Divider(),
                      ListTile(
                        leading: const Icon(Icons.logout_rounded, color: AppColors.error),
                        title: const Text('Log Out', style: TextStyle(fontWeight: FontWeight.w700, color: AppColors.error)),
                        onTap: () async {
                          final confirm = await showDialog<bool>(
                            context: context,
                            builder: (ctx) => AlertDialog(
                              title: const Text('Confirm Logout'),
                              content: const Text('Are you sure you want to log out of StudentBrain?'),
                              actions: [
                                TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
                                TextButton(
                                  onPressed: () => Navigator.pop(ctx, true),
                                  child: const Text('Logout', style: TextStyle(color: AppColors.error)),
                                ),
                              ],
                            ),
                          );
                          if (confirm == true) {
                            await ref.read(authProvider.notifier).logout();
                            if (context.mounted) {
                              context.go('/login');
                            }
                          }
                        },
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
    );
  }
}
