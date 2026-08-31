import { useState } from "react";
import Badge from "../../../components/Badge";
import Button from "../../../components/Button";
import Input from "../../../components/Input";
import { updateStudyGoal } from "../api";

export default function StreakCard({ streakData, onGoalUpdated }) {
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState(
    streakData?.daily_goal_minutes || 60,
  );
  const [saving, setSaving] = useState(false);

  if (!streakData) return null;

  const {
    current_streak,
    longest_streak,
    today_minutes,
    daily_goal_minutes,
    daily_goal_achieved,
    studied_today,
    weekly_consistency,
  } = streakData;

  const goalPercent = Math.min(
    100,
    Math.round((today_minutes / (daily_goal_minutes || 60)) * 100),
  );

  async function handleSaveGoal(e) {
    e.preventDefault();
    const newGoal = parseInt(goalInput, 10);
    if (isNaN(newGoal) || newGoal <= 0 || newGoal > 1440) return;

    setSaving(true);
    try {
      await updateStudyGoal({ daily_goal_minutes: newGoal });
      setEditingGoal(false);
      if (onGoalUpdated) onGoalUpdated();
    } catch (err) {
      console.error("Failed to update goal:", err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="streak-hero-card">
      <div className="streak-main-row">
        {/* Flame Streak Highlight */}
        <div className="streak-flame-section">
          <div className="streak-flame-badge">
            <span className="streak-flame-icon">🔥</span>
            <div className="streak-flame-info">
              <span className="streak-flame-number">{current_streak}</span>
              <span className="streak-flame-label">
                {current_streak === 1 ? "Day Streak" : "Days Streak"}
              </span>
            </div>
          </div>
          <p className="streak-status-text">
            {studied_today
              ? "⚡ Streak active for today! Great dedication."
              : current_streak > 0
              ? "⏳ Log study time today to keep your streak alive!"
              : "🌱 Start your streak today by logging a session."}
          </p>
        </div>

        {/* Daily Goal & Progress */}
        <div className="daily-goal-section">
          <div className="daily-goal-header">
            <div className="daily-goal-title-wrap">
              <span className="daily-goal-label">Today's Study Goal</span>
              {daily_goal_achieved ? (
                <Badge variant="success">🎯 Goal Met</Badge>
              ) : (
                <Badge variant="accent">
                  {today_minutes} / {daily_goal_minutes}m
                </Badge>
              )}
            </div>

            <button
              type="button"
              className="goal-edit-toggle"
              onClick={() => setEditingGoal(!editingGoal)}
            >
              {editingGoal ? "Cancel" : "⚙️ Edit Goal"}
            </button>
          </div>

          {editingGoal ? (
            <form onSubmit={handleSaveGoal} className="goal-edit-form">
              <Input
                id="daily_goal_input"
                type="number"
                min="5"
                max="1440"
                step="5"
                label="Target Focus (Minutes/Day)"
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                disabled={saving}
              />
              <Button type="submit" size="sm" loading={saving} disabled={saving}>
                Save Goal
              </Button>
            </form>
          ) : (
            <div className="goal-progress-wrap">
              <div className="goal-progress-bar-track">
                <div
                  className="goal-progress-bar-fill"
                  style={{ width: `${goalPercent}%` }}
                />
              </div>
              <div className="goal-progress-footer">
                <span>{goalPercent}% completed today</span>
                <span>Best Streak: {longest_streak} days</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 7-Day Consistency Week Strip */}
      <div className="weekly-streak-strip">
        <span className="weekly-strip-title">7-Day Study Consistency</span>
        <div className="weekly-dots-container">
          {weekly_consistency?.map((item) => (
            <div
              key={item.date}
              className={`weekly-day-dot ${
                item.goal_met
                  ? "dot-goal-met"
                  : item.studied
                  ? "dot-studied"
                  : "dot-empty"
              }`}
              title={`${item.day_name} (${item.date}): ${item.minutes} mins studied`}
            >
              <span className="dot-day-name">{item.day_name}</span>
              <span className="dot-indicator">
                {item.goal_met ? "⭐" : item.studied ? "✓" : "·"}
              </span>
              <span className="dot-mins">
                {item.minutes > 0 ? `${item.minutes}m` : "0m"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
