import { motion } from "framer-motion";
import {
  Calendar,
  FileText,
  GraduationCap,
  Users,
  Clock,
  Sparkles,
  ArrowRight,
  Target,
  MessageSquare,
  Trophy,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Badge from "../../../components/Badge";

export default function SmartLearningTools({
  user,
  schedules = [],
  todayClasses = [],
  todayWeekdayName,
  materials = [],
  totalExtractedTopics = 0,
  topGradePlan,
  communityStats,
  onOpenScheduleModal,
}) {
  const navigate = useNavigate();

  const currentGpa =
    topGradePlan && Number(topGradePlan.current_gpa) > 0
      ? Number(topGradePlan.current_gpa).toFixed(2)
      : user?.current_gpa !== null && user?.current_gpa !== undefined
        ? Number(user.current_gpa).toFixed(2)
        : "0.00";

  const targetGpa =
    topGradePlan && Number(topGradePlan.target_gpa) > 0
      ? Number(topGradePlan.target_gpa).toFixed(2)
      : user?.target_gpa && Number(user.target_gpa) > 0
        ? Number(user.target_gpa).toFixed(2)
        : "4.00";

  const totalCredits =
    topGradePlan && Number(topGradePlan.total_credits) > 0
      ? Number(topGradePlan.total_credits)
      : Number(user?.total_credits) || 140;

  const completedCredits =
    topGradePlan && Number(topGradePlan.completed_credits) >= 0
      ? Number(topGradePlan.completed_credits)
      : Number(user?.completed_credits) || 0;

  const remainingCredits = Math.max(0, totalCredits - completedCredits);

  const gpaAchievedPct =
    Number(targetGpa) > 0
      ? Math.min(
          100,
          Math.round(
            (Number(currentGpa) /
              Number(targetGpa)) *
              100,
          ),
        )
      : 0;

  return (
    <section className="dash-tools-section" aria-label="Smart Learning Tools">
      <div className="dash-tools-header">
        <div className="dash-tools-title-wrap">
          <div className="dash-section-pill">
            <Sparkles size={14} className="text-primary" />
            <span>Academic Operating System</span>
          </div>
          <h2 className="dash-tools-h2">Smart Learning Tools</h2>
          <p className="dash-tools-desc">
            Interconnected student productivity tools designed in a magazine masonry layout for high-performance coursework.
          </p>
        </div>
      </div>

      {/* Magazine Masonry Grid Composition */}
      <div className="dash-masonry-grid">
        {/* Card 1: Planner & Timetable (1 Column in 2x2 grid) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          whileHover={{ y: -5, scale: 1.012 }}
          className="dash-masonry-card dash-card-planner"
        >
          <div className="dash-card-badge-row">
            <div className="dash-module-icon-box bg-orange-subtle text-orange">
              <Calendar size={22} />
            </div>
            <Badge variant="primary">📅 Smart Timetable</Badge>
          </div>

          <div className="dash-card-main-content">
            <span className="dash-card-category">Core Workload Manager</span>
            <h3 className="dash-card-headline">Study Planner & Live Routine</h3>
            <p className="dash-card-copy">
              Build structured weekly routines, track upcoming lecture slots, and attach curriculum resources to specific study windows.
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
                        onClick={() => onOpenScheduleModal && onOpenScheduleModal(item)}
                      >
                        <span className="dash-bento-routine-time-badge">
                          <Clock size={12} />
                          {item.start_time?.slice(0, 5)} - {item.end_time?.slice(0, 5)}
                        </span>
                        <strong className="dash-bento-routine-subject">{item.subject}</strong>
                      </div>
                      <div className="dash-bento-routine-btns">
                        <button
                          type="button"
                          className="dash-bento-btn"
                          onClick={() => onOpenScheduleModal && onOpenScheduleModal(item)}
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
                    <span className="dash-bento-routine-count" style={{ textAlign: "center", display: "block" }}>
                      +{todayClasses.length - 3} more classes scheduled today
                    </span>
                  )}
                </div>
              ) : (
                <div className="dash-bento-routine-empty">
                  <span>No routines set for {todayWeekdayName}.</span>
                  <Link to="/planner" className="dash-bento-btn primary">
                    {schedules.length > 0 ? "View Weekly Routine →" : "+ Add Routine"}
                  </Link>
                </div>
              )}
            </div>
          </div>

          <div className="dash-card-bottom-bar">
            <Link to="/planner" className="dash-module-action-cta">
              <span>Open Full Timetable</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </motion.div>

        {/* Card 2: Materials & AI Extraction (Row 1, Col 2) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08 }}
          whileHover={{ y: -5, scale: 1.012 }}
          className="dash-masonry-card dash-card-materials"
        >
          <div className="dash-card-badge-row">
            <div className="dash-module-icon-box bg-rose-subtle text-rose">
              <FileText size={22} />
            </div>
            <Badge variant="danger">✨ Smart Notes</Badge>
          </div>

          <div className="dash-card-main-content">
            <span className="dash-card-category">Neural Knowledge Vault</span>
            <h3 className="dash-card-headline">Materials & Extraction</h3>
            <p className="dash-card-copy">
              Upload PDF or markdown lecture notes. Extract key syllabus flashcards and AI summaries in seconds.
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

            <div className="dash-module-features-strip">
              <span className="dash-feature-pill">📄 PDF OCR</span>
              <span className="dash-feature-pill">⚡ AI Summaries</span>
              <span className="dash-feature-pill">💡 Flashcards</span>
            </div>
          </div>

          <div className="dash-card-bottom-bar">
            <Link to="/materials" className="dash-module-action-cta">
              <span>Open Materials Hub</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </motion.div>

        {/* Card 3: Scholar Community (Row 2, Col 1) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.12 }}
          whileHover={{ y: -5, scale: 1.012 }}
          className="dash-masonry-card dash-card-community"
        >
          <div className="dash-card-badge-row">
            <div className="dash-module-icon-box bg-orange-subtle text-orange">
              <Users size={22} />
            </div>
            <Badge variant="primary">Campus Network</Badge>
          </div>

          <div className="dash-card-main-content">
            <span className="dash-card-category">Peer Collaboration</span>
            <h3 className="dash-card-headline">Scholar Community</h3>
            <p className="dash-card-copy">
              Ask exam questions, collaborate on group assignments, and sync with live study events.
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

            <div className="dash-community-network-metric">
              <span className="dash-pulse-dot" />
              <span>
                {communityStats?.totalPosts > 0
                  ? `${communityStats.totalPosts} active discussions & peer study groups`
                  : `${communityStats?.totalParticipants || 0} active scholars on campus network`}
              </span>
            </div>
          </div>

          <div className="dash-card-bottom-bar">
            <Link to="/community" className="dash-module-action-cta">
              <span>Join Community Hub</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </motion.div>

        {/* Card 4: Grade Planner (Row 2, Col 2 - Perfectly paired with Scholar Community!) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.16 }}
          whileHover={{ y: -5, scale: 1.012 }}
          className="dash-masonry-card dash-card-gpa"
        >
          <div className="dash-card-badge-row">
            <div className="dash-module-icon-box bg-emerald-subtle text-emerald">
              <GraduationCap size={22} />
            </div>
            <Badge variant="secondary">GPA Calculator</Badge>
          </div>

          <div className="dash-card-main-content">
            <span className="dash-card-category">Degree Guidance</span>
            <h3 className="dash-card-headline">Grade Planner</h3>
            <p className="dash-card-copy">
              Calculate required semester GPAs on remaining credit hours to lock in graduation honors.
            </p>

            <div className="dash-module-gpa-box">
              <div className="dash-module-gpa-labels">
                <div className="dash-module-gpa-item">
                  <span className="dash-module-gpa-label">Current Standing</span>
                  <strong className="dash-module-gpa-current">
                    {currentGpa} GPA
                  </strong>
                </div>
                <div className="dash-module-gpa-item right">
                  <span className="dash-module-gpa-label">Honors Goal</span>
                  <strong className="dash-module-gpa-target">
                    🎯 {targetGpa} GPA
                  </strong>
                </div>
              </div>
              <div className="dash-module-gpa-track">
                <div
                  className="dash-module-gpa-fill"
                  style={{
                    width: `${gpaAchievedPct}%`,
                  }}
                />
              </div>
              <div className="dash-module-gpa-footer-meta">
                <span>
                  {hasPlan
                    ? `${completedCredits} / ${totalCredits} Credits Done`
                    : "0 / 0 Credits Configured"}
                </span>
                <span className="dash-module-gpa-pct">
                  {gpaAchievedPct}% Achieved
                </span>
              </div>
            </div>

            <div className="dash-gpa-target-hint">
              <span>
                {hasPlan ? (
                  <>
                    Target pacing: <strong>{targetGpa} GPA</strong> on {remainingCredits} remaining credits
                  </>
                ) : (
                  <>
                    Target pacing: <strong>0.00 GPA</strong> • Set degree target in Grade Planner
                  </>
                )}
              </span>
            </div>
          </div>

          <div className="dash-card-bottom-bar">
            <Link to="/grades" className="dash-module-action-cta">
              <span>Open Grade Planner</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
