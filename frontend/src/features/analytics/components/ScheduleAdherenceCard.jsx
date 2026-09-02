import { Link } from "react-router-dom";
import Badge from "../../../components/Badge";

export default function ScheduleAdherenceCard({ adherence }) {
  if (!adherence) {
    return (
      <div className="analytics-card">
        <div className="analytics-card-header">
          <div>
            <h3 className="analytics-card-title">
              <span>📅</span>
              <span>Routine Adherence</span>
            </h3>
            <p className="analytics-card-desc">
              Weekly routine schedule coverage.
            </p>
          </div>
          <Link to="/planner" className="text-primary text-xs font-semibold hover:underline">
            Set Routines →
          </Link>
        </div>
        <div className="empty-chart-placeholder">
          <p className="text-muted text-sm">No scheduled study routines found.</p>
        </div>
      </div>
    );
  }

  const scheduled_subjects = Array.isArray(adherence.scheduled_subjects)
    ? adherence.scheduled_subjects
    : [];
  const covered_subjects_this_week = Array.isArray(adherence.covered_subjects_this_week)
    ? adherence.covered_subjects_this_week
    : [];
  const adherence_rate = Number(adherence.adherence_rate) || 0;

  return (
    <div className="analytics-card">
      <div className="analytics-card-header">
        <div>
          <h3 className="analytics-card-title">
            <span>📅</span>
            <span>Routine Adherence</span>
          </h3>
          <p className="analytics-card-desc">
            Coverage of scheduled study routines during this week.
          </p>
        </div>
        <Badge
          variant={
            adherence_rate >= 80
              ? "success"
              : adherence_rate >= 50
              ? "accent"
              : "warning"
          }
        >
          {adherence_rate}% Coverage
        </Badge>
      </div>

      <div className="adherence-content">
        <div className="progress-header">
          <span>Weekly Routine Coverage</span>
          <span>
            {covered_subjects_this_week.length} of {scheduled_subjects.length}{" "}
            Courses
          </span>
        </div>
        <div className="progress-bar-track">
          <div
            className="progress-bar-fill"
            style={{ width: `${Math.min(100, adherence_rate)}%` }}
          />
        </div>

        {scheduled_subjects.length > 0 ? (
          <div className="adherence-subjects-wrap">
            {scheduled_subjects.map((sub) => {
              const covered = covered_subjects_this_week.includes(sub);
              return (
                <span
                  key={sub}
                  className={`adherence-chip ${
                    covered ? "chip-covered" : "chip-missed"
                  }`}
                >
                  {covered ? "✓" : "○"} {sub}
                </span>
              );
            })}
          </div>
        ) : (
          <div style={{ marginTop: "12px" }}>
            <p className="text-muted text-xs">
              No active routine schedules configured. Add routines in the Planner.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
