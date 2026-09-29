class LeaderboardEntryModel {
  final int rank;
  final int userId;
  final String displayName;
  final double studyHours;
  final int currentStreak;
  final int trophiesCount;
  final bool isCurrentUser;
  final String? customQuote;

  LeaderboardEntryModel({
    required this.rank,
    required this.userId,
    required this.displayName,
    required this.studyHours,
    required this.currentStreak,
    required this.trophiesCount,
    required this.isCurrentUser,
    this.customQuote,
  });

  factory LeaderboardEntryModel.fromJson(Map<String, dynamic> json) {
    return LeaderboardEntryModel(
      rank: json['rank'] as int? ?? 1,
      userId: json['user_id'] as int? ?? 0,
      displayName: json['display_name'] as String? ?? 'Scholar',
      studyHours: double.tryParse('${json['study_hours']}') ?? 0.0,
      currentStreak: json['current_streak'] as int? ?? 0,
      trophiesCount: json['trophies_count'] as int? ?? 0,
      isCurrentUser: json['is_current_user'] as bool? ?? false,
      customQuote: json['custom_quote'] as String?,
    );
  }
}
