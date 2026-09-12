import { useEffect, useMemo, useState } from "react";
import Button from "../../../components/Button";
import FormError from "../../../components/FormError";
import Input from "../../../components/Input";
import {
  createStudySession,
  getStudySessions,
  updateStudySession,
} from "../api";

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
  const [suggestions, setSuggestions] = useState([]);

  const submitting = Boolean(externalSubmitting || internalSubmitting);

  useEffect(() => {
    getStudySessions()
      .then((sessions) => {
        if (Array.isArray(sessions)) {
          const subs = new Set();
          sessions.forEach((s) => {
            if (s.subject && typeof s.subject === "string") {
              const clean = s.subject.trim();
              if (clean) subs.add(clean);
            }
          });
          setSuggestions(Array.from(subs));
        }
      })
      .catch(() => {});
  }, []);

  const matchingSuggestions = useMemo(() => {
    if (!form.subject) return suggestions.slice(0, 5);
    const lower = form.subject.toLowerCase();
    return suggestions
      .filter(
        (s) => s.toLowerCase().includes(lower) && s.toLowerCase() !== lower,
      )
      .slice(0, 5);
  }, [suggestions, form.subject]);

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
        placeholder="e.g. SE Lab, Linear Algebra, DBMS"
        value={form.subject}
        onChange={handleChange}
        disabled={submitting}
        required
        list="tracker-subject-datalist"
      />

      <datalist id="tracker-subject-datalist">
        {suggestions.map((sub, idx) => (
          <option key={idx} value={sub} />
        ))}
      </datalist>

      {matchingSuggestions.length > 0 && (
        <div
          style={{
            marginTop: "-10px",
            marginBottom: "14px",
            display: "flex",
            gap: "6px",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <span
            style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}
          >
            ⚡ Past subjects:
          </span>
          {matchingSuggestions.map((sub, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, subject: sub }))}
              style={{
                background: "var(--color-surface-subtle)",
                border: "1px solid var(--color-border)",
                borderRadius: "12px",
                padding: "2px 8px",
                fontSize: "0.75rem",
                color: "var(--color-primary)",
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              + {sub}
            </button>
          ))}
        </div>
      )}

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
