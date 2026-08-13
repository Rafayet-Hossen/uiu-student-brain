import Button from "../../components/Button";
import ThemeToggle from "../../components/ThemeToggle";
import { useAuth } from "../auth/useAuth";

export default function DashboardPage() {
  const { user, logout } = useAuth();

  return (
    <div className="dashboard-screen">
      <header className="dashboard-header">
        <span className="dashboard-brand">Student Brain</span>
        <div className="dashboard-header-actions">
          <ThemeToggle />
          <Button variant="secondary" onClick={logout}>
            Logout
          </Button>
        </div>
      </header>
      <main className="dashboard-main">
        <h1>Welcome, {user?.full_name}</h1>
        <p className="auth-subtitle">This is your dashboard. More to come.</p>
      </main>
    </div>
  );
}
