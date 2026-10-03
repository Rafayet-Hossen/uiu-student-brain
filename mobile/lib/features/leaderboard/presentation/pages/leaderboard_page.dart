import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/widgets/empty_state.dart';
import '../../../../core/widgets/error_card.dart';
import '../../../../core/widgets/glass_card.dart';
import '../../../../core/widgets/responsive.dart';
import '../../../../core/widgets/student_brain_loader.dart';
import '../../../../core/widgets/user_avatar.dart';
import '../providers/leaderboard_provider.dart';

class LeaderboardPage extends ConsumerWidget {
  const LeaderboardPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(leaderboardProvider);
    final notifier = ref.read(leaderboardProvider.notifier);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final topThree = state.topThree;
    final rest = state.remainingRankings;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Scholar Leaderboard'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: () => notifier.loadLeaderboard(state.timeframe),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => notifier.loadLeaderboard(state.timeframe),
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
                  // 1. Timeframe Switcher Tabs
                  Container(
                    padding: const EdgeInsets.all(4),
                    decoration: BoxDecoration(
                      color: isDark ? AppColors.surfaceDarkSubtle : AppColors.surfaceLightSubtle,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      children: [
                        _buildTimeframeBtn(context, notifier, 'Weekly Focus', 'weekly', state.timeframe),
                        _buildTimeframeBtn(context, notifier, 'Streak Masters', 'streak', state.timeframe),
                        _buildTimeframeBtn(context, notifier, 'All Time', 'all_time', state.timeframe),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // 2. Opt-in Privacy Banner
                  GlassCard(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    child: Row(
                      children: [
                        Icon(
                          state.isOptedIn ? Icons.visibility_rounded : Icons.visibility_off_rounded,
                          color: state.isOptedIn ? AppColors.primary : Colors.grey,
                          size: 20,
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                state.isOptedIn ? 'Public Ranking Active' : 'Leaderboard Hidden',
                                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w800),
                              ),
                              Text(
                                state.isOptedIn ? 'Your study stats appear on campus leaderboards' : 'Your stats are completely private',
                                style: TextStyle(
                                  fontSize: 11,
                                  color: isDark ? AppColors.textDarkMuted : AppColors.textLightMuted,
                                ),
                              ),
                            ],
                          ),
                        ),
                        Switch(
                          value: state.isOptedIn,
                          activeTrackColor: AppColors.primary,
                          onChanged: (val) => notifier.toggleOptIn(val),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),

                  if (state.isLoading)
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 48),
                      child: StudentBrainLoader(
                        message: 'Syncing scholar rankings & trophies...',
                      ),
                    )
                  else if (state.error != null)
                    ErrorCard(
                      message: state.error!,
                      onRetry: () => notifier.loadLeaderboard(state.timeframe),
                    )
                  else if (state.rankings.isEmpty)
                    const EmptyState(
                      icon: Icons.emoji_events_outlined,
                      title: 'No Rankings for this Timeframe',
                      subtitle: 'Log a study session to take the lead on the leaderboard!',
                    )
                  else ...[
                    // 3. Top 3 Podium
                    if (topThree.length >= 3) ...[
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          // 2nd Place (Silver)
                          Expanded(child: _buildPodiumColumn(context, topThree[1], 2, Icons.military_tech_rounded, 130, AppColors.silver)),
                          const SizedBox(width: 8),
                          // 1st Place (Gold, Taller)
                          Expanded(child: _buildPodiumColumn(context, topThree[0], 1, Icons.emoji_events_rounded, 160, AppColors.gold)),
                          const SizedBox(width: 8),
                          // 3rd Place (Bronze)
                          Expanded(child: _buildPodiumColumn(context, topThree[2], 3, Icons.military_tech_rounded, 115, AppColors.bronze)),
                        ],
                      ),
                      const SizedBox(height: 24),
                    ],

                    // 4. Rankings Table List
                    const Text(
                      'All Scholar Rankings',
                      style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800),
                    ),
                    const SizedBox(height: 10),

                    ListView.separated(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: rest.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 8),
                      itemBuilder: (context, index) {
                        final entry = rest[index];
                        final isSelf = entry.isCurrentUser;

                        return GlassCard(
                          color: isSelf ? AppColors.primary.withValues(alpha: 0.12) : null,
                          borderColor: isSelf ? AppColors.primary : null,
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                          child: Row(
                            children: [
                              Text(
                                '#${entry.rank}',
                                style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w900),
                              ),
                              const SizedBox(width: 12),
                              UserAvatar(name: entry.displayName, size: 34),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        Text(
                                          entry.displayName,
                                          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w800),
                                        ),
                                        if (isSelf) ...[
                                          const SizedBox(width: 6),
                                          Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                                            decoration: BoxDecoration(
                                              color: AppColors.primary,
                                              borderRadius: BorderRadius.circular(9999),
                                            ),
                                            child: const Text(
                                              'You',
                                              style: TextStyle(fontSize: 9, fontWeight: FontWeight.w800, color: Colors.white),
                                            ),
                                          ),
                                        ],
                                      ],
                                    ),
                                    Text(
                                      entry.customQuote != null && entry.customQuote!.isNotEmpty
                                          ? '"${entry.customQuote}"'
                                          : '🔥 ${entry.currentStreak}d streak',
                                      style: TextStyle(
                                        fontSize: 11,
                                        fontStyle: FontStyle.italic,
                                        color: isDark ? AppColors.textDarkMuted : AppColors.textLightMuted,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.end,
                                children: [
                                  Text(
                                    state.timeframe == 'streak'
                                        ? '🔥 ${entry.currentStreak}d'
                                        : '⏱ ${entry.studyHours}h',
                                    style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w800),
                                  ),
                                  Text(
                                    '🏆 ${entry.trophiesCount} badges',
                                    style: TextStyle(
                                      fontSize: 10,
                                      color: isDark ? AppColors.textDarkSubtle : AppColors.textLightSubtle,
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        );
                      },
                    ),
                    const SizedBox(height: 24),
                  ],
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildTimeframeBtn(
    BuildContext context,
    LeaderboardNotifier notifier,
    String label,
    String key,
    String activeKey,
  ) {
    final isSelected = activeKey == key;
    return Expanded(
      child: GestureDetector(
        onTap: () => notifier.loadLeaderboard(key),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(
            color: isSelected ? AppColors.primary : Colors.transparent,
            borderRadius: BorderRadius.circular(10),
          ),
          child: Text(
            label,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              color: isSelected ? Colors.white : null,
            ),
            textAlign: TextAlign.center,
          ),
        ),
      ),
    );
  }

  Widget _buildPodiumColumn(
    BuildContext context,
    entry,
    int rank,
    IconData medalIcon,
    double height,
    Color color,
  ) {
    return Column(
      children: [
        UserAvatar(name: entry.displayName, size: rank == 1 ? 48 : 40),
        const SizedBox(height: 4),
        Text(
          entry.displayName.split(' ').first,
          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w800),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
        Text(
          '${entry.studyHours}h',
          style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: color),
        ),
        const SizedBox(height: 6),
        Container(
          height: height,
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.15),
            borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
            border: Border.all(color: color.withValues(alpha: 0.4), width: 1.5),
          ),
          child: Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(medalIcon, color: color, size: 26),
                const SizedBox(height: 4),
                Text(
                  '#$rank',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: color),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
