class PostModel {
  final int id;
  final String title;
  final String content;
  final String category;
  final String authorName;
  final String? authorAvatar;
  final int reactionsCount;
  final int commentsCount;
  final bool hasReacted;
  final String createdAt;

  PostModel({
    required this.id,
    required this.title,
    required this.content,
    required this.category,
    required this.authorName,
    this.authorAvatar,
    this.reactionsCount = 0,
    this.commentsCount = 0,
    this.hasReacted = false,
    this.createdAt = '',
  });

  factory PostModel.fromJson(Map<String, dynamic> json) {
    String name = 'Scholar';
    String? avatar;
    if (json['author'] is Map) {
      name = json['author']['full_name'] ?? json['author']['username'] ?? 'Scholar';
      avatar = json['author']['avatar'];
    } else if (json['author_name'] != null) {
      name = json['author_name'].toString();
    }

    return PostModel(
      id: json['id'] as int? ?? 0,
      title: json['title'] as String? ?? 'Discussion',
      content: json['content'] as String? ?? '',
      category: json['category'] as String? ?? 'General',
      authorName: name,
      authorAvatar: avatar,
      reactionsCount: json['reactions_count'] as int? ?? json['likes_count'] as int? ?? 0,
      commentsCount: json['comments_count'] as int? ?? 0,
      hasReacted: json['has_reacted'] as bool? ?? json['user_has_reacted'] as bool? ?? false,
      createdAt: json['created_at'] as String? ?? '',
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

  CommentModel({
    required this.id,
    required this.content,
    required this.authorName,
    this.authorAvatar,
    this.isHelpful = false,
    this.createdAt = '',
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
    );
  }
}

class StudyEventModel {
  final int id;
  final String title;
  final String description;
  final String eventDate;
  final String location;
  final String eventType;
  final int attendeesCount;
  final bool isAttending;

  StudyEventModel({
    required this.id,
    required this.title,
    required this.description,
    required this.eventDate,
    required this.location,
    required this.eventType,
    this.attendeesCount = 0,
    this.isAttending = false,
  });

  factory StudyEventModel.fromJson(Map<String, dynamic> json) {
    return StudyEventModel(
      id: json['id'] as int? ?? 0,
      title: json['title'] as String? ?? 'Study Session Meetup',
      description: json['description'] as String? ?? '',
      eventDate: json['event_date'] as String? ?? '',
      location: json['location'] as String? ?? 'Campus Library Room 204',
      eventType: json['event_type'] as String? ?? 'In-Person',
      attendeesCount: json['attendees_count'] as int? ?? json['rsvps_count'] as int? ?? 0,
      isAttending: json['is_attending'] as bool? ?? json['user_has_rsvped'] as bool? ?? false,
    );
  }
}
