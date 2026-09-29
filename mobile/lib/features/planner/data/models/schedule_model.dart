class ScheduleModel {
  final int id;
  final String subject;
  final String startTime;
  final String endTime;
  final String? deadline;
  final List<String> days;
  final String notes;

  ScheduleModel({
    required this.id,
    required this.subject,
    required this.startTime,
    required this.endTime,
    this.deadline,
    this.days = const [],
    this.notes = '',
  });

  factory ScheduleModel.fromJson(Map<String, dynamic> json) {
    List<String> parsedDays = [];
    if (json['days'] is List) {
      parsedDays = (json['days'] as List).map((e) => e.toString()).toList();
    }

    return ScheduleModel(
      id: json['id'] as int? ?? 0,
      subject: json['subject'] as String? ?? 'Routine Class',
      startTime: json['start_time'] as String? ?? '09:00',
      endTime: json['end_time'] as String? ?? '10:30',
      deadline: json['deadline'] as String?,
      days: parsedDays,
      notes: json['notes'] as String? ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'subject': subject,
      'start_time': startTime,
      'end_time': endTime,
      'deadline': deadline,
      'days': days,
      'notes': notes,
    };
  }
}
