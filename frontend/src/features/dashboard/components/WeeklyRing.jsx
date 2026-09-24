import { motion } from "framer-motion";
import { Target, TrendingUp } from "lucide-react";
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

  return (
    <div className="dash-card-24 dash-weekly-ring-card">
      {/* Circular Progress Meter */}
      <div className="dash-ring-wrapper">
        <svg className="dash-ring-svg" viewBox="0 0 80 80">
          <circle
            cx="40"
            cy="40"
            r={radius}
            fill="none"
            stroke="var(--dash-surface-elevated)"
            strokeWidth="7"
          />
          <motion.circle
            cx="40"
            cy="40"
            r={radius}
            fill="none"
            stroke="var(--dash-primary)"
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          />
        </svg>

        <div className="dash-ring-center-text">
          <span className="dash-ring-pct">{safePercent}%</span>
          <span className="text-[10px] font-bold text-muted">Goal</span>
        </div>
      </div>

      <div className="dash-ring-meta flex-1">
        <div className="flex items-center gap-1.5 text-xs font-bold text-primary mb-1">
          <Target size={14} />
          <span>Weekly Focus Goal</span>
        </div>
        <strong className="text-base font-black text-slate-800 dark:text-slate-100">
          {weeklyHours}h / {targetWeeklyHours}h Logged
        </strong>
        <p className="text-xs text-muted mt-0.5">
          {safePercent >= 100
            ? "Weekly goal accomplished! Outstanding discipline."
            : `${(targetWeeklyHours - weeklyHours).toFixed(1)}h remaining to hit this week's honors target.`}
        </p>
        <Link
          to="/study-center?tab=analytics"
          className="text-xs font-bold text-primary hover:underline mt-1.5 inline-flex items-center gap-1"
        >
          <span>View Analytics Trend</span>
          <TrendingUp size={12} />
        </Link>
      </div>
    </div>
  );
}
