import { motion } from "framer-motion";
import {
  Calendar,
  FileText,
  GraduationCap,
  Flame,
  Users,
  Clock,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Badge from "../../../components/Badge";

export default function AcademicModules({
  schedules,
  todayClasses,
  todayWeekdayName,
  materials,
  totalExtractedTopics,
  topGradePlan,
  currentStreak,
  onOpenScheduleModal,
}) {
  const navigate = useNavigate();

  return (
    <div className="dash-modules-section">
      <div className="dash-section-header">
        <div className="dash-section-title-wrap">
          <h2 className="dash-section-h2">
            <Sparkles size={18} className="text-primary" />
            <span>Academic Modules</span>
          </h2>
          <p className="dash-section-desc">
            Interconnected student productivity tools for high-performance
            coursework.
          </p>
        </div>
      </div>

      <div className="dash-modules-grid">
        {/* Module 1: Study Planner & Timetable */}
        <motion.div
          whileHover={{ y: -4, scale: 1.015 }}
          transition={{ duration: 0.22 }}
          className="dash-card-24 dash-module-card"
          style={{ gridColumn: "span 2" }}
        >
          <div className="dash-module-top">
            <div className="dash-module-icon-box bg-indigo-subtle text-indigo">
              <Calendar size={22} />
            </div>
            <Badge variant="primary">📅 Smart Timetable</Badge>
          </div>

          <div className="dash-module-content">
            <h3 className="dash-module-title">Study Planner & Timetable</h3>
            <p className="dash-module-desc">
              Build structured weekly routines, attach resource links, and
              organize subject workloads.
            </p>

            {/* Live Today's Classes List Preview */}
            <div className="dash-bento-routine-wrap">
              <div className="dash-bento-routine-header">
                <span className="dash-bento-routine-live-tag">
                  <span className="dash-pulse-dot" />
                  Today’s Schedule ({todayWeekdayName})
                </span>
                <span className="dash-bento-routine-count">
                  {todayClasses.length > 0
                    ? `${todayClasses.length} ${todayClasses.length === 1 ? "class" : "classes"}`
                    : "No classes scheduled"}
                </span>
              </div>

              {todayClasses.length > 0 ? (
                <div className="dash-bento-routine-list">
                  {todayClasses.slice(0, 3).map((item) => (
                    <div key={item.id} className="dash-bento-routine-item">
                      <div
                        className="dash-bento-routine-left"
                        onClick={() =>
                          onOpenScheduleModal && onOpenScheduleModal(item)
                        }
                      >
                        <span className="dash-bento-routine-time-badge">
                          <Clock size={12} />
                          {item.start_time?.slice(0, 5)} -{" "}
                          {item.end_time?.slice(0, 5)}
                        </span>
                        <strong className="dash-bento-routine-subject">
                          {item.subject}
                        </strong>
                      </div>
                      <div className="dash-bento-routine-btns">
                        <button
                          type="button"
                          className="dash-bento-btn"
                          onClick={() =>
                            onOpenScheduleModal && onOpenScheduleModal(item)
                          }
                        >
                          Details
                        </button>
                        <button
                          type="button"
                          className="dash-bento-btn primary"
                          onClick={() =>
                            navigate(`/planner?routineId=${item.id}`, {
                              state: { highlightId: item.id },
                            })
                          }
                        >
                          Open ↗
                        </button>
                      </div>
                    </div>
                  ))}
                  {todayClasses.length > 3 && (
                    <span
                      className="dash-bento-routine-count"
                      style={{ textAlign: "center", display: "block" }}
                    >
                      +{todayClasses.length - 3} more classes scheduled today
                    </span>
                  )}
                </div>
              ) : (
                <div className="dash-bento-routine-empty">
                  <span>No routines set for {todayWeekdayName}.</span>
                  <Link to="/planner" className="dash-bento-btn primary">
                    {schedules.length > 0
                      ? "View Weekly Routine →"
                      : "+ Add Routine"}
                  </Link>
                </div>
              )}
            </div>
          </div>

          <div className="dash-module-footer">
            <Link to="/planner" className="dash-module-action-cta">
              <span>Open Planner Timetable</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </motion.div>

        {/* Module 2: Materials & Extraction */}
        <motion.div
          whileHover={{ y: -4, scale: 1.015 }}
          transition={{ duration: 0.22 }}
          className="dash-card-24 dash-module-card"
        >
          <div className="dash-module-top">
            <div className="dash-module-icon-box bg-rose-subtle text-rose">
              <FileText size={22} />
            </div>
            <Badge variant="danger">✨ Smart Notes</Badge>
          </div>

          <div className="dash-module-content">
            <h3 className="dash-module-title">Materials & Extraction</h3>
            <p className="dash-module-desc">
              Upload PDF, DOCX, or markdown notes. Extract key syllabus concepts
              and flashcards.
            </p>

            <div className="dash-module-stats-row">
              <div className="dash-module-stat-pill">
                <div className="dash-module-stat-header">
                  <FileText size={15} className="text-primary" />
                  <span className="dash-module-stat-label">Documents</span>
                </div>
                <div className="dash-module-stat-val-row">
                  <strong className="dash-module-stat-num">{materials.length}</strong>
                  <span className="dash-module-stat-badge">Indexed</span>
                </div>
              </div>
              <div className="dash-module-stat-pill rose">
                <div className="dash-module-stat-header">
                  <Sparkles size={15} className="text-rose" />
                  <span className="dash-module-stat-label">AI Concepts</span>
                </div>
                <div className="dash-module-stat-val-row">
                  <strong className="dash-module-stat-num rose">{totalExtractedTopics}</strong>
                  <span className="dash-module-stat-badge rose">Extracted</span>
                </div>
              </div>
            </div>
          </div>

          <div className="dash-module-footer">
            <Link to="/materials" className="dash-module-action-cta">
              <span>Open Materials Hub</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </motion.div>

        {/* Module 3: Grade Planner */}
        <motion.div
          whileHover={{ y: -4, scale: 1.015 }}
          transition={{ duration: 0.22 }}
          className="dash-card-24 dash-module-card"
        >
          <div className="dash-module-top">
            <div className="dash-module-icon-box bg-emerald-subtle text-emerald">
              <GraduationCap size={22} />
            </div>
            <Badge variant="secondary">GPA Calculator</Badge>
          </div>

          <div className="dash-module-content">
            <h3 className="dash-module-title">Grade Planner</h3>
            <p className="dash-module-desc">
              Calculate required semester GPAs on remaining credit hours to lock
              in graduation honors.
            </p>

            <div className="dash-module-gpa-box">
              <div className="dash-module-gpa-labels">
                <div className="dash-module-gpa-item">
                  <span className="dash-module-gpa-label">Current Standing</span>
                  <strong className="dash-module-gpa-current">
                    {topGradePlan && Number(topGradePlan.current_gpa) > 0
                      ? `${Number(topGradePlan.current_gpa).toFixed(2)} GPA`
                      : "0.00 GPA"}
                  </strong>
                </div>
                <div className="dash-module-gpa-item right">
                  <span className="dash-module-gpa-label">Honors Goal</span>
                  <strong className="dash-module-gpa-target">
                    🎯 {topGradePlan && Number(topGradePlan.target_gpa) > 0
                      ? `${Number(topGradePlan.target_gpa).toFixed(2)} GPA`
                      : "0.00 GPA"}
                  </strong>
                </div>
              </div>
              <div className="dash-module-gpa-track">
                <div
                  className="dash-module-gpa-fill"
                  style={{
                    width:
                      topGradePlan && Number(topGradePlan.target_gpa) > 0
                        ? `${Math.min(
                            (Number(topGradePlan.current_gpa) /
                              Number(topGradePlan.target_gpa)) *
                              100,
                            100,
                          )}%`
                        : "0%",
                  }}
                />
              </div>
              <div className="dash-module-gpa-footer-meta">
                <span>
                  {topGradePlan
                    ? `${topGradePlan.completed_credits || 0} / ${topGradePlan.total_credits || 0} Credits Done`
                    : "0 / 0 Credits Configured"}
                </span>
                <span className="dash-module-gpa-pct">
                  {topGradePlan && Number(topGradePlan.target_gpa) > 0
                    ? `${Math.round(
                        (Number(topGradePlan.current_gpa) /
                          Number(topGradePlan.target_gpa)) *
                          100,
                      )}% Achieved`
                    : "0% Achieved"}
                </span>
              </div>
            </div>
          </div>

          <div className="dash-module-footer">
            <Link to="/grades" className="dash-module-action-cta">
              <span>Open Grade Planner</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </motion.div>

        {/* Module 4: Focus & Rewards */}
        <motion.div
          whileHover={{ y: -4, scale: 1.015 }}
          transition={{ duration: 0.22 }}
          className="dash-card-24 dash-module-card"
        >
          <div className="dash-module-top">
            <div className="dash-module-icon-box bg-amber-subtle text-amber">
              <Flame size={22} />
            </div>
            <Badge variant="accent">Habits & Streaks</Badge>
          </div>

          <div className="dash-module-content">
            <h3 className="dash-module-title">Focus & Rewards</h3>
            <p className="dash-module-desc">
              Log focused pomodoros, maintain consistency streaks, and unlock
              achievement milestone badges.
            </p>

            <div className="dash-module-streak-box">
              <div className="dash-module-streak-icon-wrap">
                <Flame size={20} className="text-amber animate-pulse" />
              </div>
              <div className="dash-module-streak-content">
                <div className="dash-module-streak-top">
                  <strong className="dash-module-streak-headline">
                    {currentStreak > 0
                      ? `${currentStreak} Days Active Streak`
                      : "Daily Streak Ready"}
                  </strong>
                  <span className="dash-module-streak-badge">
                    {currentStreak > 0 ? "🔥 Streak Active" : "⚡ +50 XP"}
                  </span>
                </div>
                <p className="dash-module-streak-sub">
                  Log focused study sessions daily to maintain habit momentum.
                </p>
              </div>
            </div>
          </div>

          <div className="dash-module-footer">
            <Link
              to="/study-center?tab=tracker"
              className="dash-module-action-cta"
            >
              <span>Open Study Tracker</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </motion.div>

        {/* Module 5: Scholar Community */}
        <motion.div
          whileHover={{ y: -4, scale: 1.015 }}
          transition={{ duration: 0.22 }}
          className="dash-card-24 dash-module-card"
        >
          <div className="dash-module-top">
            <div className="dash-module-icon-box bg-indigo-subtle text-indigo">
              <Users size={22} />
            </div>
            <Badge variant="primary">Campus Network</Badge>
          </div>

          <div className="dash-module-content">
            <h3 className="dash-module-title">Scholar Community</h3>
            <p className="dash-module-desc">
              Ask exam questions, collaborate on coursework, attend study
              events, and climb the leaderboard.
            </p>

            <div className="dash-module-tags-row">
              <div className="dash-module-tag-badge">
                <span className="dash-tag-icon">💬</span>
                <span className="dash-tag-title">Q&A Forum</span>
                <span className="dash-tag-sub">Discuss</span>
              </div>
              <div className="dash-module-tag-badge leaderboard">
                <span className="dash-tag-icon">🏆</span>
                <span className="dash-tag-title">Leaderboard</span>
                <span className="dash-tag-sub">Top 10%</span>
              </div>
              <div className="dash-module-tag-badge events">
                <span className="dash-tag-icon">🗓️</span>
                <span className="dash-tag-title">Study Groups</span>
                <span className="dash-tag-sub">Live</span>
              </div>
            </div>
          </div>

          <div className="dash-module-footer">
            <Link to="/community" className="dash-module-action-cta">
              <span>Open Community Hub</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
