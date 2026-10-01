class ApiEndpoints {
  ApiEndpoints._();

  // Production Render Backend URL (matches website live backend)
  static const String defaultBaseUrl = 'https://uiu-student-brain.onrender.com/api';

  // Accounts
  static const String login = '/accounts/login/';
  static const String register = '/accounts/register/';
  static const String tokenRefresh = '/accounts/token/refresh/';
  static const String me = '/accounts/me/';
  static const String profileSummary = '/accounts/profile-summary/';
  static const String notifications = '/accounts/notifications/';

  // Planner
  static const String schedules = '/planner/schedules/';
  static String scheduleDetail(int id) => '/planner/schedules/$id/';

  // Grades
  static const String gradePlans = '/grades/plans/';
  static String gradePlanDetail(int id) => '/grades/plans/$id/';
  static const String courseGrades = '/grades/courses/';
  static String courseGradeDetail(int id) => '/grades/courses/$id/';
  static const String retakeAdvisor = '/grades/retake-advisor/';
  static const String uploadTranscript = '/grades/transcript/upload/';

  // Tracker
  static const String studySessions = '/tracker/sessions/';
  static String studySessionDetail(int id) => '/tracker/sessions/$id/';
  static String startSession(int id) => '/tracker/sessions/$id/start/';
  static String completeSession(int id) => '/tracker/sessions/$id/complete/';
  static String extendSession(int id) => '/tracker/sessions/$id/extend/';
  static String generateSessionQuiz(int id) => '/tracker/sessions/$id/quiz/generate/';
  static String submitSessionQuiz(int id) => '/tracker/sessions/$id/quiz/submit/';
  static const String streaks = '/tracker/streaks/';
  static const String rewards = '/tracker/rewards/';
  static const String studyGoal = '/tracker/goal/';

  // Community
  static const String posts = '/community/posts/';
  static String postDetail(int id) => '/community/posts/$id/';
  static String postReact(int id) => '/community/posts/$id/react/';
  static String postComments(int id) => '/community/posts/$id/comments/';
  static String commentDetail(int id) => '/community/comments/$id/';
  static String commentMarkHelpful(int id) => '/community/comments/$id/mark-helpful/';
  static const String events = '/community/events/';
  static String eventDetail(int id) => '/community/events/$id/';
  static String eventRsvp(int id) => '/community/events/$id/rsvp/';
  static const String students = '/community/students/';
  static String studentFollow(int id) => '/community/students/$id/follow/';
  static const String leaderboard = '/community/leaderboard/';
  static const String leaderboardStatus = '/community/leaderboard/status/';
  static const String leaderboardOptIn = '/community/leaderboard/opt-in/';

  // Materials & Courses
  static const String semesters = '/materials/semesters/';
  static String semesterCourses(int semesterId) => '/materials/semesters/$semesterId/courses/';
  static const String globalCourses = '/materials/courses/';
  static String courseMaterials(int courseId) => '/materials/courses/$courseId/materials/';
  static String courseChat(int courseId) => '/materials/courses/$courseId/chat/';
  static const String globalMaterials = '/materials/materials/';
  static const String materialStats = '/materials/materials/stats/';
  static String materialDetail(int id) => '/materials/materials/$id/';
  static String materialAnalyze(int id) => '/materials/materials/$id/analyze/';
  static String materialDownload(int id) => '/materials/materials/$id/download/';

  // Analytics
  static const String analyticsDashboard = '/analytics/dashboard/';
}
