import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/widgets/app_button.dart';
import '../../../../core/widgets/app_text_field.dart';
import '../../../../core/widgets/empty_state.dart';
import '../../../../core/widgets/error_card.dart';
import '../../../../core/widgets/glass_card.dart';
import '../../../../core/widgets/responsive.dart';
import '../../../../core/widgets/student_brain_loader.dart';
import '../../../../core/widgets/user_avatar.dart';
import '../providers/community_provider.dart';

class CommunityPage extends ConsumerWidget {
  const CommunityPage({super.key});

  static const List<String> categories = [
    'All',
    'General',
    'Exam Prep',
    'Study Group',
    'Course Help',
    'Resources',
  ];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(communityProvider);
    final notifier = ref.read(communityProvider.notifier);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Scholar Community'),
          actions: [
            IconButton(
              icon: const Icon(Icons.leaderboard_outlined),
              tooltip: 'Leaderboard',
              onPressed: () => context.push('/community/leaderboard'),
            ),
            IconButton(
              icon: const Icon(Icons.refresh_rounded),
              onPressed: () => notifier.loadCommunityData(),
            ),
          ],
          bottom: const TabBar(
            indicatorColor: AppColors.primary,
            labelColor: AppColors.primary,
            tabs: [
              Tab(text: 'Discussions & Q&A'),
              Tab(text: 'Study Events & Meetups'),
            ],
          ),
        ),
        floatingActionButton: FloatingActionButton.extended(
          onPressed: () => _showCreatePostDialog(context, ref),
          backgroundColor: AppColors.primary,
          icon: const Icon(Icons.add_rounded, color: Colors.white),
          label: const Text(
            'New Discussion',
            style: TextStyle(fontWeight: FontWeight.w700, color: Colors.white),
          ),
        ),
        body: TabBarView(
          children: [
            // Tab 1: Discussions
            RefreshIndicator(
              onRefresh: () => notifier.loadCommunityData(),
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
                        // Categories horizontal chips
                        SingleChildScrollView(
                          scrollDirection: Axis.horizontal,
                          child: Row(
                            children: categories.map((cat) {
                              final isSelected = state.selectedCategory == cat;
                              return Padding(
                                padding: const EdgeInsets.only(right: 8.0),
                                child: FilterChip(
                                  label: Text(cat),
                                  selected: isSelected,
                                  onSelected: (_) => notifier.selectCategory(cat),
                                  selectedColor: AppColors.primary.withValues(alpha: 0.2),
                                  checkmarkColor: AppColors.primary,
                                  labelStyle: TextStyle(
                                    fontSize: 12,
                                    fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                                    color: isSelected
                                        ? AppColors.primary
                                        : (isDark ? AppColors.textDarkMuted : AppColors.textLightMuted),
                                  ),
                                ),
                              );
                            }).toList(),
                          ),
                        ),
                        const SizedBox(height: 16),

                        if (state.isLoading)
                          const Padding(
                            padding: EdgeInsets.symmetric(vertical: 36),
                            child: StudentBrainLoader(
                              message: 'Connecting to UIU Scholar Network...',
                            ),
                          )
                        else if (state.error != null)
                          ErrorCard(
                            message: state.error!,
                            onRetry: () => notifier.loadCommunityData(),
                          )
                        else if (state.filteredPosts.isEmpty)
                          const EmptyState(
                            icon: Icons.forum_outlined,
                            title: 'No Discussions in this Category',
                            subtitle: 'Be the first to start a conversation or ask a question.',
                          )
                        else
                          ListView.separated(
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            itemCount: state.filteredPosts.length,
                            separatorBuilder: (_, __) => const SizedBox(height: 10),
                            itemBuilder: (context, index) {
                              final post = state.filteredPosts[index];
                              return GlassCard(
                                onTap: () => context.push('/community/post/${post.id}'),
                                padding: const EdgeInsets.all(16),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        UserAvatar(name: post.authorName, size: 30),
                                        const SizedBox(width: 8),
                                        Expanded(
                                          child: Text(
                                            post.authorName,
                                            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
                                          ),
                                        ),
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                          decoration: BoxDecoration(
                                            color: AppColors.primary.withValues(alpha: 0.12),
                                            borderRadius: BorderRadius.circular(6),
                                          ),
                                          child: Text(
                                            post.category,
                                            style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: AppColors.primary),
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 10),
                                    Text(
                                      post.title,
                                      style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w800),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      post.content,
                                      style: TextStyle(
                                        fontSize: 13,
                                        height: 1.35,
                                        color: isDark ? AppColors.textDarkMuted : AppColors.textLightMuted,
                                      ),
                                      maxLines: 2,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                    const SizedBox(height: 12),
                                    Row(
                                      children: [
                                        GestureDetector(
                                          onTap: () => notifier.toggleReaction(post.id),
                                          child: Row(
                                            children: [
                                              Icon(
                                                post.hasReacted ? Icons.favorite_rounded : Icons.favorite_border_rounded,
                                                size: 16,
                                                color: post.hasReacted ? Colors.red : Colors.grey,
                                              ),
                                              const SizedBox(width: 4),
                                              Text(
                                                '${post.reactionsCount}',
                                                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                                              ),
                                            ],
                                          ),
                                        ),
                                        const SizedBox(width: 16),
                                        Row(
                                          children: [
                                            const Icon(Icons.mode_comment_outlined, size: 15, color: Colors.grey),
                                            const SizedBox(width: 4),
                                            Text(
                                              '${post.commentsCount} replies',
                                              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                                            ),
                                          ],
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              );
                            },
                          ),
                      ],
                    ),
                  ),
                ),
              ),
            ),

            // Tab 2: Study Events
            RefreshIndicator(
              onRefresh: () => notifier.loadCommunityData(),
              color: AppColors.primary,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: Responsive.padding(context),
                child: Center(
                  child: ConstrainedBox(
                    constraints: BoxConstraints(maxWidth: Responsive.maxContentWidth(context)),
                    child: state.events.isEmpty
                        ? const EmptyState(
                            icon: Icons.event_outlined,
                            title: 'No Upcoming Study Events',
                            subtitle: 'Campus study meetups will appear here.',
                          )
                        : ListView.separated(
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            itemCount: state.events.length,
                            separatorBuilder: (_, __) => const SizedBox(height: 12),
                            itemBuilder: (context, index) {
                              final event = state.events[index];
                              return GlassCard(
                                padding: const EdgeInsets.all(16),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Expanded(
                                          child: Text(
                                            event.title,
                                            style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w800),
                                          ),
                                        ),
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                          decoration: BoxDecoration(
                                            color: AppColors.primary.withValues(alpha: 0.15),
                                            borderRadius: BorderRadius.circular(6),
                                          ),
                                          child: Text(
                                            event.eventType,
                                            style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: AppColors.primary),
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 6),
                                    Text(
                                      event.description,
                                      style: TextStyle(
                                        fontSize: 12,
                                        color: isDark ? AppColors.textDarkMuted : AppColors.textLightMuted,
                                      ),
                                    ),
                                    const SizedBox(height: 12),
                                    Row(
                                      children: [
                                        const Icon(Icons.location_on_outlined, size: 14, color: AppColors.primary),
                                        const SizedBox(width: 4),
                                        Text(
                                          event.location,
                                          style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600),
                                        ),
                                        const Spacer(),
                                        Text(
                                          '${event.attendeesCount} scholars attending',
                                          style: TextStyle(
                                            fontSize: 11,
                                            color: isDark ? AppColors.textDarkMuted : AppColors.textLightMuted,
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 12),
                                    AppButton(
                                      label: event.isAttending ? 'Attending' : 'RSVP for Event',
                                      variant: event.isAttending ? AppButtonVariant.secondary : AppButtonVariant.primary,
                                      height: 38,
                                      onPressed: () => notifier.toggleRsvp(event.id),
                                    ),
                                  ],
                                ),
                              );
                            },
                          ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showCreatePostDialog(BuildContext context, WidgetRef ref) {
    final titleCtrl = TextEditingController();
    final contentCtrl = TextEditingController();
    String category = 'General';

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setModalState) {
          return AlertDialog(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(22)),
            title: const Text('Start Academic Discussion'),
            content: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  AppTextField(
                    label: 'Discussion Title *',
                    hint: 'e.g. Midterm revision questions',
                    controller: titleCtrl,
                  ),
                  const Text('Category', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 6),
                  DropdownButtonFormField<String>(
                    initialValue: category,
                    items: categories
                        .where((c) => c != 'All')
                        .map((c) => DropdownMenuItem(value: c, child: Text(c)))
                        .toList(),
                    onChanged: (val) {
                      if (val != null) setModalState(() => category = val);
                    },
                    decoration: const InputDecoration(contentPadding: EdgeInsets.symmetric(horizontal: 12)),
                  ),
                  const SizedBox(height: 14),
                  AppTextField(
                    label: 'Question / Content *',
                    hint: 'Describe your query or share study tips...',
                    controller: contentCtrl,
                    maxLines: 4,
                  ),
                ],
              ),
            ),
            actions: [
              TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
              AppButton(
                label: 'Post',
                height: 40,
                onPressed: () {
                  if (titleCtrl.text.isNotEmpty && contentCtrl.text.isNotEmpty) {
                    ref.read(communityProvider.notifier).createPost(
                          titleCtrl.text.trim(),
                          contentCtrl.text.trim(),
                          category,
                        );
                    Navigator.pop(ctx);
                  }
                },
              ),
            ],
          );
        },
      ),
    );
  }
}
