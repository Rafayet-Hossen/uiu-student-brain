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
  final List<StudentProfileModel> students;
  final Set<int> followingIds;
  final String selectedCategory;
  final int activeTab;
  final bool isLoading;
  final String? error;

  const CommunityState({
    this.posts = const [],
    this.events = const [],
    this.students = const [],
    this.followingIds = const {},
    this.selectedCategory = 'All',
    this.activeTab = 0,
    this.isLoading = false,
    this.error,
  });

  CommunityState copyWith({
    List<PostModel>? posts,
    List<StudyEventModel>? events,
    List<StudentProfileModel>? students,
    Set<int>? followingIds,
    String? selectedCategory,
    int? activeTab,
    bool? isLoading,
    String? error,
  }) {
    return CommunityState(
      posts: posts ?? this.posts,
      events: events ?? this.events,
      students: students ?? this.students,
      followingIds: followingIds ?? this.followingIds,
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
      final results = await Future.wait([
        _repository.getPosts(),
        _repository.getEvents(),
        _repository.getStudents(),
      ]);
      final p = results[0] as List<PostModel>;
      final e = results[1] as List<StudyEventModel>;
      final s = results[2] as List<StudentProfileModel>;

      final followed = s.where((stud) => stud.isFollowing).map((stud) => stud.id).toSet();

      state = state.copyWith(
        posts: p,
        events: e,
        students: s,
        followingIds: followed,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<bool> toggleFollow(int studentId) async {
    final wasFollowing = state.followingIds.contains(studentId);
    // 1. Instant optimistic update so the UI hides the button in 0ms!
    final optimistic = Set<int>.from(state.followingIds);
    if (wasFollowing) {
      optimistic.remove(studentId);
    } else {
      optimistic.add(studentId);
    }
    state = state.copyWith(followingIds: optimistic);

    // 2. Network synchronization
    try {
      final res = await _repository.toggleFollowStudent(studentId);
      final isNowFollowing = res['following'] as bool? ?? (!wasFollowing);
      final confirmed = Set<int>.from(state.followingIds);
      if (isNowFollowing) {
        confirmed.add(studentId);
      } else {
        confirmed.remove(studentId);
      }
      state = state.copyWith(followingIds: confirmed);
      return isNowFollowing;
    } catch (_) {
      // Revert if network error
      final reverted = Set<int>.from(state.followingIds);
      if (wasFollowing) {
        reverted.add(studentId);
      } else {
        reverted.remove(studentId);
      }
      state = state.copyWith(followingIds: reverted);
      return wasFollowing;
    }
  }

  Future<List<StudentProfileModel>> fetchFollowers() async {
    return _repository.getFollowers();
  }

  Future<List<StudentProfileModel>> fetchFollowing() async {
    return _repository.getFollowing();
  }

  Future<bool> removeFollower(int followerId) async {
    try {
      final success = await _repository.removeFollower(followerId);
      _repository.getStudents().then((s) {
        state = state.copyWith(students: s);
      }).catchError((_) {});
      return success;
    } catch (_) {
      return false;
    }
  }

  void setActiveTab(int index) {
    state = state.copyWith(activeTab: index);
  }

  void selectCategory(String cat) {
    state = state.copyWith(selectedCategory: cat);
  }

  Future<bool> createPost({
    required String title,
    required String content,
    required String category,
    String? codeSnippet,
    String? codeLanguage,
    String? vscodeLiveshareUrl,
  }) async {
    try {
      final post = await _repository.createPost({
        'title': title,
        'content': content,
        'category': category,
        if (codeSnippet != null && codeSnippet.isNotEmpty) 'code_snippet': codeSnippet,
        if (codeLanguage != null && codeLanguage.isNotEmpty) 'code_language': codeLanguage,
        if (vscodeLiveshareUrl != null && vscodeLiveshareUrl.isNotEmpty) 'vscode_liveshare_url': vscodeLiveshareUrl,
      });
      state = state.copyWith(posts: [post, ...state.posts]);
      return true;
    } catch (e) {
      state = state.copyWith(error: e.toString());
      return false;
    }
  }

  Future<bool> updatePost(
    int postId, {
    required String title,
    required String content,
    required String category,
    String? codeSnippet,
    String? codeLanguage,
    String? vscodeLiveshareUrl,
  }) async {
    try {
      final updated = await _repository.updatePost(postId, {
        'title': title,
        'content': content,
        'category': category,
        if (codeSnippet != null) 'code_snippet': codeSnippet,
        if (codeLanguage != null) 'code_language': codeLanguage,
        if (vscodeLiveshareUrl != null) 'vscode_liveshare_url': vscodeLiveshareUrl,
      });
      state = state.copyWith(
        posts: state.posts.map((p) => p.id == postId ? updated : p).toList(),
      );
      return true;
    } catch (_) {
      // Optimistic local update
      state = state.copyWith(
        posts: state.posts.map((p) {
          if (p.id == postId) {
            return p.copyWith(
              title: title,
              content: content,
              category: category,
              codeSnippet: codeSnippet ?? p.codeSnippet,
              codeLanguage: codeLanguage ?? p.codeLanguage,
              vscodeLiveshareUrl: vscodeLiveshareUrl ?? p.vscodeLiveshareUrl,
            );
          }
          return p;
        }).toList(),
      );
      return true;
    }
  }

  Future<bool> deletePost(int postId) async {
    try {
      await _repository.deletePost(postId);
    } catch (_) {}
    state = state.copyWith(
      posts: state.posts.where((p) => p.id != postId).toList(),
    );
    return true;
  }

  Future<void> toggleReaction(int postId) async {
    try {
      await _repository.reactToPost(postId);
      state = state.copyWith(
        posts: state.posts.map((p) {
          if (p.id == postId) {
            final nowReacted = !p.hasReacted;
            return p.copyWith(
              hasReacted: nowReacted,
              reactionsCount: nowReacted ? p.reactionsCount + 1 : (p.reactionsCount - 1).clamp(0, 9999),
            );
          }
          return p;
        }).toList(),
      );
    } catch (_) {}
  }

  Future<void> toggleRsvp(int eventId, [String status = 'going']) async {
    try {
      await _repository.rsvpEvent(eventId, status);
      final refreshedEvents = await _repository.getEvents();
      state = state.copyWith(events: refreshedEvents);
    } catch (_) {}
  }

  Future<List<CommentModel>> getComments(int postId) async {
    try {
      return await _repository.getComments(postId);
    } catch (_) {
      return [];
    }
  }

  Future<CommentModel?> addComment(int postId, String content) async {
    try {
      final comment = await _repository.addComment(postId, content);
      state = state.copyWith(
        posts: state.posts.map((p) {
          if (p.id == postId) {
            return p.copyWith(commentsCount: p.commentsCount + 1);
          }
          return p;
        }).toList(),
      );
      return comment;
    } catch (_) {
      return null;
    }
  }

  Future<bool> createEvent(Map<String, dynamic> data) async {
    try {
      final ev = await _repository.createEvent(data);
      state = state.copyWith(events: [ev, ...state.events]);
      return true;
    } catch (e) {
      state = state.copyWith(error: e.toString());
      return false;
    }
  }

  Future<bool> updateEvent(int eventId, Map<String, dynamic> data) async {
    try {
      final ev = await _repository.updateEvent(eventId, data);
      state = state.copyWith(
        events: state.events.map((e) => e.id == eventId ? ev : e).toList(),
      );
      return true;
    } catch (_) {
      // Local optimistic fallback update
      state = state.copyWith(
        events: state.events.map((e) {
          if (e.id == eventId) {
            return e.copyWith(
              title: data['title'] as String? ?? e.title,
              description: data['description'] as String? ?? e.description,
              subject: data['subject'] as String? ?? e.subject,
              eventDate: data['event_date'] as String? ?? e.eventDate,
              startTime: data['start_time'] as String? ?? e.startTime,
              endTime: data['end_time'] as String? ?? e.endTime,
              location: data['location'] as String? ?? e.location,
              eventType: data['event_type'] as String? ?? e.eventType,
            );
          }
          return e;
        }).toList(),
      );
      return true;
    }
  }

  Future<bool> deleteEvent(int eventId) async {
    try {
      await _repository.deleteEvent(eventId);
    } catch (_) {}
    state = state.copyWith(
      events: state.events.where((e) => e.id != eventId).toList(),
    );
    return true;
  }
}

final communityProvider =
    StateNotifierProvider<CommunityNotifier, CommunityState>((ref) {
  final repo = ref.watch(communityRepositoryProvider);
  return CommunityNotifier(repo);
});
