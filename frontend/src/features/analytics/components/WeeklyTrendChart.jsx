import { BarChart3 } from "lucide-react";
import Badge from "../../../components/Badge";

export default function WeeklyTrendChart({ trend = [] }) {
  const safeTrend = Array.isArray(trend) ? trend : [];
  const maxMinutes = Math.max(...safeTrend.map((t) => Number(t.minutes) || 0), 60);
  const totalWeeklyMins = safeTrend.reduce((sum, item) => sum + (Number(item.minutes) || 0), 0);
  const totalWeeklyHours = (totalWeeklyMins / 60).toFixed(1);

  if (safeTrend.length === 0) {
    return (
      <div className="analytics-card">
        <div className="analytics-card-header">
          <div className="analytics-card-header-left">
            <h3 className="analytics-card-title">
              <span className="analytics-card-icon-pill icon-primary">
                <BarChart3 size={17} />
              </span>
              <span>Weekly Focus Trend</span>
            </h3>
            <p className="analytics-card-desc">
              Daily focus hours recorded across the past 7 days.
            </p>
          </div>
          <Badge variant="default">0.0 hrs</Badge>
        </div>
        <div className="empty-chart-placeholder">
          <p className="text-muted text-sm">No study sessions logged in the last 7 days.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-card">
      <div className="analytics-card-header">
        <div className="analytics-card-header-left">
          <h3 className="analytics-card-title">
            <span className="analytics-card-icon-pill icon-primary">
              <BarChart3 size={17} />
            </span>
            <span>Weekly Focus Trend</span>
          </h3>
          <p className="analytics-card-desc">
            Daily focus hours recorded across the past 7 days.
          </p>
        </div>
        <Badge variant="accent">Total: {totalWeeklyHours} hrs</Badge>
      </div>

      <div className="trend-bar-chart">
        {safeTrend.map((day) => {
          const mins = Number(day.minutes) || 0;
          const heightPct = Math.round((mins / maxMinutes) * 100);
          const isHighest = mins > 0 && mins === maxMinutes;

          return (
            <div key={day.date || day.day_name} className="trend-bar-column">
              <div className="trend-bar-track">
                <div
                  className={`trend-bar-fill ${isHighest ? "trend-bar-peak" : ""}`}
                  style={{ height: `${Math.max(6, heightPct)}%` }}
                  title={`${day.day_name} (${day.date}): ${mins} mins (${day.sessions || 0} sessions)`}
                >
                  {mins > 0 && (
                    <span className="trend-bar-value">{mins}m</span>
                  )}
                </div>
              </div>
              <span className="trend-bar-label">{day.day_name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
