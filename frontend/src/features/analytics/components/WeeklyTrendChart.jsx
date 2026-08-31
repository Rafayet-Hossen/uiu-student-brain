import Badge from "../../../components/Badge";

export default function WeeklyTrendChart({ trend }) {
  if (!trend || trend.length === 0) return null;

  const maxMinutes = Math.max(...trend.map((t) => t.minutes), 60);
  const totalWeeklyMins = trend.reduce((sum, item) => sum + item.minutes, 0);
  const totalWeeklyHours = (totalWeeklyMins / 60).toFixed(1);

  return (
    <div className="analytics-card">
      <div className="analytics-card-header">
        <div>
          <h3 className="analytics-card-title">
            <span>📊</span>
            <span>Weekly Study Trend</span>
          </h3>
          <p className="analytics-card-desc">
            Daily focus hours recorded across the past 7 days.
          </p>
        </div>
        <Badge variant="accent">Total: {totalWeeklyHours} hrs</Badge>
      </div>

      <div className="trend-bar-chart">
        {trend.map((day) => {
          const heightPct = Math.round((day.minutes / maxMinutes) * 100);
          const isHighest = day.minutes > 0 && day.minutes === maxMinutes;

          return (
            <div key={day.date} className="trend-bar-column">
              <div className="trend-bar-track">
                <div
                  className={`trend-bar-fill ${
                    isHighest ? "trend-bar-peak" : ""
                  }`}
                  style={{ height: `${Math.max(6, heightPct)}%` }}
                  title={`${day.day_name} (${day.date}): ${day.minutes} mins (${day.sessions} sessions)`}
                >
                  {day.minutes > 0 && (
                    <span className="trend-bar-value">{day.minutes}m</span>
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
