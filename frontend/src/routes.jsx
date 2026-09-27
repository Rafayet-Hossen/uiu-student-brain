import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";
import Spinner from "./components/Spinner";
import { useAuth } from "./features/auth/useAuth";
import LoginPage from "./features/auth/pages/LoginPage";
import RegisterPage from "./features/auth/pages/RegisterPage";
import OnboardingPage from "./features/auth/pages/OnboardingPage";
import DashboardPage from "./features/dashboard/DashboardPage";
import GradePlannerPage from "./features/grades/GradePlannerPage";
import CommunityPage from "./features/community/CommunityPage";
import StudyCenterPage from "./features/studycenter/StudyCenterPage";
import QuizPage from "./features/quiz/QuizPage";

function PageLoading() {
  return (
    <div className="page-loading">
      <Spinner standalone />
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <PageLoading />;
  if (!user)
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;

  // Mandatory Academic Onboarding Gate:
  if (!user.is_onboarded && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }
  if (user.is_onboarded && location.pathname === "/onboarding") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function PublicOnlyRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <PageLoading />;
  if (user) {
    return <Navigate to={user.is_onboarded ? "/dashboard" : "/onboarding"} replace />;
  }
  return children;
}

function RootRedirect() {
  const { user, loading } = useAuth();

  if (loading) return <PageLoading />;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.is_onboarded ? "/dashboard" : "/onboarding"} replace />;
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <LoginPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicOnlyRoute>
              <RegisterPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <OnboardingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/study-center"
          element={
            <ProtectedRoute>
              <StudyCenterPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/materials"
          element={<Navigate to="/study-center?tab=materials" replace />}
        />
        <Route
          path="/quiz/:materialId"
          element={
            <ProtectedRoute>
              <QuizPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/planner"
          element={<Navigate to="/study-center?tab=planner" replace />}
        />
        <Route
          path="/tracker"
          element={<Navigate to="/study-center?tab=tracker" replace />}
        />
        <Route
          path="/timer"
          element={
            <Navigate to="/study-center?tab=tracker&subtab=timer" replace />
          }
        />
        <Route
          path="/analytics"
          element={<Navigate to="/study-center?tab=analytics" replace />}
        />
        <Route
          path="/grades"
          element={
            <ProtectedRoute>
              <ErrorBoundary>
                <GradePlannerPage />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />
        <Route
          path="/community"
          element={
            <ProtectedRoute>
              <ErrorBoundary>
                <CommunityPage />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
