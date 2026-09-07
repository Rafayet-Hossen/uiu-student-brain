import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BarChart3,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Flame,
  GraduationCap,
  Layers,
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";
import Badge from "../../components/Badge";
import Button from "../../components/Button";
import Card from "../../components/Card";
import ErrorState from "../../components/ErrorState";
import { StatSkeleton } from "../../components/Skeleton";
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
      console.error("Failed to load analytics dashboard:", err);
      setError(extractAnalyticsErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const summary = data?.summary || {};
  const totalStudyMinutes = Number(summary.total_study_minutes) || 0;
  const totalHours = Math.floor(totalStudyMinutes / 60);
  const remainingMins = totalStudyMinutes % 60;
  const totalSessions = Number(summary.total_sessions) || 0;
  const totalSubjects = Number(summary.total_subjects) || 0;
  const avgSessionMinutes = Number(summary.avg_session_minutes) || 0;

  const gpaSummary = data?.gpa_summary || null;
  const adherence = data?.schedule_adherence || {};
  const adherenceRate = Number(adherence.adherence_rate) || 0;
  const coveredCount = Array.isArray(adherence.covered_subjects_this_week)
    ? adherence.covered_subjects_this_week.length
    : 0;
  const scheduledCount = Array.isArray(adherence.scheduled_subjects)
    ? adherence.scheduled_subjects.length
    : 0;

  const insights = Array.isArray(data?.insights) ? data.insights : [];

  return (
    <div className="analytics-page-container">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">
              <BarChart3 size={28} className="text-indigo" />
              <span>Academic & Focus Analytics</span>
            </h1>
            <p className="page-description">
              Comprehensive academic intelligence: focus time trends, subject distribution, GPA forecast, and routine adherence.
            </p>
          </div>

          <Button
            variant="secondary"
            onClick={loadDashboard}
            icon={RefreshCw}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh Analytics"}
          </Button>
        </div>
      </div>

      {/* Loading Skeletons */}
      {loading && (
        <div className="stats-cards-row">
          <StatSkeleton />
          <StatSkeleton />
          <StatSkeleton />
          <StatSkeleton />
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <ErrorState
          title="Failed to compute analytics"
          message={error}
          onRetry={loadDashboard}
        />
      )}

      {/* Loaded Analytics Dashboard */}
      {!loading && !error && data && (
        <div>
          {/* KPI Summary Grid with 4 distinct styled cards */}
          <div className="stats-cards-row">
            {/* Card 1: Focus Investment */}
            <Card variant="stat" className="stat-indigo">
              <div className="stat-top-row">
                <span className="stat-header-label">Focus Investment</span>
                <div className="stat-icon-pill bg-indigo-subtle">
                  <Clock size={16} className="text-indigo" />
                </div>
              </div>
              <div className="stat-number-row">
                <strong className="stat-metric-value">
                  {totalHours}h {remainingMins}m
                </strong>
              </div>
              <span className="stat-footer-subtext">
                {totalSessions} study sessions logged
              </span>
            </Card>

            {/* Card 2: Subject Breadth */}
            <Card variant="stat" className="stat-emerald">
              <div className="stat-top-row">
                <span className="stat-header-label">Subject Breadth</span>
                <div className="stat-icon-pill bg-emerald-subtle">
                  <BookOpen size={16} className="text-emerald" />
                </div>
              </div>
              <div className="stat-number-row">
                <strong className="stat-metric-value">
                  {totalSubjects} Subjects
                </strong>
              </div>
              <span className="stat-footer-subtext">
                Avg session: {avgSessionMinutes} mins
              </span>
            </Card>

            {/* Card 3: Academic Standing */}
            <Card variant="stat" className="stat-amber">
              <div className="stat-top-row">
                <span className="stat-header-label">Academic Standing</span>
                <div className="stat-icon-pill bg-amber-subtle">
                  <GraduationCap size={16} className="text-amber" />
                </div>
              </div>
              <div className="stat-number-row">
                <strong className="stat-metric-value">
                  {gpaSummary && typeof gpaSummary.current_gpa === "number"
                    ? `${gpaSummary.current_gpa.toFixed(2)}`
                    : "N/A"}
                </strong>
              </div>
              <span className="stat-footer-subtext">
                {gpaSummary && typeof gpaSummary.target_gpa === "number"
                  ? `Target Goal: ${gpaSummary.target_gpa.toFixed(2)} CGPA`
                  : "No GPA target configured"}
              </span>
            </Card>

            {/* Card 4: Routine Adherence */}
            <Card variant="stat" className="stat-rose">
              <div className="stat-top-row">
                <span className="stat-header-label">Routine Adherence</span>
                <div className="stat-icon-pill bg-rose-subtle">
                  <Calendar size={16} className="text-rose" />
                </div>
              </div>
              <div className="stat-number-row">
                <strong className="stat-metric-value">
                  {adherenceRate}%
                </strong>
              </div>
              <span className="stat-footer-subtext">
                {coveredCount} of {scheduledCount} weekly routines covered
              </span>
            </Card>
          </div>

          {/* Smart AI Academic Intelligence Insights */}
          {insights.length > 0 && (
            <div className="analytics-insights-banner">
              <div className="insights-banner-header">
                <Sparkles size={18} className="text-primary" />
                <h3 className="insights-banner-title">
                  Smart Academic Intelligence & Recommendations
                </h3>
              </div>
              <div className="insights-cards-list">
                {insights.map((insight, idx) => (
                  <div key={idx} className="insight-chip-item">
                    <span>{insight}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Analytics Visual Charts Grid */}
          <div className="analytics-charts-grid">
            <WeeklyTrendChart trend={data.weekly_trend} />
            <SubjectDistributionChart distribution={data.subject_distribution} />
            <GpaTrajectoryCard gpaSummary={data.gpa_summary} />
            <ScheduleAdherenceCard adherence={data.schedule_adherence} />
          </div>
        </div>
      )}
    </div>
  );
}
