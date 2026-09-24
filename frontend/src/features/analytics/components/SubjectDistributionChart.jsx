import Badge from "../../../components/Badge";

const COLOR_PALETTE = [
  "#4f46e5", // indigo
  "#f26522", // UIU orange
  "#10b981", // emerald
  "#f59e0b", // amber
  "#8b5cf6", // purple
  "#ea580c", // terracotta
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#64748b", // slate
  "#c2410c", // deep rust
];

export default function SubjectDistributionChart({ distribution = [] }) {
  const safeList = Array.isArray(distribution) ? distribution : [];

  if (safeList.length === 0) {
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
          <Badge variant="default">0 Subjects</Badge>
        </div>
        <div className="empty-chart-placeholder">
          <p className="text-muted text-sm">No subject study time recorded yet.</p>
        </div>
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
        <Badge variant="default">{safeList.length} Subjects</Badge>
      </div>

      {/* Segmented Multi-color Distribution Bar */}
      <div className="distribution-multi-bar">
        {safeList.map((item, idx) => (
          <div
            key={item.subject}
            className="distribution-segment"
            style={{
              width: `${Math.max(4, Number(item.percentage) || 0)}%`,
              backgroundColor: COLOR_PALETTE[idx % COLOR_PALETTE.length],
            }}
            title={`${item.subject}: ${item.percentage}% (${item.minutes} mins)`}
          />
        ))}
      </div>

      {/* Subject List with Percentages and Durations */}
      <div className="distribution-list">
        {safeList.map((item, idx) => {
          const color = COLOR_PALETTE[idx % COLOR_PALETTE.length];
          const totalMins = Number(item.minutes) || 0;
          const hours = Math.floor(totalMins / 60);
          const mins = totalMins % 60;
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
                  {item.sessions_count || 0}{" "}
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
