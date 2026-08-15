import { useEffect, useState } from "react";

function getInitialForm() {
  return {
    subject: "",
    duration_minutes: "",
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

  useEffect(() => {
    setForm(sessionToForm(session));
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

    const payload = {
      subject: form.subject.trim(),
      duration_minutes: Number(form.duration_minutes),
      session_date: form.session_date,
      notes: form.notes.trim(),
    };

    try {
      if (session) {
        const result = await updateSession(session.id, payload);

        onUpdated(result);
      } else {
        const result = await createSession(payload);

        onCreated(result);
      }
    } catch (error) {
      console.error("Study session save failed:", error);
    }
  }

  function handleCancelClick() {
    if (submitting) return;

    setForm(session ? sessionToForm(session) : getInitialForm());

    onCancel();
  }

  const isEditing = Boolean(session);

  return (
    <form id="study-session-form" onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="tracker-subject">Subject</label>

        <input
          id="tracker-subject"
          name="subject"
          type="text"
          value={form.subject}
          onChange={handleChange}
          placeholder="e.g. Database Systems"
          required
          disabled={submitting}
        />
      </div>

      <div>
        <label htmlFor="tracker-duration">Duration (minutes)</label>

        <input
          id="tracker-duration"
          name="duration_minutes"
          type="number"
          min="1"
          step="1"
          value={form.duration_minutes}
          onChange={handleChange}
          placeholder="e.g. 60"
          required
          disabled={submitting}
        />
      </div>

      <div>
        <label htmlFor="tracker-date">Study date</label>

        <input
          id="tracker-date"
          name="session_date"
          type="date"
          value={form.session_date}
          onChange={handleChange}
          required
          disabled={submitting}
        />
      </div>

      <div>
        <label htmlFor="tracker-notes">Notes</label>

        <textarea
          id="tracker-notes"
          name="notes"
          value={form.notes}
          onChange={handleChange}
          rows="3"
          placeholder="What did you study?"
          disabled={submitting}
        />
      </div>

      <div className="planner-card-actions">
        <button type="submit" disabled={submitting}>
          {submitting
            ? "Saving..."
            : isEditing
              ? "Update Session"
              : "Log Session"}
        </button>

        {isEditing && (
          <button
            type="button"
            onClick={handleCancelClick}
            disabled={submitting}
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
