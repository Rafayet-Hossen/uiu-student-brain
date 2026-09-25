import { Target, TrendingUp, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

export default function WeeklyRing({
  weeklyHours = 8.4,
  targetWeeklyHours = 10,
  weeklyPercent = 84,
}) {
  const radius = 34;
  const circ = 2 * Math.PI * radius;
  const safePercent = Math.min(100, Math.max(0, weeklyPercent));
  const offset = circ - (safePercent / 100) * circ;
  const isCompleted = safePercent >= 100;

  return (
    <div
      className={`dash-card-24 dash-challenge-card dash-weekly-ring-card ${
        isCompleted ? "border-emerald/40 is-completed" : ""
      }`}
    >
      <div className="dash-challenge-header">
        <div className="dash-challenge-title-group">
          {isCompleted ? (
            <CheckCircle2 size={18} className="text-emerald shrink-0" />
          ) : (
            <Target size={18} className="text-primary shrink-0" />
          )}
          <strong className="dash-challenge-title">
            Weekly Focus Goal
          </strong>
        </div>
        <span
          className={`dash-weekly-goal-badge ${
            isCompleted ? "completed" : ""
          }`}
        >
          <span>{isCompleted ? "🎉 Goal Hit" : `🎯 ${targetWeeklyHours}h Goal`}</span>
        </span>
      </div>

      <div className="dash-challenge-body-split">
        {/* Modern Circular Ring */}
        <div className="dash-challenge-ring-box">
          <svg className="dash-challenge-svg" viewBox="0 0 82 82">
            <circle
              cx="41"
              cy="41"
              r={radius}
              fill="none"
              stroke="var(--dash-surface-elevated)"
              strokeWidth="6"
            />
            <circle
              cx="41"
              cy="41"
              r={radius}
              fill="none"
              stroke={isCompleted ? "#10B981" : "var(--dash-primary)"}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={offset}
              style={{ transition: "stroke-dashoffset 0.8s ease" }}
            />
          </svg>
          <div className="dash-challenge-center-content">
            <span className="dash-challenge-pct-val">{safePercent}%</span>
          </div>
        </div>

        <div className="dash-challenge-details">
          {isCompleted ? (
            <div>
              <strong className="dash-challenge-target-headline text-emerald">
                {weeklyHours}h Logged
              </strong>
              <p className="dash-challenge-subcopy">
                Weekly goal accomplished! Outstanding academic discipline.
              </p>
            </div>
          ) : (
            <div>
              <h4 className="dash-challenge-target-headline">
                {weeklyHours}h / {targetWeeklyHours}h Logged
              </h4>
              <p className="dash-challenge-subcopy">
                {(targetWeeklyHours - weeklyHours).toFixed(1)}h remaining to hit this week's honors target.
              </p>
            </div>
          )}

          {/* Progress bar track */}
          <div className="dash-challenge-progress-track">
            <div
              className="dash-challenge-progress-fill"
              style={{
                width: `${safePercent}%`,
                background: isCompleted
                  ? "linear-gradient(90deg, #10b981, #059669)"
                  : "linear-gradient(90deg, var(--dash-primary), #f59e0b)",
              }}
            />
          </div>
        </div>
      </div>

      <div className="dash-challenge-btn-row">
        <Link
          to="/study-center?tab=analytics"
          className="dash-bento-btn secondary"
        >
          <TrendingUp size={13} />
          <span>View Analytics Trend →</span>
        </Link>
      </div>
    </div>
  );
}
