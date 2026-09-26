import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  Flame,
  Globe,
  MoreVertical,
  Pencil,
  Play,
  Plus,
  RotateCcw,
  Sparkles,
  StickyNote,
  Timer,
  Trash2,
  XCircle,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";
import Button from "../../../components/Button";

function formatTimeOnly(timeStr) {
  if (!timeStr) return "";
  try {
    const [hrs, mins] = timeStr.split(":");
    const h = parseInt(hrs, 10);
    const m = mins || "00";
    const ampm = h >= 12 ? "PM" : "AM";
    const formattedH = h % 12 === 0 ? 12 : h % 12;
    return `${formattedH}:${m} ${ampm}`;
  } catch {
    return timeStr;
  }
}

export default function ScheduledSessionCard({
  session,
  onStart,
  onComplete,
  onExtend,
  onTakeQuiz,
  onViewDiagnostic,
  onEdit,
  onDelete,
  onReschedule,
}) {
  const [extending, setExtending] = useState(false);
  const [starting, setStarting] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [currentTime, setCurrentTime] = useState(() => new Date());

  // Live 1-second interval to drive live countdown timers
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Determine timing & readiness status
  const { isToday, isUpcoming, isPastTime, timeWindowText } = useMemo(() => {
    if (!session?.session_date) {
      return {
        isToday: false,
        isUpcoming: false,
        isPastTime: false,
        timeWindowText: "",
      };
    }

    const todayStr = new Date().toISOString().split("T")[0];
    const isT = session.session_date === todayStr;

    let startTimeFormatted = formatTimeOnly(session.start_time);
    let endTimeFormatted = formatTimeOnly(session.end_time);

    let windowStr = startTimeFormatted;
    if (endTimeFormatted) {
      windowStr = `${startTimeFormatted} – ${endTimeFormatted}`;
    }

    return {
      isToday: isT,
      isUpcoming: session.session_date > todayStr,
      isPastTime: session.session_date < todayStr,
      timeWindowText: windowStr,
    };
  }, [session?.session_date, session?.start_time, session?.end_time]);

  // Calculate live countdown / status context
  const timingContext = useMemo(() => {
    if (!session?.session_date || !session?.start_time) return null;
    try {
      const now = currentTime;
      const [sh, sm] = session.start_time.split(":").map(Number);
      const sessionStart = new Date(session.session_date);
      sessionStart.setHours(sh, sm, 0, 0);

      const [eh, em] = (session.end_time || `${sh + 1}:${sm}`)
        .split(":")
        .map(Number);
      const sessionEnd = new Date(session.session_date);
      sessionEnd.setHours(eh, em, 0, 0);

      if (now >= sessionStart && now <= sessionEnd) {
        const remainingSec = Math.max(
          0,
          Math.floor((sessionEnd.getTime() - now.getTime()) / 1000),
        );
        const remMins = Math.floor(remainingSec / 60);
        const remSecs = remainingSec % 60;
        const timeStr =
          remMins >= 60
            ? `${Math.floor(remMins / 60)}h ${remMins % 60}m ${remSecs < 10 ? "0" : ""}${remSecs}s`
            : `${remMins}m ${remSecs < 10 ? "0" : ""}${remSecs}s`;

        return {
          label: `Active Window Now • Closes in ${timeStr}`,
          type: "active",
          icon: Zap,
          isActiveNow: true,
          timeStr,
          remainingSec,
        };
      }

      const diffSec = Math.floor(
        (sessionStart.getTime() - now.getTime()) / 1000,
      );
      const diffMins = Math.floor(diffSec / 60);

      if (diffSec > 0 && diffSec <= 3600) {
        const remSecs = diffSec % 60;
        const timeStr = `${diffMins}m ${remSecs < 10 ? "0" : ""}${remSecs}s`;
        return {
          label: `Starts in ${timeStr}`,
          type: "soon",
          icon: Clock,
          isSoon: true,
          timeStr,
        };
      }
      if (diffMins > 60 && diffMins <= 12 * 60) {
        const hrs = Math.round(diffMins / 60);
        return {
          label: `Starts in ~${hrs}h`,
          type: "upcoming",
          icon: Clock,
        };
      }
      if (now > sessionEnd) {
        return {
          label: "Time Window Ended",
          type: "passed",
          icon: AlertCircle,
        };
      }
      return null;
    } catch {
      return null;
    }
  }, [
    session?.session_date,
    session?.start_time,
    session?.end_time,
    currentTime,
  ]);

  const handleStart = async () => {
    if (!onStart) return;
    try {
      setStarting(true);
      await onStart(session);
    } finally {
      setStarting(false);
    }
  };

  const handleComplete = async () => {
    if (!onComplete) return;
    try {
      setCompleting(true);
      await onComplete(session);
    } finally {
      setCompleting(false);
    }
  };

  const handleExtend = async (mins) => {
    if (!onExtend) return;
    try {
      setExtending(true);
      await onExtend(session, mins);
    } finally {
      setExtending(false);
    }
  };

  const course = session.course_details;
  const material = session.material_details;
  const status = session.status || "scheduled";

  const StatusIcon =
    status === "in_progress"
      ? Flame
      : status === "completed"
        ? CheckCircle2
        : status === "missed"
          ? AlertCircle
          : Clock;

  const accentBackground =
    status === "completed"
      ? "linear-gradient(90deg, #10b981 0%, #059669 100%)"
      : status === "in_progress"
        ? "linear-gradient(90deg, #f26522 0%, #ea580c 100%)"
        : status === "missed"
          ? "linear-gradient(90deg, #ef4444 0%, #f43f5e 100%)"
          : course?.color
            ? `linear-gradient(90deg, ${course.color} 0%, #ea580c 100%)`
            : "linear-gradient(90deg, #f26522 0%, #ea580c 100%)";

  return (
    <motion.div
      className={`scheduled-session-card status-${status} ${
        timingContext?.isActiveNow ? "scheduled-card-active-now" : ""
      }`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.985 }}
      transition={{ duration: 0.2 }}
    >
      {/* Accent Top Border Bar */}
      <div
        className={`scheduled-card-accent ${
          status === "in_progress" || timingContext?.isActiveNow
            ? "accent-animated-glow"
            : ""
        }`}
        style={{ background: accentBackground }}
      />

      <div className="scheduled-card-body">
        {/* Top Header Row */}
        <div className="scheduled-card-header">
          <div className="scheduled-header-left">
            {course && (
              <span
                className="course-chip-badge"
                style={{
                  background: course.color
                    ? `${course.color}18`
                    : "rgba(99, 102, 241, 0.1)",
                  color: course.color || "var(--color-primary)",
                  borderColor: course.color
                    ? `${course.color}40`
                    : "rgba(99, 102, 241, 0.25)",
                }}
              >
                <span
                  className="course-chip-dot"
                  style={{ background: course.color || "var(--color-primary)" }}
                />
                <span className="course-chip-text">
                  {course.code || course.title}
                </span>
              </span>
            )}

            <span className={`session-status-badge badge-${status}`}>
              <StatusIcon
                size={13}
                className="status-badge-icon flex-shrink-0"
              />
              <span className="status-badge-text">
                {status === "scheduled" && "Scheduled"}
                {status === "in_progress" && "In Progress"}
                {status === "completed" && "Completed"}
                {status === "missed" && "Missed Window"}
                {status === "cancelled" && "Cancelled"}
              </span>
            </span>
          </div>

          <div className="scheduled-duration-badge">
            <Timer size={13} className="text-primary" />
            <span>
              {session.duration_minutes}m
              {session.extended_minutes > 0 && (
                <strong className="text-success">
                  {" "}
                  +{session.extended_minutes}m
                </strong>
              )}
            </span>
          </div>
        </div>

        {/* Main Title */}
        <h4 className="scheduled-session-title" title={session.subject}>
          {session.subject}
        </h4>

        {/* Active Window Live Alert Banner */}
        {timingContext?.isActiveNow && status === "scheduled" && (
          <div className="active-window-live-banner">
            <div className="active-window-pulse-beacon">
              <span className="live-pulse-dot" />
              <Zap size={13} className="text-warning fill-warning inline" />
              <span className="active-window-live-title">
                ACTIVE FOCUS WINDOW
              </span>
            </div>
            <span className="active-window-countdown-chip">
              ⏳ Closes in {timingContext.timeStr}
            </span>
          </div>
        )}

        {/* Linked Material Card */}
        {material && (
          <div className="scheduled-linked-material-card">
            <div className="scheduled-material-icon-box">
              <BookOpen size={16} />
            </div>
            <div className="scheduled-material-info">
              <span className="scheduled-material-label">
                ATTACHED STUDY MATERIAL
              </span>
              <div className="scheduled-material-title" title={material.title}>
                {material.title}
              </div>
              {material.key_topics && material.key_topics.length > 0 && (
                <div className="scheduled-material-topics">
                  {material.key_topics.slice(0, 3).map((t, idx) => (
                    <span key={idx} className="scheduled-topic-badge">
                      🎯 {t}
                    </span>
                  ))}
                  {material.key_topics.length > 3 && (
                    <span className="scheduled-topic-more">
                      +{material.key_topics.length - 3} more
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Schedule Timing & Date Strip */}
        <div className="scheduled-time-strip">
          <div className="time-strip-item">
            <Calendar size={13} className="time-strip-icon" />
            <span className="time-strip-val">{session.session_date}</span>
            {isToday && <span className="today-badge">Today</span>}
          </div>

          {timeWindowText && (
            <div className="time-strip-item">
              <Clock size={13} className="time-strip-icon" />
              <span className="time-strip-val">{timeWindowText}</span>
            </div>
          )}

          {timingContext && status === "scheduled" && (
            <div className={`time-strip-context context-${timingContext.type}`}>
              <timingContext.icon size={12} />
              <span>{timingContext.label}</span>
            </div>
          )}
        </div>

        {/* Session Notes */}
        {session.notes && (
          <div className="scheduled-session-notes">
            <StickyNote
              size={13}
              className="flex-shrink-0 text-primary mt-0.5"
            />
            <p className="scheduled-notes-text">{session.notes}</p>
          </div>
        )}

        {/* AI Diagnostic Score Ribbon if completed & taken */}
        {status === "completed" && session.quiz_taken && (
          <div className="quiz-result-ribbon">
            <div className="quiz-ribbon-left">
              <div className="quiz-ribbon-icon-box">
                <Sparkles size={14} className="text-amber" />
              </div>
              <div className="quiz-ribbon-meta">
                <span className="quiz-ribbon-title">
                  AI Diagnostic Performance
                </span>
                <span className="quiz-ribbon-sub">
                  Evaluated on attached study material
                </span>
              </div>
            </div>
            <div className="quiz-ribbon-score-pill">
              <span className="ribbon-fraction">
                {session.quiz_score}/
                {session.quiz_results?.total_questions || 5}
              </span>
              <span className="ribbon-pct">
                ({session.quiz_accuracy || 0}%)
              </span>
            </div>
          </div>
        )}

        {/* Missed Focus Window Advisory Ribbon */}
        {status === "missed" && (
          <div className="missed-window-advisory-ribbon">
            <div className="missed-advisory-left">
              <div className="missed-advisory-icon-box">
                <Clock size={14} />
              </div>
              <div className="missed-advisory-meta">
                <span className="missed-advisory-title">
                  Focus Window Elapsed
                </span>
                <span className="missed-advisory-sub">
                  Session was not started during scheduled hours. Reschedule
                  this block to maintain your study streak.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Card Footer Actions Based on State */}
        <div className="scheduled-card-actions-row">
          {status === "scheduled" && (
            <>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="action-start-btn-container"
              >
                <Button
                  variant="primary"
                  size="sm"
                  icon={Play}
                  loading={starting}
                  onClick={handleStart}
                  className="btn-start-focus-glow"
                >
                  Start Focus Session
                </Button>
              </motion.div>

              <div className="card-actions-right">
                {onEdit && (
                  <button
                    type="button"
                    className="action-icon-btn edit"
                    onClick={() => onEdit(session)}
                    title="Edit session details"
                  >
                    <Pencil size={15} />
                  </button>
                )}
                {onDelete && (
                  <button
                    type="button"
                    className="action-icon-btn delete"
                    onClick={() => onDelete(session.id)}
                    title="Remove scheduled session"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            </>
          )}

          {status === "in_progress" && (
            <div className="w-full">
              <Button
                variant="success"
                size="sm"
                icon={CheckCircle2}
                loading={completing}
                onClick={handleComplete}
                className="btn-complete-focus w-full"
              >
                Complete Session & Launch Quiz
              </Button>
            </div>
          )}

          {status === "completed" && (
            <div className="completed-card-actions-box w-full">
              {/* Row 1: Extend Focus Options */}
              <div className="extend-session-row">
                <span className="extend-label">
                  <Clock size={12} className="text-muted inline mr-1" />
                  <span>Extend Focus:</span>
                </span>
                <div className="extend-chips-group">
                  <button
                    type="button"
                    className="btn-chip-extend"
                    disabled={extending}
                    onClick={() => handleExtend(15)}
                    title="Add 15 extra focus minutes"
                  >
                    +15m
                  </button>
                  <button
                    type="button"
                    className="btn-chip-extend"
                    disabled={extending}
                    onClick={() => handleExtend(30)}
                    title="Add 30 extra focus minutes"
                  >
                    +30m
                  </button>
                </div>
              </div>

              {/* Row 2: AI Diagnostic Quiz CTA Button (Full Width & Prominent!) */}
              <div className="quiz-cta-row">
                {session.quiz_taken ? (
                  <Button
                    variant="outline"
                    size="sm"
                    icon={Sparkles}
                    onClick={() => onViewDiagnostic(session)}
                    className="btn-quiz-full-cta"
                  >
                    View Diagnostic Report
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    icon={Sparkles}
                    onClick={() => onTakeQuiz(session)}
                    className="btn-quiz-full-cta"
                  >
                    Take AI Diagnostic Quiz
                  </Button>
                )}
              </div>
            </div>
          )}

          {status === "missed" && (
            <div className="missed-card-actions-box w-full">
              {onReschedule && (
                <Button
                  variant="secondary"
                  size="sm"
                  icon={RotateCcw}
                  onClick={() => onReschedule(session)}
                  className="btn-reschedule-full-cta"
                >
                  Reschedule Session
                </Button>
              )}
              {onDelete && (
                <button
                  type="button"
                  className="action-icon-btn delete"
                  onClick={() => onDelete(session.id)}
                  title="Remove missed session"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
