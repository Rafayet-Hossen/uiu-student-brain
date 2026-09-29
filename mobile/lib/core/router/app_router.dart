import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/ai/presentation/pages/course_chat_page.dart';
import '../../features/ai/presentation/pages/quiz_page.dart';
import '../../features/ai/presentation/pages/quiz_result_page.dart';
import '../../features/analytics/presentation/pages/analytics_page.dart';
import '../../features/auth/presentation/pages/forgot_password_page.dart';
import '../../features/auth/presentation/pages/login_page.dart';
import '../../features/auth/presentation/pages/register_page.dart';
import '../../features/auth/presentation/pages/splash_page.dart';
import '../../features/auth/presentation/providers/auth_provider.dart';
import '../../features/community/presentation/pages/community_page.dart';
import '../../features/community/presentation/pages/post_detail_page.dart';
import '../../features/dashboard/presentation/pages/dashboard_page.dart';
import '../../features/grades/presentation/pages/grades_page.dart';
import '../../features/leaderboard/presentation/pages/leaderboard_page.dart';
import '../../features/main_shell/presentation/pages/main_shell_page.dart';
import '../../features/materials/presentation/pages/material_reader_page.dart';
import '../../features/materials/presentation/pages/materials_page.dart';
import '../../features/planner/presentation/pages/planner_page.dart';
import '../../features/profile/presentation/pages/profile_page.dart';
import '../../features/profile/presentation/pages/settings_page.dart';
import '../../features/tracker/presentation/pages/live_focus_page.dart';
import '../../features/tracker/presentation/pages/tracker_page.dart';

class RouterNotifier extends ChangeNotifier {
  final Ref _ref;

  RouterNotifier(this._ref) {
    _ref.listen<AuthState>(
      authProvider,
      (_, __) => notifyListeners(),
    );
  }
}

final routerNotifierProvider = Provider<RouterNotifier>((ref) {
  return RouterNotifier(ref);
});

final rootNavigatorKey = GlobalKey<NavigatorState>(debugLabel: 'root');

final routerProvider = Provider<GoRouter>((ref) {
  final notifier = ref.watch(routerNotifierProvider);

  return GoRouter(
    navigatorKey: rootNavigatorKey,
    initialLocation: '/',
    refreshListenable: notifier,
    redirect: (context, state) {
      final auth = ref.read(authProvider);
      final isSplash = state.matchedLocation == '/';
      final isAuthRoute = state.matchedLocation == '/login' ||
          state.matchedLocation == '/register' ||
          state.matchedLocation == '/forgot-password';

      // Allow splash screen to display its animation and navigate on its own
      if (isSplash) {
        return null;
      }

      // If not logged in and attempting to visit a protected route
      if (!auth.isAuthenticated && !isAuthRoute) {
        return '/login';
      }

      // If already logged in and visiting login/register/forgot-password
      if (auth.isAuthenticated && isAuthRoute) {
        return '/dashboard';
      }

      return null;
    },
    routes: [
      GoRoute(
        path: '/',
        builder: (context, state) => const SplashPage(),
      ),
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginPage(),
      ),
      GoRoute(
        path: '/register',
        builder: (context, state) => const RegisterPage(),
      ),
      GoRoute(
        path: '/forgot-password',
        builder: (context, state) => const ForgotPasswordPage(),
      ),
      GoRoute(
        path: '/grades',
        builder: (context, state) => const GradesPage(),
      ),
      GoRoute(
        path: '/tracker/live',
        builder: (context, state) => const LiveFocusPage(),
      ),
      GoRoute(
        path: '/ai/quiz/:sessionId',
        builder: (context, state) {
          final sessionId = int.tryParse(state.pathParameters['sessionId'] ?? '0') ?? 0;
          return QuizPage(sessionId: sessionId);
        },
      ),
      GoRoute(
        path: '/ai/quiz/:sessionId/result',
        builder: (context, state) {
          final sessionId = int.tryParse(state.pathParameters['sessionId'] ?? '0') ?? 0;
          return QuizResultPage(sessionId: sessionId);
        },
      ),
      GoRoute(
        path: '/ai/chat/:courseId',
        builder: (context, state) {
          final courseId = int.tryParse(state.pathParameters['courseId'] ?? '0') ?? 0;
          final courseTitle = state.uri.queryParameters['title'] ?? 'Course Assistant';
          return CourseChatPage(courseId: courseId, courseTitle: courseTitle);
        },
      ),
      GoRoute(
        path: '/materials/:materialId',
        builder: (context, state) {
          final materialId = int.tryParse(state.pathParameters['materialId'] ?? '0') ?? 0;
          return MaterialReaderPage(materialId: materialId);
        },
      ),
      GoRoute(
        path: '/community/post/:postId',
        builder: (context, state) {
          final postId = int.tryParse(state.pathParameters['postId'] ?? '0') ?? 0;
          return PostDetailPage(postId: postId);
        },
      ),
      GoRoute(
        path: '/community/leaderboard',
        builder: (context, state) => const LeaderboardPage(),
      ),
      GoRoute(
        path: '/settings',
        builder: (context, state) => const SettingsPage(),
      ),

      // Main Shell with Bottom Navigation / Navigation Rail
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) {
          return MainShellPage(navigationShell: navigationShell);
        },
        branches: [
          // 0: Dashboard
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/dashboard',
                builder: (context, state) => const DashboardPage(),
              ),
            ],
          ),
          // 1: Planner
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/planner',
                builder: (context, state) => const PlannerPage(),
              ),
            ],
          ),
          // 2: Tracker
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/tracker',
                builder: (context, state) => const TrackerPage(),
              ),
            ],
          ),
          // 3: Materials
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/materials',
                builder: (context, state) => const MaterialsPage(),
              ),
            ],
          ),
          // 4: Community
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/community',
                builder: (context, state) => const CommunityPage(),
              ),
            ],
          ),
          // 5: Analytics
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/analytics',
                builder: (context, state) => const AnalyticsPage(),
              ),
            ],
          ),
          // 6: Profile
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/profile',
                builder: (context, state) => const ProfilePage(),
              ),
            ],
          ),
        ],
      ),
    ],
  );
});
