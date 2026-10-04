class PostModel {
  final int id;
  final String title;
  final String content;
  final String category;
  final String authorName;
  final int? authorId;
  final String? authorAvatar;
  final int reactionsCount;
  final int commentsCount;
  final bool hasReacted;
  final String createdAt;
  final String? codeSnippet;
  final String? codeLanguage;
  final String? vscodeLiveshareUrl;
  final bool isSolved;

  PostModel({
    required this.id,
    required this.title,
    required this.content,
    required this.category,
    required this.authorName,
    this.authorId,
    this.authorAvatar,
    this.reactionsCount = 0,
    this.commentsCount = 0,
    this.hasReacted = false,
    this.createdAt = '',
    this.codeSnippet,
    this.codeLanguage,
    this.vscodeLiveshareUrl,
    this.isSolved = false,
  });

  PostModel copyWith({
    int? id,
    String? title,
    String? content,
    String? category,
    String? authorName,
    int? authorId,
    String? authorAvatar,
    int? reactionsCount,
    int? commentsCount,
    bool? hasReacted,
    String? createdAt,
    String? codeSnippet,
    String? codeLanguage,
    String? vscodeLiveshareUrl,
    bool? isSolved,
  }) {
    return PostModel(
      id: id ?? this.id,
      title: title ?? this.title,
      content: content ?? this.content,
      category: category ?? this.category,
      authorName: authorName ?? this.authorName,
      authorId: authorId ?? this.authorId,
      authorAvatar: authorAvatar ?? this.authorAvatar,
      reactionsCount: reactionsCount ?? this.reactionsCount,
      commentsCount: commentsCount ?? this.commentsCount,
      hasReacted: hasReacted ?? this.hasReacted,
      createdAt: createdAt ?? this.createdAt,
      codeSnippet: codeSnippet ?? this.codeSnippet,
      codeLanguage: codeLanguage ?? this.codeLanguage,
      vscodeLiveshareUrl: vscodeLiveshareUrl ?? this.vscodeLiveshareUrl,
      isSolved: isSolved ?? this.isSolved,
    );
  }

  factory PostModel.fromJson(Map<String, dynamic> json) {
    String name = 'Scholar';
    String? avatar;
    int? authorId;
    if (json['author'] is Map) {
      name = json['author']['full_name'] ?? json['author']['username'] ?? json['author']['email'] ?? 'Scholar';
      avatar = json['author']['avatar'];
      authorId = json['author']['id'] as int?;
    } else if (json['author_name'] != null) {
      name = json['author_name'].toString();
    }
    if (authorId == null && json['author_id'] != null) {
      authorId = json['author_id'] as int?;
    }

    return PostModel(
      id: json['id'] as int? ?? 0,
      title: json['title'] as String? ?? 'Discussion',
      content: json['content'] as String? ?? '',
      category: json['category'] as String? ?? 'General',
      authorName: name,
      authorId: authorId,
      authorAvatar: avatar,
      reactionsCount: json['reactions_count'] as int? ?? json['likes_count'] as int? ?? 0,
      commentsCount: json['comments_count'] as int? ?? 0,
      hasReacted: json['has_reacted'] as bool? ?? json['is_liked'] as bool? ?? json['user_has_reacted'] as bool? ?? false,
      createdAt: json['created_at'] as String? ?? '',
      codeSnippet: json['code_snippet'] as String?,
      codeLanguage: json['code_language'] as String?,
      vscodeLiveshareUrl: json['vscode_liveshare_url'] as String?,
      isSolved: json['is_solved'] as bool? ?? false,
    );
  }
}

class CommentModel {
  final int id;
  final String content;
  final String authorName;
  final String? authorAvatar;
  final bool isHelpful;
  final String createdAt;
  final String? codeSolution;
  final String? codeLanguage;

  CommentModel({
    required this.id,
    required this.content,
    required this.authorName,
    this.authorAvatar,
    this.isHelpful = false,
    this.createdAt = '',
    this.codeSolution,
    this.codeLanguage,
  });

  factory CommentModel.fromJson(Map<String, dynamic> json) {
    String name = 'Scholar';
    String? avatar;
    if (json['author'] is Map) {
      name = json['author']['full_name'] ?? json['author']['username'] ?? 'Scholar';
      avatar = json['author']['avatar'];
    } else if (json['author_name'] != null) {
      name = json['author_name'].toString();
    }

    return CommentModel(
      id: json['id'] as int? ?? 0,
      content: json['content'] as String? ?? '',
      authorName: name,
      authorAvatar: avatar,
      isHelpful: json['is_helpful'] as bool? ?? false,
      createdAt: json['created_at'] as String? ?? '',
      codeSolution: json['code_solution'] as String?,
      codeLanguage: json['code_language'] as String?,
    );
  }
}

class StudyEventModel {
  final int id;
  final String title;
  final String description;
  final String subject;
  final String eventDate;
  final String startTime;
  final String endTime;
  final String location;
  final String eventType;
  final int attendeesCount;
  final int goingCount;
  final int interestedCount;
  final bool isAttending;
  final String? userRsvpStatus;
  final String? creatorName;
  final int? creatorId;

  StudyEventModel({
    required this.id,
    required this.title,
    required this.description,
    this.subject = 'Academics',
    required this.eventDate,
    this.startTime = '10:00:00',
    this.endTime = '12:00:00',
    required this.location,
    this.eventType = 'In-Person',
    this.attendeesCount = 0,
    this.goingCount = 0,
    this.interestedCount = 0,
    this.isAttending = false,
    this.userRsvpStatus,
    this.creatorName,
    this.creatorId,
  });

  StudyEventModel copyWith({
    int? id,
    String? title,
    String? description,
    String? subject,
    String? eventDate,
    String? startTime,
    String? endTime,
    String? location,
    String? eventType,
    int? attendeesCount,
    int? goingCount,
    int? interestedCount,
    bool? isAttending,
    String? userRsvpStatus,
    String? creatorName,
    int? creatorId,
  }) {
    return StudyEventModel(
      id: id ?? this.id,
      title: title ?? this.title,
      description: description ?? this.description,
      subject: subject ?? this.subject,
      eventDate: eventDate ?? this.eventDate,
      startTime: startTime ?? this.startTime,
      endTime: endTime ?? this.endTime,
      location: location ?? this.location,
      eventType: eventType ?? this.eventType,
      attendeesCount: attendeesCount ?? this.attendeesCount,
      goingCount: goingCount ?? this.goingCount,
      interestedCount: interestedCount ?? this.interestedCount,
      isAttending: isAttending ?? this.isAttending,
      userRsvpStatus: userRsvpStatus ?? this.userRsvpStatus,
      creatorName: creatorName ?? this.creatorName,
      creatorId: creatorId ?? this.creatorId,
    );
  }

  factory StudyEventModel.fromJson(Map<String, dynamic> json) {
    String? creator;
    int? creatorId;
    if (json['creator'] is Map) {
      creator = json['creator']['full_name'] ?? json['creator']['username'] ?? json['creator']['email'];
      creatorId = json['creator']['id'] as int?;
    } else if (json['creator_id'] != null) {
      creatorId = json['creator_id'] as int?;
    }

    final going = json['going_count'] as int? ?? 0;
    final interested = json['interested_count'] as int? ?? 0;
    final rsvps = json['rsvp_count'] as int? ?? json['attendees_count'] as int? ?? (going + interested);
    final userStatus = json['user_rsvp_status'] as String?;

    return StudyEventModel(
      id: json['id'] as int? ?? 0,
      title: json['title'] as String? ?? 'Study Session Meetup',
      description: json['description'] as String? ?? '',
      subject: json['subject'] as String? ?? 'Academic Study',
      eventDate: json['event_date'] as String? ?? '',
      startTime: json['start_time'] as String? ?? '',
      endTime: json['end_time'] as String? ?? '',
      location: json['location'] as String? ?? 'Campus Library Room 204',
      eventType: json['event_type'] as String? ?? 'In-Person',
      attendeesCount: rsvps,
      goingCount: going,
      interestedCount: interested,
      isAttending: json['is_attending'] as bool? ?? json['is_rsvped'] as bool? ?? (userStatus == 'going' || userStatus == 'interested'),
      userRsvpStatus: userStatus,
      creatorName: creator,
      creatorId: creatorId,
    );
  }
}

class StudentProfileModel {
  final int id;
  final String email;
  final String fullName;
  final int followersCount;
  final int followingCount;
  final bool isFollowing;

  StudentProfileModel({
    required this.id,
    required this.email,
    required this.fullName,
    this.followersCount = 0,
    this.followingCount = 0,
    this.isFollowing = false,
  });

  factory StudentProfileModel.fromJson(Map<String, dynamic> json) {
    final rawName = (json['full_name'] as String? ??
            json['name'] as String? ??
            json['author_name'] as String? ??
            json['username'] as String? ??
            '')
        .trim();
    final rawEmail = (json['email'] as String? ?? '').trim();

    String effectiveName = rawName;
    if (effectiveName.isEmpty && rawEmail.isNotEmpty) {
      final handle = rawEmail.split('@').first;
      // Convert e.g. "baitun.bithy" to "Baitun Bithy"
      effectiveName = handle
          .replaceAll('.', ' ')
          .replaceAll('_', ' ')
          .split(' ')
          .where((p) => p.isNotEmpty)
          .map((p) => p[0].toUpperCase() + p.substring(1))
          .join(' ');
    }
    if (effectiveName.isEmpty) {
      effectiveName = 'Scholar Student';
    }

    return StudentProfileModel(
      id: json['id'] as int? ?? (json['user_id'] as int? ?? 0),
      email: rawEmail.isNotEmpty ? rawEmail : 'student@uiu.ac.bd',
      fullName: effectiveName,
      followersCount: json['followers_count'] as int? ?? 0,
      followingCount: json['following_count'] as int? ?? 0,
      isFollowing: json['is_following'] as bool? ?? false,
    );
  }
}
