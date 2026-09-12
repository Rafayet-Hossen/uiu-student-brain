import { useMemo } from "react";
import {
  Binary,
  BookOpen,
  Calendar,
  Clock,
  Code2,
  Cpu,
  Database,
  Pencil,
  Sparkles,
  StickyNote,
  Timer,
  Trash2,
} from "lucide-react";
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
      themeClass: "session-theme-indigo",
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

function formatDuration(minutes) {
  const m = Number(minutes) || 0;
  if (m < 60) return `${m} min${m === 1 ? "" : "s"}`;
  const hours = Math.floor(m / 60);
  const remainingMins = m % 60;
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

export default function StudySessionCard({ session, onEdit, onDelete }) {
  const {
    icon: ThemeIcon,
    themeClass,
    label,
  } = useMemo(() => getSubjectTheme(session?.subject), [session?.subject]);

  const categoryTag = useMemo(() => {
    if (!label) return "Focus Session";
    const subStr = (session?.subject || "").toString().toLowerCase().trim();
    if (label.toLowerCase().trim() === subStr) {
      return "Core Course Module";
    }
    return label;
  }, [label, session?.subject]);

  const {
    formatted: dateText,
    isToday,
    isYesterday,
  } = useMemo(
    () => formatDisplayDate(session?.session_date),
    [session?.session_date],
  );

  const durationText = formatDuration(session?.duration_minutes);

  return (
    <div className={`study-session-card ${themeClass}`}>
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
          </div>
        </div>

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
        </div>

        {/* Notes Preview */}
        {session.notes ? (
          <div className="session-notes-box">
            <div className="session-notes-header">
              <StickyNote size={12} className="session-notes-icon" />
              <span>Session Key Takeaways</span>
            </div>
            <p className="session-notes-content">{session.notes}</p>
          </div>
        ) : (
          <div className="session-notes-placeholder">
            <StickyNote size={12} className="session-notes-icon-faint" />
            <span>No session notes recorded</span>
          </div>
        )}

        {/* Footer Actions */}
        <div className="session-card-actions">
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
        </div>
      </div>
    </div>
  );
}
