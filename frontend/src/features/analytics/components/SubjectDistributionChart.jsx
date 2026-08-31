import Badge from "../../../components/Badge";

const COLOR_PALETTE = [
  "#2563eb", // blue
  "#10b981", // emerald
  "#f59e0b", // amber
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#64748b", // slate
];

export default function SubjectDistributionChart({ distribution }) {
  if (!distribution || distribution.length === 0) {
    return (
      <div className="analytics-card">
        <h3 className="analytics-card-title">
          <span>📚</span>
          <span>Subject Time Distribution</span>
        </h3>
        <p className="analytics-card-desc">
          No subject study time recorded yet.
        </p>
      </div>
    );
  }

  return (
    <div className="analytics-card">
      <div className="analytics-card-header">
        <div>
          <h3 className="analytics-card-title">
            <span>📚</span>
            <span>Subject Time Distribution</span>
          </h3>
          <p className="analytics-card-desc">
            Breakdown of total study investment by subject.
          </p>
        </div>
        <Badge variant="default">{distribution.length} Subjects</Badge>
      </div>

      {/* Segmented Multi-color Distribution Bar */}
      <div className="distribution-multi-bar">
        {distribution.map((item, idx) => (
          <div
            key={item.subject}
            className="distribution-segment"
            style={{
              width: `${Math.max(3, item.percentage)}%`,
              backgroundColor: COLOR_PALETTE[idx % COLOR_PALETTE.length],
            }}
            title={`${item.subject}: ${item.percentage}% (${item.minutes} mins)`}
          />
        ))}
      </div>

      {/* Subject List with Percentages and Durations */}
      <div className="distribution-list">
        {distribution.map((item, idx) => {
          const color = COLOR_PALETTE[idx % COLOR_PALETTE.length];
          const hours = Math.floor(item.minutes / 60);
          const mins = item.minutes % 60;
          const durationStr =
            hours > 0 ? `${hours}h ${mins > 0 ? `${mins}m` : ""}` : `${mins}m`;

          return (
            <div key={item.subject} className="distribution-row">
              <div className="distribution-subject-info">
                <span
                  className="distribution-color-dot"
                  style={{ backgroundColor: color }}
                />
                <span className="distribution-subject-name">
                  {item.subject}
                </span>
                <span className="distribution-sessions-pill">
                  {item.sessions_count}{" "}
                  {item.sessions_count === 1 ? "session" : "sessions"}
                </span>
              </div>

              <div className="distribution-meta">
                <span className="distribution-duration">{durationStr}</span>
                <span className="distribution-pct-badge">{item.percentage}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
