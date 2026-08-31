import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Badge from "../../components/Badge";
import Button from "../../components/Button";
import Card from "../../components/Card";
import Navbar from "../../components/Navbar";
import { useAuth } from "../auth/useAuth";
import { getSchedules } from "../planner/api";
import { getGradePlans } from "../grades/api";
import { getStreakSummary, getStudySessions } from "../tracker/api";

export default function DashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState([]);
  const [gradePlans, setGradePlans] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [streakData, setStreakData] = useState(null);

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      try {
        const [schedulesData, gradesData, sessionsData, streakRes] =
          await Promise.allSettled([
            getSchedules(),
            getGradePlans(),
            getStudySessions(),
            getStreakSummary(),
          ]);

        if (schedulesData.status === "fulfilled")
          setSchedules(schedulesData.value);
        if (gradesData.status === "fulfilled") setGradePlans(gradesData.value);
        if (sessionsData.status === "fulfilled")
          setSessions(sessionsData.value);
        if (streakRes.status === "fulfilled") setStreakData(streakRes.value);
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

  const currentStreak = streakData?.current_streak || 0;

  return (
    <div className="app-screen">
      <Navbar />

      <main className="main-content">
        {/* Academic Hero */}
        <section className="academic-hero">
          <div className="hero-text-col">
            <div className="hero-badge">
              <Badge variant="accent">Academic Command Center</Badge>
            </div>
            <h1 className="hero-title">
              Welcome back, {user?.full_name || "Scholar"}!
            </h1>
            <p className="hero-subtitle">
              Track routines, monitor active streaks, project GPA targets, and manage academic performance.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "flex-end" }}>
            <div className="hero-date-badge">
              <span>🗓️</span>
              <span>{currentDate}</span>
            </div>

            {currentStreak > 0 && (
              <Badge variant="warning" style={{ fontSize: "0.875rem", padding: "6px 12px" }}>
                🔥 {currentStreak} Day Study Streak Active
              </Badge>
            )}
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
              <span className="stat-label">Study Streak & Focus</span>
              <div className="stat-icon">🔥</div>
            </div>
            <p className="stat-number">
              {loading ? "..." : `${currentStreak} Days`}
            </p>
            <p className="stat-subtext">
              {streakData?.today_minutes > 0
                ? `⚡ ${streakData.today_minutes}m studied today (${totalHours}h ${remainingMins}m total)`
                : `Total ${totalHours}h ${remainingMins}m logged`}
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
                    Build structured weekly routines, organize course workloads, and track assignment deadlines.
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
                    Calculate required GPAs on remaining credit hours to achieve degree honors and target cumulative GPAs.
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
                  <Badge variant="warning">Focus & Rewards</Badge>
                  <h3>Study Tracker & Rewards</h3>
                  <p>
                    Log study sessions, maintain consecutive day streaks, and earn academic achievement milestone badges.
                  </p>
                </div>
              </div>
            </div>

            <Link to="/tracker">
              <Button className="btn-block">Open Study Tracker & Streaks →</Button>
            </Link>
          </Card>

          {/* Community Hub */}
          <Card className="feature-hub-card">
            <div>
              <div className="feature-hub-header">
                <div className="feature-hub-icon">👥</div>
                <div className="feature-hub-body">
                  <Badge variant="default">Community</Badge>
                  <h3>Student Community</h3>
                  <p>
                    Connect with fellow scholars, join academic study groups, share insights, and RSVP for campus events.
                  </p>
                </div>
              </div>
            </div>

            <Link to="/community">
              <Button className="btn-block">Open Community →</Button>
            </Link>
          </Card>
        </div>
      </main>
    </div>
  );
}
