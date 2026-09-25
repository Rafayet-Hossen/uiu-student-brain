import { Link } from "react-router-dom";
import { Award, CheckCircle2, Play, Sparkles } from "lucide-react";

export default function DailyChallenge({
  todayMinutes = 0,
  targetMinutes = 45,
  xpReward = 80,
}) {
  const isCompleted = todayMinutes >= targetMinutes;
  const progressPercent = Math.min(
    100,
    Math.round((todayMinutes / targetMinutes) * 100),
  );

  // SVG Ring calculation: viewBox 0 0 82 82, cx=41, cy=41, r=34
  const radius = 34;
  const circ = 2 * Math.PI * radius; // ~213.63
  const offset = circ - (progressPercent / 100) * circ;

  return (
    <div
      className={`dash-card-24 dash-challenge-card ${
        isCompleted ? "border-emerald/40 is-completed" : ""
      }`}
    >
      <div className="dash-challenge-header">
        <div className="dash-challenge-title-group">
          {isCompleted ? (
            <CheckCircle2 size={18} className="text-emerald shrink-0" />
          ) : (
            <Award size={18} className="text-amber shrink-0" />
          )}
          <strong className="dash-challenge-title">
            Daily Study Challenge
          </strong>
        </div>
        <span
          className={`dash-challenge-xp-badge ${
            isCompleted ? "completed" : ""
          }`}
        >
          <Sparkles size={12} className="dash-xp-sparkle shrink-0" />
          <span>{isCompleted ? `+${xpReward} XP Earned` : `+${xpReward} Scholar XP`}</span>
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
              stroke={isCompleted ? "#10B981" : "#F59E0B"}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={offset}
              style={{ transition: "stroke-dashoffset 0.8s ease" }}
            />
          </svg>
          <div className="dash-challenge-center-content">
            <span className="dash-challenge-pct-val">{progressPercent}%</span>
          </div>
        </div>

        <div className="dash-challenge-details">
          {isCompleted ? (
            <div>
              <strong className="dash-challenge-target-headline text-emerald">
                Goal Achieved!
              </strong>
              <p className="dash-challenge-subcopy">
                You logged {todayMinutes}m of deep focus today. Keep up the great momentum!
              </p>
            </div>
          ) : (
            <div>
              <h4 className="dash-challenge-target-headline">
                {todayMinutes}m / {targetMinutes}m completed
              </h4>
              <p className="dash-challenge-subcopy">
                Log at least {targetMinutes}m focused study today to hit your streak goal.
              </p>
            </div>
          )}

          {/* Progress bar track */}
          <div className="dash-challenge-progress-track">
            <div
              className="dash-challenge-progress-fill"
              style={{
                width: `${progressPercent}%`,
                background: isCompleted
                  ? "linear-gradient(90deg, #10b981, #059669)"
                  : "linear-gradient(90deg, #f59e0b, #d97706)",
              }}
            />
          </div>
        </div>
      </div>

      <div className="dash-challenge-btn-row">
        {isCompleted ? (
          <Link
            to="/study-center?tab=tracker"
            className="dash-bento-btn secondary"
          >
            <span>+ Log More Focus →</span>
          </Link>
        ) : (
          <Link
            to="/study-center?tab=tracker"
            className="dash-bento-btn primary"
          >
            <Play size={13} fill="currentColor" />
            <span>Start Focus Session →</span>
          </Link>
        )}
      </div>
    </div>
  );
}
