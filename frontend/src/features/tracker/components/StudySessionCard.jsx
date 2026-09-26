import { useMemo, useState } from "react";
import {
  Award,
  Binary,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Code2,
  Cpu,
  Database,
  FileText,
  Pencil,
  Plus,
  Sparkles,
  StickyNote,
  Timer,
  Trash2,
} from "lucide-react";
import { motion } from "framer-motion";
import Button from "../../../components/Button";

function getSubjectTheme(subject = "") {
  const s = (subject || "").toString().toLowerCase();
  if (
    s.includes("algorithm") ||
    s.includes("data structure") ||
    s.includes("dsa") ||
    s.includes("programming") ||
    s.includes("coding") ||
    s.includes("c++") ||
    s.includes("python") ||
    s.includes("java")
  ) {
    return {
      icon: Code2,
      themeClass: "session-theme-emerald",
      label: "Algorithms & Code",
    };
  }
  if (
    s.includes("database") ||
    s.includes("dbms") ||
    s.includes("sql") ||
    s.includes("schema")
  ) {
    return {
      icon: Database,
      themeClass: "session-theme-orange",
      label: "Database Systems",
    };
  }
  if (
    s.includes("operating") ||
    s.includes("os") ||
    s.includes("system") ||
    s.includes("architecture") ||
    s.includes("network")
  ) {
    return {
      icon: Cpu,
      themeClass: "session-theme-violet",
      label: "Systems & Architecture",
    };
  }
  if (
    s.includes("math") ||
    s.includes("calculus") ||
    s.includes("algebra") ||
    s.includes("discrete") ||
    s.includes("statistics")
  ) {
    return {
      icon: Binary,
      themeClass: "session-theme-amber",
      label: "Mathematics",
    };
  }
  if (
    s.includes("ai") ||
    s.includes("machine learning") ||
    s.includes("intelligence") ||
    s.includes("neural")
  ) {
    return {
      icon: Sparkles,
      themeClass: "session-theme-rose",
      label: "Artificial Intelligence",
    };
  }
  return {
    icon: BookOpen,
    themeClass: "session-theme-cyan",
    label: "Study Subject",
  };
}

function formatDuration(minutes, extended = 0) {
  const m = Number(minutes) || 0;
  const total = m + (Number(extended) || 0);
  if (total < 60) return `${total} min${total === 1 ? "" : "s"}`;
  const hours = Math.floor(total / 60);
  const remainingMins = total % 60;
  if (remainingMins === 0) return `${hours} hr${hours === 1 ? "" : "s"}`;
  return `${hours}h ${remainingMins}m`;
}

function formatDisplayDate(dateStr) {
  if (!dateStr)
    return { formatted: "Unknown date", isToday: false, isYesterday: false };
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const parts = dateStr.split("-");
    const sessionDate =
      parts.length === 3
        ? new Date(parts[0], parts[1] - 1, parts[2])
        : new Date(dateStr);
    sessionDate.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - sessionDate.getTime();
    const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

    const isToday = diffDays === 0;
    const isYesterday = diffDays === 1;

    const formatted = sessionDate.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year:
        sessionDate.getFullYear() !== today.getFullYear()
          ? "numeric"
          : undefined,
    });

    return { formatted, isToday, isYesterday };
  } catch {
    return { formatted: dateStr, isToday: false, isYesterday: false };
  }
}

export default function StudySessionCard({
  session,
  onEdit,
  onDelete,
  onExtend,
  onTakeQuiz,
  onViewDiagnostic,
}) {
  const [extending, setExtending] = useState(false);

  const {
    icon: ThemeIcon,
    themeClass,
    label,
  } = useMemo(() => getSubjectTheme(session?.subject), [session?.subject]);

  const course = session?.course_details;
  const material = session?.material_details;

  const categoryTag = useMemo(() => {
    if (course?.title) {
      return course.code ? `[${course.code}] ${course.title}` : course.title;
    }
    if (!label) return "Focus Session";
    const subStr = (session?.subject || "").toString().toLowerCase().trim();
    if (label.toLowerCase().trim() === subStr) {
      return "Core Course Module";
    }
    return label;
  }, [label, course, session?.subject]);

  const {
    formatted: dateText,
    isToday,
    isYesterday,
  } = useMemo(
    () => formatDisplayDate(session?.session_date),
    [session?.session_date],
  );

  const durationText = formatDuration(
    session?.duration_minutes,
    session?.extended_minutes,
  );

  const handleExtend = async (mins) => {
    if (!onExtend) return;
    try {
      setExtending(true);
      await onExtend(session, mins);
    } finally {
      setExtending(false);
    }
  };

  return (
    <motion.div
      className={`study-session-card ${themeClass}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.985 }}
      transition={{ duration: 0.18 }}
    >
      {/* Top Accent Strip */}
      <div className="session-card-accent-strip" />

      <div className="session-card-inner">
        {/* Header Row */}
        <div className="session-card-header">
          <div className="session-header-left">
            <div className="session-icon-avatar">
              <ThemeIcon size={20} />
            </div>
            <div className="session-header-text">
              <span className="session-category-tag">{categoryTag}</span>
              <h3 className="session-subject-title" title={session.subject}>
                {session.subject}
              </h3>
            </div>
          </div>

          <div className="session-duration-pill">
            <Timer size={14} />
            <span>{durationText}</span>
            {session.extended_minutes > 0 && (
              <span className="text-xs text-success font-bold ml-1">
                (+{session.extended_minutes}m)
              </span>
            )}
          </div>
        </div>

        {/* Linked Material Section */}
        {material && (
          <div className="session-linked-material-chip">
            <FileText size={12} className="text-primary flex-shrink-0" />
            <span
              className="text-xs truncate font-medium"
              title={material.title}
            >
              {material.title}
            </span>
          </div>
        )}

        {/* Metadata Badges */}
        <div className="session-meta-row">
          <div className="session-meta-chip">
            <Calendar size={13} />
            <span>{dateText}</span>
            {isToday && (
              <span className="session-relative-badge today">Today</span>
            )}
            {isYesterday && (
              <span className="session-relative-badge yesterday">
                Yesterday
              </span>
            )}
          </div>

          {session.start_time && (
            <div className="session-meta-chip">
              <Clock size={13} />
              <span>{session.start_time.slice(0, 5)}</span>
            </div>
          )}

          <div className="session-meta-chip">
            <span
              className={`status-pill pill-${session.status || "completed"}`}
            >
              {session.status === "completed" ? "Completed" : session.status}
            </span>
          </div>
        </div>

        {/* Quiz Diagnostic Pill if taken */}
        {session.quiz_taken ? (
          <div className="session-quiz-badge-row">
            <div className="flex items-center gap-1 text-xs font-semibold text-amber">
              <Sparkles size={13} />
              <span>
                AI Quiz Score: {session.quiz_score}/
                {session.quiz_results?.total_questions || 5} (
                {session.quiz_accuracy}%)
              </span>
            </div>
            {onViewDiagnostic && (
              <button
                type="button"
                className="btn-view-diagnostic-link"
                onClick={() => onViewDiagnostic(session)}
              >
                View Report ↗
              </button>
            )}
          </div>
        ) : session.status === "completed" && onTakeQuiz ? (
          <div className="session-quiz-prompt-row">
            <button
              type="button"
              className="btn-take-quiz-prompt"
              onClick={() => onTakeQuiz(session)}
            >
              <Sparkles size={13} />
              <span>Take AI Concept Quiz</span>
            </button>
          </div>
        ) : null}

        {/* Notes Preview */}
        {session.notes ? (
          <div className="session-notes-box">
            <div className="session-notes-header">
              <StickyNote size={12} className="session-notes-icon" />
              <span>Session Key Takeaways</span>
            </div>
            <p className="session-notes-content">
              <StickyNote size={11} className="session-notes-inline-icon" />
              <span>{session.notes}</span>
            </p>
          </div>
        ) : (
          <div className="session-notes-placeholder">
            <StickyNote size={12} className="session-notes-icon-faint" />
            <span>No session notes recorded</span>
          </div>
        )}

        {/* Footer Actions */}
        <div className="session-card-actions">
          {session.status === "completed" && onExtend && (
            <div className="flex items-center gap-1 mr-auto session-extend-cluster">
              <span className="text-xs text-muted">Extend:</span>
              <button
                type="button"
                className="btn-chip-extend"
                disabled={extending}
                onClick={() => handleExtend(15)}
                title="Add 15 extra minutes to goal"
              >
                +15m
              </button>
              <button
                type="button"
                className="btn-chip-extend"
                disabled={extending}
                onClick={() => handleExtend(30)}
                title="Add 30 extra minutes to goal"
              >
                +30m
              </button>
            </div>
          )}

          <div className="session-card-btns-right">
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                icon={Pencil}
                className="session-action-btn edit-btn"
                onClick={() => onEdit(session)}
                aria-label={`Edit ${session.subject} session`}
              >
                Edit
              </Button>
            )}

            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                icon={Trash2}
                className="session-action-btn delete-btn"
                onClick={() => onDelete(session.id)}
                aria-label={`Delete ${session.subject} session`}
              >
                Delete
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
