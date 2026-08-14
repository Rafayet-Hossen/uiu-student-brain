import { useEffect, useState } from "react";
import Button from "../../../components/Button";
import Card from "../../../components/Card";
import FormError from "../../../components/FormError";
import Input from "../../../components/Input";
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

const INITIAL_FORM = {
  subject: "",
  start_time: "",
  end_time: "",
  deadline: "",
  days: [],
};

function normalizeTime(value) {
  return value ? value.slice(0, 5) : "";
}

function scheduleToForm(schedule) {
  return {
    subject: schedule?.subject || "",
    start_time: normalizeTime(schedule?.start_time),
    end_time: normalizeTime(schedule?.end_time),
    deadline: schedule?.deadline || "",
    days: schedule?.days || [],
  };
}

export default function ScheduleForm({
  schedule = null,
  onCreated,
  onUpdated,
  onCancel,
}) {
  const isEditing = Boolean(schedule);

  const [form, setForm] = useState(
    isEditing ? scheduleToForm(schedule) : INITIAL_FORM,
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setForm(isEditing ? scheduleToForm(schedule) : INITIAL_FORM);
    setError("");
  }, [schedule, isEditing]);

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
      setError("Select at least one day.");
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
      };

      if (isEditing) {
        const updatedSchedule = await updateSchedule(schedule.id, payload);

        if (onUpdated) {
          onUpdated(updatedSchedule);
        }
      } else {
        const createdSchedule = await createSchedule(payload);

        setForm(INITIAL_FORM);

        if (onCreated) {
          onCreated(createdSchedule);
        }
      }
    } catch (err) {
      setError(extractPlannerErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="planner-form-card">
      <h2>{isEditing ? "Edit Study Schedule" : "Add Study Schedule"}</h2>

      <form onSubmit={handleSubmit} noValidate>
        <Input
          id="subject"
          name="subject"
          label="Subject"
          type="text"
          placeholder="e.g. Data Structures"
          value={form.subject}
          onChange={handleChange}
        />

        <div className="planner-time-row">
          <Input
            id="start_time"
            name="start_time"
            label="Start time"
            type="time"
            value={form.start_time}
            onChange={handleChange}
          />

          <Input
            id="end_time"
            name="end_time"
            label="End time"
            type="time"
            value={form.end_time}
            onChange={handleChange}
          />
        </div>

        <Input
          id="deadline"
          name="deadline"
          label="Deadline"
          type="date"
          value={form.deadline}
          onChange={handleChange}
        />

        <div className="planner-days">
          <p className="planner-field-label">Study days</p>

          <div className="planner-day-list">
            {DAYS.map((day) => (
              <label key={day} className="planner-day-option">
                <input
                  type="checkbox"
                  checked={form.days.includes(day)}
                  onChange={() => toggleDay(day)}
                />
                <span>{day}</span>
              </label>
            ))}
          </div>
        </div>

        <FormError message={error} className="form-error-block" />

        <div className="planner-form-actions">
          <Button type="submit" loading={submitting} disabled={submitting}>
            {isEditing ? "Update Schedule" : "Add Schedule"}
          </Button>

          {isEditing && (
            <Button
              type="button"
              variant="secondary"
              onClick={onCancel}
              disabled={submitting}
            >
              Cancel
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
}
