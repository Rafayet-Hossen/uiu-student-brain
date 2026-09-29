class StudySessionModel {
  final int id;
  final String subject;
  final int durationMinutes;
  final String sessionDate;
  final String? startTime;
  final String? endTime;
  final String status;
  final String notes;
  final int extendedMinutes;
  final bool quizTaken;
  final double? quizScore;
  final Map<String, dynamic> quizResults;

  StudySessionModel({
    required this.id,
    required this.subject,
    required this.durationMinutes,
    required this.sessionDate,
    this.startTime,
    this.endTime,
    required this.status,
    this.notes = '',
    this.extendedMinutes = 0,
    this.quizTaken = false,
    this.quizScore,
    this.quizResults = const {},
  });

  bool get isScheduled => status == 'scheduled';
  bool get isInProgress => status == 'in_progress';
  bool get isCompleted => status == 'completed';

  int get totalMinutes => durationMinutes + extendedMinutes;

  factory StudySessionModel.fromJson(Map<String, dynamic> json) {
    return StudySessionModel(
      id: json['id'] as int? ?? 0,
      subject: json['subject'] as String? ?? 'Study Focus',
      durationMinutes: json['duration_minutes'] as int? ?? 60,
      sessionDate: json['session_date'] as String? ?? '',
      startTime: json['start_time'] as String?,
      endTime: json['end_time'] as String?,
      status: json['status'] as String? ?? 'scheduled',
      notes: json['notes'] as String? ?? '',
      extendedMinutes: json['extended_minutes'] as int? ?? 0,
      quizTaken: json['quiz_taken'] as bool? ?? false,
      quizScore: json['quiz_score'] != null ? double.tryParse('${json['quiz_score']}') : null,
      quizResults: json['quiz_results'] is Map ? Map<String, dynamic>.from(json['quiz_results'] as Map) : {},
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'subject': subject,
      'duration_minutes': durationMinutes,
      'session_date': sessionDate,
      'start_time': startTime,
      'notes': notes,
    };
  }
}
