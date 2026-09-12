import { useState } from "react";
import Button from "../../../components/Button";
import FormError from "../../../components/FormError";
import Input from "../../../components/Input";
import { createMaterial, extractMaterialErrorMessage } from "../api";

const CATEGORIES = [
  "Lecture Note",
  "Textbook Chapter",
  "Cheat Sheet",
  "Lab Report",
  "Research Paper",
  "Other",
];

export default function MaterialUploadModal({ onClose, onCreated }) {
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("Lecture Note");
  const [content, setContent] = useState("");
  const [file, setFile] = useState(null);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function handleAddTag(e) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const val = tagInput.trim().replace(/^,|,$/g, "");
      if (val && !tags.includes(val)) {
        setTags([...tags, val]);
      }
      setTagInput("");
    }
  }

  function handleRemoveTag(tagToRemove) {
    setTags(tags.filter((t) => t !== tagToRemove));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Please provide a title for the study material.");
      return;
    }

    if (!subject.trim()) {
      setError("Please provide a course or subject name.");
      return;
    }

    if (!content.trim() && !file) {
      setError(
        "Please either enter your note text or select a document file (.pdf, .docx, .txt, .md).",
      );
      return;
    }

    setSubmitting(true);

    try {
      let payload;
      if (file) {
        const formData = new FormData();
        formData.append("title", title.trim());
        formData.append("subject", subject.trim());
        formData.append("category", category);
        formData.append("content", content.trim());
        formData.append("file", file);
        formData.append("tags", JSON.stringify(tags));
        payload = formData;
      } else {
        payload = {
          title: title.trim(),
          subject: subject.trim(),
          category,
          content: content.trim(),
          tags,
        };
      }

      const created = await createMaterial(payload);
      if (onCreated) onCreated(created);
      onClose();
    } catch (err) {
      setError(extractMaterialErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content-card"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "620px" }}
      >
        <div className="modal-header-row">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "1.6rem" }}>📚</span>
            <div>
              <h3 className="modal-title">Upload & Index Study Material</h3>
              <span className="modal-subtitle">
                Index syllabus concepts, summaries, and key topics for your
                courses.
              </span>
            </div>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="academic-form">
          {error && <FormError message={error} className="form-error-block" />}

          <div className="modal-grid-2col">
            <Input
              id="mat_title"
              label="Material Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Tree Data Structures & AVL Rotations"
              disabled={submitting}
              required
            />

            <Input
              id="mat_subject"
              label="Subject / Course"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Data Structures"
              disabled={submitting}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="form-input"
              disabled={submitting}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: "var(--radius-md)",
              }}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Paste notes or text content */}
          <div className="form-group">
            <label className="form-label">
              📝 Study Notes / Document Text (Paste lecture notes, syllabus,
              transcript)
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste your study notes, definitions, formulas, or lecture transcript here..."
              rows={4}
              className="form-input"
              disabled={submitting}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: "var(--radius-md)",
                resize: "vertical",
                fontSize: "0.875rem",
              }}
            />
          </div>

          {/* Upload file optional */}
          <div className="form-group">
            <label className="form-label">
              📁 Or Upload Document File (PDF, DOCX, TXT, MD, etc.)
            </label>
            <div
              style={{
                border: "1px dashed var(--color-border)",
                borderRadius: "var(--radius-md)",
                padding: "12px 14px",
                background: "var(--color-surface-subtle)",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <input
                type="file"
                accept=".pdf,.docx,.doc,.txt,.md,.rtf,.csv,.json,.py,.java,.c,.cpp"
                onChange={(e) => {
                  const selected = e.target.files[0] || null;
                  setFile(selected);
                  if (selected && !title) {
                    const cleanName = selected.name.replace(/\.[^/.]+$/, "");
                    setTitle(cleanName);
                  }
                }}
                disabled={submitting}
                style={{ fontSize: "0.875rem", width: "100%" }}
              />

              {file && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "6px 10px",
                    background: "var(--color-surface)",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--color-border)",
                    fontSize: "0.8125rem",
                  }}
                >
                  <span>
                    📄 <strong>{file.name}</strong> (
                    {(file.size / 1024).toFixed(1)} KB)
                  </span>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--color-danger-text, #ef4444)",
                      cursor: "pointer",
                      fontWeight: 600,
                      padding: "2px 6px",
                    }}
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Tags */}
          <div className="form-group">
            <label className="form-label">🏷️ Custom Tags (Press Enter)</label>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              placeholder="Type tag and press Enter (e.g. Midterm, Trees, Formulas)"
              className="form-input"
              disabled={submitting}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: "var(--radius-md)",
              }}
            />
            {tags.length > 0 && (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "6px",
                  marginTop: "8px",
                }}
              >
                {tags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "2px 8px",
                      fontSize: "0.75rem",
                      borderRadius: "var(--radius-sm)",
                      background: "var(--color-surface-subtle)",
                      border: "1px solid var(--color-border)",
                    }}
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "0.75rem",
                        color: "var(--color-text-muted)",
                        padding: 0,
                      }}
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="modal-footer-row" style={{ marginTop: "18px" }}>
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" loading={submitting} disabled={submitting}>
              {submitting
                ? "Analyzing Content..."
                : "🚀 Upload & Extract Topics"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
