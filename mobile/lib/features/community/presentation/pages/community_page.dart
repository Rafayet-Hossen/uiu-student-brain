import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/widgets/app_button.dart';
import '../../../../core/widgets/empty_state.dart';
import '../../../../core/widgets/error_card.dart';
import '../../../../core/widgets/glass_card.dart';
import '../../../../core/widgets/responsive.dart';
import '../../../../core/widgets/student_brain_loader.dart';
import '../../../../core/widgets/user_avatar.dart';
import '../../data/models/community_models.dart';
import '../providers/community_provider.dart';

class CommunityPage extends ConsumerWidget {
  const CommunityPage({super.key});

  static const List<String> categories = [
    'All',
    'General',
    'Code Help',
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
                        // Categories horizontal filter chips
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
                            separatorBuilder: (_, __) => const SizedBox(height: 12),
                            itemBuilder: (context, index) {
                              final post = state.filteredPosts[index];
                              return _CommunityPostCard(post: post);
                            },
                          ),
                        const SizedBox(height: 80),
                      ],
                    ),
                  ),
                ),
              ),
            ),

            // Tab 2: Study Events & Meetups
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
                        if (state.events.isEmpty)
                          const EmptyState(
                            icon: Icons.event_outlined,
                            title: 'No Upcoming Study Events',
                            subtitle: 'Campus study meetups and group sessions will appear here.',
                          )
                        else
                          ListView.separated(
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            itemCount: state.events.length,
                            separatorBuilder: (_, __) => const SizedBox(height: 14),
                            itemBuilder: (context, index) {
                              final event = state.events[index];
                              return _CommunityEventCard(event: event);
                            },
                          ),
                        const SizedBox(height: 80),
                      ],
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
    showDialog(
      context: context,
      builder: (ctx) => const _CreateDiscussionDialog(),
    );
  }
}

/// Rich Post Card with Inline Comments, Share button, and Code viewer
class _CommunityPostCard extends ConsumerStatefulWidget {
  final PostModel post;
  const _CommunityPostCard({required this.post});

  @override
  ConsumerState<_CommunityPostCard> createState() => _CommunityPostCardState();
}

class _CommunityPostCardState extends ConsumerState<_CommunityPostCard> {
  bool _isCommentsExpanded = false;
  bool _isLoadingComments = false;
  bool _isPostingComment = false;
  List<CommentModel> _comments = [];
  final TextEditingController _commentCtrl = TextEditingController();

  @override
  void dispose() {
    _commentCtrl.dispose();
    super.dispose();
  }

  Future<void> _toggleComments() async {
    final nextState = !_isCommentsExpanded;
    setState(() => _isCommentsExpanded = nextState);

    if (nextState && _comments.isEmpty) {
      setState(() => _isLoadingComments = true);
      try {
        final items = await ref.read(communityProvider.notifier).getComments(widget.post.id);
        if (mounted) {
          setState(() {
            _comments = items;
            _isLoadingComments = false;
          });
        }
      } catch (_) {
        if (mounted) setState(() => _isLoadingComments = false);
      }
    }
  }

  Future<void> _submitComment() async {
    final text = _commentCtrl.text.trim();
    if (text.isEmpty) return;

    setState(() => _isPostingComment = true);
    try {
      final comment = await ref.read(communityProvider.notifier).addComment(widget.post.id, text);
      if (comment != null && mounted) {
        _commentCtrl.clear();
        setState(() {
          _comments.add(comment);
          _isPostingComment = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Comment posted!'),
            backgroundColor: AppColors.primary,
            duration: Duration(seconds: 2),
          ),
        );
      } else {
        if (mounted) setState(() => _isPostingComment = false);
      }
    } catch (_) {
      if (mounted) setState(() => _isPostingComment = false);
    }
  }

  void _sharePost() {
    final link = 'https://studentbrain.uiu.ac.bd/community/post/${widget.post.id}';
    Clipboard.setData(ClipboardData(text: link));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.check_circle_rounded, color: Colors.white, size: 18),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                'Discussion link copied to clipboard: $link',
                style: const TextStyle(fontSize: 12),
              ),
            ),
          ],
        ),
        backgroundColor: AppColors.primary,
        behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 3),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final post = widget.post;

    Color categoryColor = AppColors.primary;
    if (post.category == 'Code Help') {
      categoryColor = const Color(0xFF6366F1);
    } else if (post.category == 'Exam Prep') {
      categoryColor = const Color(0xFFF59E0B);
    } else if (post.category == 'Study Group') {
      categoryColor = const Color(0xFF10B981);
    } else if (post.category == 'Course Help') {
      categoryColor = const Color(0xFF0EA5E9);
    } else if (post.category == 'Resources') {
      categoryColor = const Color(0xFF8B5CF6);
    }

    return GlassCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Author Header & Category
          Row(
            children: [
              UserAvatar(name: post.authorName, size: 32),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      post.authorName,
                      style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700),
                    ),
                    if (post.createdAt.isNotEmpty)
                      Text(
                        post.createdAt.contains('T')
                            ? post.createdAt.split('T')[0]
                            : post.createdAt,
                        style: TextStyle(
                          fontSize: 10.5,
                          color: isDark ? AppColors.textDarkMuted : AppColors.textLightMuted,
                        ),
                      ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3.5),
                decoration: BoxDecoration(
                  color: categoryColor.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  post.category,
                  style: TextStyle(
                    fontSize: 10.5,
                    fontWeight: FontWeight.w800,
                    color: categoryColor,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),

          // Post Title
          Text(
            post.title,
            style: const TextStyle(fontSize: 15.5, fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 6),

          // Post Content
          Text(
            post.content,
            style: TextStyle(
              fontSize: 13,
              height: 1.4,
              color: isDark ? AppColors.textDark : AppColors.textLight,
            ),
          ),

          // Code Snippet Box (if available)
          if (post.codeSnippet != null && post.codeSnippet!.isNotEmpty) ...[
            const SizedBox(height: 10),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF1E1E2E) : const Color(0xFF282A36),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: Colors.white10),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: Colors.white12,
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          (post.codeLanguage ?? 'code').toUpperCase(),
                          style: const TextStyle(
                            fontSize: 9.5,
                            fontWeight: FontWeight.w800,
                            color: Color(0xFF50FA7B),
                          ),
                        ),
                      ),
                      InkWell(
                        onTap: () {
                          Clipboard.setData(ClipboardData(text: post.codeSnippet!));
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Code copied to clipboard!'),
                              duration: Duration(seconds: 1),
                            ),
                          );
                        },
                        child: const Row(
                          children: [
                            Icon(Icons.copy_rounded, size: 12, color: Colors.white70),
                            SizedBox(width: 4),
                            Text('Copy', style: TextStyle(fontSize: 10.5, color: Colors.white70)),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    post.codeSnippet!,
                    style: const TextStyle(
                      fontFamily: 'monospace',
                      fontSize: 11.5,
                      color: Color(0xFFF8F8F2),
                      height: 1.35,
                    ),
                  ),
                ],
              ),
            ),
          ],

          // VS Code Live Share link
          if (post.vscodeLiveshareUrl != null && post.vscodeLiveshareUrl!.isNotEmpty) ...[
            const SizedBox(height: 8),
            InkWell(
              onTap: () async {
                final uri = Uri.tryParse(post.vscodeLiveshareUrl!);
                if (uri != null && await canLaunchUrl(uri)) {
                  await launchUrl(uri, mode: LaunchMode.externalApplication);
                } else {
                  Clipboard.setData(ClipboardData(text: post.vscodeLiveshareUrl!));
                  if (!context.mounted) return;
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Live Share link copied to clipboard!')),
                  );
                }
              },
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: const Color(0xFF007ACC).withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: const Color(0xFF007ACC).withValues(alpha: 0.4)),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.laptop_chromebook_rounded, size: 14, color: Color(0xFF007ACC)),
                    const SizedBox(width: 6),
                    Flexible(
                      child: Text(
                        'VS Code Live Share Session',
                        style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Color(0xFF007ACC)),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    const SizedBox(width: 4),
                    const Icon(Icons.open_in_new_rounded, size: 12, color: Color(0xFF007ACC)),
                  ],
                ),
              ),
            ),
          ],

          const SizedBox(height: 12),
          const Divider(height: 1),
          const SizedBox(height: 8),

          // Actions Row: Reactions, Expand Comments, Share, Open Detail
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              // Reaction
              InkWell(
                onTap: () => ref.read(communityProvider.notifier).toggleReaction(post.id),
                borderRadius: BorderRadius.circular(8),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                  child: Row(
                    children: [
                      Icon(
                        post.hasReacted ? Icons.favorite_rounded : Icons.favorite_border_rounded,
                        size: 18,
                        color: post.hasReacted ? Colors.red : (isDark ? AppColors.textDarkMuted : AppColors.textLightMuted),
                      ),
                      const SizedBox(width: 5),
                      Text(
                        '${post.reactionsCount}',
                        style: TextStyle(
                          fontSize: 12.5,
                          fontWeight: FontWeight.w700,
                          color: post.hasReacted ? Colors.red : (isDark ? AppColors.textDarkMuted : AppColors.textLightMuted),
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              // Comments Toggle Button
              InkWell(
                onTap: _toggleComments,
                borderRadius: BorderRadius.circular(8),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                  child: Row(
                    children: [
                      Icon(
                        Icons.mode_comment_outlined,
                        size: 16,
                        color: _isCommentsExpanded ? AppColors.primary : (isDark ? AppColors.textDarkMuted : AppColors.textLightMuted),
                      ),
                      const SizedBox(width: 5),
                      Text(
                        '${post.commentsCount} replies',
                        style: TextStyle(
                          fontSize: 12.5,
                          fontWeight: _isCommentsExpanded ? FontWeight.w800 : FontWeight.w600,
                          color: _isCommentsExpanded ? AppColors.primary : (isDark ? AppColors.textDarkMuted : AppColors.textLightMuted),
                        ),
                      ),
                      const SizedBox(width: 2),
                      Icon(
                        _isCommentsExpanded ? Icons.keyboard_arrow_up_rounded : Icons.keyboard_arrow_down_rounded,
                        size: 18,
                        color: _isCommentsExpanded ? AppColors.primary : (isDark ? AppColors.textDarkMuted : AppColors.textLightMuted),
                      ),
                    ],
                  ),
                ),
              ),

              // Dynamic Share Button
              InkWell(
                onTap: _sharePost,
                borderRadius: BorderRadius.circular(8),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                  child: Row(
                    children: [
                      Icon(
                        Icons.share_outlined,
                        size: 16,
                        color: isDark ? AppColors.textDarkMuted : AppColors.textLightMuted,
                      ),
                      const SizedBox(width: 5),
                      Text(
                        'Share',
                        style: TextStyle(
                          fontSize: 12.5,
                          fontWeight: FontWeight.w600,
                          color: isDark ? AppColors.textDarkMuted : AppColors.textLightMuted,
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              // Detail Page
              IconButton(
                icon: const Icon(Icons.arrow_forward_ios_rounded, size: 13),
                onPressed: () => context.push('/community/post/${post.id}'),
                tooltip: 'Full Thread',
                visualDensity: VisualDensity.compact,
              ),
            ],
          ),

          // INLINE EXPANDED COMMENTS SECTION
          if (_isCommentsExpanded) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: isDark ? AppColors.surfaceDarkSubtle : AppColors.surfaceLightSubtle,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: isDark ? AppColors.borderDark : AppColors.borderLight,
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Text(
                    'Discussion Replies',
                    style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w800),
                  ),
                  const SizedBox(height: 8),

                  if (_isLoadingComments)
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 16),
                      child: Center(
                        child: SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary),
                        ),
                      ),
                    )
                  else if (_comments.isEmpty)
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      child: Text(
                        'No replies yet. Be the first scholar to comment below!',
                        style: TextStyle(
                          fontSize: 12,
                          fontStyle: FontStyle.italic,
                          color: isDark ? AppColors.textDarkMuted : AppColors.textLightMuted,
                        ),
                      ),
                    )
                  else
                    ListView.separated(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: _comments.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 8),
                      itemBuilder: (context, idx) {
                        final c = _comments[idx];
                        return Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  UserAvatar(name: c.authorName, size: 20),
                                  const SizedBox(width: 6),
                                  Text(
                                    c.authorName,
                                    style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.w700),
                                  ),
                                  if (c.createdAt.isNotEmpty) ...[
                                    const Spacer(),
                                    Text(
                                      c.createdAt.contains('T') ? c.createdAt.split('T')[0] : c.createdAt,
                                      style: TextStyle(
                                        fontSize: 10,
                                        color: isDark ? AppColors.textDarkMuted : AppColors.textLightMuted,
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                              const SizedBox(height: 4),
                              Text(
                                c.content,
                                style: TextStyle(
                                  fontSize: 12,
                                  color: isDark ? AppColors.textDark : AppColors.textLight,
                                ),
                              ),
                            ],
                          ),
                        );
                      },
                    ),

                  const SizedBox(height: 10),

                  // Inline Comment Input Bar
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _commentCtrl,
                          decoration: InputDecoration(
                            hintText: 'Write a reply...',
                            hintStyle: const TextStyle(fontSize: 12),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                            isDense: true,
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(20),
                              borderSide: BorderSide(
                                color: isDark ? AppColors.borderDark : AppColors.borderLight,
                              ),
                            ),
                          ),
                          style: const TextStyle(fontSize: 12),
                          onSubmitted: (_) => _submitComment(),
                        ),
                      ),
                      const SizedBox(width: 8),
                      IconButton(
                        onPressed: _isPostingComment ? null : _submitComment,
                        icon: _isPostingComment
                            ? const SizedBox(
                                width: 16,
                                height: 16,
                                child: CircularProgressIndicator(strokeWidth: 2),
                              )
                            : const Icon(Icons.send_rounded, size: 20, color: AppColors.primary),
                        tooltip: 'Send Reply',
                        visualDensity: VisualDensity.compact,
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}

/// Rich Study Event Card matching Website layout with Going & Interested RSVP toggles
class _CommunityEventCard extends ConsumerWidget {
  final StudyEventModel event;
  const _CommunityEventCard({required this.event});

  void _openGoogleCalendar(BuildContext context) async {
    final title = Uri.encodeComponent(event.title);
    final details = Uri.encodeComponent('${event.description}\nSubject: ${event.subject}');
    final location = Uri.encodeComponent(event.location);

    // Format YYYYMMDDTHHMMSSZ
    String datePart = event.eventDate.replaceAll('-', '');
    String startClean = event.startTime.replaceAll(':', '');
    if (startClean.length < 6) startClean = startClean.padRight(6, '0');
    String endClean = event.endTime.replaceAll(':', '');
    if (endClean.length < 6) endClean = endClean.padRight(6, '0');

    final datesParam = '${datePart}T${startClean}Z/${datePart}T${endClean}Z';
    final calUrl = 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=$title&details=$details&location=$location&dates=$datesParam';

    final uri = Uri.parse(calUrl);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } else {
      Clipboard.setData(ClipboardData(text: calUrl));
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Calendar link copied to clipboard!')),
      );
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final isGoing = event.userRsvpStatus == 'going';
    final isInterested = event.userRsvpStatus == 'interested';

    // Parse date for visual badge
    String monthStr = 'EVENT';
    String dayStr = '12';
    try {
      if (event.eventDate.isNotEmpty) {
        final dt = DateTime.parse(event.eventDate);
        const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
        monthStr = months[dt.month - 1];
        dayStr = dt.day.toString();
      }
    } catch (_) {}

    return GlassCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Visual Calendar Date Block
              Container(
                width: 54,
                decoration: BoxDecoration(
                  color: isDark ? AppColors.surfaceDarkSubtle : AppColors.surfaceLightSubtle,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: isDark ? AppColors.borderDark : AppColors.borderLight,
                  ),
                ),
                child: Column(
                  children: [
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(vertical: 3),
                      decoration: const BoxDecoration(
                        color: AppColors.primary,
                        borderRadius: BorderRadius.only(
                          topLeft: Radius.circular(11),
                          topRight: Radius.circular(11),
                        ),
                      ),
                      child: Text(
                        monthStr,
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w900,
                          color: Colors.white,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: 6),
                      child: Text(
                        dayStr,
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 14),

              // Title, Badges, Description
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Wrap(
                      spacing: 6,
                      runSpacing: 4,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2.5),
                          decoration: BoxDecoration(
                            color: AppColors.primary.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            event.subject,
                            style: const TextStyle(
                              fontSize: 10.5,
                              fontWeight: FontWeight.w800,
                              color: AppColors.primary,
                            ),
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2.5),
                          decoration: BoxDecoration(
                            color: isDark ? AppColors.surfaceDarkSubtle : AppColors.surfaceLightSubtle,
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(
                              color: isDark ? AppColors.borderDark : AppColors.borderLight,
                            ),
                          ),
                          child: Text(
                            event.eventType,
                            style: TextStyle(
                              fontSize: 10.5,
                              fontWeight: FontWeight.w700,
                              color: isDark ? AppColors.textDarkMuted : AppColors.textLightMuted,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      event.title,
                      style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w800),
                    ),
                    if (event.description.isNotEmpty) ...[
                      const SizedBox(height: 4),
                      Text(
                        event.description,
                        style: TextStyle(
                          fontSize: 12,
                          height: 1.35,
                          color: isDark ? AppColors.textDarkMuted : AppColors.textLightMuted,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Metadata: Location, Time & Attendees
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: isDark ? AppColors.surfaceDarkSubtle : AppColors.surfaceLightSubtle,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Column(
              children: [
                Row(
                  children: [
                    const Icon(Icons.location_on_outlined, size: 14, color: AppColors.primary),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        event.location,
                        style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.w600),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Row(
                  children: [
                    Icon(Icons.access_time_rounded, size: 14, color: isDark ? AppColors.textDarkMuted : AppColors.textLightMuted),
                    const SizedBox(width: 6),
                    Text(
                      '${event.startTime.length >= 5 ? event.startTime.substring(0, 5) : event.startTime} - ${event.endTime.length >= 5 ? event.endTime.substring(0, 5) : event.endTime}',
                      style: TextStyle(
                        fontSize: 11.5,
                        fontWeight: FontWeight.w600,
                        color: isDark ? AppColors.textDarkMuted : AppColors.textLightMuted,
                      ),
                    ),
                    const Spacer(),
                    Text(
                      '${event.goingCount} Going • ${event.interestedCount} Interested',
                      style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: AppColors.primary,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),

          // Action Buttons: Going, Interested, Google Calendar Sync
          Row(
            children: [
              // Going Button
              Expanded(
                flex: 5,
                child: ElevatedButton.icon(
                  onPressed: () async {
                    await ref.read(communityProvider.notifier).toggleRsvp(event.id, 'going');
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text(
                            isGoing
                                ? 'RSVP removed.'
                                : 'Going! Event automatically synced to your Study Planner Calendar.',
                          ),
                          backgroundColor: AppColors.success,
                          duration: const Duration(seconds: 2),
                        ),
                      );
                    }
                  },
                  icon: Icon(
                    isGoing ? Icons.check_circle_rounded : Icons.check_rounded,
                    size: 15,
                    color: isGoing ? Colors.white : AppColors.success,
                  ),
                  label: Text(
                    isGoing ? 'Going (In Planner)' : 'Going',
                    style: TextStyle(
                      fontSize: 11.5,
                      fontWeight: FontWeight.w800,
                      color: isGoing ? Colors.white : AppColors.success,
                    ),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: isGoing ? AppColors.success : AppColors.success.withValues(alpha: 0.12),
                    foregroundColor: isGoing ? Colors.white : AppColors.success,
                    elevation: 0,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                  ),
                ),
              ),
              const SizedBox(width: 8),

              // Interested Button
              Expanded(
                flex: 4,
                child: ElevatedButton.icon(
                  onPressed: () async {
                    await ref.read(communityProvider.notifier).toggleRsvp(event.id, 'interested');
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text(
                            isInterested ? 'Marked as not interested.' : 'Marked as interested!',
                          ),
                          duration: const Duration(seconds: 2),
                        ),
                      );
                    }
                  },
                  icon: Icon(
                    isInterested ? Icons.star_rounded : Icons.star_border_rounded,
                    size: 15,
                    color: isInterested ? Colors.white : AppColors.warning,
                  ),
                  label: Text(
                    isInterested ? 'Interested' : 'Interested',
                    style: TextStyle(
                      fontSize: 11.5,
                      fontWeight: FontWeight.w800,
                      color: isInterested ? Colors.white : AppColors.warning,
                    ),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: isInterested ? AppColors.warning : AppColors.warning.withValues(alpha: 0.12),
                    foregroundColor: isInterested ? Colors.white : AppColors.warning,
                    elevation: 0,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
                  ),
                ),
              ),
              const SizedBox(width: 8),

              // Google Calendar Icon Launcher
              IconButton(
                onPressed: () => _openGoogleCalendar(context),
                icon: const Icon(Icons.calendar_month_outlined, size: 20),
                tooltip: 'Add to Google Calendar',
                style: IconButton.styleFrom(
                  backgroundColor: AppColors.primary.withValues(alpha: 0.1),
                  foregroundColor: AppColors.primary,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

/// Dynamic Start Academic Discussion Dialog with Category-Specific Fields
class _CreateDiscussionDialog extends ConsumerStatefulWidget {
  const _CreateDiscussionDialog();

  @override
  ConsumerState<_CreateDiscussionDialog> createState() => _CreateDiscussionDialogState();
}

class _CreateDiscussionDialogState extends ConsumerState<_CreateDiscussionDialog> {
  String _category = 'General';

  // Common / General
  final _titleCtrl = TextEditingController();
  final _contentCtrl = TextEditingController();

  // Code Help fields
  final _codeSnippetCtrl = TextEditingController();
  final _vsCodeUrlCtrl = TextEditingController();
  String _codeLanguage = 'python';

  // Course Help fields
  final _courseCodeCtrl = TextEditingController();
  final _courseTopicCtrl = TextEditingController();

  // Exam Prep fields
  String _examType = 'Midterm Exam';
  final _examFocusTopicsCtrl = TextEditingController();

  // Study Group fields
  String _groupMode = 'In-Person';
  final _groupLocationCtrl = TextEditingController(text: 'Campus Library 4th Floor');
  String _groupSize = '2-3 Members';
  final _groupScheduleCtrl = TextEditingController();

  // Resources fields
  String _resourceType = 'Lecture Notes / Handouts';
  final _resourceLinkCtrl = TextEditingController();

  bool _isSubmitting = false;

  static const List<String> _categories = [
    'General',
    'Code Help',
    'Exam Prep',
    'Study Group',
    'Course Help',
    'Resources',
  ];

  static const List<String> _codeLanguages = [
    'python',
    'javascript',
    'typescript',
    'cpp',
    'c',
    'java',
    'csharp',
    'html',
    'sql',
    'php',
    'go',
    'rust',
  ];

  static const List<String> _examTypes = [
    'Midterm Exam',
    'Final Term Exam',
    'Class Quiz / Assessment',
    'Lab Test & Viva',
    'Assignment Review',
  ];

  static const List<String> _resourceTypes = [
    'Lecture Notes / Handouts',
    'Formula Sheet / Cheatsheet',
    'Previous Question Solve',
    'Video Tutorial Playlist',
    'Google Drive / Cloud Folder',
    'GitHub Repository',
  ];

  static const List<String> _groupSizes = [
    '2-3 Members',
    '4-5 Members',
    '6+ Members',
    'Open for All',
  ];

  @override
  void dispose() {
    _titleCtrl.dispose();
    _contentCtrl.dispose();
    _codeSnippetCtrl.dispose();
    _vsCodeUrlCtrl.dispose();
    _courseCodeCtrl.dispose();
    _courseTopicCtrl.dispose();
    _examFocusTopicsCtrl.dispose();
    _groupLocationCtrl.dispose();
    _groupScheduleCtrl.dispose();
    _resourceLinkCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    String finalTitle = _titleCtrl.text.trim();
    String finalContent = _contentCtrl.text.trim();
    String? finalSnippet;
    String? finalLanguage;
    String? finalLiveUrl;

    if (_category == 'Code Help') {
      if (finalTitle.isEmpty) finalTitle = 'Code Help: ${_codeLanguage.toUpperCase()} Query';
      finalSnippet = _codeSnippetCtrl.text.trim();
      finalLanguage = _codeLanguage;
      finalLiveUrl = _vsCodeUrlCtrl.text.trim();
      if (finalContent.isEmpty && finalSnippet.isNotEmpty) {
        finalContent = 'Please review this code snippet and help resolve the issue.';
      }
    } else if (_category == 'Course Help') {
      final code = _courseCodeCtrl.text.trim();
      final topic = _courseTopicCtrl.text.trim();
      if (finalTitle.isEmpty) {
        finalTitle = code.isNotEmpty ? '[$code] Help with $topic' : 'Course Help: $topic';
      }
    } else if (_category == 'Exam Prep') {
      final topics = _examFocusTopicsCtrl.text.trim();
      if (finalTitle.isEmpty) {
        finalTitle = 'Exam Prep: $_examType';
      }
      if (topics.isNotEmpty) {
        finalContent = 'Focus Topics: $topics\n\n$finalContent';
      }
    } else if (_category == 'Study Group') {
      final location = _groupLocationCtrl.text.trim();
      final schedule = _groupScheduleCtrl.text.trim();
      if (finalTitle.isEmpty) {
        finalTitle = 'Study Group: $_groupMode Session ($_groupSize)';
      }
      finalContent = 'Mode: $_groupMode\nLocation/Link: $location\nTarget Size: $_groupSize\nSchedule: $schedule\n\n$finalContent';
    } else if (_category == 'Resources') {
      final link = _resourceLinkCtrl.text.trim();
      if (finalTitle.isEmpty) {
        finalTitle = 'Resource: $_resourceType';
      }
      if (link.isNotEmpty) {
        finalContent = 'Resource Type: $_resourceType\nURL: $link\n\n$finalContent';
      }
    }

    if (finalTitle.isEmpty || finalContent.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please fill in title and description fields.')),
      );
      return;
    }

    setState(() => _isSubmitting = true);
    final success = await ref.read(communityProvider.notifier).createPost(
          title: finalTitle,
          content: finalContent,
          category: _category,
          codeSnippet: finalSnippet,
          codeLanguage: finalLanguage,
          vscodeLiveshareUrl: finalLiveUrl,
        );

    if (mounted) {
      setState(() => _isSubmitting = false);
      if (success) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Discussion post published successfully!'),
            backgroundColor: AppColors.primary,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 520, maxHeight: 680),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Dialog Header
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Row(
                    children: [
                      Icon(Icons.forum_rounded, color: AppColors.primary, size: 22),
                      SizedBox(width: 8),
                      Text(
                        'Start Academic Discussion',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
                      ),
                    ],
                  ),
                  IconButton(
                    icon: const Icon(Icons.close_rounded, size: 20),
                    onPressed: () => Navigator.pop(context),
                    visualDensity: VisualDensity.compact,
                  ),
                ],
              ),
              const SizedBox(height: 12),

              // Category Selector Chips
              const Text('Select Category', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
              const SizedBox(height: 6),
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: _categories.map((cat) {
                    final isSelected = _category == cat;
                    return Padding(
                      padding: const EdgeInsets.only(right: 6.0),
                      child: ChoiceChip(
                        label: Text(cat),
                        selected: isSelected,
                        onSelected: (_) => setState(() => _category = cat),
                        selectedColor: AppColors.primary.withValues(alpha: 0.18),
                        labelStyle: TextStyle(
                          fontSize: 11.5,
                          fontWeight: isSelected ? FontWeight.w800 : FontWeight.w500,
                          color: isSelected ? AppColors.primary : (isDark ? AppColors.textDarkMuted : AppColors.textLightMuted),
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ),
              const SizedBox(height: 14),

              // Scrollable Dynamic Form Fields
              Expanded(
                child: SingleChildScrollView(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // Discussion Title
                      TextField(
                        controller: _titleCtrl,
                        decoration: InputDecoration(
                          labelText: 'Discussion Title *',
                          hintText: _getCategoryTitleHint(_category),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                        ),
                      ),
                      const SizedBox(height: 12),

                      // DYNAMIC CATEGORY FIELDS
                      if (_category == 'Code Help') ...[
                        // Language Dropdown
                        DropdownButtonFormField<String>(
                          initialValue: _codeLanguage,
                          decoration: InputDecoration(
                            labelText: 'Programming Language',
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                          ),
                          items: _codeLanguages
                              .map((lang) => DropdownMenuItem(value: lang, child: Text(lang.toUpperCase())))
                              .toList(),
                          onChanged: (val) {
                            if (val != null) setState(() => _codeLanguage = val);
                          },
                        ),
                        const SizedBox(height: 12),

                        // Code Snippet Field
                        TextField(
                          controller: _codeSnippetCtrl,
                          maxLines: 5,
                          style: const TextStyle(fontFamily: 'monospace', fontSize: 12),
                          decoration: InputDecoration(
                            labelText: 'Paste Code Snippet',
                            hintText: 'public static void main(String[] args) { ... }',
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                            contentPadding: const EdgeInsets.all(12),
                          ),
                        ),
                        const SizedBox(height: 12),

                        // VS Code Live Share URL
                        TextField(
                          controller: _vsCodeUrlCtrl,
                          decoration: InputDecoration(
                            labelText: 'VS Code Live Share or GitHub URL (Optional)',
                            hintText: 'https://prod.liveshare.vsengsaas.visualstudio.com/join?...',
                            prefixIcon: const Icon(Icons.link_rounded, size: 18),
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                          ),
                        ),
                        const SizedBox(height: 12),
                      ] else if (_category == 'Course Help') ...[
                        Row(
                          children: [
                            Expanded(
                              flex: 4,
                              child: TextField(
                                controller: _courseCodeCtrl,
                                decoration: InputDecoration(
                                  labelText: 'Course Code',
                                  hintText: 'e.g. CSE 411',
                                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                                  contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                                ),
                              ),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              flex: 6,
                              child: TextField(
                                controller: _courseTopicCtrl,
                                decoration: InputDecoration(
                                  labelText: 'Topic Name',
                                  hintText: 'e.g. Dynamic Programming',
                                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                                  contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                      ] else if (_category == 'Exam Prep') ...[
                        DropdownButtonFormField<String>(
                          initialValue: _examType,
                          decoration: InputDecoration(
                            labelText: 'Exam / Assessment Type',
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                          ),
                          items: _examTypes
                              .map((t) => DropdownMenuItem(value: t, child: Text(t)))
                              .toList(),
                          onChanged: (val) {
                            if (val != null) setState(() => _examType = val);
                          },
                        ),
                        const SizedBox(height: 12),
                        TextField(
                          controller: _examFocusTopicsCtrl,
                          decoration: InputDecoration(
                            labelText: 'Focus Topics / Chapters',
                            hintText: 'e.g. Chapter 3 to 6, Dijkstra, AVL Trees',
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                          ),
                        ),
                        const SizedBox(height: 12),
                      ] else if (_category == 'Study Group') ...[
                        Row(
                          children: [
                            Expanded(
                              child: DropdownButtonFormField<String>(
                                initialValue: _groupMode,
                                decoration: InputDecoration(
                                  labelText: 'Study Mode',
                                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                                  contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
                                ),
                                items: ['In-Person', 'Online (Google Meet/Zoom)']
                                    .map((m) => DropdownMenuItem(value: m, child: Text(m, style: const TextStyle(fontSize: 12))))
                                    .toList(),
                                onChanged: (val) {
                                  if (val != null) setState(() => _groupMode = val);
                                },
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: DropdownButtonFormField<String>(
                                initialValue: _groupSize,
                                decoration: InputDecoration(
                                  labelText: 'Group Size',
                                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                                  contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
                                ),
                                items: _groupSizes
                                    .map((s) => DropdownMenuItem(value: s, child: Text(s, style: const TextStyle(fontSize: 12))))
                                    .toList(),
                                onChanged: (val) {
                                  if (val != null) setState(() => _groupSize = val);
                                },
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        TextField(
                          controller: _groupLocationCtrl,
                          decoration: InputDecoration(
                            labelText: _groupMode == 'In-Person' ? 'Campus Location' : 'Online Meeting Link',
                            hintText: _groupMode == 'In-Person' ? 'Library 4th Floor Study Room' : 'https://meet.google.com/...',
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                          ),
                        ),
                        const SizedBox(height: 12),
                        TextField(
                          controller: _groupScheduleCtrl,
                          decoration: InputDecoration(
                            labelText: 'Preferred Timing',
                            hintText: 'e.g. Tuesdays & Thursdays 4:30 PM - 6:00 PM',
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                          ),
                        ),
                        const SizedBox(height: 12),
                      ] else if (_category == 'Resources') ...[
                        DropdownButtonFormField<String>(
                          initialValue: _resourceType,
                          decoration: InputDecoration(
                            labelText: 'Resource Type',
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
                          ),
                          items: _resourceTypes
                              .map((rt) => DropdownMenuItem(value: rt, child: Text(rt, style: const TextStyle(fontSize: 12))))
                              .toList(),
                          onChanged: (val) {
                            if (val != null) setState(() => _resourceType = val);
                          },
                        ),
                        const SizedBox(height: 12),
                        TextField(
                          controller: _resourceLinkCtrl,
                          decoration: InputDecoration(
                            labelText: 'Resource URL / Drive Link',
                            hintText: 'https://drive.google.com/...',
                            prefixIcon: const Icon(Icons.link_rounded, size: 18),
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                          ),
                        ),
                        const SizedBox(height: 12),
                      ],

                      // Main Question / Content Text Area
                      TextField(
                        controller: _contentCtrl,
                        maxLines: 4,
                        decoration: InputDecoration(
                          labelText: 'Details / Description *',
                          hintText: 'Describe your query or share your study thoughts...',
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                          contentPadding: const EdgeInsets.all(12),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 14),

              // Action Buttons
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  TextButton(
                    onPressed: () => Navigator.pop(context),
                    child: const Text('Cancel'),
                  ),
                  const SizedBox(width: 8),
                  AppButton(
                    label: 'Publish Discussion',
                    isLoading: _isSubmitting,
                    onPressed: _submit,
                    height: 40,
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _getCategoryTitleHint(String category) {
    switch (category) {
      case 'Code Help':
        return 'e.g. Segmentation fault in C++ graph traversal';
      case 'Exam Prep':
        return 'e.g. Midterm revision questions for Discrete Math';
      case 'Study Group':
        return 'e.g. Forming study group for Compiler Design';
      case 'Course Help':
        return 'e.g. Need clarification on Bellman-Ford algorithm';
      case 'Resources':
        return 'e.g. Complete Lecture Notes & Solved Papers';
      default:
        return 'e.g. Tips for managing trimester coursework';
    }
  }
}
