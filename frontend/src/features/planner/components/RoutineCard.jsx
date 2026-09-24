import { useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Code,
  Cpu,
  Database,
  ExternalLink,
  FileText,
  Flame,
  MoreVertical,
  Pencil,
  Play,
  Sparkles,
  Trash2,
  Video,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";
import Badge from "../../../components/Badge";
import Button from "../../../components/Button";

const DAY_ABBRS = [
  { key: "Sun", full: "Sunday" },
  { key: "Mon", full: "Monday" },
  { key: "Tue", full: "Tuesday" },
  { key: "Wed", full: "Wednesday" },
  { key: "Thu", full: "Thursday" },
  { key: "Fri", full: "Friday" },
  { key: "Sat", full: "Saturday" },
];

function getSubjectTheme(subject = "") {
  const s = (subject || "").toLowerCase();
  if (s.includes("data") || s.includes("dbms") || s.includes("sql")) {
    return {
      icon: Database,
      colorClass: "theme-orange",
      pillBg: "rgba(242, 101, 34, 0.12)",
      pillColor: "#f26522",
      borderGlow: "rgba(242, 101, 34, 0.28)",
      gradient: "linear-gradient(135deg, #f26522, #ea580c)",
    };
  }
  if (
    s.includes("algo") ||
    s.includes("code") ||
    s.includes("program") ||
    s.includes("soft") ||
    s.includes("web") ||
    s.includes("dev")
  ) {
    return {
      icon: Code,
      colorClass: "theme-emerald",
      pillBg: "rgba(16, 185, 129, 0.12)",
      pillColor: "#10b981",
      borderGlow: "rgba(16, 185, 129, 0.25)",
      gradient: "linear-gradient(135deg, #10b981, #059669)",
    };
  }
  if (
    s.includes("math") ||
    s.includes("stat") ||
    s.includes("calc") ||
    s.includes("linear") ||
    s.includes("discrete")
  ) {
    return {
      icon: Cpu,
      colorClass: "theme-sapphire",
      pillBg: "rgba(37, 99, 235, 0.12)",
      pillColor: "#2563eb",
      borderGlow: "rgba(37, 99, 235, 0.25)",
      gradient: "linear-gradient(135deg, #3b82f6, #2563eb)",
    };
  }
  if (
    s.includes("ai") ||
    s.includes("learn") ||
    s.includes("network") ||
    s.includes("os") ||
    s.includes("system")
  ) {
    return {
      icon: Zap,
      colorClass: "theme-purple",
      pillBg: "rgba(147, 51, 234, 0.12)",
      pillColor: "#9333ea",
      borderGlow: "rgba(147, 51, 234, 0.25)",
      gradient: "linear-gradient(135deg, #a855f7, #7c3aed)",
    };
  }
  return {
    icon: BookOpen,
    colorClass: "theme-amber",
    pillBg: "rgba(245, 158, 11, 0.12)",
    pillColor: "#f59e0b",
    borderGlow: "rgba(245, 158, 11, 0.25)",
    gradient: "linear-gradient(135deg, #f59e0b, #d97706)",
  };
}

function calculateDuration(startStr, endStr) {
  if (!startStr || !endStr) return "";
  try {
    const [sh, sm] = startStr.split(":").map(Number);
    const [eh, em] = endStr.split(":").map(Number);
    let totalMins = eh * 60 + em - (sh * 60 + sm);
    if (totalMins < 0) totalMins += 24 * 60;
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h} hr`;
    return `${m} mins`;
  } catch (e) {
    return "";
  }
}

export default function RoutineCard({
  schedule,
  onEdit,
  onDelete,
  isHighlighted = false,
}) {
  const [showMenu, setShowMenu] = useState(false);
  const theme = getSubjectTheme(schedule.subject);
  const SubjectIcon = theme.icon;

  const todayIndex = new Date().getDay();
  const todayDayName = DAY_ABBRS[todayIndex]?.full;
  const isScheduledToday = (schedule.days || []).some(
    (d) =>
      d.toLowerCase().startsWith(todayDayName.slice(0, 3).toLowerCase()) ||
      d.toLowerCase() === todayDayName.toLowerCase(),
  );

  const durationStr = calculateDuration(schedule.start_time, schedule.end_time);

  return (
    <motion.div
      id={`routine-${schedule.id}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3, transition: { duration: 0.15 } }}
      className={`pro-routine-card ${theme.colorClass} ${
        isScheduledToday ? "card-active-today" : ""
      } ${isHighlighted ? "routine-card-highlighted" : ""}`}
    >
      {/* Top Accent Strip */}
      <div
        className="routine-top-accent"
        style={{ background: theme.pillColor }}
      />

      {/* Card Header */}
      <div className="routine-card-header">
        <div className="routine-subject-meta">
          <div
            className="routine-subject-icon-box"
            style={{ background: theme.pillBg, color: theme.pillColor }}
          >
            <SubjectIcon size={20} />
          </div>

          <div className="routine-title-box">
            <h3 className="routine-subject-heading" title={schedule.subject}>
              {schedule.subject}
            </h3>
            <div className="routine-tag-subrow">
              <span className="routine-frequency-text">
                {(schedule.days || []).length}{" "}
                {(schedule.days || []).length === 1 ? "day" : "days"} / week
              </span>
              {isScheduledToday && (
                <span className="routine-today-pill">
                  <span className="today-pulse-dot" />
                  <span>Active Today</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Menu / Buttons */}
        <div className="routine-header-actions">
          <button
            type="button"
            className="routine-icon-btn edit-btn"
            onClick={() => onEdit(schedule)}
            title="Edit Routine"
          >
            <Pencil size={14} />
          </button>
          <button
            type="button"
            className="routine-icon-btn delete-btn"
            onClick={() => onDelete(schedule.id)}
            title="Delete Routine"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Time & Duration Row */}
      <div className="routine-time-row">
        <div className="routine-time-box">
          <Clock size={15} className="text-muted" />
          <strong className="time-range-text">
            {schedule.start_time?.slice(0, 5)} –{" "}
            {schedule.end_time?.slice(0, 5)}
          </strong>
        </div>

        {durationStr && (
          <span className="routine-duration-pill">{durationStr} block</span>
        )}
      </div>

      {/* 7-Day Week Capsule Bar */}
      <div className="routine-week-capsules-bar">
        {DAY_ABBRS.map((dayItem, idx) => {
          const isMatched = (schedule.days || []).some(
            (d) =>
              d.toLowerCase().startsWith(dayItem.key.toLowerCase()) ||
              d.toLowerCase() === dayItem.full.toLowerCase(),
          );
          const isCurrentDay = idx === todayIndex;

          return (
            <div
              key={dayItem.key}
              className={`day-capsule-item ${
                isMatched ? "day-capsule-active" : "day-capsule-inactive"
              } ${isCurrentDay ? "day-capsule-current" : ""}`}
              style={
                isMatched
                  ? {
                      background: theme.gradient || theme.pillColor,
                      color: "#ffffff",
                      boxShadow: `0 3px 10px -2px ${theme.borderGlow || "rgba(242, 101, 34, 0.3)"}`,
                    }
                  : undefined
              }
              title={`${dayItem.full}: ${isMatched ? "Scheduled" : "Off"}`}
            >
              <span className="day-abbr-text">{dayItem.key.slice(0, 1)}</span>
              {isMatched && <span className="day-active-dot" />}
            </div>
          );
        })}
      </div>

      {/* Attached Study Notes */}
      {schedule.notes && (
        <div className="routine-notes-box">
          <div className="routine-notes-header">
            <FileText size={12} className="text-muted" />
            <span>Study Notes</span>
          </div>
          <p className="routine-notes-text">{schedule.notes}</p>
        </div>
      )}

      {/* Attached Resources */}
      {schedule.resources && schedule.resources.length > 0 && (
        <div className="routine-resources-wrap">
          <span className="routine-resources-label">Resources:</span>
          <div className="routine-resources-pills">
            {schedule.resources.map((res, index) => (
              <a
                key={index}
                href={res.url}
                target="_blank"
                rel="noopener noreferrer"
                className="routine-resource-chip"
                title={res.title || res.url}
              >
                <span>
                  {res.type === "drive"
                    ? "📁"
                    : res.type === "video"
                      ? "🎥"
                      : "📄"}
                </span>
                <span className="res-title-ellipsis">
                  {res.title || "Resource"}
                </span>
                <ExternalLink size={11} className="res-ext-icon" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Card Footer with "Start Focus Session" Action */}
      <div className="routine-card-footer">
        <Link
          to={`/tracker?subject=${encodeURIComponent(schedule.subject)}`}
          className="routine-start-focus-btn"
          style={{
            background: theme.gradient || undefined,
          }}
        >
          <Zap size={14} className="focus-btn-icon" />
          <span>Start Focus Session</span>
        </Link>
      </div>
    </motion.div>
  );
}
