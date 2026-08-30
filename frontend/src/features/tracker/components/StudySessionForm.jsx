import { useEffect, useState } from "react";
import Button from "../../../components/Button";
import FormError from "../../../components/FormError";
import Input from "../../../components/Input";

function getInitialForm() {
  return {
    subject: "",
    duration_minutes: "60",
    session_date: new Date().toISOString().split("T")[0],
    notes: "",
  };
}

function sessionToForm(session) {
  if (!session) {
    return getInitialForm();
  }

  return {
    subject: session.subject ?? "",
    duration_minutes: session.duration_minutes ?? "",
    session_date:
      session.session_date ?? new Date().toISOString().split("T")[0],
    notes: session.notes ?? "",
  };
}

export default function StudySessionForm({
  session,
  onCreated,
  onUpdated,
  onCancel,
  createSession,
  updateSession,
  submitting,
}) {
  const [form, setForm] = useState(() => sessionToForm(session));
  const [error, setError] = useState("");

  useEffect(() => {
    setForm(sessionToForm(session));
    setError("");
  }, [session]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!form.subject.trim()) {
      setError("Subject is required.");
      return;
    }

    const duration = parseInt(form.duration_minutes, 10);
    if (isNaN(duration) || duration <= 0) {
      setError("Duration must be a positive number of minutes (e.g. 45).");
      return;
    }

    if (!form.session_date) {
      setError("Study session date is required.");
      return;
    }

    const payload = {
      subject: form.subject.trim(),
      duration_minutes: duration,
      session_date: form.session_date,
      notes: form.notes.trim(),
    };

    try {
      if (session) {
        const result = await updateSession(session.id, payload);
        onUpdated(result);
      } else {
        const result = await createSession(payload);
        setForm(getInitialForm());
        onCreated(result);
      }
    } catch (err) {
      console.error("Study session save failed:", err);
    }
  }

  const isEditing = Boolean(session);

  return (
    <form id="study-session-form" onSubmit={handleSubmit} noValidate>
      <Input
        id="tracker-subject"
        name="subject"
        label="Subject / Topic Studied"
        type="text"
        placeholder="e.g. Linear Algebra, Neural Networks"
        value={form.subject}
        onChange={handleChange}
        disabled={submitting}
        required
      />

      <div className="planner-time-row">
        <Input
          id="tracker-duration"
          name="duration_minutes"
          label="Duration (Minutes)"
          type="number"
          min="1"
          step="5"
          placeholder="e.g. 60"
          value={form.duration_minutes}
          onChange={handleChange}
          disabled={submitting}
          required
        />

        <Input
          id="tracker-date"
          name="session_date"
          label="Session Date"
          type="date"
          value={form.session_date}
          onChange={handleChange}
          disabled={submitting}
          required
        />
      </div>

      <div className="field">
        <label htmlFor="tracker-notes" className="field-label">
          Notes & Covered Topics (Optional)
        </label>
        <textarea
          id="tracker-notes"
          name="notes"
          className="field-input"
          value={form.notes}
          onChange={handleChange}
          rows="3"
          placeholder="Summarize key concepts reviewed, problems solved, or insights..."
          disabled={submitting}
        />
      </div>

      <FormError message={error} className="form-error-block" />

      <div className="card-actions-row">
        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={submitting}
          >
            Cancel
          </Button>
        )}

        <Button type="submit" loading={submitting} disabled={submitting}>
          {isEditing ? "Update Session" : "Log Session"}
        </Button>
      </div>
    </form>
  );
}
