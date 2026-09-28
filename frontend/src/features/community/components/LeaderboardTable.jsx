import { motion } from "framer-motion";
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

  const metricHeader =
    timeframe === "streak"
      ? "Current Streak"
      : timeframe === "all_time"
        ? "Total Focus"
        : "Weekly Focus";

  return (
    <div className="leaderboard-table-container">
      {/* Desktop & Tablet Table Header */}
      <div className="leaderboard-table-header">
        <span className="col-rank">Rank</span>
        <span className="col-student">Student</span>
        <span className="col-metric">{metricHeader}</span>
        <span className="col-achievements">Badges</span>
        <span className="col-action">Connect</span>
      </div>

      {/* Rows List */}
      <div className="leaderboard-rows-list">
        {rankings.map((entry, index) => {
          const metricValue =
            timeframe === "streak"
              ? `${entry.current_streak} days`
              : `${entry.study_hours} hrs`;

          const rankMedal =
            entry.rank === 1
              ? "🥇"
              : entry.rank === 2
                ? "🥈"
                : entry.rank === 3
                  ? "🥉"
                  : null;

          return (
            <motion.div
              key={entry.user_id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -2 }}
              transition={{
                duration: 0.2,
                delay: Math.min(index * 0.03, 0.25),
              }}
              className={`leaderboard-row ${
                entry.is_current_user ? "leaderboard-row-you" : ""
              }`}
            >
              {/* Column 1: Rank */}
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
                  {rankMedal ? `${rankMedal} #${entry.rank}` : `#${entry.rank}`}
                </span>
              </div>

              {/* Column 2: Student Details */}
              <div className="col-student student-info-cell">
                <ScholarAvatar
                  user={{
                    id: entry.user_id,
                    full_name: entry.display_name,
                    email: entry.email,
                    profile_image: entry.profile_image || entry.avatar,
                  }}
                  size={38}
                />
                <div className="student-text-wrap">
                  <div className="student-name-row">
                    <span className="student-name">{entry.display_name}</span>
                    {entry.is_current_user && (
                      <span className="you-pill">You</span>
                    )}
                  </div>
                  {entry.custom_quote ? (
                    <span className="student-table-quote">
                      "{entry.custom_quote}"
                    </span>
                  ) : (
                    <span className="student-table-sub">UIU Scholar</span>
                  )}
                </div>
              </div>

              {/* Column 3: Focus Metric */}
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

              {/* Column 4: Badges */}
              <div className="col-achievements">
                <Badge variant="accent">
                  🏆 {entry.trophies_count} Badges
                </Badge>
              </div>

              {/* Column 5: Connect / Action */}
              <div className="col-action">
                {!entry.is_current_user && onToggleFollow ? (
                  <Button
                    size="sm"
                    variant={entry.is_following ? "secondary" : "primary"}
                    onClick={() => onToggleFollow(entry.user_id)}
                    className="leaderboard-connect-btn"
                  >
                    {entry.is_following ? "✓ Following" : "+ Follow"}
                  </Button>
                ) : entry.is_current_user ? (
                  <span className="leaderboard-self-status">★ Your Rank</span>
                ) : (
                  <span className="text-muted">-</span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
