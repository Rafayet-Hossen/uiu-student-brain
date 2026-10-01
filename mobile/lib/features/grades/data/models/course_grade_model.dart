class CourseGradeModel {
  final int id;
  final String courseCode;
  final String courseName;
  final double credits;
  final double gradePoint;
  final String gradeLetter;
  final String semester;
  final bool isRetake;
  final double? cgpaJump;
  final double? projectedCgpa;

  CourseGradeModel({
    required this.id,
    required this.courseCode,
    required this.courseName,
    required this.credits,
    required this.gradePoint,
    required this.gradeLetter,
    this.semester = '',
    this.isRetake = false,
    this.cgpaJump,
    this.projectedCgpa,
  });

  factory CourseGradeModel.fromJson(Map<String, dynamic> json) {
    double parseD(dynamic v, double fallback) {
      if (v == null) return fallback;
      if (v is num) return v.toDouble();
      return double.tryParse(v.toString()) ?? fallback;
    }

    return CourseGradeModel(
      id: json['id'] as int? ?? 0,
      courseCode: json['course_code']?.toString() ?? '',
      courseName: json['course_name']?.toString() ?? '',
      credits: parseD(json['credits'], 3.0),
      gradePoint: parseD(json['grade_point'] ?? json['current_grade_point'], 0.0),
      gradeLetter: json['grade_letter']?.toString() ?? json['current_grade_letter']?.toString() ?? 'C',
      semester: json['semester']?.toString() ?? '',
      isRetake: json['is_retake'] == true,
      cgpaJump: json['cgpa_jump_4'] != null ? parseD(json['cgpa_jump_4'], 0.0) : null,
      projectedCgpa: json['projected_cgpa_4'] != null ? parseD(json['projected_cgpa_4'], 0.0) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'course_code': courseCode,
      'course_name': courseName,
      'credits': credits,
      'grade_point': gradePoint,
      'grade_letter': gradeLetter,
      'semester': semester,
      'is_retake': isRetake,
      if (cgpaJump != null) 'cgpa_jump_4': cgpaJump,
      if (projectedCgpa != null) 'projected_cgpa_4': projectedCgpa,
    };
  }
}

