import { useState } from "react";
import Button from "../../../components/Button";

const COMMON_SEMESTERS = [
  "Summer 2026",
  "Fall 2026",
  "Spring 2027",
  "Summer 2027",
  "Fall 2027",
];

export default function CreateSemesterModal({ isOpen, onClose, onSubmit, submitting }) {
  const [name, setName] = useState("");
  const [isCurrent, setIsCurrent] = useState(true);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter a semester name.");
      return;
    }
    setError("");
    onSubmit({
      name: name.trim(),
      is_current: isCurrent,
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
            <h3 className="modal-title">Add Academic Semester</h3>
            <p className="modal-subtitle">
              Group your courses and study materials by semester term.
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
            <label className="form-label" htmlFor="semester-name">
              Semester Name <span className="text-danger">*</span>
            </label>
            <input
              id="semester-name"
              type="text"
              className="form-input"
              placeholder="e.g., Summer 2026"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={submitting}
              autoFocus
            />
            <div className="subject-suggestions">
              {COMMON_SEMESTERS.map((s) => (
                <button
                  key={s}
                  type="button"
                  className="subject-chip-btn"
                  onClick={() => setName(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="form-checkbox-row">
            <label className="checkbox-container">
              <input
                type="checkbox"
                checked={isCurrent}
                onChange={(e) => setIsCurrent(e.target.checked)}
                disabled={submitting}
              />
              <span className="checkbox-label-text">
                Set as my current active semester
              </span>
            </label>
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
              Create Semester
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
