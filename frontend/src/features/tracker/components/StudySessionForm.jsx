import { useEffect, useState } from "react";
import Button from "../../../components/Button";
import FormError from "../../../components/FormError";
import Input from "../../../components/Input";
import { createStudySession, updateStudySession } from "../api";

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
  onCreate,
  onUpdate,
  submitting: externalSubmitting,
}) {
  const [form, setForm] = useState(() => sessionToForm(session));
  const [error, setError] = useState("");
  const [internalSubmitting, setInternalSubmitting] = useState(false);

  const submitting = Boolean(externalSubmitting || internalSubmitting);

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
      setError("Subject / topic studied is required.");
      return;
    }

    const duration = parseInt(form.duration_minutes, 10);
    if (isNaN(duration) || duration <= 0) {
      setError("Duration must be a positive number of minutes (e.g. 60).");
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
      notes: form.notes ? form.notes.trim() : "",
    };

    setInternalSubmitting(true);
    try {
      if (session) {
        const updater = updateSession || onUpdate;
        let result;
        if (typeof updater === "function") {
          result = await updater(session.id, payload);
        } else {
          result = await updateStudySession(session.id, payload);
        }
        if (onUpdated) onUpdated(result);
      } else {
        const creator = createSession || onCreate;
        let result;
        if (typeof creator === "function") {
          result = await creator(payload);
        } else {
          result = await createStudySession(payload);
        }
        setForm(getInitialForm());
        if (onCreated) onCreated(result);
      }
    } catch (err) {
      console.error("Study session save failed:", err);
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        (err?.response?.data && typeof err.response.data === "object"
          ? Object.entries(err.response.data)
              .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
              .join(" | ")
          : null) ||
        err.message ||
        "Failed to save study session.";
      setError(msg);
    } finally {
      setInternalSubmitting(false);
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
        placeholder="e.g. Linear Algebra, Neural Networks, DBMS"
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

      <div className="form-field-group">
        <label htmlFor="tracker-notes" className="form-field-label">
          <span>Notes & Covered Topics (Optional)</span>
        </label>
        <textarea
          id="tracker-notes"
          name="notes"
          className="form-input-control"
          style={{
            minHeight: "86px",
            resize: "vertical",
            fontFamily: "inherit",
            lineHeight: "1.5",
          }}
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
