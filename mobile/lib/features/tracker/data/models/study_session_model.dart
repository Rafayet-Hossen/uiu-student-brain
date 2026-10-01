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
  final int? courseId;
  final int? materialId;
  final String? courseTitle;
  final String? materialTitle;

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
    this.courseId,
    this.materialId,
    this.courseTitle,
    this.materialTitle,
  });

  bool get isScheduled => status == 'scheduled';
  bool get isInProgress => status == 'in_progress';
  bool get isCompleted => status == 'completed';

  int get totalMinutes => durationMinutes + extendedMinutes;

  factory StudySessionModel.fromJson(Map<String, dynamic> json) {
    int? cId;
    if (json['course'] is int) {
      cId = json['course'] as int?;
    } else if (json['course'] is Map) {
      cId = json['course']['id'] as int?;
    } else if (json['course_id'] != null) {
      cId = json['course_id'] as int?;
    }

    int? mId;
    if (json['material'] is int) {
      mId = json['material'] as int?;
    } else if (json['material'] is Map) {
      mId = json['material']['id'] as int?;
    } else if (json['material_id'] != null) {
      mId = json['material_id'] as int?;
    }

    String? cTitle;
    String? mTitle;
    if (json['course_details'] is Map) {
      cTitle = json['course_details']['title'] as String?;
    }
    if (json['material_details'] is Map) {
      mTitle = json['material_details']['title'] as String?;
    }

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
      quizScore: json['quiz_score'] != null ? double.tryParse('') : null,
      quizResults: json['quiz_results'] is Map ? Map<String, dynamic>.from(json['quiz_results'] as Map) : {},
      courseId: cId,
      materialId: mId,
      courseTitle: cTitle,
      materialTitle: mTitle,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'subject': subject,
      'duration_minutes': durationMinutes,
      'session_date': sessionDate,
      'start_time': startTime,
      'notes': notes,
      if (courseId != null) 'course': courseId,
      if (materialId != null) 'material': materialId,
    };
  }
}
