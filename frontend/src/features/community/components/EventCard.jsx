import { useState } from "react";
import Badge from "../../../components/Badge";
import Button from "../../../components/Button";
import Card from "../../../components/Card";
import { deleteEvent, toggleEventRsvp } from "../api";
import { useAuth } from "../../auth/useAuth";

export default function EventCard({ event, onDeleted }) {
  const { user } = useAuth();
  const [isRsvped, setIsRsvped] = useState(Boolean(event.is_rsvped));
  const [rsvpCount, setRsvpCount] = useState(event.rsvp_count || 0);
  const [loading, setLoading] = useState(false);

  const isCreator = user?.id === event.creator?.id;

  async function handleToggleRsvp() {
    if (loading) return;
    setLoading(true);
    try {
      const res = await toggleEventRsvp(event.id);
      setIsRsvped(res.rsvped);
      setRsvpCount(res.rsvp_count);
    } catch (err) {
      console.error("Error toggling RSVP:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (
      !window.confirm(
        "Are you sure you want to cancel and delete this study event?",
      )
    )
      return;
    try {
      await deleteEvent(event.id);
      onDeleted(event.id);
    } catch (err) {
      console.error("Error deleting event:", err);
    }
  }

  return (
    <Card className="study-event-card" style={{ marginBottom: "20px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "12px",
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "6px",
            }}
          >
            <Badge variant="accent">{event.subject}</Badge>
            <span
              style={{
                fontSize: "0.8125rem",
                color: "var(--color-text-muted)",
              }}
            >
              Organized by {event.creator?.full_name || event.creator?.email}
            </span>
          </div>
          <h3 style={{ margin: "0 0 6px 0", fontSize: "1.125rem" }}>
            {event.title}
          </h3>
        </div>

        {isCreator && (
          <Button size="sm" variant="danger" onClick={handleDelete}>
            🗑️
          </Button>
        )}
      </div>

      {event.description && (
        <p
          style={{
            margin: "10px 0 14px 0",
            color: "var(--color-text-muted)",
            fontSize: "0.875rem",
            lineHeight: 1.5,
          }}
        >
          {event.description}
        </p>
      )}

      {/* Meta grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "10px",
          margin: "14px 0",
          padding: "12px",
          background: "var(--color-surface-subtle)",
          borderRadius: "var(--radius-md)",
        }}
      >
        <div>
          <span
            style={{
              fontSize: "0.75rem",
              color: "var(--color-text-muted)",
              display: "block",
            }}
          >
            Date & Time
          </span>
          <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>
            📅 {event.event_date} ({event.start_time.slice(0, 5)} -{" "}
            {event.end_time.slice(0, 5)})
          </span>
        </div>

        <div>
          <span
            style={{
              fontSize: "0.75rem",
              color: "var(--color-text-muted)",
              display: "block",
            }}
          >
            Location
          </span>
          <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>
            📍 {event.location}
          </span>
        </div>

        <div>
          <span
            style={{
              fontSize: "0.75rem",
              color: "var(--color-text-muted)",
              display: "block",
            }}
          >
            Attendees
          </span>
          <span
            style={{
              fontWeight: 600,
              fontSize: "0.875rem",
              color: "var(--color-accent)",
            }}
          >
            👥 {rsvpCount} Scholar{rsvpCount === 1 ? "" : "s"} Going
          </span>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginTop: "12px",
        }}
      >
        <Button
          size="sm"
          variant={isRsvped ? "secondary" : "primary"}
          onClick={handleToggleRsvp}
          disabled={loading}
        >
          {isRsvped ? "✓ You're Going (Cancel RSVP)" : "✋ RSVP / Join Session"}
        </Button>
      </div>
    </Card>
  );
}
