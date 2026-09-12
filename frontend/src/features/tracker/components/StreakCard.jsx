import { useState, useMemo } from "react";
import { Flame, Sparkles, Target, Zap } from "lucide-react";
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

  const weekly_consistency = streakData?.weekly_consistency || [];

  // Compute 7-day consistency stats
  const { totalWeekMinutes, activeDaysCount, goalsMetCount } = useMemo(() => {
    const totalMins = weekly_consistency.reduce(
      (sum, d) => sum + (d.minutes || 0),
      0,
    );
    const activeDays = weekly_consistency.filter((d) => d.studied).length;
    const goalsMet = weekly_consistency.filter((d) => d.goal_met).length;
    return {
      totalWeekMinutes: totalMins,
      activeDaysCount: activeDays,
      goalsMetCount: goalsMet,
    };
  }, [weekly_consistency]);

  if (!streakData) return null;

  const {
    current_streak = 0,
    longest_streak = 0,
    today_minutes = 0,
    daily_goal_minutes = 60,
    daily_goal_achieved = false,
    studied_today = false,
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

  // Helper to format short date "9 Sep"
  const formatShortDate = (dateStr) => {
    if (!dateStr) return "";
    try {
      const parts = dateStr.split("-");
      if (parts.length === 3) {
        const d = new Date(parts[0], parts[1] - 1, parts[2]);
        return d.toLocaleDateString(undefined, {
          day: "numeric",
          month: "short",
        });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  const todayIso = new Date().toISOString().slice(0, 10);

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
              <span className="daily-goal-label">Today's Study Target</span>
              {daily_goal_achieved ? (
                <Badge variant="success">
                  🎯 Target Met ({today_minutes}m)
                </Badge>
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
              {editingGoal ? "Cancel" : "⚙️ Edit Target"}
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
              <Button
                type="submit"
                size="sm"
                loading={saving}
                disabled={saving}
              >
                Save Target
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

      {/* Gamified 7-Day Consistency Tracker */}
      <div className="weekly-streak-strip">
        <div className="weekly-strip-header">
          <div className="weekly-strip-title-group">
            <span className="weekly-strip-title">7-Day Study Consistency</span>
            <span className="weekly-strip-subtitle">
              Daily habit velocity & target achievements
            </span>
          </div>

          <div className="weekly-strip-metrics">
            <div className="weekly-metric-chip active-days">
              <Zap size={12} className="text-amber" />
              <span>{activeDaysCount}/7 Active Days</span>
            </div>
            <div className="weekly-metric-chip goals-met">
              <Target size={12} className="text-emerald" />
              <span>{goalsMetCount} Targets Met</span>
            </div>
            <div className="weekly-metric-chip total-focus">
              <Flame size={12} className="text-purple" />
              <span>
                {Math.round((totalWeekMinutes / 60) * 10) / 10}h Focused
              </span>
            </div>
          </div>
        </div>

        <div className="weekly-days-grid">
          {weekly_consistency?.map((item, idx) => {
            const isToday =
              item.date === todayIso || idx === weekly_consistency.length - 1;
            const targetMins = daily_goal_minutes || 60;
            const pct = Math.min(
              100,
              Math.round(((item.minutes || 0) / targetMins) * 100),
            );
            const fillHeight = Math.max(item.studied ? 16 : 0, pct);

            return (
              <div
                key={item.date}
                className={`weekly-day-card ${
                  item.goal_met
                    ? "day-goal-met"
                    : item.studied
                      ? "day-studied"
                      : "day-rest"
                } ${isToday ? "day-today" : ""}`}
                title={`${item.day_name}, ${formatShortDate(item.date)}: ${
                  item.minutes
                } mins studied (${pct}% of target)${
                  item.goal_met ? " • Target Met!" : ""
                }`}
              >
                {/* Day Header */}
                <div className="day-card-header">
                  <span className="day-card-name">{item.day_name}</span>
                  {isToday ? (
                    <span className="day-card-today-badge">Today</span>
                  ) : (
                    <span className="day-card-date">
                      {formatShortDate(item.date)}
                    </span>
                  )}
                </div>

                {/* Cylinder Progress Gauge */}
                <div className="cylinder-gauge-container">
                  <div className="cylinder-gauge-track">
                    <div
                      className={`cylinder-gauge-fill ${
                        item.goal_met
                          ? "fill-goal-met"
                          : item.studied
                            ? "fill-studied"
                            : "fill-empty"
                      }`}
                      style={{ height: `${fillHeight}%` }}
                    />
                  </div>

                  <div className="cylinder-badge-icon">
                    {item.goal_met ? (
                      <span className="icon-met" title="Goal Met">
                        ⭐
                      </span>
                    ) : item.studied ? (
                      <span className="icon-studied" title="Studied">
                        ⚡
                      </span>
                    ) : (
                      <span className="icon-rest" title="Rest Day">
                        ·
                      </span>
                    )}
                  </div>
                </div>

                {/* Minutes & Completion Footer */}
                <div className="day-card-footer">
                  <span className="day-card-mins">
                    {item.minutes > 0 ? `${item.minutes}m` : "0m"}
                  </span>
                  <span className="day-card-pct">
                    {pct > 0 ? `${pct}%` : "—"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
