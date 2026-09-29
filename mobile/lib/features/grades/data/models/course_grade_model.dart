class CourseGradeModel {
  final int id;
  final String courseCode;
  final String courseTitle;
  final double credits;
  final String grade;
  final double gradePoint;
  final String semester;
  final bool isRetake;

  const CourseGradeModel({
    required this.id,
    required this.courseCode,
    required this.courseTitle,
    required this.credits,
    required this.grade,
    required this.gradePoint,
    this.semester = 'Fall 2024',
    this.isRetake = false,
  });

  factory CourseGradeModel.fromJson(Map<String, dynamic> json) {
    return CourseGradeModel(
      id: json['id'] as int? ?? 0,
      courseCode: json['course_code'] as String? ?? json['courseCode'] as String? ?? '',
      courseTitle: json['course_title'] as String? ?? json['courseTitle'] as String? ?? '',
      credits: (json['credits'] as num?)?.toDouble() ?? 3.0,
      grade: json['grade'] as String? ?? 'A',
      gradePoint: (json['grade_point'] as num?)?.toDouble() ??
          (json['gradePoint'] as num?)?.toDouble() ??
          4.0,
      semester: json['semester'] as String? ?? 'Fall 2024',
      isRetake: json['is_retake'] as bool? ?? json['isRetake'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'course_code': courseCode,
      'course_title': courseTitle,
      'credits': credits,
      'grade': grade,
      'grade_point': gradePoint,
      'semester': semester,
      'is_retake': isRetake,
    };
  }

  CourseGradeModel copyWith({
    int? id,
    String? courseCode,
    String? courseTitle,
    double? credits,
    String? grade,
    double? gradePoint,
    String? semester,
    bool? isRetake,
  }) {
    return CourseGradeModel(
      id: id ?? this.id,
      courseCode: courseCode ?? this.courseCode,
      courseTitle: courseTitle ?? this.courseTitle,
      credits: credits ?? this.credits,
      grade: grade ?? this.grade,
      gradePoint: gradePoint ?? this.gradePoint,
      semester: semester ?? this.semester,
      isRetake: isRetake ?? this.isRetake,
    );
  }
}
