class CatalogCourse {
  final String code;
  final String title;
  final double credits;
  final String trimester;
  final String prerequisite;

  const CatalogCourse({
    required this.code,
    required this.title,
    required this.credits,
    required this.trimester,
    this.prerequisite = 'X',
  });
}

const List<CatalogCourse> kCoursesCatalog = [
  CatalogCourse(code: 'ENG 1011', title: 'English I', credits: 3, trimester: 'Trimester 1', prerequisite: 'X'),
  CatalogCourse(code: 'BDS 1201', title: 'History of the Emergence of Bangladesh', credits: 2, trimester: 'Trimester 1', prerequisite: 'X'),
  CatalogCourse(code: 'CSE 1110', title: 'Introduction to Computer Systems', credits: 1, trimester: 'Trimester 1', prerequisite: 'X'),
  CatalogCourse(code: 'MATH 1151', title: 'Fundamental Calculus', credits: 3, trimester: 'Trimester 1', prerequisite: 'X'),
  CatalogCourse(code: 'ENG 1013', title: 'English II', credits: 3, trimester: 'Trimester 2', prerequisite: 'ENG 1011'),
  CatalogCourse(code: 'CSE 1111', title: 'Structured Programming Language', credits: 3, trimester: 'Trimester 2', prerequisite: 'CSE 1110'),
  CatalogCourse(code: 'CSE 1112', title: 'Structured Programming Language Laboratory', credits: 1, trimester: 'Trimester 2', prerequisite: 'CSE 1110'),
  CatalogCourse(code: 'CSE 2213', title: 'Discrete Mathematics', credits: 3, trimester: 'Trimester 2', prerequisite: 'X'),
  CatalogCourse(code: 'MATH 2183', title: 'Calculus and Linear Algebra', credits: 3, trimester: 'Trimester 3', prerequisite: 'MATH 1151'),
  CatalogCourse(code: 'PHY 2105', title: 'Physics', credits: 3, trimester: 'Trimester 3', prerequisite: 'X'),
  CatalogCourse(code: 'PHY 2106', title: 'Physics Lab', credits: 1, trimester: 'Trimester 3', prerequisite: 'X'),
  CatalogCourse(code: 'CSE 2215', title: 'Data Structure and Algorithms I', credits: 3, trimester: 'Trimester 3', prerequisite: 'CSE 1111'),
  CatalogCourse(code: 'CSE 2216', title: 'Data Structure and Algorithms I Laboratory', credits: 1, trimester: 'Trimester 3', prerequisite: 'CSE 1112'),
  CatalogCourse(code: 'MATH 2201', title: 'Coordinate Geometry and Vector Analysis', credits: 3, trimester: 'Trimester 4', prerequisite: 'MATH 1151'),
  CatalogCourse(code: 'CSE 1325', title: 'Digital Logic Design', credits: 3, trimester: 'Trimester 4', prerequisite: 'X'),
  CatalogCourse(code: 'CSE 1326', title: 'Digital Logic Design Lab', credits: 1, trimester: 'Trimester 4', prerequisite: 'X'),
  CatalogCourse(code: 'CSE 1115', title: 'Object Oriented Programming', credits: 3, trimester: 'Trimester 4', prerequisite: 'CSE 2215'),
  CatalogCourse(code: 'CSE 1116', title: 'Object Oriented Programming Lab', credits: 1, trimester: 'Trimester 4', prerequisite: 'CSE 2216'),
  CatalogCourse(code: 'MATH 2205', title: 'Probability and Statistics', credits: 3, trimester: 'Trimester 5', prerequisite: 'MATH 1151'),
  CatalogCourse(code: 'SOC 2101', title: 'Society, Technology and Engineering Ethics', credits: 3, trimester: 'Trimester 5', prerequisite: 'X'),
  CatalogCourse(code: 'CSE 2217', title: 'Data Structure and Algorithms II', credits: 3, trimester: 'Trimester 5', prerequisite: 'CSE 2215'),
  CatalogCourse(code: 'CSE 2218', title: 'Data Structure and Algorithms II Laboratory', credits: 1, trimester: 'Trimester 5', prerequisite: 'CSE 2216'),
  CatalogCourse(code: 'EEE 2113', title: 'Electrical Circuits', credits: 3, trimester: 'Trimester 5', prerequisite: 'X'),
  CatalogCourse(code: 'CSE 3521', title: 'Database Management Systems', credits: 3, trimester: 'Trimester 6', prerequisite: 'CSE 2215'),
  CatalogCourse(code: 'CSE 3522', title: 'Database Management Systems Lab', credits: 1, trimester: 'Trimester 6', prerequisite: 'CSE 2216'),
  CatalogCourse(code: 'EEE 2123', title: 'Electronics', credits: 3, trimester: 'Trimester 6', prerequisite: 'EEE 2113'),
  CatalogCourse(code: 'EEE 2124', title: 'Electronics Lab', credits: 1, trimester: 'Trimester 6', prerequisite: 'X'),
  CatalogCourse(code: 'CSE 4165', title: 'Web Programming', credits: 3, trimester: 'Trimester 6', prerequisite: 'CSE 1115, CSE 1116'),
  CatalogCourse(code: 'CSE 3313', title: 'Computer Architecture', credits: 3, trimester: 'Trimester 7', prerequisite: 'CSE 1325'),
  CatalogCourse(code: 'CSE 2118', title: 'Advanced Object Oriented Programming Lab', credits: 1, trimester: 'Trimester 7', prerequisite: 'CSE 1116'),
  CatalogCourse(code: 'BIO 3105', title: 'Biology for Engineers', credits: 3, trimester: 'Trimester 7', prerequisite: 'X'),
  CatalogCourse(code: 'CSE 3411', title: 'System Analysis and Design', credits: 3, trimester: 'Trimester 7', prerequisite: 'CSE 3521'),
  CatalogCourse(code: 'CSE 3412', title: 'System Analysis and Design Lab', credits: 1, trimester: 'Trimester 7', prerequisite: 'CSE 3522'),
  CatalogCourse(code: 'CSE 4325', title: 'Microprocessors and Microcontrollers', credits: 3, trimester: 'Trimester 8', prerequisite: 'CSE 3313'),
  CatalogCourse(code: 'CSE 4326', title: 'Microprocessors and Microcontrollers Lab', credits: 1, trimester: 'Trimester 8', prerequisite: 'EEE 2124'),
  CatalogCourse(code: 'CSE 3421', title: 'Software Engineering', credits: 3, trimester: 'Trimester 8', prerequisite: 'CSE 3411'),
  CatalogCourse(code: 'CSE 3422', title: 'Software Engineering Lab', credits: 1, trimester: 'Trimester 8', prerequisite: 'CSE 3412'),
  CatalogCourse(code: 'CSE 3811', title: 'Artificial Intelligence', credits: 3, trimester: 'Trimester 8', prerequisite: 'MATH 2205, CSE 2217'),
  CatalogCourse(code: 'CSE 3812', title: 'Artificial Intelligence Lab', credits: 1, trimester: 'Trimester 8', prerequisite: 'MATH 2205, CSE 2218'),
  CatalogCourse(code: 'CSE 2233', title: 'Theory of Computation', credits: 3, trimester: 'Trimester 9', prerequisite: 'X'),
  CatalogCourse(code: 'GED OPT1', title: 'General Education Optional-I', credits: 3, trimester: 'Trimester 9', prerequisite: 'X'),
  CatalogCourse(code: 'PMG 4101', title: 'Project Management', credits: 3, trimester: 'Trimester 9', prerequisite: 'CSE 3411'),
  CatalogCourse(code: 'CSE 3711', title: 'Computer Networks', credits: 3, trimester: 'Trimester 9', prerequisite: 'CSE 2217'),
  CatalogCourse(code: 'CSE 3712', title: 'Computer Networks Lab', credits: 1, trimester: 'Trimester 9', prerequisite: 'X'),
  CatalogCourse(code: 'GED OPT2', title: 'General Education Optional-II', credits: 3, trimester: 'Trimester 10', prerequisite: 'X'),
  CatalogCourse(code: 'CSE 4000 A', title: 'Final Year Design Project - I', credits: 2, trimester: 'Trimester 10', prerequisite: 'minimum 85 credits'),
  CatalogCourse(code: 'CSE ****', title: 'Elective - I', credits: 3, trimester: 'Trimester 10', prerequisite: 'X'),
  CatalogCourse(code: 'CSE 4509', title: 'Operating Systems', credits: 3, trimester: 'Trimester 10', prerequisite: 'CSE 2217, CSE 3313'),
  CatalogCourse(code: 'CSE 4510', title: 'Operating Systems Laboratory', credits: 1, trimester: 'Trimester 10', prerequisite: 'CSE 2218'),
  CatalogCourse(code: 'GED OPT3', title: 'General Education Optional - III', credits: 3, trimester: 'Trimester 11', prerequisite: 'X'),
  CatalogCourse(code: 'CSE ****', title: 'Elective - II', credits: 3, trimester: 'Trimester 11', prerequisite: 'X'),
  CatalogCourse(code: 'CSE ****', title: 'Elective - III', credits: 3, trimester: 'Trimester 11', prerequisite: 'X'),
  CatalogCourse(code: 'CSE 4000 B', title: 'Final Year Design Project - II', credits: 2, trimester: 'Trimester 11', prerequisite: 'CSE 4000 A'),
  CatalogCourse(code: 'CSE 4531', title: 'Computer Security', credits: 3, trimester: 'Trimester 11', prerequisite: 'CSE 3711, CSE 4509'),
  CatalogCourse(code: 'CSE 4000 C', title: 'Final Year Design Project - III', credits: 2, trimester: 'Trimester 12', prerequisite: 'CSE 4000 A & CSE 4000 B'),
  CatalogCourse(code: 'EEE 4261', title: 'Green Computing', credits: 3, trimester: 'Trimester 12', prerequisite: 'X'),
  CatalogCourse(code: 'CSE ****', title: 'Elective - IV', credits: 3, trimester: 'Trimester 12', prerequisite: 'X'),
  CatalogCourse(code: 'CSE ****', title: 'Elective - V', credits: 3, trimester: 'Trimester 12', prerequisite: 'X'),
  CatalogCourse(code: 'GED 1005', title: 'AI Literacy and Prompt Engineering', credits: 3, trimester: 'Trimester GenEd', prerequisite: 'X'),
  CatalogCourse(code: 'ECO 4101', title: 'Economics', credits: 3, trimester: 'Trimester GenEd', prerequisite: 'X'),
  CatalogCourse(code: 'ACT 2111', title: 'Financial and Managerial Accounting', credits: 3, trimester: 'Trimester GenEd', prerequisite: 'X'),
  CatalogCourse(code: 'TEC 2499', title: 'Technology Entrepreneurship', credits: 3, trimester: 'Trimester GenEd', prerequisite: 'X'),
];

List<CatalogCourse> searchCoursesCatalog(String query) {
  if (query.trim().isEmpty) return const [];
  final q = query.trim().toLowerCase();
  return kCoursesCatalog.where((c) {
    return c.code.toLowerCase().contains(q) || c.title.toLowerCase().contains(q);
  }).take(6).toList();
}
