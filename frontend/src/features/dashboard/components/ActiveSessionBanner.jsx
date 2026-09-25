import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { BookOpen, Calendar, Clock, Play, Target } from "lucide-react";
import Button from "../../../components/Button";

function formatTimeOnly(timeStr) {
  if (!timeStr) return "";
  try {
    const [h, m] = timeStr.split(":");
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${m} ${ampm}`;
  } catch {
    return timeStr;
  }
}

export default function ActiveSessionBanner({
  activeSessionAlert,
  alertCourse,
  alertMaterial,
}) {
  if (!activeSessionAlert) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`dashboard-session-alert-banner alert-type-${activeSessionAlert.type}`}
    >
      <div className="alert-content-left">
        <div className="alert-badge-row">
          <span className="alert-live-pulse-badge">
            <span className="live-pulse-dot" />
            {activeSessionAlert.badgeText}
          </span>

          {alertCourse && (
            <span
              className="alert-course-chip"
              style={{
                backgroundColor: alertCourse.color
                  ? `${alertCourse.color}18`
                  : "rgba(91, 93, 240, 0.12)",
                borderColor: alertCourse.color
                  ? `${alertCourse.color}40`
                  : "rgba(91, 93, 240, 0.25)",
                color: alertCourse.color || "var(--dash-primary)",
              }}
            >
              <span
                className="w-2 h-2 rounded-full inline-block mr-1.5"
                style={{
                  background: alertCourse.color || "var(--dash-primary)",
                }}
              />
              {alertCourse.code || alertCourse.title}
            </span>
          )}

          {activeSessionAlert.countdown && (
            <span className="alert-countdown-chip">
              <Clock size={12} className="inline mr-1" />
              {activeSessionAlert.timeTitle}:{" "}
              <strong>{activeSessionAlert.countdown}</strong>
            </span>
          )}
        </div>

        <h2 className="alert-headline-title">
          {activeSessionAlert.session.subject}
        </h2>

        <div className="alert-meta-row">
          <span className="alert-meta-pill">
            <Calendar size={13} className="text-muted" />
            {formatTimeOnly(activeSessionAlert.session.start_time)} –{" "}
            {formatTimeOnly(activeSessionAlert.session.end_time)}
          </span>
          <span className="alert-meta-pill">
            <Target size={13} className="text-muted" />
            {activeSessionAlert.session.duration_minutes}m Target Duration
          </span>

          {alertMaterial && (
            <div className="alert-attached-material-card">
              <BookOpen size={13} className="flex-shrink-0 text-primary" />
              <span className="material-label-prefix">Material:</span>
              <strong
                className="material-title-text"
                title={alertMaterial.title}
              >
                {alertMaterial.title}
              </strong>
            </div>
          )}
        </div>
      </div>

      <div className="alert-content-right">
        <Link to="/study-center?tab=tracker">
          <Button
            variant="primary"
            size="md"
            icon={Play}
            className="btn-launch-alert-session"
          >
            {activeSessionAlert.ctaText}
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}
