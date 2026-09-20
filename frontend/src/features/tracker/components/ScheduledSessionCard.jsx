import { useMemo, useState } from "react";
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
} from "lucide-react";
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

  // Determine timing & readiness status
  const { isToday, isUpcoming, isPastTime, timeWindowText } = useMemo(() => {
    if (!session?.session_date) {
      return { isToday: false, isUpcoming: false, isPastTime: false, timeWindowText: "" };
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

  return (
    <div className={`scheduled-session-card status-${status}`}>
      {/* Accent Top Border */}
      <div
        className="scheduled-card-accent"
        style={{
          background:
            status === "completed"
              ? "var(--color-success)"
              : status === "in_progress"
                ? "var(--color-primary)"
                : status === "missed"
                  ? "var(--color-danger)"
                  : course?.color || "var(--color-primary)",
        }}
      />

      <div className="scheduled-card-body">
        {/* Top Header Row */}
        <div className="scheduled-card-header">
          <div className="scheduled-header-left">
            {course && (
              <span
                className="course-chip-badge"
                style={{
                  background: course.color ? `${course.color}15` : "var(--color-surface-subtle)",
                  color: course.color || "var(--color-primary)",
                  borderColor: course.color ? `${course.color}40` : "var(--color-border)",
                }}
              >
                {course.code || course.title}
              </span>
            )}
            <span className={`session-status-badge badge-${status}`}>
              {status === "scheduled" && "⏳ Scheduled"}
              {status === "in_progress" && "🔥 In Progress"}
              {status === "completed" && "✅ Completed"}
              {status === "missed" && "❌ Missed"}
              {status === "cancelled" && "🚫 Cancelled"}
            </span>
          </div>

          <div className="scheduled-duration-badge">
            <Timer size={13} />
            <span>
              {session.duration_minutes}m
              {session.extended_minutes > 0 && (
                <strong className="text-success"> +{session.extended_minutes}m</strong>
              )}
            </span>
          </div>
        </div>

        {/* Main Title & Material Info */}
        <h4 className="scheduled-session-title" title={session.subject}>
          {session.subject}
        </h4>

        {material && (
          <div className="linked-material-box">
            <div className="flex items-center gap-1 text-xs text-muted mb-1">
              <FileText size={12} className="text-primary" />
              <span className="font-medium text-xs">Linked Material:</span>
              <span className="text-xs truncate font-semibold text-primary" title={material.title}>
                {material.title}
              </span>
            </div>
            {material.key_topics && material.key_topics.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {material.key_topics.slice(0, 3).map((t, idx) => (
                  <span key={idx} className="material-mini-topic-chip">
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Schedule Timing & Date Strip */}
        <div className="scheduled-time-strip">
          <div className="time-strip-item">
            <Calendar size={13} />
            <span>{session.session_date}</span>
            {isToday && <span className="today-badge">Today</span>}
          </div>

          {timeWindowText && (
            <div className="time-strip-item">
              <Clock size={13} />
              <span>{timeWindowText}</span>
            </div>
          )}
        </div>

        {/* Session Notes */}
        {session.notes && (
          <div className="scheduled-session-notes">
            <StickyNote size={12} className="flex-shrink-0 text-muted" />
            <p className="truncate-2-lines">{session.notes}</p>
          </div>
        )}

        {/* Quiz Diagnostic summary badge if completed & taken */}
        {status === "completed" && session.quiz_taken && (
          <div className="quiz-result-summary-strip">
            <Sparkles size={14} className="text-amber" />
            <span>
              AI Diagnostic Score: <strong>{session.quiz_score}/{session.quiz_results?.total_questions || 5}</strong> (
              {session.quiz_accuracy || 0}%)
            </span>
          </div>
        )}

        {/* Card Footer Actions Based on State */}
        <div className="scheduled-card-actions-row">
          {status === "scheduled" && (
            <>
              <Button
                variant="primary"
                size="sm"
                icon={Play}
                loading={starting}
                onClick={handleStart}
                className="btn-start-focus"
              >
                Start Focus Session
              </Button>

              <div className="flex gap-1 ml-auto">
                {onEdit && (
                  <button
                    type="button"
                    className="action-icon-btn"
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
            <>
              <Button
                variant="success"
                size="sm"
                icon={CheckCircle2}
                loading={completing}
                onClick={handleComplete}
              >
                Complete Session
              </Button>
            </>
          )}

          {status === "completed" && (
            <div className="completed-actions-container">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Extend Session Option */}
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted">Extend:</span>
                  <button
                    type="button"
                    className="btn-chip-extend"
                    disabled={extending}
                    onClick={() => handleExtend(15)}
                    title="Add 15 extra focus minutes to goal"
                  >
                    +15m
                  </button>
                  <button
                    type="button"
                    className="btn-chip-extend"
                    disabled={extending}
                    onClick={() => handleExtend(30)}
                    title="Add 30 extra focus minutes to goal"
                  >
                    +30m
                  </button>
                </div>

                {/* AI Quiz Action */}
                {session.quiz_taken ? (
                  <Button
                    variant="outline"
                    size="sm"
                    icon={Sparkles}
                    onClick={() => onViewDiagnostic(session)}
                  >
                    View Diagnostic Report
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    icon={Sparkles}
                    onClick={() => onTakeQuiz(session)}
                  >
                    Take AI Diagnostic Quiz
                  </Button>
                )}
              </div>
            </div>
          )}

          {status === "missed" && (
            <>
              <span className="text-xs text-danger font-medium">
                ⚠️ Session expired (0 mins added)
              </span>
              {onReschedule && (
                <Button
                  variant="outline"
                  size="sm"
                  icon={RotateCcw}
                  onClick={() => onReschedule(session)}
                  className="ml-auto"
                >
                  Reschedule
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
