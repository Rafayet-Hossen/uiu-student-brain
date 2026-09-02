import { useState } from "react";
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
  const { user } = useAuth();
  const [isRsvped, setIsRsvped] = useState(Boolean(event.is_attending || event.is_rsvped));
  const [rsvpCount, setRsvpCount] = useState(event.rsvps_count || event.rsvp_count || 0);
  const [loading, setLoading] = useState(false);

  const isCreator = user?.id === event.creator?.id;

  // Assume max capacity is 30 seats for university study sessions
  const maxCapacity = 30;
  const capacityPct = Math.min(100, Math.round((rsvpCount / maxCapacity) * 100));

  async function handleToggleRsvp() {
    if (loading) return;
    setLoading(true);
    try {
      if (onToggleRSVP) {
        await onToggleRSVP(event.id);
        setIsRsvped(!isRsvped);
        setRsvpCount((prev) => (isRsvped ? prev - 1 : prev + 1));
      } else {
        const res = await toggleEventRSVP(event.id);
        setIsRsvped(res.is_attending);
        setRsvpCount(res.rsvps_count);
      }
    } catch (err) {
      console.error("Error toggling RSVP:", err);
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

  // Parse date into Month and Day
  const dateObj = new Date(event.event_date);
  const monthStr = isNaN(dateObj)
    ? "OCT"
    : dateObj.toLocaleDateString(undefined, { month: "short" }).toUpperCase();
  const dayStr = isNaN(dateObj) ? "15" : dateObj.getDate();
  const dayName = isNaN(dateObj)
    ? "Monday"
    : dateObj.toLocaleDateString(undefined, { weekday: "short" });

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
              <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
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
                Organized by <strong>{event.creator?.full_name || event.creator?.email?.split("@")[0] || "Scholar"}</strong>
              </span>
            </div>

            {/* Meta Pills */}
            <div className="event-booking-pills-row">
              <div className="event-info-pill">
                <Clock size={13} className="text-indigo" />
                <span>
                  {event.start_time?.slice(0, 5)} - {event.end_time?.slice(0, 5)}
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

            {/* Seat Capacity Progress Bar */}
            <div className="event-capacity-section">
              <div className="capacity-label-row">
                <span>Seats & RSVPs</span>
                <strong>
                  {rsvpCount} / {maxCapacity} scholars
                </strong>
              </div>
              <div className="capacity-bar-track">
                <div
                  className="capacity-bar-fill"
                  style={{ width: `${capacityPct}%` }}
                />
              </div>
            </div>

            {/* Bottom RSVP Action Button */}
            <div className="event-booking-footer-action">
              <motion.button
                type="button"
                whileTap={{ scale: 0.95 }}
                className={`event-rsvp-cta-btn ${isRsvped ? "rsvp-going" : "rsvp-available"}`}
                onClick={handleToggleRsvp}
                disabled={loading}
              >
                {isRsvped ? (
                  <>
                    <CheckCircle2 size={16} />
                    <span>You're Going (Attending)</span>
                  </>
                ) : (
                  <>
                    <Users size={16} />
                    <span>RSVP / Save My Spot</span>
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
