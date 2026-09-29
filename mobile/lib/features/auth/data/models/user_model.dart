class UserModel {
  final int id;
  final String email;
  final String fullName;
  final String? department;
  final String? institution;
  final String? studentId;
  final String? avatar;

  UserModel({
    required this.id,
    required this.email,
    required this.fullName,
    this.department,
    this.institution,
    this.studentId,
    this.avatar,
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
    };
  }
}
