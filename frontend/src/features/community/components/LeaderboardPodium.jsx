import Badge from "../../../components/Badge";
import Button from "../../../components/Button";
import ScholarAvatar from "../../auth/components/ScholarAvatar";

export default function LeaderboardPodium({
  topThree,
  timeframe,
  onToggleFollow,
}) {
  if (!topThree || topThree.length === 0) return null;

  const first = topThree[0];
  const second = topThree[1];
  const third = topThree[2];

  const renderPodiumCard = (entry, place, medal, className) => {
    if (!entry) return null;

    const metricLabel =
      timeframe === "streak"
        ? `${entry.current_streak} Day Streak`
        : `${entry.study_hours} hrs studied`;

    return (
      <div className={`podium-card ${className}`}>
        <div className="podium-medal-badge">{medal}</div>

        <div className="podium-avatar-wrap">
          <ScholarAvatar
            user={{
              id: entry.user_id,
              full_name: entry.display_name,
              email: entry.email,
              profile_image: entry.profile_image || entry.avatar,
            }}
            size={56}
          />
          <span className="podium-rank-pill">#{place}</span>
        </div>

        <h4 className="podium-name">{entry.display_name}</h4>

        {entry.custom_quote ? (
          <p className="podium-quote">"{entry.custom_quote}"</p>
        ) : (
          <p className="podium-quote-empty">Dedicated Scholar</p>
        )}

        <div className="podium-metrics-row">
          <Badge
            variant={
              place === 1 ? "warning" : place === 2 ? "default" : "accent"
            }
            style={{ fontWeight: 700 }}
          >
            {timeframe === "streak" ? "🔥 " : "⏱️ "}
            {metricLabel}
          </Badge>

          {entry.current_streak > 0 && timeframe !== "streak" && (
            <span className="podium-streak-tag">
              🔥 {entry.current_streak}d
            </span>
          )}

          {entry.trophies_count > 0 && (
            <span className="podium-trophies-tag">
              🏆 {entry.trophies_count}
            </span>
          )}
        </div>

        {!entry.is_current_user && onToggleFollow && (
          <Button
            size="sm"
            variant={entry.is_following ? "secondary" : "primary"}
            className="podium-follow-btn"
            onClick={() => onToggleFollow(entry.user_id)}
          >
            {entry.is_following ? "✓ Following" : "+ Follow"}
          </Button>
        )}

        {entry.is_current_user && <span className="podium-you-badge">You</span>}
      </div>
    );
  };

  return (
    <div className="leaderboard-podium-container">
      {/* 2nd Place */}
      <div className="podium-col col-second">
        {renderPodiumCard(second, 2, "🥈 2nd Place", "card-second")}
      </div>

      {/* 1st Place (Center / Taller) */}
      <div className="podium-col col-first">
        {renderPodiumCard(first, 1, "🥇 1st Place", "card-first")}
      </div>

      {/* 3rd Place */}
      <div className="podium-col col-third">
        {renderPodiumCard(third, 3, "🥉 3rd Place", "card-third")}
      </div>
    </div>
  );
}
