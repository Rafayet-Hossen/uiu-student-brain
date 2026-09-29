import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/config/providers.dart';
import '../../data/models/community_models.dart';
import '../../data/repositories/community_repository.dart';

final communityRepositoryProvider = Provider<CommunityRepository>((ref) {
  final dioClient = ref.watch(dioClientProvider);
  return CommunityRepository(dioClient);
});

class CommunityState {
  final List<PostModel> posts;
  final List<StudyEventModel> events;
  final String selectedCategory;
  final int activeTab;
  final bool isLoading;
  final String? error;

  const CommunityState({
    this.posts = const [],
    this.events = const [],
    this.selectedCategory = 'All',
    this.activeTab = 0,
    this.isLoading = false,
    this.error,
  });

  CommunityState copyWith({
    List<PostModel>? posts,
    List<StudyEventModel>? events,
    String? selectedCategory,
    int? activeTab,
    bool? isLoading,
    String? error,
  }) {
    return CommunityState(
      posts: posts ?? this.posts,
      events: events ?? this.events,
      selectedCategory: selectedCategory ?? this.selectedCategory,
      activeTab: activeTab ?? this.activeTab,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }

  List<PostModel> get filteredPosts {
    if (selectedCategory == 'All') return posts;
    return posts.where((p) => p.category == selectedCategory).toList();
  }
}

class CommunityNotifier extends StateNotifier<CommunityState> {
  final CommunityRepository _repository;

  CommunityNotifier(this._repository) : super(const CommunityState()) {
    loadCommunityData();
  }

  Future<void> loadCommunityData() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final p = await _repository.getPosts();
      final e = await _repository.getEvents();
      state = state.copyWith(posts: p, events: e, isLoading: false);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  void setActiveTab(int index) {
    state = state.copyWith(activeTab: index);
  }

  void selectCategory(String cat) {
    state = state.copyWith(selectedCategory: cat);
  }

  Future<bool> createPost(String title, String content, String category) async {
    try {
      final post = await _repository.createPost({
        'title': title,
        'content': content,
        'category': category,
      });
      state = state.copyWith(posts: [post, ...state.posts]);
      return true;
    } catch (e) {
      state = state.copyWith(error: e.toString());
      return false;
    }
  }

  Future<void> toggleReaction(int postId) async {
    try {
      await _repository.reactToPost(postId);
      state = state.copyWith(
        posts: state.posts.map((p) {
          if (p.id == postId) {
            final nowReacted = !p.hasReacted;
            return PostModel(
              id: p.id,
              title: p.title,
              content: p.content,
              category: p.category,
              authorName: p.authorName,
              authorAvatar: p.authorAvatar,
              reactionsCount: nowReacted ? p.reactionsCount + 1 : (p.reactionsCount - 1).clamp(0, 9999),
              commentsCount: p.commentsCount,
              hasReacted: nowReacted,
              createdAt: p.createdAt,
            );
          }
          return p;
        }).toList(),
      );
    } catch (_) {}
  }

  Future<void> toggleRsvp(int eventId) async {
    try {
      await _repository.rsvpEvent(eventId);
      state = state.copyWith(
        events: state.events.map((e) {
          if (e.id == eventId) {
            final nowAttending = !e.isAttending;
            return StudyEventModel(
              id: e.id,
              title: e.title,
              description: e.description,
              eventDate: e.eventDate,
              location: e.location,
              eventType: e.eventType,
              attendeesCount: nowAttending ? e.attendeesCount + 1 : (e.attendeesCount - 1).clamp(0, 9999),
              isAttending: nowAttending,
            );
          }
          return e;
        }).toList(),
      );
    } catch (_) {}
  }
}

final communityProvider =
    StateNotifierProvider<CommunityNotifier, CommunityState>((ref) {
  final repo = ref.watch(communityRepositoryProvider);
  return CommunityNotifier(repo);
});
