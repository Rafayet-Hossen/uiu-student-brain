import { useState } from "react";
import Button from "../../../components/Button";
import Input from "../../../components/Input";
import FormError from "../../../components/FormError";
import { createEvent, extractCommunityErrorMessage } from "../api";

export default function EventForm({ onSubmit, onCreated, onCancel }) {
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [startTime, setStartTime] = useState("14:00");
  const [endTime, setEndTime] = useState("16:00");
  const [eventType, setEventType] = useState("offline"); // "offline" | "online"
  const [location, setLocation] = useState("");
  const [maxParticipants, setMaxParticipants] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (
      !title.trim() ||
      !subject.trim() ||
      !eventDate ||
      !startTime ||
      !endTime ||
      !location.trim()
    ) {
      setError("Please fill in all required event details.");
      return;
    }

    if (startTime >= endTime) {
      setError("End time must be after start time.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      let finalLocation = location.trim();
      if (
        eventType === "online" &&
        !finalLocation.toLowerCase().startsWith("http") &&
        !finalLocation.toLowerCase().startsWith("online")
      ) {
        finalLocation = `Online: ${finalLocation}`;
      } else if (
        eventType === "offline" &&
        !finalLocation.toLowerCase().startsWith("offline")
      ) {
        finalLocation = `Offline: ${finalLocation}`;
      }

      const payload = {
        title: title.trim(),
        subject: subject.trim(),
        description: description.trim(),
        event_date: eventDate,
        start_time: startTime,
        end_time: endTime,
        location: finalLocation,
        max_participants: Number(maxParticipants) > 0 ? Number(maxParticipants) : 30,
      };

      if (onSubmit) {
        await onSubmit(payload);
      } else if (onCreated) {
        const newEvent = await createEvent(payload);
        onCreated(newEvent);
      } else {
        await createEvent(payload);
      }
    } catch (err) {
      setError(extractCommunityErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="academic-form">
      {error && <FormError message={error} />}

      {/* Event Format Selection (Offline vs Online) */}
      <div className="form-group" style={{ marginBottom: "16px" }}>
        <label
          className="form-label"
          style={{ fontWeight: 600, display: "block", marginBottom: "8px" }}
        >
          Event Format / Venue Type *
        </label>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "12px",
          }}
        >
          <button
            type="button"
            className={`event-type-toggle-btn ${eventType === "offline" ? "active" : ""}`}
            onClick={() => {
              setEventType("offline");
              if (
                location.startsWith("Online: ") ||
                location.startsWith("http")
              )
                setLocation("");
            }}
            style={{
              padding: "12px 14px",
              borderRadius: "10px",
              border:
                eventType === "offline"
                  ? "2px solid var(--primary, #6366f1)"
                  : "1px solid var(--border-color, #e2e8f0)",
              background:
                eventType === "offline"
                  ? "rgba(99, 102, 241, 0.08)"
                  : "var(--bg-surface, #ffffff)",
              color:
                eventType === "offline"
                  ? "var(--primary, #6366f1)"
                  : "var(--text-secondary, #64748b)",
              fontWeight: eventType === "offline" ? 600 : 500,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            <span style={{ fontSize: "18px" }}>🏛️</span>
            <span>Offline (In-Person Campus)</span>
          </button>

          <button
            type="button"
            className={`event-type-toggle-btn ${eventType === "online" ? "active" : ""}`}
            onClick={() => {
              setEventType("online");
              if (location.startsWith("Offline: ")) setLocation("");
            }}
            style={{
              padding: "12px 14px",
              borderRadius: "10px",
              border:
                eventType === "online"
                  ? "2px solid #10b981"
                  : "1px solid var(--border-color, #e2e8f0)",
              background:
                eventType === "online"
                  ? "rgba(16, 185, 129, 0.08)"
                  : "var(--bg-surface, #ffffff)",
              color:
                eventType === "online"
                  ? "#10b981"
                  : "var(--text-secondary, #64748b)",
              fontWeight: eventType === "online" ? 600 : 500,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            <span style={{ fontSize: "18px" }}>🌐</span>
            <span>Online (Virtual / Remote)</span>
          </button>
        </div>
      </div>

      <div className="modal-grid-2col">
        <Input
          label="Event Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Midterm Prep & Review"
          disabled={loading}
          required
        />

        <Input
          label="Course / Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="e.g. CSE 311 / Database"
          disabled={loading}
          required
        />
      </div>

      <div className="modal-grid-3col">
        <Input
          label="Date"
          type="date"
          value={eventDate}
          onChange={(e) => setEventDate(e.target.value)}
          disabled={loading}
          required
        />

        <Input
          label="Start Time"
          type="time"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          disabled={loading}
          required
        />

        <Input
          label="End Time"
          type="time"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          disabled={loading}
          required
        />
      </div>

      <Input
        label={
          eventType === "offline"
            ? "🏛️ Campus Location / Room"
            : "🌐 Meeting Link (Google Meet / Zoom / Discord)"
        }
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        placeholder={
          eventType === "offline"
            ? "e.g. Central Library 4th Floor Study Room 402, Building A"
            : "e.g. https://meet.google.com/xyz-abc-def or Zoom Link"
        }
        disabled={loading}
        required
      />

      <div className="form-group" style={{ marginBottom: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
          <label className="form-label" style={{ fontWeight: 600, margin: 0 }}>
            👥 Participant Capacity Limit (Seats)
          </label>
          <span style={{ fontSize: "0.8rem", color: "var(--color-primary)", fontWeight: 700 }}>
            {maxParticipants} Max Attendees
          </span>
        </div>
        
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "8px" }}>
          {[5, 10, 15, 20, 30, 50].map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setMaxParticipants(preset)}
              className={`event-preset-pill ${maxParticipants === preset ? "pill-active" : ""}`}
              style={{
                padding: "4px 10px",
                fontSize: "0.78rem",
                borderRadius: "6px",
                border: maxParticipants === preset ? "1px solid var(--color-primary)" : "1px solid var(--color-border)",
                background: maxParticipants === preset ? "var(--color-primary-subtle)" : "var(--color-surface)",
                color: maxParticipants === preset ? "var(--color-primary)" : "var(--color-text-muted)",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {preset} Seats
            </button>
          ))}
        </div>

        <Input
          type="number"
          min="1"
          max="500"
          value={maxParticipants}
          onChange={(e) => setMaxParticipants(Math.max(1, parseInt(e.target.value) || 1))}
          placeholder="Custom capacity (e.g. 25)"
          disabled={loading}
          required
        />
      </div>

      <div className="form-group">
        <label className="form-label">Description & Agenda (Optional)</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Topics to cover, prerequisites, practice questions..."
          rows={3}
          className="form-input"
          style={{
            width: "100%",
            padding: "10px 14px",
            borderRadius: "var(--radius-md)",
          }}
          disabled={loading}
        />
      </div>

      <div className="form-actions-row">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Scheduling..." : "📅 Schedule Study Meetup"}
        </Button>
      </div>
    </form>
  );
}
