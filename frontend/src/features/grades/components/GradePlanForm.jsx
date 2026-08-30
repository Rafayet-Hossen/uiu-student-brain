import { useState } from "react";
import Button from "../../../components/Button";
import Input from "../../../components/Input";
import FormError from "../../../components/FormError";

const initialForm = {
  name: "Undergraduate Degree Plan",
  target_gpa: "3.50",
  total_credits: "120",
  completed_credits: "0",
  current_gpa: "3.00",
};

export default function GradePlanForm({ onSubmit, submitting, onCancel }) {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!form.name.trim()) {
      setError("Plan name is required.");
      return;
    }

    const total = parseFloat(form.total_credits);
    const completed = parseFloat(form.completed_credits);
    const target = parseFloat(form.target_gpa);
    const current = parseFloat(form.current_gpa);

    if (isNaN(total) || total <= 0) {
      setError("Total credits must be a positive number.");
      return;
    }

    if (isNaN(completed) || completed < 0) {
      setError("Completed credits cannot be negative.");
      return;
    }

    if (completed > total) {
      setError("Completed credits cannot exceed total degree credits.");
      return;
    }

    if (isNaN(target) || target < 0 || target > 4) {
      setError("Target GPA must be between 0.00 and 4.00.");
      return;
    }

    if (isNaN(current) || current < 0 || current > 4) {
      setError("Current GPA must be between 0.00 and 4.00.");
      return;
    }

    onSubmit({
      name: form.name.trim(),
      target_gpa: form.target_gpa,
      total_credits: form.total_credits,
      completed_credits: form.completed_credits,
      current_gpa: form.current_gpa,
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Input
        id="name"
        name="name"
        label="Plan / Degree Name"
        placeholder="e.g. B.Sc. in Computer Science"
        value={form.name}
        onChange={handleChange}
        disabled={submitting}
        required
      />

      <div className="planner-time-row">
        <Input
          id="current_gpa"
          name="current_gpa"
          label="Current Cumulative GPA (0.00 - 4.00)"
          type="number"
          min="0"
          max="4"
          step="0.01"
          placeholder="e.g. 3.25"
          value={form.current_gpa}
          onChange={handleChange}
          disabled={submitting}
          required
        />

        <Input
          id="target_gpa"
          name="target_gpa"
          label="Target GPA (0.00 - 4.00)"
          type="number"
          min="0"
          max="4"
          step="0.01"
          placeholder="e.g. 3.75"
          value={form.target_gpa}
          onChange={handleChange}
          disabled={submitting}
          required
        />
      </div>

      <div className="planner-time-row">
        <Input
          id="completed_credits"
          name="completed_credits"
          label="Completed Credits"
          type="number"
          min="0"
          step="0.5"
          placeholder="e.g. 60"
          value={form.completed_credits}
          onChange={handleChange}
          disabled={submitting}
          required
        />

        <Input
          id="total_credits"
          name="total_credits"
          label="Total Degree Credits"
          type="number"
          min="1"
          step="0.5"
          placeholder="e.g. 120"
          value={form.total_credits}
          onChange={handleChange}
          disabled={submitting}
          required
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
          Create Grade Plan
        </Button>
      </div>
    </form>
  );
}
