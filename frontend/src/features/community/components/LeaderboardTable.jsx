import Badge from "../../../components/Badge";
import Button from "../../../components/Button";
import ScholarAvatar from "../../auth/components/ScholarAvatar";

export default function LeaderboardTable({
  rankings,
  timeframe,
  onToggleFollow,
}) {
  if (!rankings || rankings.length === 0) {
    return (
      <div className="leaderboard-empty">
        <p>No rankings available for this timeframe yet.</p>
      </div>
    );
  }

  return (
    <div className="leaderboard-table-container">
      <div className="leaderboard-table-header">
        <span className="col-rank">Rank</span>
        <span className="col-student">Student</span>
        <span className="col-metric">
          {timeframe === "streak"
            ? "Current Streak"
            : timeframe === "all_time"
              ? "Total Focus"
              : "Weekly Focus"}
        </span>
        <span className="col-achievements">Badges</span>
        <span className="col-action">Connect</span>
      </div>

      <div className="leaderboard-rows-list">
        {rankings.map((entry) => {
          const metricValue =
            timeframe === "streak"
              ? `${entry.current_streak} days`
              : `${entry.study_hours} hrs`;

          return (
            <div
              key={entry.user_id}
              className={`leaderboard-row ${
                entry.is_current_user ? "leaderboard-row-you" : ""
              }`}
            >
              {/* Rank */}
              <div className="col-rank">
                <span
                  className={`rank-number-badge ${
                    entry.rank === 1
                      ? "rank-gold"
                      : entry.rank === 2
                        ? "rank-silver"
                        : entry.rank === 3
                          ? "rank-bronze"
                          : ""
                  }`}
                >
                  #{entry.rank}
                </span>
              </div>

              {/* Student Info */}
              <div className="col-student student-info-cell">
                <ScholarAvatar
                  user={{
                    id: entry.user_id,
                    full_name: entry.display_name,
                    email: entry.email,
                    profile_image: entry.profile_image || entry.avatar,
                  }}
                  size={36}
                />
                <div className="student-text-wrap">
                  <div className="student-name-row">
                    <span className="student-name">{entry.display_name}</span>
                    {entry.is_current_user && (
                      <span className="you-pill">You</span>
                    )}
                  </div>
                  {entry.custom_quote && (
                    <span className="student-table-quote">
                      "{entry.custom_quote}"
                    </span>
                  )}
                </div>
              </div>

              {/* Metric (Hours / Streak) */}
              <div className="col-metric">
                <div className="metric-val-wrap">
                  <span className="metric-main-val">
                    {timeframe === "streak" ? "🔥 " : "⏱️ "}
                    {metricValue}
                  </span>
                  {timeframe !== "streak" && entry.current_streak > 0 && (
                    <span className="metric-sub-streak">
                      🔥 {entry.current_streak}d streak
                    </span>
                  )}
                </div>
              </div>

              {/* Achievements / Trophies */}
              <div className="col-achievements">
                <Badge variant="accent">🏆 {entry.trophies_count} Badges</Badge>
              </div>

              {/* Connect / Follow */}
              <div className="col-action">
                {!entry.is_current_user && onToggleFollow ? (
                  <Button
                    size="sm"
                    variant={entry.is_following ? "secondary" : "primary"}
                    onClick={() => onToggleFollow(entry.user_id)}
                  >
                    {entry.is_following ? "✓ Following" : "+ Follow"}
                  </Button>
                ) : (
                  <span
                    style={{
                      fontSize: "0.8125rem",
                      color: "var(--color-text-muted)",
                    }}
                  >
                    -
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
