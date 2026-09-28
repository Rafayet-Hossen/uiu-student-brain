import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import Badge from "../../../components/Badge";
import Button from "../../../components/Button";
import Card from "../../../components/Card";
import FormError from "../../../components/FormError";
import Input from "../../../components/Input";
import CourseAutocomplete from "../../../components/CourseAutocomplete";
import {
  createSchedule,
  extractPlannerErrorMessage,
  updateSchedule,
} from "../api";

const DAYS = [
  "Saturday",
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
];

const RESOURCE_TYPES = [
  { value: "drive", label: "📁 Google Drive / Folder", icon: "📁" },
  { value: "video", label: "🎥 Video Lecture / YouTube", icon: "🎥" },
  { value: "doc", label: "📄 Document / Notes", icon: "📄" },
  { value: "link", label: "🔗 Web Link / Resource", icon: "🔗" },
];

const INITIAL_FORM = {
  subject: "",
  start_time: "",
  end_time: "",
  deadline: "",
  days: [],
  notes: "",
  resources: [],
};

function normalizeTime(value) {
  return value ? value.slice(0, 5) : "";
}

function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const parts = timeStr.slice(0, 5).split(":");
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  return h * 60 + m;
}

function findScheduleConflict(
  form,
  existingSchedules = [],
  currentScheduleId = null,
) {
  if (
    !form.start_time ||
    !form.end_time ||
    !form.days ||
    form.days.length === 0
  ) {
    return null;
  }
  const formStart = timeToMinutes(form.start_time);
  const formEnd = timeToMinutes(form.end_time);
  if (formEnd <= formStart) return null;

  for (const existing of existingSchedules) {
    if (
      currentScheduleId &&
      (existing.id === currentScheduleId ||
        String(existing.id) === String(currentScheduleId))
    ) {
      continue;
    }

    const existStart = timeToMinutes(existing.start_time);
    const existEnd = timeToMinutes(existing.end_time);

    // Overlapping interval: startA < endB && startB < endA
    const timesOverlap = formStart < existEnd && existStart < formEnd;
    if (!timesOverlap) continue;

    // Check shared days (e.g. "Monday" or "Mon")
    const conflictingDays = (form.days || []).filter((formDay) =>
      (existing.days || []).some(
        (exDay) =>
          exDay.slice(0, 3).toLowerCase() === formDay.slice(0, 3).toLowerCase(),
      ),
    );

    if (conflictingDays.length > 0) {
      return {
        conflictSchedule: existing,
        conflictingDays,
        existingTime: `${existing.start_time?.slice(0, 5)} – ${existing.end_time?.slice(0, 5)}`,
      };
    }
  }

  return null;
}

function parseResourcesSafe(res) {
  if (Array.isArray(res)) return res;
  if (typeof res === "string") {
    try {
      const parsed = JSON.parse(res);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      return [];
    }
  }
  return [];
}

function scheduleToForm(schedule) {
  return {
    subject: schedule?.subject || "",
    start_time: normalizeTime(schedule?.start_time),
    end_time: normalizeTime(schedule?.end_time),
    deadline: schedule?.deadline || "",
    days: schedule?.days || [],
    notes: schedule?.notes || "",
    resources: parseResourcesSafe(schedule?.resources),
  };
}

export default function ScheduleForm({
  schedule = null,
  initialValues = null,
  existingSchedules = [],
  onCreated,
  onUpdated,
  onCancel,
}) {
  const isEditing = Boolean(schedule && schedule.id);

  const getInitialForm = () => {
    if (isEditing) return scheduleToForm(schedule);
    if (initialValues) {
      return {
        ...INITIAL_FORM,
        ...initialValues,
      };
    }
    return INITIAL_FORM;
  };

  const [form, setForm] = useState(getInitialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const liveConflict = findScheduleConflict(
    form,
    existingSchedules,
    schedule?.id,
  );

  // Resource input state
  const [resourceTitle, setResourceTitle] = useState("");
  const [resourceUrl, setResourceUrl] = useState("");
  const [resourceType, setResourceType] = useState("link");

  useEffect(() => {
    setForm(getInitialForm());
    setError("");
  }, [schedule, initialValues, isEditing]);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function toggleDay(day) {
    setForm((current) => ({
      ...current,
      days: current.days.includes(day)
        ? current.days.filter((item) => item !== day)
        : [...current.days, day],
    }));
  }

  function autoDetectResourceType(url) {
    if (!url) return "link";
    const lower = url.toLowerCase();
    if (
      lower.includes("drive.google.com") ||
      lower.includes("dropbox.com") ||
      lower.includes("onedrive")
    ) {
      return "drive";
    }
    if (
      lower.includes("youtube.com") ||
      lower.includes("youtu.be") ||
      lower.includes("vimeo.com") ||
      lower.includes("loom.com") ||
      lower.includes(".mp4")
    ) {
      return "video";
    }
    if (
      lower.includes("docs.google.com") ||
      lower.includes(".pdf") ||
      lower.includes("notion.so") ||
      lower.includes(".docx")
    ) {
      return "doc";
    }
    return "link";
  }

  function handleUrlChange(e) {
    const val = e.target.value;
    setResourceUrl(val);
    if (val && resourceType === "link") {
      setResourceType(autoDetectResourceType(val));
    }
  }

  function handleAddResource(e) {
    e.preventDefault();
    if (!resourceUrl.trim()) return;

    let cleanUrl = resourceUrl.trim();
    if (!/^https?:\/\//i.test(cleanUrl)) {
      cleanUrl = `https://${cleanUrl}`;
    }

    const defaultTitle =
      resourceType === "drive"
        ? "Google Drive Folder"
        : resourceType === "video"
          ? "Video Lecture"
          : resourceType === "doc"
            ? "Reference Document"
            : "Learning Resource";

    const newResource = {
      title: resourceTitle.trim() || defaultTitle,
      url: cleanUrl,
      type: resourceType,
    };

    setForm((current) => ({
      ...current,
      resources: [...(current.resources || []), newResource],
    }));

    setResourceTitle("");
    setResourceUrl("");
    setResourceType("link");
  }

  function handleRemoveResource(index) {
    setForm((current) => ({
      ...current,
      resources: current.resources.filter((_, i) => i !== index),
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!form.subject.trim()) {
      setError("Subject is required.");
      return;
    }

    if (!form.start_time || !form.end_time) {
      setError("Start time and end time are required.");
      return;
    }

    if (form.start_time >= form.end_time) {
      setError("End time must be after start time.");
      return;
    }

    if (!form.deadline) {
      setError("Deadline is required.");
      return;
    }

    if (form.days.length === 0) {
      setError("Select at least one study day.");
      return;
    }

    // Explicit schedule conflict verification
    const conflict = findScheduleConflict(
      form,
      existingSchedules,
      schedule?.id,
    );
    if (conflict) {
      setError(
        `Schedule Conflict: Time slot (${form.start_time} – ${form.end_time}) on ${conflict.conflictingDays.join(", ")} overlaps with existing course "${conflict.conflictSchedule.subject}" (${conflict.existingTime}). You cannot add duplicate or overlapping routines at the same time.`,
      );
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        subject: form.subject.trim(),
        start_time: form.start_time,
        end_time: form.end_time,
        deadline: form.deadline,
        days: form.days,
        notes: form.notes.trim(),
        resources: form.resources || [],
      };

      if (isEditing) {
        const updatedSchedule = await updateSchedule(schedule.id, payload);
        if (onUpdated) onUpdated(updatedSchedule);
      } else {
        const createdSchedule = await createSchedule(payload);
        setForm(INITIAL_FORM);
        if (onCreated) onCreated(createdSchedule);
      }
    } catch (err) {
      setError(extractPlannerErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="planner-form-card" style={{ marginBottom: "28px" }}>
      <div className="card-header">
        <h2 className="card-title">
          <span>{isEditing ? "✏️" : "➕"}</span>
          <span>
            {isEditing ? "Edit Study Routine" : "Create New Study Routine"}
          </span>
        </h2>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div style={{ marginBottom: "16px" }}>
          <CourseAutocomplete
            id="subject"
            label="Subject / Course Name *"
            placeholder="e.g. Data Structures or type course title..."
            value={form.subject}
            onChange={(e) =>
              setForm((current) => ({ ...current, subject: e.target.value }))
            }
            onSelectCourse={(course) => {
              setForm((current) => ({
                ...current,
                subject: `${course.code}: ${course.title}`,
              }));
            }}
            disabled={submitting}
            required
          />
        </div>

        <div className="planner-time-row">
          <Input
            id="start_time"
            name="start_time"
            label="Start Time"
            type="time"
            value={form.start_time}
            onChange={handleChange}
            disabled={submitting}
            required
          />

          <Input
            id="end_time"
            name="end_time"
            label="End Time"
            type="time"
            value={form.end_time}
            onChange={handleChange}
            disabled={submitting}
            required
          />
        </div>

        <Input
          id="deadline"
          name="deadline"
          label="Target / Exam Deadline"
          type="date"
          value={form.deadline}
          onChange={handleChange}
          disabled={submitting}
          required
        />

        <div className="planner-days-container">
          <label className="planner-days-label">Weekly Study Days</label>
          <div className="day-chips-grid">
            {DAYS.map((day) => {
              const isSelected = form.days.includes(day);
              return (
                <button
                  type="button"
                  key={day}
                  className={`day-chip ${isSelected ? "day-chip-active" : ""}`}
                  onClick={() => toggleDay(day)}
                  disabled={submitting}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        {/* Live Conflict Warning Banner */}
        {liveConflict && (
          <div
            className="alert-banner alert-banner-error"
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
              marginTop: "14px",
              padding: "12px 16px",
              borderRadius: "12px",
              background: "rgba(239, 68, 68, 0.08)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              color: "#dc2626",
            }}
          >
            <AlertTriangle
              size={18}
              style={{ marginTop: "2px", flexShrink: 0 }}
            />
            <div style={{ fontSize: "0.85rem", lineHeight: 1.45 }}>
              <strong>Time Slot Conflict Detected:</strong> Overlaps with
              existing course{" "}
              <strong style={{ textDecoration: "underline" }}>
                {liveConflict.conflictSchedule.subject}
              </strong>{" "}
              on <strong>{liveConflict.conflictingDays.join(", ")}</strong> (
              {liveConflict.existingTime}).
              <div style={{ marginTop: "4px", opacity: 0.9 }}>
                Please choose a different time or change days to prevent
                overlapping schedules.
              </div>
            </div>
          </div>
        )}

        {/* Notes & Agenda */}
        <div className="form-group" style={{ marginTop: "16px" }}>
          <label className="form-label" htmlFor="notes">
            📝 Study Notes & Agenda (Optional)
          </label>
          <textarea
            id="notes"
            name="notes"
            className="form-input"
            rows={3}
            placeholder="Add key chapter references, formulas to review, practice problem lists, or study strategies..."
            value={form.notes}
            onChange={handleChange}
            disabled={submitting}
            style={{
              width: "100%",
              padding: "10px 14px",
              borderRadius: "var(--radius-md)",
              resize: "vertical",
            }}
          />
        </div>

        {/* Resources & Links Section */}
        <div
          className="planner-resources-section"
          style={{ marginTop: "20px" }}
        >
          <label className="form-label">
            🔗 Attached Resources & Materials (Google Drive, Videos, Docs)
          </label>

          {/* List of current attached resources */}
          {form.resources && form.resources.length > 0 && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                marginBottom: "14px",
              }}
            >
              {form.resources.map((res, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 12px",
                    background: "var(--color-surface-subtle)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-md)",
                    gap: "10px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <span>
                      {res.type === "drive"
                        ? "📁"
                        : res.type === "video"
                          ? "🎥"
                          : res.type === "doc"
                            ? "📄"
                            : "🔗"}
                    </span>
                    <strong style={{ fontSize: "0.875rem" }}>
                      {res.title}
                    </strong>
                    <a
                      href={res.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--color-accent)",
                        textDecoration: "underline",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        maxWidth: "200px",
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {res.url}
                    </a>
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    variant="danger"
                    onClick={() => handleRemoveResource(idx)}
                    disabled={submitting}
                    style={{ padding: "2px 6px", fontSize: "0.75rem" }}
                  >
                    ✕
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Add resource mini form */}
          <div
            style={{
              padding: "12px",
              background: "var(--color-surface-subtle)",
              borderRadius: "var(--radius-md)",
              border: "1px dashed var(--color-border)",
            }}
          >
            <div className="resource-builder-grid">
              <select
                value={resourceType}
                onChange={(e) => setResourceType(e.target.value)}
                className="form-input"
                disabled={submitting}
                style={{ padding: "8px 10px", fontSize: "0.8125rem" }}
              >
                {RESOURCE_TYPES.map((rt) => (
                  <option key={rt.value} value={rt.value}>
                    {rt.label}
                  </option>
                ))}
              </select>

              <input
                type="text"
                placeholder="Resource Title (e.g. Midterm Slides)"
                value={resourceTitle}
                onChange={(e) => setResourceTitle(e.target.value)}
                className="form-input"
                disabled={submitting}
                style={{ padding: "8px 10px", fontSize: "0.8125rem" }}
              />

              <input
                type="url"
                placeholder="URL (e.g. drive.google.com/..., youtube.com/...)"
                value={resourceUrl}
                onChange={handleUrlChange}
                className="form-input"
                disabled={submitting}
                style={{ padding: "8px 10px", fontSize: "0.8125rem" }}
              />

              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={handleAddResource}
                disabled={submitting || !resourceUrl.trim()}
              >
                ➕ Add Link
              </Button>
            </div>
          </div>
        </div>

        <FormError message={error} className="form-error-block" />

        <div className="card-actions-row" style={{ marginTop: "20px" }}>
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={submitting}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            loading={submitting}
            disabled={submitting || Boolean(liveConflict)}
          >
            {isEditing ? "Save Changes" : "Save Routine"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
