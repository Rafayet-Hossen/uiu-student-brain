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
  const [location, setLocation] = useState("");
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
      const payload = {
        title: title.trim(),
        subject: subject.trim(),
        description: description.trim(),
        event_date: eventDate,
        start_time: startTime,
        end_time: endTime,
        location: location.trim(),
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

      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}
      >
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

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: "16px",
        }}
      >
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
        label="Location / Meeting Link"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        placeholder="e.g. Central Library Study Room 402 or Google Meet Link"
        disabled={loading}
        required
      />

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
