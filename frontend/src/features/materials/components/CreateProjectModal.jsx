import { useState } from "react";
import Button from "../../../components/Button";

const COLOR_OPTIONS = [
  { name: "Royal Blue", value: "#2563eb" },
  { name: "Emerald", value: "#10b981" },
  { name: "Purple", value: "#8b5cf6" },
  { name: "Amber", value: "#f59e0b" },
  { name: "Rose", value: "#ef4444" },
  { name: "Indigo", value: "#6366f1" },
  { name: "Cyan", value: "#06b6d4" },
];

const COMMON_SUBJECTS = [
  "Computer Science",
  "Biochemistry",
  "Mathematics",
  "Electrical Engineering",
  "Economics",
  "Physics",
  "Data Science",
  "Mechanical Engineering",
];

export default function CreateProjectModal({ isOpen, onClose, onSubmit, submitting }) {
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(COLOR_OPTIONS[0].value);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please provide a project or course title.");
      return;
    }
    if (!subject.trim()) {
      setError("Please specify the course subject.");
      return;
    }

    setError("");
    onSubmit({
      title: title.trim(),
      subject: subject.trim(),
      description: description.trim(),
      color,
    });
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content-card modal-materials-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header-row">
          <div>
            <h3 className="modal-title">Create Subject Project</h3>
            <p className="modal-subtitle">
              Set up a dedicated workspace to organize notes, book PDFs, and links.
            </p>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {error && <div className="alert-banner alert-banner-error">{error}</div>}

        <form onSubmit={handleSubmit} className="modal-body-content">
          <div className="form-group">
            <label className="form-label" htmlFor="project-title">
              Project / Course Title <span className="text-danger">*</span>
            </label>
            <input
              id="project-title"
              type="text"
              className="form-input"
              placeholder="e.g., Algorithms & Advanced Data Structures"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={submitting}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="project-subject">
              Subject Name <span className="text-danger">*</span>
            </label>
            <input
              id="project-subject"
              type="text"
              className="form-input"
              placeholder="e.g., Computer Science & Engineering"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={submitting}
            />
            <div className="subject-suggestions">
              {COMMON_SUBJECTS.map((s) => (
                <button
                  key={s}
                  type="button"
                  className="subject-chip-btn"
                  onClick={() => setSubject(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="project-desc">
              Description / Syllabus Overview (Optional)
            </label>
            <textarea
              id="project-desc"
              className="form-textarea"
              rows={3}
              placeholder="Summary of chapters, course objectives, or midterm exam scope..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={submitting}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Workspace Accent Color</label>
            <div className="color-swatch-picker">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  className={`color-swatch-dot ${color === c.value ? "swatch-active" : ""}`}
                  style={{ backgroundColor: c.value }}
                  onClick={() => setColor(c.value)}
                  title={c.name}
                />
              ))}
            </div>
          </div>

          <div className="modal-footer-row">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={submitting}
            >
              Create Project
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
