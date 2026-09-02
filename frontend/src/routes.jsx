import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import Spinner from "./components/Spinner";
import { useAuth } from "./features/auth/useAuth";
import LoginPage from "./features/auth/pages/LoginPage";
import RegisterPage from "./features/auth/pages/RegisterPage";
import DashboardPage from "./features/dashboard/DashboardPage";
import PlannerPage from "./features/planner/PlannerPage";
import GradePlannerPage from "./features/grades/GradePlannerPage";
import TrackerPage from "./features/tracker/TrackerPage";
import CommunityPage from "./features/community/CommunityPage";
import AnalyticsPage from "./features/analytics/AnalyticsPage";
import MaterialsPage from "./features/materials/MaterialsPage";

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
  return children;
}

function PublicOnlyRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <PageLoading />;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

function RootRedirect() {
  const { user, loading } = useAuth();

  if (loading) return <PageLoading />;
  return <Navigate to={user ? "/dashboard" : "/login"} replace />;
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
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/planner"
          element={
            <ProtectedRoute>
              <PlannerPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/grades"
          element={
            <ProtectedRoute>
              <GradePlannerPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tracker"
          element={
            <ProtectedRoute>
              <TrackerPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <AnalyticsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/community"
          element={
            <ProtectedRoute>
              <CommunityPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/materials"
          element={
            <ProtectedRoute>
              <MaterialsPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
