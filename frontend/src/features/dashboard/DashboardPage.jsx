import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Badge from "../../components/Badge";
import Button from "../../components/Button";
import Card from "../../components/Card";
import Navbar from "../../components/Navbar";
import Spinner from "../../components/Spinner";
import { useAuth } from "../auth/useAuth";
import { getSchedules } from "../planner/api";
import { getGradePlans } from "../grades/api";
import { getStudySessions } from "../tracker/api";

export default function DashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState([]);
  const [gradePlans, setGradePlans] = useState([]);
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      try {
        const [schedulesData, gradesData, sessionsData] =
          await Promise.allSettled([
            getSchedules(),
            getGradePlans(),
            getStudySessions(),
          ]);

        if (schedulesData.status === "fulfilled")
          setSchedules(schedulesData.value);
        if (gradesData.status === "fulfilled") setGradePlans(gradesData.value);
        if (sessionsData.status === "fulfilled")
          setSessions(sessionsData.value);
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  const totalStudyMinutes = sessions.reduce(
    (total, session) => total + Number(session.duration_minutes || 0),
    0,
  );
  const totalHours = Math.floor(totalStudyMinutes / 60);
  const remainingMins = totalStudyMinutes % 60;

  const topGradePlan = gradePlans[0];

  const currentDate = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="app-screen">
      <Navbar />

      <main className="main-content">
        {/* Academic Hero */}
        <section className="academic-hero">
          <div className="hero-text-col">
            <div className="hero-badge">
              <Badge variant="accent">Academic Workspace</Badge>
            </div>
            <h1 className="hero-title">
              Welcome back, {user?.full_name || "Scholar"}!
            </h1>
            <p className="hero-subtitle">
              Track routines, project GPA targets, and manage your academic
              performance from one unified dashboard.
            </p>
          </div>

          <div className="hero-date-badge">
            <span>🗓️</span>
            <span>{currentDate}</span>
          </div>
        </section>

        {/* Academic Stats Overview Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-card-header">
              <span className="stat-label">Study Schedule</span>
              <div className="stat-icon">📅</div>
            </div>
            <p className="stat-number">{loading ? "..." : schedules.length}</p>
            <p className="stat-subtext">
              {schedules.length === 1
                ? "1 active study routine"
                : `${schedules.length} active study routines`}
            </p>
          </div>

          <div className="stat-card">
            <div className="stat-card-header">
              <span className="stat-label">Target GPA</span>
              <div className="stat-icon">🎓</div>
            </div>
            <p className="stat-number">
              {loading
                ? "..."
                : topGradePlan
                  ? Number(topGradePlan.target_gpa).toFixed(2)
                  : "N/A"}
            </p>
            <p className="stat-subtext">
              {topGradePlan
                ? `Current: ${Number(topGradePlan.current_gpa).toFixed(2)} (${topGradePlan.completed_credits}/${topGradePlan.total_credits} cr)`
                : "No grade plan configured yet"}
            </p>
          </div>

          <div className="stat-card">
            <div className="stat-card-header">
              <span className="stat-label">Total Time Studied</span>
              <div className="stat-icon">⏱️</div>
            </div>
            <p className="stat-number">
              {loading ? "..." : `${totalHours}h ${remainingMins}m`}
            </p>
            <p className="stat-subtext">
              {sessions.length === 1
                ? "Across 1 session"
                : `Across ${sessions.length} logged sessions`}
            </p>
          </div>
        </div>

        {/* Academic Modules Grid */}
        <h2 className="section-title">Academic Modules</h2>

        <div className="features-grid">
          {/* Study Planner Hub */}
          <Card className="feature-hub-card">
            <div>
              <div className="feature-hub-header">
                <div className="feature-hub-icon">📅</div>
                <div className="feature-hub-body">
                  <Badge variant="accent">Schedule</Badge>
                  <h3>Study Schedule Maker</h3>
                  <p>
                    Build structured weekly routines, organize course workloads,
                    and track assignment deadlines.
                  </p>
                </div>
              </div>
            </div>

            <Link to="/planner">
              <Button className="btn-block">Open Study Planner →</Button>
            </Link>
          </Card>

          {/* Grade Planner Hub */}
          <Card className="feature-hub-card">
            <div>
              <div className="feature-hub-header">
                <div className="feature-hub-icon">🎓</div>
                <div className="feature-hub-body">
                  <Badge variant="success">Performance</Badge>
                  <h3>Grade Planner & Projection</h3>
                  <p>
                    Calculate required GPAs on remaining credit hours to achieve
                    degree honors and target cumulative GPAs.
                  </p>
                </div>
              </div>
            </div>

            <Link to="/grades">
              <Button className="btn-block">Open Grade Planner →</Button>
            </Link>
          </Card>

          {/* Study Tracker Hub */}
          <Card className="feature-hub-card">
            <div>
              <div className="feature-hub-header">
                <div className="feature-hub-icon">⏱️</div>
                <div className="feature-hub-body">
                  <Badge variant="warning">Focus</Badge>
                  <h3>Study Session Tracker</h3>
                  <p>
                    Log dedicated study hours by subject, track your focus
                    history, and maintain consistent study habits.
                  </p>
                </div>
              </div>
            </div>

            <Link to="/tracker">
              <Button className="btn-block">Open Study Tracker →</Button>
            </Link>
          </Card>

          {/* Community Hub */}
          <Card className="feature-hub-card">
            <div>
              <div className="feature-hub-header">
                <div className="feature-hub-icon">💬</div>
                <div className="feature-hub-body">
                  <Badge variant="accent">Social</Badge>
                  <h3>Academic Community</h3>
                  <p>
                    Connect with peer scholars, discuss exam topics, collaborate
                    in study groups, and schedule meetups.
                  </p>
                </div>
              </div>
            </div>

            <Link to="/community">
              <Button className="btn-block">Open Community Hub →</Button>
            </Link>
          </Card>
        </div>
      </main>
    </div>
  );
}
