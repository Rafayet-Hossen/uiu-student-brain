import { useState, useEffect } from "react";
import {
  Calendar,
  CheckCircle2,
  Clock,
  GraduationCap,
  MapPin,
  Sparkles,
  Trash2,
  UserCheck,
  Users,
  Video,
} from "lucide-react";
import { motion } from "framer-motion";
import Badge from "../../../components/Badge";
import Button from "../../../components/Button";
import Card from "../../../components/Card";
import ScholarAvatar from "../../auth/components/ScholarAvatar";
import { useAuth } from "../../auth/useAuth";
import { deleteEvent, toggleEventRSVP } from "../api";

export default function EventCard({ event, onToggleRSVP, onDeleted }) {
  if (!event) return null;
  const { user } = useAuth();
  const [userStatus, setUserStatus] = useState(
    event.user_rsvp_status || (event.is_attending ? "going" : null),
  );
  const [goingCount, setGoingCount] = useState(
    event.going_count !== undefined
      ? event.going_count
      : event.is_attending
        ? event.rsvps_count || 1
        : event.rsvps_count || 0,
  );
  const [interestedCount, setInterestedCount] = useState(
    event.interested_count || 0,
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!event) return;
    setUserStatus(
      event.user_rsvp_status || (event.is_attending ? "going" : null),
    );
    setGoingCount(
      event.going_count !== undefined
        ? event.going_count
        : event.is_attending
          ? event.rsvps_count || 1
          : event.rsvps_count || 0,
    );
    setInterestedCount(event.interested_count || 0);
  }, [event]);

  const isCreator = user?.id === event.creator?.id;

  // Max capacity for university study sessions
  const maxCapacity = 30;

  async function handleToggleStatus(targetStatus) {
    if (loading) return;
    setLoading(true);
    try {
      if (onToggleRSVP) {
        const res = await onToggleRSVP(event.id, targetStatus);
        if (res) {
          setUserStatus(res.user_rsvp_status);
          setGoingCount(res.going_count);
          setInterestedCount(res.interested_count);
        } else {
          // Fallback optimistic update
          if (userStatus === targetStatus) {
            setUserStatus(null);
            if (targetStatus === "going")
              setGoingCount((c) => Math.max(0, c - 1));
            else setInterestedCount((c) => Math.max(0, c - 1));
          } else {
            if (userStatus === "going")
              setGoingCount((c) => Math.max(0, c - 1));
            if (userStatus === "interested")
              setInterestedCount((c) => Math.max(0, c - 1));
            setUserStatus(targetStatus);
            if (targetStatus === "going") setGoingCount((c) => c + 1);
            else setInterestedCount((c) => c + 1);
          }
        }
      } else {
        const res = await toggleEventRSVP(event.id, targetStatus);
        setUserStatus(res.user_rsvp_status);
        setGoingCount(res.going_count);
        setInterestedCount(res.interested_count);
      }
    } catch (err) {
      console.error("Error toggling event response:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm("Cancel and remove this campus study event?")) {
      return;
    }
    try {
      await deleteEvent(event.id);
      if (onDeleted) {
        onDeleted(event.id);
      }
    } catch (err) {
      console.error("Error deleting event:", err);
    }
  }

  // Parse date into Month and Day safely
  const dateObj = event?.event_date ? new Date(event.event_date) : null;
  const isValidDate = dateObj && !isNaN(dateObj.getTime());
  const monthStr = isValidDate
    ? dateObj.toLocaleDateString(undefined, { month: "short" }).toUpperCase()
    : "OCT";
  const dayStr = isValidDate ? dateObj.getDate() : "15";
  const dayName = isValidDate
    ? dateObj.toLocaleDateString(undefined, { weekday: "short" })
    : "Monday";

  const isOnline =
    event.location?.toLowerCase().includes("meet") ||
    event.location?.toLowerCase().includes("zoom") ||
    event.location?.toLowerCase().includes("http");

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      style={{ height: "100%" }}
    >
      <Card className="premium-event-booking-card">
        <div className="event-booking-layout">
          {/* Left Vertical Date Stamp */}
          <div className="event-vertical-date-stamp">
            <span className="stamp-day-name">{dayName}</span>
            <span className="stamp-month-abbr">{monthStr}</span>
            <strong className="stamp-day-num">{dayStr}</strong>
            <div className="stamp-glow-blob" />
          </div>

          {/* Right Event Content Details */}
          <div className="event-booking-right-content">
            {/* Top Badges & Actions */}
            <div className="event-booking-top-row">
              <div
                style={{
                  display: "flex",
                  gap: "6px",
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <Badge variant="primary" size="sm">
                  {event.subject || "Study Session"}
                </Badge>
                {isOnline && (
                  <Badge variant="success" size="sm">
                    <Video size={11} />
                    <span>Virtual Meet</span>
                  </Badge>
                )}
              </div>

              {isCreator && (
                <button
                  type="button"
                  className="event-delete-ghost-btn"
                  onClick={handleDelete}
                  title="Cancel Event"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>

            {/* Title */}
            <h3 className="event-booking-title">{event.title}</h3>

            {/* Description */}
            {event.description && (
              <p className="event-booking-desc">{event.description}</p>
            )}

            {/* Host Section */}
            <div className="event-host-row">
              <ScholarAvatar user={event.creator} size={26} />
              <span className="event-host-text">
                Organized by{" "}
                <strong>
                  {event.creator?.full_name ||
                    event.creator?.email?.split("@")[0] ||
                    "Scholar"}
                </strong>
              </span>
            </div>

            {/* Meta Pills */}
            <div className="event-booking-pills-row">
              <div className="event-info-pill">
                <Clock size={13} className="text-indigo" />
                <span>
                  {event.start_time?.slice(0, 5)} -{" "}
                  {event.end_time?.slice(0, 5)}
                </span>
              </div>

              <div className="event-info-pill">
                {isOnline ? (
                  <Video size={13} className="text-emerald" />
                ) : (
                  <MapPin size={13} className="text-amber" />
                )}
                <span>{event.location || "Campus Library"}</span>
              </div>
            </div>

            {/* Social Response Counters & Capacity */}
            <div className="event-capacity-section">
              <div className="event-response-stats-row">
                <span className="response-stat-item stat-going">
                  <CheckCircle2 size={13} className="text-emerald" />
                  <strong>{goingCount}</strong> Going
                </span>
                <span className="response-stat-dot">•</span>
                <span className="response-stat-item stat-interested">
                  <Sparkles size={13} className="text-amber" />
                  <strong>{interestedCount}</strong> Interested
                </span>
                <span className="capacity-seats-label">
                  ({goingCount} / {maxCapacity} seats)
                </span>
              </div>
              <div className="capacity-bar-track">
                <div
                  className="capacity-bar-fill"
                  style={{
                    width: `${Math.min(100, Math.round((goingCount / maxCapacity) * 100))}%`,
                  }}
                />
              </div>
            </div>

            {/* Bottom Facebook-Style Action Buttons */}
            <div className="event-booking-footer-action">
              <div className="event-fb-actions-row">
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  className={`event-fb-btn event-btn-going ${userStatus === "going" ? "is-active" : ""}`}
                  onClick={() => handleToggleStatus("going")}
                  disabled={loading}
                  title={
                    userStatus === "going"
                      ? "You are going (Click to remove)"
                      : "Mark as Going"
                  }
                >
                  <CheckCircle2 size={15} />
                  <span>{userStatus === "going" ? "Going ✓" : "Going"}</span>
                </motion.button>

                <motion.button
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  className={`event-fb-btn event-btn-interested ${userStatus === "interested" ? "is-active" : ""}`}
                  onClick={() => handleToggleStatus("interested")}
                  disabled={loading}
                  title={
                    userStatus === "interested"
                      ? "You are interested (Click to remove)"
                      : "Mark as Interested"
                  }
                >
                  <Sparkles size={15} />
                  <span>
                    {userStatus === "interested"
                      ? "Interested ★"
                      : "Interested"}
                  </span>
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
