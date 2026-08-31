import { useState } from "react";
import Badge from "../../../components/Badge";

export default function RewardsShelf({ rewards }) {
  const [filter, setFilter] = useState("all");

  if (!rewards || rewards.length === 0) return null;

  const categories = [
    { key: "all", label: "All Badges" },
    { key: "streak", label: "🔥 Streaks" },
    { key: "duration", label: "⏱️ Focus Hours" },
    { key: "milestone", label: "🌱 Milestones" },
  ];

  const filteredRewards = rewards.filter((r) => {
    if (filter === "all") return true;
    return r.category === filter;
  });

  const unlockedCount = rewards.filter((r) => r.unlocked).length;

  return (
    <div className="rewards-shelf-container">
      <div className="rewards-shelf-header">
        <div>
          <h2 className="card-title">
            <span>🏆</span>
            <span>Academic Achievement Trophies</span>
          </h2>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", marginTop: "2px" }}>
            Unlock milestones as you build consistency and log study focus hours.
          </p>
        </div>

        <div className="rewards-unlocked-pill">
          <Badge variant="accent">
            {unlockedCount} / {rewards.length} Unlocked
          </Badge>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="rewards-filter-tabs">
        {categories.map((cat) => (
          <button
            key={cat.key}
            type="button"
            className={`rewards-filter-tab ${
              filter === cat.key ? "tab-active" : ""
            }`}
            onClick={() => setFilter(cat.key)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Badges Grid */}
      <div className="rewards-trophy-grid">
        {filteredRewards.map((reward) => (
          <div
            key={reward.id}
            className={`trophy-card ${
              reward.unlocked ? "trophy-unlocked" : "trophy-locked"
            }`}
          >
            <div className="trophy-icon-wrapper">
              <span className="trophy-icon">{reward.icon}</span>
              {reward.unlocked && <span className="trophy-check">✓</span>}
            </div>

            <div className="trophy-details">
              <div className="trophy-title-row">
                <h4 className="trophy-name">{reward.name}</h4>
                <Badge variant={reward.unlocked ? "success" : "default"}>
                  {reward.unlocked ? "Unlocked" : `${reward.progress}%`}
                </Badge>
              </div>

              <p className="trophy-desc">{reward.description}</p>

              {!reward.unlocked && (
                <div className="trophy-progress-bar">
                  <div
                    className="trophy-progress-fill"
                    style={{ width: `${reward.progress}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
