import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Zap,
  Sparkles,
  Play,
  Target,
  PlusCircle,
  Calendar,
} from "lucide-react";
import { Link } from "react-router-dom";

export default function FocusTimeline({
  targetDayLabel,
  targetFormattedDate,
  dayHours,
  dayMins,
  dayTotalMinutes,
  flowDayOffset,
  setFlowDayOffset,
  daySessions = [],
  dayRoutines = [],
  onOpenScheduleModal,
}) {
  const hasSessions = daySessions.length > 0;
  const hasRoutines = dayRoutines.length > 0;

  return (
    <div className="dash-card-24 dash-timeline-card">
      {/* Header */}
      <div className="dash-section-header">
        <div className="dash-section-title-wrap">
          <div className="flex items-center gap-2">
            <h3 className="dash-section-h2">
              <span>{targetDayLabel}'s Focus Flow</span>
            </h3>
            {flowDayOffset > 0 && (
              <button
                type="button"
                onClick={() => setFlowDayOffset(0)}
                className="dash-jump-today-btn"
                title="Return to Today"
              >
                Jump to Today
              </button>
            )}
          </div>
          <p className="dash-section-desc">
            {targetFormattedDate} •{" "}
            {dayTotalMinutes > 0
              ? `${dayHours > 0 ? `${dayHours}h ` : ""}${dayMins}m focused learning`
              : "No sessions logged"}
          </p>
        </div>

        {/* Date Navigator Controls */}
        <div className="dash-timeline-day-picker">
          <button
            type="button"
            className="dash-timeline-arrow"
            onClick={() => setFlowDayOffset((prev) => Math.min(3, prev + 1))}
            disabled={flowDayOffset >= 3}
            title="View Previous Day (up to 3 days ago)"
            aria-label="Previous day"
          >
            <ChevronLeft size={16} />
          </button>

          <span className="dash-timeline-tag">{targetDayLabel}</span>

          <button
            type="button"
            className="dash-timeline-arrow"
            onClick={() => setFlowDayOffset((prev) => Math.max(0, prev - 1))}
            disabled={flowDayOffset <= 0}
            title="View Next Day"
            aria-label="Next day"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Main Content Area — Always starts at the top */}
      <div className="dash-timeline-list">
        <AnimatePresence mode="wait">
          <motion.div
            key={flowDayOffset}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="dash-timeline-motion-wrap"
          >
            {/* 1. Completed Sessions on this day (rendered at the very TOP) */}
            {hasSessions && (
              <div className="dash-timeline-sessions-group">
                {daySessions.map((session, sIdx) => (
                  <div key={session.id || sIdx} className="dash-timeline-item">
                    <div className="dash-timeline-left-wrap">
                      <div className="dash-timeline-node bg-emerald-subtle text-emerald">
                        <CheckCircle2 size={18} />
                      </div>
                      <div className="dash-timeline-body">
                        <strong className="dash-timeline-subject">
                          {session.subject}
                        </strong>
                        <div className="dash-timeline-meta">
                          <span className="flex items-center gap-1">
                            <Clock size={12} /> {session.duration_minutes}m duration
                          </span>
                          <span>•</span>
                          <span>Session #{sIdx + 1}</span>
                        </div>
                        {session.notes && (
                          <p className="text-xs text-muted mt-0.5 line-clamp-1">
                            {session.notes}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="dash-timeline-right-wrap">
                      <span className="dash-timeline-status-badge dash-badge-completed">
                        ✓ Completed
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 2. Scheduled Routines for Today */}
            {flowDayOffset === 0 && hasRoutines && (
              <div className="dash-timeline-routines-group">
                {dayRoutines.map((routine, rIdx) => (
                  <div
                    key={routine.id || rIdx}
                    className="dash-timeline-item cursor-pointer hover:border-primary"
                    onClick={() =>
                      onOpenScheduleModal && onOpenScheduleModal(routine)
                    }
                    title="Click to view routine details"
                  >
                    <div className="dash-timeline-left-wrap">
                      <div className="dash-timeline-node bg-indigo-subtle text-indigo">
                        <Zap size={16} className="animate-pulse" />
                      </div>
                      <div className="dash-timeline-body">
                        <strong className="dash-timeline-subject">
                          {routine.subject}
                        </strong>
                        <div className="dash-timeline-meta">
                          <span className="flex items-center gap-1">
                            <Clock size={12} /> {routine.start_time?.slice(0, 5)} -{" "}
                            {routine.end_time?.slice(0, 5)}
                          </span>
                          <span>•</span>
                          <span>Timetable Routine</span>
                        </div>
                      </div>
                    </div>
                    <div className="dash-timeline-right-wrap">
                      <span className="dash-timeline-status-badge dash-badge-scheduled">
                        Scheduled
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 3. Empty State when NO sessions exist for Today */}
            {flowDayOffset === 0 && !hasSessions && !hasRoutines && (
              <div className="dash-timeline-empty-card today">
                <div className="dash-timeline-empty-icon-wrap">
                  <Sparkles size={22} className="text-primary animate-pulse" />
                </div>
                <div className="dash-timeline-empty-content">
                  <strong className="dash-timeline-empty-title">
                    Nothing to show yet today
                  </strong>
                  <p className="dash-timeline-empty-sub">
                    No focus sessions logged yet today. Choose a quick sprint below to kickstart your study streak!
                  </p>
                </div>
              </div>
            )}

            {/* 4. Empty State for Past Days (when NO sessions exist) */}
            {flowDayOffset > 0 && !hasSessions && (
              <div className="dash-timeline-empty-card past">
                <div className="dash-timeline-empty-icon-wrap past">
                  <Clock size={28} className="text-muted" />
                </div>
                <div className="dash-timeline-empty-content">
                  <strong className="dash-timeline-empty-title">
                    Nothing to show for {targetDayLabel}
                  </strong>
                  <p className="dash-timeline-empty-sub">
                    No focus sessions or timetable activity recorded on {targetFormattedDate}.
                  </p>
                  <button
                    type="button"
                    onClick={() => setFlowDayOffset(0)}
                    className="dash-btn-return-today"
                  >
                    Jump to Today's Flow →
                  </button>
                </div>
              </div>
            )}

            {/* 5. Past Day Summary Banner (when sessions DO exist in past day) */}
            {flowDayOffset > 0 && hasSessions && (
              <div className="dash-timeline-past-summary">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald" />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      {targetDayLabel} Summary: {daySessions.length} session{daySessions.length > 1 ? "s" : ""} completed ({dayHours > 0 ? `${dayHours}h ` : ""}{dayMins}m logged)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFlowDayOffset(0)}
                    className="dash-timeline-inline-link"
                  >
                    Jump to Today's Flow →
                  </button>
                </div>
              </div>
            )}

            {/* 6. "Add More" / Instant Focus Studio on Today */}
            {flowDayOffset === 0 && (
              <div className="dash-timeline-quick-launchpad">
                <div className="dash-launchpad-header">
                  <div className="flex items-center gap-1.5">
                    <PlusCircle size={14} className="text-primary" />
                    <span className="dash-launchpad-title">
                      {hasSessions ? "Add More Focus Time" : "Instant Focus Studio"}
                    </span>
                  </div>
                  <Link
                    to="/study-center?tab=tracker"
                    className="dash-launchpad-subtitle hover:text-primary transition-colors"
                  >
                    Custom Timer →
                  </Link>
                </div>

                <div className="dash-launchpad-presets">
                  <Link
                    to="/study-center?tab=tracker"
                    className="dash-preset-chip pomodoro"
                    title="Start 25-minute Pomodoro focus"
                  >
                    <div className="dash-preset-time-badge">25m</div>
                    <div className="dash-preset-info">
                      <span className="dash-preset-name">Pomodoro</span>
                      <span className="dash-preset-desc">Quick Sprint</span>
                    </div>
                  </Link>

                  <Link
                    to="/study-center?tab=tracker"
                    className="dash-preset-chip deep"
                    title="Start 45-minute deep focus"
                  >
                    <div className="dash-preset-time-badge deep">45m</div>
                    <div className="dash-preset-info">
                      <span className="dash-preset-name">Deep Work</span>
                      <span className="dash-preset-desc">Habit Threshold</span>
                    </div>
                  </Link>

                  <Link
                    to="/study-center?tab=tracker"
                    className="dash-preset-chip exam"
                    title="Start 60-minute exam review"
                  >
                    <div className="dash-preset-time-badge exam">60m</div>
                    <div className="dash-preset-info">
                      <span className="dash-preset-name">Exam Prep</span>
                      <span className="dash-preset-desc">Course Mastery</span>
                    </div>
                  </Link>
                </div>

                <div className="dash-daily-targets-checklist">
                  <div className="dash-target-item">
                    <span
                      className={`dash-target-dot ${
                        dayTotalMinutes >= 45 ? "done" : "pending"
                      }`}
                    />
                    <span className="dash-target-text">
                      {dayTotalMinutes >= 45
                        ? "✓ 45m Daily study challenge accomplished"
                        : "45-minute daily study threshold goal"}
                    </span>
                  </div>
                  <div className="dash-target-item">
                    <span className="dash-target-dot done" />
                    <span className="dash-target-text">
                      {dayRoutines.length > 0
                        ? `${dayRoutines.length} Timetable routine${
                            dayRoutines.length > 1 ? "s" : ""
                          } synchronized`
                        : "Timetable routines synchronized"}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
