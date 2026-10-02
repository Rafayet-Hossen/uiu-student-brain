import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/data/courses_catalog.dart';
import '../../../../core/widgets/app_button.dart';
import '../../../../core/widgets/empty_state.dart';
import '../../../../core/widgets/error_card.dart';
import '../../../../core/widgets/glass_card.dart';
import '../../../../core/widgets/responsive.dart';
import '../../../../core/widgets/student_brain_loader.dart';
import '../../../../core/widgets/user_avatar.dart';
import '../../data/models/community_models.dart';
import '../providers/community_provider.dart';
import '../../../auth/presentation/providers/auth_provider.dart';

class CommunityPage extends ConsumerStatefulWidget {
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
  ConsumerState<CommunityPage> createState() => _CommunityPageState();
}

class _CommunityPageState extends ConsumerState<CommunityPage>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _tabController.addListener(() {
      if (mounted) setState(() {});
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(communityProvider);
    final notifier = ref.read(communityProvider.notifier);
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final categories = ['All', 'Academic', 'Career', 'Projects', 'Campus Life', 'General'];

    return Scaffold(
      appBar: AppBar(
        title: const Text('Scholar Community'),
        actions: [
          IconButton(
            icon: const Icon(Icons.leaderboard_outlined),
            tooltip: 'Leaderboard',
            onPressed: () => context.push('/community/leaderboard'),
          ),
          Padding(
            padding: const EdgeInsets.only(right: 12.0, left: 4.0),
            child: InkWell(
              onTap: () => _showMyCommunityProfileModal(context, ref),
              borderRadius: BorderRadius.circular(20),
              child: Container(
                padding: const EdgeInsets.all(2),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: AppColors.primary, width: 1.5),
                ),
                child: UserAvatar(
                  name: ref.watch(authProvider).user?.fullName ?? 'Scholar',
                  size: 28,
                ),
              ),
            ),
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: AppColors.primary,
          labelColor: AppColors.primary,
          tabs: const [
            Tab(text: 'Discussions & Q&A'),
            Tab(text: 'Study Events & Meetups'),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          if (_tabController.index == 0) {
            _showCreatePostDialog(context, ref);
          } else {
            _showCreateEventDialog(context, ref);
          }
        },
        backgroundColor: AppColors.primary,
        icon: Icon(
          _tabController.index == 0 ? Icons.add_rounded : Icons.event_available_rounded,
          color: Colors.white,
        ),
        label: Text(
          _tabController.index == 0 ? 'New Discussion' : 'Host Study Event',
          style: const TextStyle(fontWeight: FontWeight.w700, color: Colors.white),
        ),
      ),
      body: TabBarView(
        controller: _tabController,
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
    );
  }

  void _showCreatePostDialog(BuildContext context, WidgetRef ref) {
    showDialog(
      context: context,
      builder: (ctx) => const _CreateDiscussionDialog(),
    );
  }

  void _showCreateEventDialog(BuildContext context, WidgetRef ref) {
    showDialog(
      context: context,
      builder: (ctx) => const _CreateStudyEventDialog(),
    );
  }

  void _showMyCommunityProfileModal(BuildContext context, WidgetRef ref) {
    final user = ref.read(authProvider).user;
    final commState = ref.read(communityProvider);
    final myPosts = commState.posts.where((p) {
      if (user?.id != null && p.authorId == user!.id) return true;
      final uName = (user?.fullName ?? user?.email ?? '').trim().toLowerCase();
      return uName.isNotEmpty && p.authorName.trim().toLowerCase() == uName;
    }).toList();

    final studentRecord = commState.students.where((s) => s.id == user?.id).firstOrNull;
    final followersCount = studentRecord?.followersCount ?? 0;
    final followingCount = commState.followingIds.length;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => DraggableScrollableSheet(
        initialChildSize: 0.65,
        minChildSize: 0.4,
        maxChildSize: 0.9,
        builder: (_, scrollCtrl) => Container(
          decoration: BoxDecoration(
            color: Theme.of(context).scaffoldBackgroundColor,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
          ),
          padding: const EdgeInsets.all(20),
          child: ListView(
            controller: scrollCtrl,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  margin: const EdgeInsets.only(bottom: 16),
                  decoration: BoxDecoration(
                    color: Colors.grey.withValues(alpha: 0.4),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              Row(
                children: [
                  UserAvatar(name: user?.fullName ?? 'Scholar', size: 54),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          user?.fullName ?? 'Scholar',
                          style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w800),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          user?.email ?? 'Campus Community Member',
                          style: const TextStyle(fontSize: 12, color: Colors.grey),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              Container(
                padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 16),
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.primary.withValues(alpha: 0.2)),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    _buildStatCol('${myPosts.length}', 'Discussions'),
                    Container(height: 30, width: 1, color: Colors.grey.withValues(alpha: 0.3)),
                    _buildStatCol('$followersCount', 'Followers'),
                    Container(height: 30, width: 1, color: Colors.grey.withValues(alpha: 0.3)),
                    _buildStatCol('$followingCount', 'Following'),
                  ],
                ),
              ),
              const SizedBox(height: 22),
              const Text(
                'My Authored Discussions',
                style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 12),
              if (myPosts.isEmpty)
                Container(
                  padding: const EdgeInsets.all(24),
                  alignment: Alignment.center,
                  child: const Column(
                    children: [
                      Icon(Icons.forum_outlined, size: 40, color: Colors.grey),
                      SizedBox(height: 8),
                      Text('You have not created any discussions yet.', style: TextStyle(color: Colors.grey)),
                    ],
                  ),
                )
              else
                ...myPosts.map((p) => Card(
                  margin: const EdgeInsets.only(bottom: 10),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  child: ListTile(
                    title: Text(p.title, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13.5)),
                    subtitle: Text('${p.category} • ${p.commentsCount} comments • ${p.reactionsCount} likes', style: const TextStyle(fontSize: 11)),
                    trailing: const Icon(Icons.arrow_forward_ios_rounded, size: 14),
                    onTap: () {
                      Navigator.pop(ctx);
                    },
                  ),
                )),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatCol(String val, String label) {
    return Column(
      children: [
        Text(val, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: AppColors.primary)),
        const SizedBox(height: 2),
        Text(label, style: const TextStyle(fontSize: 11, color: Colors.grey)),
      ],
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
                    Row(
                      children: [
                        Flexible(
                          child: Text(
                            post.authorName,
                            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        Builder(
                          builder: (context) {
                            final commState = ref.watch(communityProvider);
                            final authState = ref.watch(authProvider);
                            final currentUserId = authState.user?.id;
                            final currentUserName = (authState.user?.fullName ?? authState.user?.email ?? '').trim().toLowerCase();
                            final isSelf = (post.authorId != null && post.authorId == currentUserId) ||
                                (currentUserName.isNotEmpty && post.authorName.trim().toLowerCase() == currentUserName);
                            final isFollowing = post.authorId != null && commState.followingIds.contains(post.authorId);
                            final showFollowBtn = !isSelf && !isFollowing && post.authorId != null;

                            if (!showFollowBtn) return const SizedBox.shrink();

                            return Padding(
                              padding: const EdgeInsets.only(left: 6.0),
                              child: InkWell(
                                onTap: () async {
                                  await ref.read(communityProvider.notifier).toggleFollow(post.authorId!);
                                  if (context.mounted) {
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(
                                        content: Text('You are now following ${post.authorName}'),
                                        duration: const Duration(seconds: 2),
                                        backgroundColor: AppColors.primary,
                                      ),
                                    );
                                  }
                                },
                                borderRadius: BorderRadius.circular(10),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: AppColors.primary.withValues(alpha: 0.12),
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(color: AppColors.primary.withValues(alpha: 0.3)),
                                  ),
                                  child: const Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Icon(Icons.person_add_rounded, size: 10, color: AppColors.primary),
                                      SizedBox(width: 3),
                                      Text(
                                        'Follow',
                                        style: TextStyle(
                                          fontSize: 9.5,
                                          fontWeight: FontWeight.w800,
                                          color: AppColors.primary,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            );
                          },
                        ),
                      ],
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
              Builder(
                builder: (context) {
                  final authState = ref.watch(authProvider);
                  final currentUserId = authState.user?.id;
                  final currentUserName = (authState.user?.fullName ?? authState.user?.email ?? '').trim().toLowerCase();
                  final isSelf = (post.authorId != null && post.authorId == currentUserId) ||
                      (currentUserName.isNotEmpty && post.authorName.trim().toLowerCase() == currentUserName);

                  if (!isSelf) return const SizedBox.shrink();

                  return Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const SizedBox(width: 4),
                      PopupMenuButton<String>(
                        icon: Icon(
                          Icons.more_vert_rounded,
                          size: 18,
                          color: isDark ? AppColors.textDarkMuted : AppColors.textLightMuted,
                        ),
                        padding: EdgeInsets.zero,
                        constraints: const BoxConstraints(),
                        onSelected: (val) {
                          if (val == 'edit') {
                            showDialog(
                              context: context,
                              builder: (ctx) => _CreateDiscussionDialog(postToEdit: widget.post),
                            );
                          } else if (val == 'delete') {
                            showDialog(
                              context: context,
                              builder: (dCtx) => AlertDialog(
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                                title: const Text('Delete Post?', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
                                content: Text('Are you sure you want to delete "${widget.post.title}"?'),
                                actions: [
                                  TextButton(
                                    onPressed: () => Navigator.pop(dCtx),
                                    child: const Text('Cancel'),
                                  ),
                                  ElevatedButton(
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: AppColors.error,
                                      foregroundColor: Colors.white,
                                    ),
                                    onPressed: () async {
                                      Navigator.pop(dCtx);
                                      await ref.read(communityProvider.notifier).deletePost(widget.post.id);
                                      if (context.mounted) {
                                        ScaffoldMessenger.of(context).showSnackBar(
                                          const SnackBar(
                                            content: Text('Discussion post deleted.'),
                                            backgroundColor: AppColors.error,
                                          ),
                                        );
                                      }
                                    },
                                    child: const Text('Delete'),
                                  ),
                                ],
                              ),
                            );
                          }
                        },
                        itemBuilder: (ctx) => [
                          const PopupMenuItem(
                            value: 'edit',
                            child: Row(
                              children: [
                                Icon(Icons.edit_outlined, size: 16),
                                SizedBox(width: 8),
                                Text('Edit Post', style: TextStyle(fontSize: 13)),
                              ],
                            ),
                          ),
                          const PopupMenuItem(
                            value: 'delete',
                            child: Row(
                              children: [
                                Icon(Icons.delete_outline_rounded, size: 16, color: AppColors.error),
                                SizedBox(width: 8),
                                Text('Delete Post', style: TextStyle(fontSize: 13, color: AppColors.error)),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ],
                  );
                },
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
    final user = ref.watch(authProvider).user;
    final isCreator = user != null &&
        ((event.creatorId != null && event.creatorId == user.id) ||
         (event.creatorName != null &&
             (event.creatorName == user.fullName || event.creatorName == user.email)));

    final isOnline = event.eventType.toLowerCase().contains('online') ||
        event.location.toLowerCase().contains('http') ||
        event.location.toLowerCase().contains('meet.google') ||
        event.location.toLowerCase().contains('zoom.us');

    String? cleanUrl;
    if (event.location.toLowerCase().contains('http')) {
      final match = RegExp(r'https?:\/\/[^\s]+').firstMatch(event.location);
      if (match != null) cleanUrl = match.group(0);
    } else if (event.location.toLowerCase().contains('meet.google.com')) {
      final match = RegExp(r'meet\.google\.com\/[^\s]+').firstMatch(event.location);
      if (match != null) cleanUrl = 'https://${match.group(0)}';
    } else if (event.location.toLowerCase().contains('zoom.us')) {
      final match = RegExp(r'zoom\.us\/[^\s]+').firstMatch(event.location);
      if (match != null) cleanUrl = 'https://${match.group(0)}';
    }

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
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          Column(
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
                    Padding(
                      padding: EdgeInsets.only(right: isCreator ? 28.0 : 0.0),
                      child: Wrap(
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
                    ),
                    const SizedBox(height: 6),
                    Padding(
                      padding: EdgeInsets.only(right: isCreator ? 26.0 : 0.0),
                      child: Text(
                        event.title,
                        style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w800),
                      ),
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
                    Icon(
                      isOnline ? Icons.videocam_rounded : Icons.location_on_outlined,
                      size: 14,
                      color: isOnline ? AppColors.accent : AppColors.primary,
                    ),
                    const SizedBox(width: 6),
                    Expanded(
                      child: cleanUrl != null
                          ? InkWell(
                              onTap: () async {
                                final uri = Uri.tryParse(cleanUrl!);
                                if (uri != null) {
                                  await launchUrl(uri, mode: LaunchMode.externalApplication);
                                }
                              },
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Flexible(
                                    child: Text(
                                      event.location,
                                      style: const TextStyle(
                                        fontSize: 11.5,
                                        fontWeight: FontWeight.w700,
                                        color: AppColors.accent,
                                        decoration: TextDecoration.underline,
                                      ),
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                  const SizedBox(width: 4),
                                  const Icon(Icons.open_in_new_rounded, size: 12, color: AppColors.accent),
                                ],
                              ),
                            )
                          : Text(
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
                    'Going',
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
      if (isCreator)
        Positioned(
          top: -6,
          right: -6,
          child: PopupMenuButton<String>(
            icon: Icon(
              Icons.more_vert_rounded,
              size: 20,
              color: isDark ? AppColors.textDarkMuted : AppColors.textLightMuted,
            ),
            padding: EdgeInsets.zero,
            constraints: const BoxConstraints(),
            onSelected: (val) {
              if (val == 'edit') {
                showDialog(
                  context: context,
                  builder: (ctx) => _CreateStudyEventDialog(eventToEdit: event),
                );
              } else if (val == 'delete') {
                showDialog(
                  context: context,
                  builder: (dCtx) => AlertDialog(
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    title: const Text('Delete Study Event?', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
                    content: Text('Are you sure you want to delete "${event.title}"?'),
                    actions: [
                      TextButton(
                        onPressed: () => Navigator.pop(dCtx),
                        child: const Text('Cancel'),
                      ),
                      ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.error,
                          foregroundColor: Colors.white,
                        ),
                        onPressed: () async {
                          Navigator.pop(dCtx);
                          await ref.read(communityProvider.notifier).deleteEvent(event.id);
                          if (context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('Study Event deleted.'),
                                backgroundColor: AppColors.error,
                              ),
                            );
                          }
                        },
                        child: const Text('Delete'),
                      ),
                    ],
                  ),
                );
              }
            },
            itemBuilder: (ctx) => [
              const PopupMenuItem(
                value: 'edit',
                child: Row(
                  children: [
                    Icon(Icons.edit_outlined, size: 16),
                    SizedBox(width: 8),
                    Text('Edit Event', style: TextStyle(fontSize: 13)),
                  ],
                ),
              ),
              const PopupMenuItem(
                value: 'delete',
                child: Row(
                  children: [
                    Icon(Icons.delete_outline_rounded, size: 16, color: AppColors.error),
                    SizedBox(width: 8),
                    Text('Delete Event', style: TextStyle(fontSize: 13, color: AppColors.error)),
                  ],
                ),
              ),
            ],
          ),
        ),
    ],
  ),
);
  }
}

/// Dynamic Start Academic Discussion Dialog with Category-Specific Fields
class _CreateDiscussionDialog extends ConsumerStatefulWidget {
  final PostModel? postToEdit;
  const _CreateDiscussionDialog({this.postToEdit});

  @override
  ConsumerState<_CreateDiscussionDialog> createState() => _CreateDiscussionDialogState();
}

class _CreateDiscussionDialogState extends ConsumerState<_CreateDiscussionDialog> {
  @override
  void initState() {
    super.initState();
    if (widget.postToEdit != null) {
      final p = widget.postToEdit!;
      _category = p.category;
      _titleCtrl.text = p.title;
      _contentCtrl.text = p.content;
      if (p.codeSnippet != null) _codeSnippetCtrl.text = p.codeSnippet!;
      if (p.codeLanguage != null) _codeLanguage = p.codeLanguage!;
      if (p.vscodeLiveshareUrl != null) _vsCodeUrlCtrl.text = p.vscodeLiveshareUrl!;
    }
  }

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

  static const Map<String, IconData> _categoryIcons = {
    'General': Icons.forum_outlined,
    'Code Help': Icons.code_rounded,
    'Exam Prep': Icons.quiz_outlined,
    'Study Group': Icons.groups_outlined,
    'Course Help': Icons.school_outlined,
    'Resources': Icons.folder_shared_outlined,
  };

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
    final size = MediaQuery.sizeOf(context);

    return Dialog(
      insetPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 18),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(22)),
      child: ConstrainedBox(
        constraints: BoxConstraints(
          maxWidth: size.width > 560 ? 520 : size.width * 0.94,
          maxHeight: size.height * 0.86,
        ),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Dialog Header
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(7),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Icon(Icons.forum_rounded, color: AppColors.primary, size: 20),
                      ),
                      const SizedBox(width: 10),
                      Text(
                        widget.postToEdit != null ? 'Edit Discussion Post' : 'Start Academic Discussion',
                        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
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

              // Category Selector Chips with Icons
              const Text('Select Category', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
              const SizedBox(height: 8),
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                physics: const BouncingScrollPhysics(),
                child: Row(
                  children: _categories.map((cat) {
                    final isSelected = _category == cat;
                    final icon = _categoryIcons[cat] ?? Icons.label_outline_rounded;
                    return Padding(
                      padding: const EdgeInsets.only(right: 8.0),
                      child: ChoiceChip(
                        avatar: Icon(
                          icon,
                          size: 15,
                          color: isSelected ? Colors.white : (isDark ? AppColors.textDarkMuted : AppColors.textLightMuted),
                        ),
                        label: Text(cat),
                        selected: isSelected,
                        onSelected: (_) => setState(() => _category = cat),
                        selectedColor: AppColors.primary,
                        backgroundColor: isDark ? AppColors.surfaceDarkSubtle : AppColors.surfaceLightSubtle,
                        labelStyle: TextStyle(
                          fontSize: 11.5,
                          fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                          color: isSelected ? Colors.white : (isDark ? AppColors.textDark : AppColors.textLight),
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                          side: BorderSide(
                            color: isSelected ? AppColors.primary : (isDark ? AppColors.borderDark : AppColors.borderLight),
                            width: 1,
                          ),
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

/// Dynamic Host Study Event & Meetup Dialog matching website EventForm
class _CreateStudyEventDialog extends ConsumerStatefulWidget {
  final StudyEventModel? eventToEdit;
  const _CreateStudyEventDialog({this.eventToEdit});

  @override
  ConsumerState<_CreateStudyEventDialog> createState() => _CreateStudyEventDialogState();
}

class _CreateStudyEventDialogState extends ConsumerState<_CreateStudyEventDialog> {
  final _titleCtrl = TextEditingController();
  final _subjectCtrl = TextEditingController();
  final _locationCtrl = TextEditingController();
  final _descCtrl = TextEditingController();
  final _customCapacityCtrl = TextEditingController();

  String? _eventType; // null initially - user chooses In-Person or Online
  DateTime? _eventDate; // null initially - user selects date
  TimeOfDay? _startTime; // null initially
  TimeOfDay? _endTime; // null initially
  int? _maxParticipants; // null initially
  bool _isCustomCapacity = false;
  bool _isSubmitting = false;
  List<CatalogCourse> _courseSuggestions = [];

  @override
  void initState() {
    super.initState();
    final ev = widget.eventToEdit;
    if (ev != null) {
      _titleCtrl.text = ev.title;
      _subjectCtrl.text = ev.subject;
      _locationCtrl.text = ev.location;
      _descCtrl.text = ev.description;
      _eventType = ev.eventType.toLowerCase().contains('online') ? 'online' : 'offline';
      try {
        if (ev.eventDate.isNotEmpty) {
          _eventDate = DateTime.parse(ev.eventDate);
        }
      } catch (_) {}
      try {
        if (ev.startTime.isNotEmpty) {
          final parts = ev.startTime.split(':');
          if (parts.length >= 2) {
            _startTime = TimeOfDay(hour: int.parse(parts[0]), minute: int.parse(parts[1]));
          }
        }
        if (ev.endTime.isNotEmpty) {
          final parts = ev.endTime.split(':');
          if (parts.length >= 2) {
            _endTime = TimeOfDay(hour: int.parse(parts[0]), minute: int.parse(parts[1]));
          }
        }
      } catch (_) {}
    }
  }

  static const List<Map<String, dynamic>> _capacityPresets = [
    {'label': 'Unlimited', 'value': 0},
    {'label': '10 Seats', 'value': 10},
    {'label': '20 Seats', 'value': 20},
    {'label': '30 Seats', 'value': 30},
    {'label': '50 Seats', 'value': 50},
  ];

  @override
  void dispose() {
    _titleCtrl.dispose();
    _subjectCtrl.dispose();
    _locationCtrl.dispose();
    _descCtrl.dispose();
    _customCapacityCtrl.dispose();
    super.dispose();
  }

  void _applyTimePreset(int startH, int startM, int endH, int endM) {
    setState(() {
      _startTime = TimeOfDay(hour: startH, minute: startM);
      _endTime = TimeOfDay(hour: endH, minute: endM);
    });
  }

  String _formatTimeDisplay(TimeOfDay? time) {
    if (time == null) return 'Select time';
    final now = DateTime.now();
    final dt = DateTime(now.year, now.month, now.day, time.hour, time.minute);
    return DateFormat('h:mm a').format(dt);
  }

  Future<void> _pickDate() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: _eventDate ?? now,
      firstDate: now.subtract(const Duration(days: 1)),
      lastDate: now.add(const Duration(days: 180)),
    );
    if (picked != null) {
      setState(() => _eventDate = picked);
    }
  }

  Future<void> _pickStartTime() async {
    final picked = await showTimePicker(
      context: context,
      initialTime: _startTime ?? const TimeOfDay(hour: 14, minute: 0),
    );
    if (picked != null) {
      setState(() => _startTime = picked);
    }
  }

  Future<void> _pickEndTime() async {
    final picked = await showTimePicker(
      context: context,
      initialTime: _endTime ?? const TimeOfDay(hour: 16, minute: 0),
    );
    if (picked != null) {
      setState(() => _endTime = picked);
    }
  }

  Future<void> _submit() async {
    final title = _titleCtrl.text.trim();
    final subject = _subjectCtrl.text.trim();
    final location = _locationCtrl.text.trim();
    final desc = _descCtrl.text.trim();

    if (title.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter an event title.')),
      );
      return;
    }

    if (subject.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please specify a subject or course code.')),
      );
      return;
    }

    if (_eventType == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select an event format (In-Person or Online).')),
      );
      return;
    }

    if (location.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(_eventType == 'online'
              ? 'Please provide an online meeting link or platform.'
              : 'Please enter a campus room or location.'),
        ),
      );
      return;
    }

    if (_eventDate == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please choose an event date.')),
      );
      return;
    }

    if (_startTime == null || _endTime == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select both start and end time.')),
      );
      return;
    }

    final startMinutes = _startTime!.hour * 60 + _startTime!.minute;
    final endMinutes = _endTime!.hour * 60 + _endTime!.minute;
    if (startMinutes >= endMinutes) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('End time must be after start time.')),
      );
      return;
    }

    int capacity = 0;
    if (_isCustomCapacity) {
      final parsed = int.tryParse(_customCapacityCtrl.text.trim());
      if (parsed == null || parsed <= 0) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Please enter a valid seat number.')),
        );
        return;
      }
      capacity = parsed;
    } else if (_maxParticipants != null) {
      capacity = _maxParticipants!;
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select attendee capacity or choose Unlimited.')),
      );
      return;
    }

    final dateStr = DateFormat('yyyy-MM-dd').format(_eventDate!);
    final startStr = '${_startTime!.hour.toString().padLeft(2, '0')}:${_startTime!.minute.toString().padLeft(2, '0')}';
    final endStr = '${_endTime!.hour.toString().padLeft(2, '0')}:${_endTime!.minute.toString().padLeft(2, '0')}';

    String finalLocation = location;
    if (_eventType == 'online' && !finalLocation.toLowerCase().startsWith('http') && !finalLocation.toLowerCase().startsWith('online')) {
      finalLocation = 'Online: $finalLocation';
    }

    setState(() => _isSubmitting = true);
    final messenger = ScaffoldMessenger.of(context);

    final isEditing = widget.eventToEdit != null;
    final Map<String, dynamic> eventPayload = {
      'title': title,
      'subject': subject,
      'description': desc,
      'event_date': dateStr,
      'start_time': startStr,
      'end_time': endStr,
      'location': finalLocation,
      'event_type': _eventType == 'online' ? 'Online' : 'In-Person',
      'max_participants': capacity,
    };

    final bool success;
    if (isEditing) {
      success = await ref.read(communityProvider.notifier).updateEvent(widget.eventToEdit!.id, eventPayload);
    } else {
      success = await ref.read(communityProvider.notifier).createEvent(eventPayload);
    }

    if (mounted) {
      setState(() => _isSubmitting = false);
      if (success) {
        Navigator.pop(context);
        messenger.showSnackBar(
          SnackBar(
            content: Text(isEditing ? 'Study Event updated successfully!' : 'Study Event published and synced to Scholar Community!'),
            backgroundColor: AppColors.success,
          ),
        );
      } else {
        messenger.showSnackBar(
          const SnackBar(
            content: Text('Could not create study event. Please check required fields.'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final isToday = _eventDate != null && DateUtils.isSameDay(_eventDate!, DateTime.now());
    final isTomorrow = _eventDate != null && DateUtils.isSameDay(_eventDate!, DateTime.now().add(const Duration(days: 1)));
    final screenHeight = MediaQuery.of(context).size.height;

    return Dialog(
      insetPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 20),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      child: ConstrainedBox(
        constraints: BoxConstraints(maxWidth: 580, maxHeight: screenHeight * 0.88),
        child: Padding(
          padding: const EdgeInsets.fromLTRB(18, 18, 18, 16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Header
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withValues(alpha: 0.15),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.event_available_rounded, color: AppColors.primary, size: 20),
                      ),
                      const SizedBox(width: 10),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            widget.eventToEdit != null ? 'Edit Study Event & Meetup' : 'Host Study Event & Meetup',
                            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
                          ),
                          const Text(
                            'Invite batchmates for collaborative prep',
                            style: TextStyle(fontSize: 11, color: Colors.grey),
                          ),
                        ],
                      ),
                    ],
                  ),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              // Scrollable Form Fields
              Expanded(
                child: SingleChildScrollView(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // Event Title
                      TextField(
                        controller: _titleCtrl,
                        decoration: InputDecoration(
                          labelText: 'Event Title *',
                          hintText: 'e.g. Midterm Problem Solving Marathon',
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                        ),
                      ),
                      const SizedBox(height: 12),

                      // Subject / Course with Autocomplete
                      TextField(
                        controller: _subjectCtrl,
                        decoration: InputDecoration(
                          labelText: 'Subject / Course *',
                          hintText: 'e.g. CSE 2215 - Data Structures',
                          prefixIcon: const Icon(Icons.school_outlined, size: 18),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                        ),
                        onChanged: (val) {
                          setState(() {
                            _courseSuggestions = searchCoursesCatalog(val);
                          });
                        },
                      ),
                      if (_courseSuggestions.isNotEmpty) ...[
                        const SizedBox(height: 6),
                        Wrap(
                          spacing: 6,
                          runSpacing: 4,
                          children: _courseSuggestions.take(4).map((c) {
                            return ActionChip(
                              avatar: const Icon(Icons.school, size: 14, color: AppColors.primary),
                              label: Text('${c.code} (${c.title})', style: const TextStyle(fontSize: 11)),
                              onPressed: () {
                                setState(() {
                                  _subjectCtrl.text = '${c.code} - ${c.title}';
                                  _courseSuggestions = [];
                                });
                              },
                            );
                          }).toList(),
                        ),
                      ],
                      const SizedBox(height: 12),

                      // Event Format (In-Person vs Online) - Responsive Row with FittedBox
                      Row(
                        children: [
                          Expanded(
                            child: ChoiceChip(
                              avatar: const Icon(Icons.location_on_outlined, size: 16),
                              label: const FittedBox(
                                fit: BoxFit.scaleDown,
                                child: Text('In-Person (Campus)'),
                              ),
                              selected: _eventType == 'offline',
                              selectedColor: AppColors.primary,
                              labelStyle: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w700,
                                color: _eventType == 'offline' ? Colors.white : null,
                              ),
                              onSelected: (_) => setState(() {
                                _eventType = 'offline';
                              }),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: ChoiceChip(
                              avatar: const Icon(Icons.videocam_outlined, size: 16),
                              label: const FittedBox(
                                fit: BoxFit.scaleDown,
                                child: Text('Online Meetup'),
                              ),
                              selected: _eventType == 'online',
                              selectedColor: AppColors.primary,
                              labelStyle: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w700,
                                color: _eventType == 'online' ? Colors.white : null,
                              ),
                              onSelected: (_) => setState(() {
                                _eventType = 'online';
                              }),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),

                      // Location or Meeting Link
                      TextField(
                        controller: _locationCtrl,
                        decoration: InputDecoration(
                          labelText: _eventType == 'online'
                              ? 'Meeting Link / Platform *'
                              : (_eventType == 'offline' ? 'Campus Location / Room *' : 'Location or Meeting Link *'),
                          hintText: _eventType == 'online'
                              ? 'e.g. Google Meet link or Zoom URL'
                              : 'e.g. Room 412 or Library 4th Floor',
                          prefixIcon: Icon(_eventType == 'online' ? Icons.link : Icons.place_outlined, size: 18),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                        ),
                      ),
                      const SizedBox(height: 12),

                      // Date Selection
                      const Text('Event Date *', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
                      const SizedBox(height: 6),
                      Row(
                        children: [
                          ChoiceChip(
                            label: const Text('Today'),
                            selected: isToday,
                            onSelected: (_) => setState(() => _eventDate = DateTime.now()),
                            selectedColor: AppColors.primary,
                            labelStyle: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              color: isToday ? Colors.white : null,
                            ),
                          ),
                          const SizedBox(width: 6),
                          ChoiceChip(
                            label: const Text('Tomorrow'),
                            selected: isTomorrow,
                            onSelected: (_) => setState(() => _eventDate = DateTime.now().add(const Duration(days: 1))),
                            selectedColor: AppColors.primary,
                            labelStyle: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              color: isTomorrow ? Colors.white : null,
                            ),
                          ),
                          const SizedBox(width: 6),
                          Expanded(
                            child: OutlinedButton.icon(
                              onPressed: _pickDate,
                              icon: const Icon(Icons.calendar_month, size: 14),
                              label: FittedBox(
                                fit: BoxFit.scaleDown,
                                child: Text(
                                  _eventDate != null
                                      ? DateFormat('EEE, MMM d').format(_eventDate!)
                                      : 'Select Date',
                                  style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700),
                                ),
                              ),
                              style: OutlinedButton.styleFrom(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),

                      // Time Pickers (Start and End)
                      Row(
                        children: [
                          Expanded(
                            child: InkWell(
                              onTap: _pickStartTime,
                              borderRadius: BorderRadius.circular(10),
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
                                decoration: BoxDecoration(
                                  border: Border.all(color: isDark ? AppColors.borderDark : AppColors.borderLight),
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: Row(
                                  children: [
                                    const Icon(Icons.schedule, size: 14, color: AppColors.primary),
                                    const SizedBox(width: 6),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          const Text('Start Time', style: TextStyle(fontSize: 10, color: Colors.grey)),
                                          Text(
                                            _formatTimeDisplay(_startTime),
                                            style: TextStyle(
                                              fontSize: 12,
                                              fontWeight: FontWeight.w800,
                                              color: _startTime == null ? Colors.grey : null,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: InkWell(
                              onTap: _pickEndTime,
                              borderRadius: BorderRadius.circular(10),
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
                                decoration: BoxDecoration(
                                  border: Border.all(color: isDark ? AppColors.borderDark : AppColors.borderLight),
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: Row(
                                  children: [
                                    const Icon(Icons.timelapse_rounded, size: 14, color: AppColors.warning),
                                    const SizedBox(width: 6),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          const Text('End Time', style: TextStyle(fontSize: 10, color: Colors.grey)),
                                          Text(
                                            _formatTimeDisplay(_endTime),
                                            style: TextStyle(
                                              fontSize: 12,
                                              fontWeight: FontWeight.w800,
                                              color: _endTime == null ? Colors.grey : null,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),

                      // Quick Time Presets
                      SingleChildScrollView(
                        scrollDirection: Axis.horizontal,
                        child: Row(
                          children: [
                            ActionChip(
                              label: const Text('10:00 - 12:00', style: TextStyle(fontSize: 10.5)),
                              onPressed: () => _applyTimePreset(10, 0, 12, 0),
                              padding: const EdgeInsets.symmetric(horizontal: 4),
                            ),
                            const SizedBox(width: 6),
                            ActionChip(
                              label: const Text('14:00 - 16:00', style: TextStyle(fontSize: 10.5)),
                              onPressed: () => _applyTimePreset(14, 0, 16, 0),
                              padding: const EdgeInsets.symmetric(horizontal: 4),
                            ),
                            const SizedBox(width: 6),
                            ActionChip(
                              label: const Text('16:00 - 18:00', style: TextStyle(fontSize: 10.5)),
                              onPressed: () => _applyTimePreset(16, 0, 18, 0),
                              padding: const EdgeInsets.symmetric(horizontal: 4),
                            ),
                            const SizedBox(width: 6),
                            ActionChip(
                              label: const Text('19:00 - 21:00', style: TextStyle(fontSize: 10.5)),
                              onPressed: () => _applyTimePreset(19, 0, 21, 0),
                              padding: const EdgeInsets.symmetric(horizontal: 4),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 14),

                      // Slot Capacity
                      const Text('Total Seats / Capacity *', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
                      const SizedBox(height: 6),
                      Wrap(
                        spacing: 6,
                        runSpacing: 6,
                        children: [
                          ..._capacityPresets.map((p) {
                            final isSelected = !_isCustomCapacity && _maxParticipants == p['value'];
                            return ChoiceChip(
                              label: Text(p['label'] as String),
                              selected: isSelected,
                              onSelected: (_) => setState(() {
                                _isCustomCapacity = false;
                                _maxParticipants = p['value'] as int;
                              }),
                              selectedColor: AppColors.primary,
                              labelStyle: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w700,
                                color: isSelected ? Colors.white : null,
                              ),
                            );
                          }),
                          ChoiceChip(
                            label: const Text('Custom'),
                            selected: _isCustomCapacity,
                            onSelected: (_) => setState(() => _isCustomCapacity = true),
                            selectedColor: AppColors.primary,
                            labelStyle: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              color: _isCustomCapacity ? Colors.white : null,
                            ),
                          ),
                        ],
                      ),
                      if (_isCustomCapacity) ...[
                        const SizedBox(height: 8),
                        TextField(
                          controller: _customCapacityCtrl,
                          keyboardType: TextInputType.number,
                          decoration: InputDecoration(
                            labelText: 'Enter number of seats',
                            hintText: 'e.g. 15',
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                          ),
                        ),
                      ],
                      const SizedBox(height: 14),

                      // Description
                      TextField(
                        controller: _descCtrl,
                        maxLines: 3,
                        decoration: InputDecoration(
                          labelText: 'Event Details & Guidelines (Optional)',
                          hintText: 'What will be covered, prerequisites, or what to bring (e.g. Bring laptop)...',
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                          contentPadding: const EdgeInsets.all(12),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 12),

              // Pinned Bottom Actions Row
              Container(
                padding: const EdgeInsets.only(top: 10),
                decoration: BoxDecoration(
                  border: Border(
                    top: BorderSide(
                      color: isDark ? AppColors.borderDark.withValues(alpha: 0.5) : AppColors.borderLight,
                    ),
                  ),
                ),
                child: Row(
                  children: [
                    Expanded(
                      flex: 1,
                      child: OutlinedButton(
                        onPressed: () => Navigator.pop(context),
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                        child: const Text('Cancel', style: TextStyle(fontWeight: FontWeight.w700)),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      flex: 2,
                      child: ElevatedButton.icon(
                        onPressed: _isSubmitting ? null : _submit,
                        icon: _isSubmitting
                            ? const SizedBox(
                                width: 16,
                                height: 16,
                                child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                              )
                            : const Icon(Icons.check_circle_outline_rounded, size: 18),
                        label: Text(
                          widget.eventToEdit != null ? (_isSubmitting ? 'Saving...' : 'Save Changes') : (_isSubmitting ? 'Publishing...' : 'Publish Study Event'),
                          style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13),
                        ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          elevation: 1,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
