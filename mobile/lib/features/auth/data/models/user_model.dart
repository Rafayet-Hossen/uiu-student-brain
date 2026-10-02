class UserModel {
  final int id;
  final String email;
  final String fullName;
  final String? department;
  final String? institution;
  final String? studentId;
  final String? avatar;
  final bool isOnboarded;
  final String? currentTrimester;
  final double? currentGpa;
  final double? targetGpa;
  final int? targetDailyMinutes;

  UserModel({
    required this.id,
    required this.email,
    required this.fullName,
    this.department,
    this.institution,
    this.studentId,
    this.avatar,
    this.isOnboarded = false,
    this.currentTrimester,
    this.currentGpa,
    this.targetGpa,
    this.targetDailyMinutes,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] as int? ?? 0,
      email: json['email'] as String? ?? '',
      fullName: json['full_name'] as String? ?? json['username'] as String? ?? 'Scholar',
      department: json['department'] as String?,
      institution: json['institution'] as String?,
      studentId: json['student_id'] as String?,
      avatar: json['avatar'] as String? ?? json['profile_image'] as String?,
      isOnboarded: json['is_onboarded'] as bool? ?? false,
      currentTrimester: json['current_trimester'] as String?,
      currentGpa: (json['current_gpa'] != null) ? double.tryParse('${json['current_gpa']}') : null,
      targetGpa: (json['target_gpa'] != null) ? double.tryParse('${json['target_gpa']}') : null,
      targetDailyMinutes: json['target_daily_minutes'] as int?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'full_name': fullName,
      'department': department,
      'institution': institution,
      'student_id': studentId,
      'avatar': avatar,
      'is_onboarded': isOnboarded,
      'current_trimester': currentTrimester,
      'current_gpa': currentGpa,
      'target_gpa': targetGpa,
      'target_daily_minutes': targetDailyMinutes,
    };
  }

  UserModel copyWith({
    int? id,
    String? email,
    String? fullName,
    String? department,
    String? institution,
    String? studentId,
    String? avatar,
    bool? isOnboarded,
    String? currentTrimester,
    double? currentGpa,
    double? targetGpa,
    int? targetDailyMinutes,
  }) {
    return UserModel(
      id: id ?? this.id,
      email: email ?? this.email,
      fullName: fullName ?? this.fullName,
      department: department ?? this.department,
      institution: institution ?? this.institution,
      studentId: studentId ?? this.studentId,
      avatar: avatar ?? this.avatar,
      isOnboarded: isOnboarded ?? this.isOnboarded,
      currentTrimester: currentTrimester ?? this.currentTrimester,
      currentGpa: currentGpa ?? this.currentGpa,
      targetGpa: targetGpa ?? this.targetGpa,
      targetDailyMinutes: targetDailyMinutes ?? this.targetDailyMinutes,
    );
  }
}
