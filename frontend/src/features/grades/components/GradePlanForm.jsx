import { useState } from "react";

const initialForm = {
  name: "My Grade Plan",
  target_gpa: "",
  total_credits: "",
  completed_credits: "0",
  current_gpa: "",
};

export default function GradePlanForm({ onSubmit, submitting }) {
  const [form, setForm] = useState(initialForm);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    onSubmit({
      name: form.name.trim(),
      target_gpa: form.target_gpa,
      total_credits: form.total_credits,
      completed_credits: form.completed_credits,
      current_gpa: form.current_gpa,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name">Plan name</label>
        <input
          id="name"
          name="name"
          value={form.name}
          onChange={handleChange}
          required
        />
      </div>

      <div>
        <label htmlFor="target_gpa">Target GPA</label>
        <input
          id="target_gpa"
          name="target_gpa"
          type="number"
          min="0"
          max="4"
          step="0.01"
          value={form.target_gpa}
          onChange={handleChange}
          required
        />
      </div>

      <div>
        <label htmlFor="total_credits">Total credits</label>
        <input
          id="total_credits"
          name="total_credits"
          type="number"
          min="0"
          step="0.01"
          value={form.total_credits}
          onChange={handleChange}
          required
        />
      </div>

      <div>
        <label htmlFor="completed_credits">Completed credits</label>
        <input
          id="completed_credits"
          name="completed_credits"
          type="number"
          min="0"
          step="0.01"
          value={form.completed_credits}
          onChange={handleChange}
          required
        />
      </div>

      <div>
        <label htmlFor="current_gpa">Current GPA</label>
        <input
          id="current_gpa"
          name="current_gpa"
          type="number"
          min="0"
          max="4"
          step="0.01"
          value={form.current_gpa}
          onChange={handleChange}
          required
        />
      </div>

      <button type="submit" disabled={submitting}>
        {submitting ? "Creating..." : "Create Grade Plan"}
      </button>
    </form>
  );
}
