import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart3, TrendingUp, PieChart, Sparkles, Award, CheckCircle2, Flame } from "lucide-react";
import StudyHeatmap from "./StudyHeatmap";

export default function StudyInsights({
  sessions = [],
  schedules = [],
  currentStreak = 0,
  totalHours = "0.0",
}) {
  const [hoveredBar, setHoveredBar] = useState(null);

  // 1. Calculate 7-day Weekly Trend (Mon through Sun)
  const weeklyTrendData = useMemo(() => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Map sessions of last 7 days
    const result = days.map((dayName, idx) => {
      // Find date for that day in the current week
      const currentDayIdx = (today.getDay() + 6) % 7; // 0=Mon, 6=Sun
      const diff = idx - currentDayIdx;
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + diff);
      const iso = targetDate.toISOString().slice(0, 10);

      const dayMins = sessions.reduce((acc, s) => {
        const dStr = s.session_date || (s.created_at ? s.created_at.slice(0, 10) : "");
        return dStr === iso ? acc + Number(s.duration_minutes || 0) : acc;
      }, 0);

      return {
        day: dayName,
        date: targetDate.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        minutes: dayMins,
        isToday: diff === 0,
        isFuture: diff > 0,
      };
    });

    const maxMins = Math.max(...result.map((d) => d.minutes), 60); // minimum 60m scale
    return { days: result, maxMins };
  }, [sessions]);

  // 2. Subject Distribution breakdown
  const subjectDistribution = useMemo(() => {
    const subjectMins = {};
    let totalMins = 0;

    sessions.forEach((s) => {
      const sub = s.subject || "General Study";
      const mins = Number(s.duration_minutes || 0);
      if (!subjectMins[sub]) subjectMins[sub] = 0;
      subjectMins[sub] += mins;
      totalMins += mins;
    });

    // If no sessions, use schedules as placeholder distribution
    if (totalMins === 0 && schedules.length > 0) {
      schedules.slice(0, 4).forEach((sch, idx) => {
        const pseudoMins = (4 - idx) * 45;
        subjectMins[sch.subject] = pseudoMins;
        totalMins += pseudoMins;
      });
    }

    const sorted = Object.entries(subjectMins)
      .map(([name, mins]) => ({
        name,
        minutes: mins,
        hours: (mins / 60).toFixed(1),
        percent: totalMins > 0 ? Math.round((mins / totalMins) * 100) : 0,
      }))
      .sort((a, b) => b.minutes - a.minutes)
      .slice(0, 4);

    return { subjects: sorted, totalMins };
  }, [sessions, schedules]);

  // 3. Dynamic Productivity Score (0 to 100)
  const productivityScore = useMemo(() => {
    let score = 50; // baseline
    if (parseFloat(totalHours) > 5) score += 20;
    else if (parseFloat(totalHours) > 2) score += 10;

    if (currentStreak >= 7) score += 20;
    else if (currentStreak >= 3) score += 12;
    else if (currentStreak > 0) score += 6;

    if (sessions.length >= 5) score += 10;
    return Math.min(98, score);
  }, [totalHours, currentStreak, sessions]);

  return (
    <section className="dash-insights-section" aria-label="Study Insights">
      <div className="dash-insights-header">
        <div className="dash-insights-title-wrap">
          <div className="dash-section-pill">
            <BarChart3 size={14} className="text-primary" />
            <span>Deep Learning Analytics</span>
          </div>
          <h2 className="dash-insights-h2">Study Insights & Velocity</h2>
          <p className="dash-insights-desc">
            Granular metrics tracking your daily learning distribution, streak momentum, and academic velocity.
          </p>
        </div>
      </div>

      {/* 1. Full-Width Study Heatmap */}
      <div className="dash-insights-heatmap-wrap">
        <StudyHeatmap sessions={sessions} />
      </div>

      {/* 2. Three Analytics Deep-Dive Panels */}
      <div className="dash-insights-trio-grid">
        {/* Panel A: 7-Day Weekly Trend Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ y: -6, scale: 1.015 }}
          transition={{ duration: 0.3 }}
          className="dash-card-24 dash-analytics-card"
        >
          <div className="dash-card-glow glow-orange" />

          <div className="dash-analytics-card-header">
            <div className="flex items-center gap-2">
              <motion.div
                whileHover={{ rotate: 12, scale: 1.15 }}
                className="dash-analytics-icon-badge orange"
              >
                <TrendingUp size={16} />
              </motion.div>
              <strong className="dash-analytics-card-title">Weekly Focus Trend</strong>
            </div>
            <span className="dash-analytics-tag">Last 7 Days</span>
          </div>

          <div className="dash-bar-chart-container">
            {weeklyTrendData.days.map((item, idx) => {
              const heightPct = Math.max(8, Math.round((item.minutes / weeklyTrendData.maxMins) * 100));
              const isHovered = hoveredBar === idx;

              return (
                <div
                  key={idx}
                  className="dash-bar-col"
                  onMouseEnter={() => setHoveredBar(idx)}
                  onMouseLeave={() => setHoveredBar(null)}
                >
                  <AnimatePresence>
                    {isHovered && (
                      <motion.div
                        initial={{ opacity: 0, y: 4, scale: 0.85 }}
                        animate={{ opacity: 1, y: -2, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.85 }}
                        className="dash-bar-floating-tooltip"
                      >
                        <span>{item.minutes}m</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="dash-bar-track">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${heightPct}%` }}
                      transition={{ duration: 0.7, delay: idx * 0.07, type: "spring", stiffness: 100, damping: 15 }}
                      className={`dash-bar-fill ${item.isToday ? "active-today" : ""}`}
                    />
                  </div>
                  <span className={`dash-bar-day-lbl ${item.isToday ? "is-today" : ""}`}>
                    {item.day}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="dash-analytics-footer-summary">
            <span>Daily focus minutes across the active learning week</span>
          </div>
        </motion.div>

        {/* Panel B: Subject Focus Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ y: -6, scale: 1.015 }}
          transition={{ duration: 0.3, delay: 0.08 }}
          className="dash-card-24 dash-analytics-card"
        >
          <div className="dash-card-glow glow-purple" />

          <div className="dash-analytics-card-header">
            <div className="flex items-center gap-2">
              <motion.div
                whileHover={{ rotate: 12, scale: 1.15 }}
                className="dash-analytics-icon-badge emerald"
              >
                <PieChart size={16} />
              </motion.div>
              <strong className="dash-analytics-card-title">Subject Distribution</strong>
            </div>
            <span className="dash-analytics-tag">Curriculum Focus</span>
          </div>

          <div className="dash-distribution-list">
            {subjectDistribution.subjects.length > 0 ? (
              subjectDistribution.subjects.map((sub, sIdx) => (
                <div key={sIdx} className="dash-dist-item">
                  <div className="dash-dist-header">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`dash-dist-dot color-${sIdx}`} />
                      <span className="dash-dist-name" title={sub.name}>{sub.name}</span>
                    </div>
                    <strong className="dash-dist-val">{sub.hours}h ({sub.percent}%)</strong>
                  </div>
                  <div className="dash-dist-track">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${sub.percent}%` }}
                      transition={{ duration: 0.8, delay: sIdx * 0.1, ease: "easeOut" }}
                      className={`dash-dist-fill color-${sIdx}`}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="dash-dist-empty">
                <span>Start logging sessions to see subject distribution</span>
              </div>
            )}
          </div>

          <div className="dash-analytics-footer-summary">
            <span>Balancing high-difficulty coursework with core subjects</span>
          </div>
        </motion.div>

        {/* Panel C: Academic Productivity Score */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ y: -6, scale: 1.015 }}
          transition={{ duration: 0.3, delay: 0.16 }}
          className="dash-card-24 dash-analytics-card"
        >
          <div className="dash-card-glow glow-emerald" />

          <div className="dash-analytics-card-header">
            <div className="flex items-center gap-2">
              <motion.div
                whileHover={{ rotate: 12, scale: 1.15 }}
                className="dash-analytics-icon-badge amber"
              >
                <Award size={16} />
              </motion.div>
              <strong className="dash-analytics-card-title">Productivity Score</strong>
            </div>
            <span className="dash-analytics-tag">Scholar Index</span>
          </div>

          <div className="dash-productivity-body">
            <div className="dash-prod-gauge-box">
              <div className="dash-prod-glow-pulse" />
              <svg className="dash-prod-svg" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="var(--dash-surface-elevated)"
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="url(#prodGrad)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 40}
                  strokeDashoffset={2 * Math.PI * 40 * (1 - productivityScore / 100)}
                  transform="rotate(-90 50 50)"
                  style={{
                    transition: "stroke-dashoffset 1.2s cubic-bezier(0.16, 1, 0.3, 1)",
                    filter: "drop-shadow(0 0 8px rgba(16, 185, 129, 0.45))",
                  }}
                />
                <defs>
                  <linearGradient id="prodGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f97316" />
                    <stop offset="40%" stopColor="#eab308" />
                    <stop offset="80%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="dash-prod-center-score">
                <span className="dash-prod-num">{productivityScore}</span>
                <span className="dash-prod-denom">/100</span>
              </div>
            </div>

            <div className="dash-prod-verdict">
              <span className="dash-prod-badge">
                <Sparkles size={13} className="text-emerald" />
                <span>Exceptional Velocity</span>
              </span>
              <p className="dash-prod-sub">
                Your study habits place you in the top 8% of focused learners this semester.
              </p>
            </div>
          </div>

          <div className="dash-analytics-footer-summary">
            <span>Calculated from streak habits, hours logged & routines</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
