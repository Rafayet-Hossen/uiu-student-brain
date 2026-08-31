import { useEffect, useState } from "react";
import Badge from "../../components/Badge";
import Button from "../../components/Button";
import Card from "../../components/Card";
import FormError from "../../components/FormError";
import Navbar from "../../components/Navbar";
import Spinner from "../../components/Spinner";
import { extractAnalyticsErrorMessage, getAnalyticsDashboard } from "./api";
import GpaTrajectoryCard from "./components/GpaTrajectoryCard";
import ScheduleAdherenceCard from "./components/ScheduleAdherenceCard";
import SubjectDistributionChart from "./components/SubjectDistributionChart";
import WeeklyTrendChart from "./components/WeeklyTrendChart";

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadDashboard() {
    setLoading(true);
    setError("");

    try {
      const res = await getAnalyticsDashboard();
      setData(res);
    } catch (err) {
      setError(extractAnalyticsErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const summary = data?.summary;
  const totalHours = summary ? Math.floor(summary.total_study_minutes / 60) : 0;
  const remainingMins = summary ? summary.total_study_minutes % 60 : 0;

  return (
    <div className="app-screen">
      <Navbar />

      <main className="main-content">
        {/* Page Header */}
        <div className="page-header">
          <div className="page-header-row">
            <div>
              <h1 className="page-title">
                <span>📊</span>
                <span>Study & Academic Analytics</span>
              </h1>
              <p className="page-description">
                Comprehensive academic intelligence: focus time trends, course distribution, GPA forecast, and routine adherence.
              </p>
            </div>

            <Button variant="secondary" onClick={loadDashboard}>
              🔄 Refresh Analytics
            </Button>
          </div>
        </div>

        {/* Loading Spinner */}
        {loading && (
          <Card className="empty-state-card">
            <Spinner standalone />
            <p className="page-loading-text">Computing academic analytics...</p>
          </Card>
        )}

        {/* Error State */}
        {!loading && error && (
          <Card className="empty-state-card">
            <FormError message={error} className="form-error-block" />
            <Button onClick={loadDashboard}>Try Again</Button>
          </Card>
        )}

        {/* Loaded Analytics Dashboard */}
        {!loading && !error && data && (
          <div>
            {/* KPI Summary Grid */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-card-header">
                  <span className="stat-label">Total Focus Investment</span>
                  <div className="stat-icon">⏱️</div>
                </div>
                <p className="stat-number">
                  {totalHours}h {remainingMins}m
                </p>
                <p className="stat-subtext">
                  {summary.total_sessions} study sessions logged
                </p>
              </div>

              <div className="stat-card">
                <div className="stat-card-header">
                  <span className="stat-label">Active Subjects</span>
                  <div className="stat-icon">📚</div>
                </div>
                <p className="stat-number">{summary.total_subjects}</p>
                <p className="stat-subtext">
                  Across {summary.active_schedules_count} scheduled routines
                </p>
              </div>

              <div className="stat-card">
                <div className="stat-card-header">
                  <span className="stat-label">Average Session Length</span>
                  <div className="stat-icon">📈</div>
                </div>
                <p className="stat-number">{summary.avg_session_minutes}m</p>
                <p className="stat-subtext">Per focused study block</p>
              </div>

              <div className="stat-card">
                <div className="stat-card-header">
                  <span className="stat-label">Target GPA Status</span>
                  <div className="stat-icon">🎓</div>
                </div>
                <p className="stat-number">
                  {data.gpa_summary
                    ? data.gpa_summary.target_gpa.toFixed(2)
                    : "N/A"}
                </p>
                <p className="stat-subtext">
                  {data.gpa_summary
                    ? `Current: ${data.gpa_summary.current_gpa.toFixed(2)}`
                    : "No GPA plan set"}
                </p>
              </div>
            </div>

            {/* Smart Academic Insights Banner */}
            {data.insights && data.insights.length > 0 && (
              <div className="analytics-insights-banner">
                <div className="insights-header">
                  <span style={{ fontSize: "1.25rem" }}>💡</span>
                  <span className="insights-title">Academic Insights & Intelligence</span>
                </div>
                <ul className="insights-list">
                  {data.insights.map((insight, idx) => (
                    <li key={idx} className="insight-item">
                      {insight}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 2-Column Analytics Grid */}
            <div className="analytics-layout-grid">
              <WeeklyTrendChart trend={data.weekly_trend} />
              <SubjectDistributionChart
                distribution={data.subject_distribution}
              />
              <GpaTrajectoryCard gpaSummary={data.gpa_summary} />
              <ScheduleAdherenceCard
                adherence={data.schedule_adherence}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
