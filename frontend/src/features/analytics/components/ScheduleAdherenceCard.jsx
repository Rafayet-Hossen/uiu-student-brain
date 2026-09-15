import { Link } from "react-router-dom";
import {
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  AlertCircle,
  ArrowRight,
  Sparkles,
  BookOpen,
  PlusCircle,
  TrendingUp,
} from "lucide-react";
import Badge from "../../../components/Badge";

export default function ScheduleAdherenceCard({ adherence }) {
  if (!adherence) {
    return (
      <div className="analytics-card adherence-card-enhanced">
        <div className="analytics-card-header">
          <div>
            <h3 className="analytics-card-title">
              <span className="adherence-icon-pill">
                <Calendar size={18} className="text-primary" />
              </span>
              <span>Routine Adherence</span>
            </h3>
            <p className="analytics-card-desc">
              Weekly routine schedule coverage and execution tracking.
            </p>
          </div>
          <Link
            to="/planner"
            className="text-primary text-xs font-semibold hover:underline flex items-center gap-1"
          >
            <span>Set Routines</span>
            <ArrowRight size={13} />
          </Link>
        </div>
        <div className="empty-chart-placeholder">
          <p className="text-muted text-sm">
            No scheduled study routines found.
          </p>
          <Link
            to="/planner"
            className="adherence-quick-setup-btn"
            style={{ marginTop: "12px", display: "inline-flex" }}
          >
            <PlusCircle size={14} />
            <span>Create Study Routine in Planner</span>
          </Link>
        </div>
      </div>
    );
  }

  const scheduled_subjects = Array.isArray(adherence.scheduled_subjects)
    ? adherence.scheduled_subjects
    : [];
  const covered_subjects_this_week = Array.isArray(
    adherence.covered_subjects_this_week,
  )
    ? adherence.covered_subjects_this_week
    : [];
  const adherence_rate = Number(adherence.adherence_rate) || 0;
  const subject_details = Array.isArray(adherence.subject_details)
    ? adherence.subject_details
    : [];
  const total_scheduled_hours = Number(adherence.total_scheduled_hours) || 0;
  const total_studied_hours_this_week =
    Number(adherence.total_studied_hours_this_week) || 0;
  const consistency_label =
    adherence.consistency_label ||
    (adherence_rate >= 80
      ? "Optimal Adherence"
      : adherence_rate >= 50
        ? "Moderate Progress"
        : "Attention Needed");
  const motivational_tip = adherence.motivational_tip || "";

  const variantColor =
    adherence_rate >= 80
      ? "success"
      : adherence_rate >= 50
        ? "accent"
        : "warning";

  return (
    <div className="analytics-card adherence-card-enhanced">
      {/* Top Header Row */}
      <div className="analytics-card-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span className="adherence-icon-pill">
              <Calendar size={18} className="text-primary" />
            </span>
            <h3 className="analytics-card-title" style={{ margin: 0 }}>
              Routine Adherence
            </h3>
          </div>
          <p className="analytics-card-desc" style={{ marginTop: "4px" }}>
            Coverage and execution fidelity of your weekly study routines.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Badge variant={variantColor} className="adherence-rate-badge">
            <span className="adherence-pulse-dot" />
            {adherence_rate}% Coverage
          </Badge>
          <Link
            to="/planner"
            className="text-primary text-xs font-semibold hover:underline hidden-mobile flex items-center gap-1"
            title="Edit routines in Planner"
          >
            <span>Planner</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>

      <div className="adherence-content">
        {/* KPI Quick Metrics Grid */}
        <div className="adherence-metric-cards-grid">
          <div className="adherence-metric-box">
            <div className="metric-box-label">
              <TrendingUp size={14} className="text-primary" />
              <span>Routine Status</span>
            </div>
            <div className="metric-box-value-row">
              <span className="metric-box-number">{consistency_label}</span>
            </div>
            <span className="metric-box-sub">
              {adherence_rate >= 80
                ? "Excellent consistency"
                : adherence_rate >= 50
                  ? "Pacing well"
                  : "Needs focus sessions"}
            </span>
          </div>

          <div className="adherence-metric-box">
            <div className="metric-box-label">
              <CheckCircle2 size={14} className="text-emerald" />
              <span>Coverage Ratio</span>
            </div>
            <div className="metric-box-value-row">
              <span className="metric-box-number">
                {covered_subjects_this_week.length}
                <small> / {scheduled_subjects.length} Courses</small>
              </span>
            </div>
            <span className="metric-box-sub">
              {scheduled_subjects.length - covered_subjects_this_week.length ===
              0
                ? "All routines completed"
                : `${scheduled_subjects.length - covered_subjects_this_week.length} pending focus`}
            </span>
          </div>

          <div className="adherence-metric-box">
            <div className="metric-box-label">
              <Clock size={14} className="text-accent" />
              <span>Focus Execution</span>
            </div>
            <div className="metric-box-value-row">
              <span className="metric-box-number">
                {total_studied_hours_this_week}
                <small> / {total_scheduled_hours || "--"} hrs</small>
              </span>
            </div>
            <span className="metric-box-sub">Past 7 days logged time</span>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="adherence-progress-section">
          <div className="progress-header">
            <span className="adherence-progress-label">
              Weekly Routine Completion
            </span>
            <span className="adherence-progress-percent">
              {adherence_rate}%
            </span>
          </div>
          <div className="adherence-progress-track">
            <div
              className={`adherence-progress-fill ${
                adherence_rate >= 80
                  ? "progress-fill-emerald"
                  : adherence_rate >= 50
                    ? "progress-fill-accent"
                    : "progress-fill-amber"
              }`}
              style={{ width: `${Math.min(100, adherence_rate)}%` }}
            />
          </div>
        </div>

        {/* Per-Course Adherence Cards */}
        {scheduled_subjects.length > 0 ? (
          <div className="adherence-course-cards-list">
            <div className="adherence-list-header">
              <span>Scheduled Courses Breakdown</span>
              <span className="text-muted text-xs">
                Click course to log study session
              </span>
            </div>

            <div className="adherence-courses-grid">
              {(subject_details.length > 0
                ? subject_details
                : scheduled_subjects.map((sub) => ({
                    subject: sub,
                    is_covered: covered_subjects_this_week.includes(sub),
                    logged_hours_this_week: 0,
                    scheduled_slots: 1,
                    scheduled_hours: 0,
                    progress_percent: covered_subjects_this_week.includes(sub)
                      ? 100
                      : 0,
                    status: covered_subjects_this_week.includes(sub)
                      ? "Completed"
                      : "Pending",
                  }))
              ).map((item) => {
                const isCovered = item.is_covered;
                return (
                  <div
                    key={item.subject}
                    className={`adherence-course-card ${
                      isCovered ? "course-card-covered" : "course-card-pending"
                    }`}
                  >
                    <div className="course-card-top-row">
                      <div className="course-card-identity">
                        <span className="course-card-icon-tag">
                          <BookOpen size={14} />
                        </span>
                        <div>
                          <strong
                            className="course-card-name"
                            title={item.subject}
                          >
                            {item.subject}
                          </strong>
                          <div className="course-card-submeta">
                            {item.scheduled_slots > 0 && (
                              <span>
                                {item.scheduled_slots} slot
                                {item.scheduled_slots > 1 ? "s" : ""}/wk
                              </span>
                            )}
                            {item.scheduled_hours > 0 && (
                              <span> • {item.scheduled_hours} hrs planned</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <span
                        className={`course-card-status-pill ${
                          isCovered
                            ? "status-pill-covered"
                            : "status-pill-pending"
                        }`}
                      >
                        {isCovered ? (
                          <>
                            <CheckCircle2 size={12} />
                            <span>Covered</span>
                          </>
                        ) : (
                          <>
                            <Circle size={12} />
                            <span>Pending</span>
                          </>
                        )}
                      </span>
                    </div>

                    {/* Mini Course Progress Bar */}
                    <div className="course-card-progress-row">
                      <div className="course-card-bar-track">
                        <div
                          className={`course-card-bar-fill ${
                            isCovered ? "bar-fill-covered" : "bar-fill-pending"
                          }`}
                          style={{
                            width: `${Math.max(
                              isCovered ? 100 : 0,
                              Math.min(100, item.progress_percent || 0),
                            )}%`,
                          }}
                        />
                      </div>
                      <span className="course-card-time-stat">
                        {item.logged_hours_this_week > 0
                          ? `${item.logged_hours_this_week}h logged`
                          : "0h logged"}
                      </span>
                    </div>

                    {/* Action footer */}
                    <div className="course-card-actions">
                      <Link
                        to={`/tracker?subject=${encodeURIComponent(item.subject)}`}
                        className="course-card-log-btn"
                        title={`Start focus session for ${item.subject}`}
                      >
                        <PlusCircle size={12} />
                        <span>Log Session</span>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="adherence-empty-state">
            <AlertCircle size={20} className="text-muted" />
            <p className="text-muted text-sm">
              No active routine schedules configured. Set up your weekly study
              routine in the Planner to track adherence.
            </p>
            <Link to="/planner" className="adherence-quick-setup-btn">
              <span>Go to Study Routine Planner</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        )}

        {/* Motivational Tip Banner */}
        {motivational_tip && (
          <div className="adherence-tip-banner">
            <Sparkles size={16} className="text-primary flex-shrink-0" />
            <p className="adherence-tip-text">{motivational_tip}</p>
          </div>
        )}
      </div>
    </div>
  );
}
