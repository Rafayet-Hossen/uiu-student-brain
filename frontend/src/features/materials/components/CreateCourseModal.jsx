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

export default function CreateCourseModal({
  isOpen,
  onClose,
  onSubmit,
  submitting,
  semesterName,
}) {
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(COLOR_OPTIONS[0].value);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please provide a course title.");
      return;
    }

    setError("");
    onSubmit({
      code: code.trim(),
      title: title.trim(),
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
            <h3 className="modal-title">Add Course</h3>
            <p className="modal-subtitle">
              Adding to <span className="text-accent font-semibold">{semesterName}</span>
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
          <div className="form-row-grid">
            <div className="form-group flex-1">
              <label className="form-label" htmlFor="course-code">
                Course Code (Optional)
              </label>
              <input
                id="course-code"
                type="text"
                className="form-input"
                placeholder="e.g., CSE 220"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                disabled={submitting}
                autoFocus
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="course-title">
              Course Title <span className="text-danger">*</span>
            </label>
            <input
              id="course-title"
              type="text"
              className="form-input"
              placeholder="e.g., Data Structures & Algorithms"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={submitting}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="course-desc">
              Syllabus / Focus Areas (Optional)
            </label>
            <textarea
              id="course-desc"
              className="form-textarea"
              rows={3}
              placeholder="Topics covered, instructor notes, or exam weightings..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={submitting}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Course Color Accent</label>
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
              Create Course
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

