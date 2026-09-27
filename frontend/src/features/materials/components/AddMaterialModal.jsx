import { useState, useRef } from "react";
import Button from "../../../components/Button";

const NOTE_TEMPLATES = {
  lecture: `## 📌 Lecture Overview
Key concepts and ideas discussed in today's class.

## 📝 Key Takeaways
- Concept 1: 
- Concept 2: 
- Concept 3: 

## 💡 Important Definitions
> **Definition:** Critical concept or rule to remember.

## ❓ Questions to Review
- [ ] Practice problem from slide / textbook
`,
  exam: `## 🎯 High-Yield Exam Topics
- [ ] Topic 1: Core theory and algorithms
- [ ] Topic 2: Formula derivations and proofs
- [ ] Topic 3: Past exam problems

## ⚠️ Common Pitfalls & Mistakes
- Watch out for edge cases
- Keep track of units and standard conventions
`,
  formulas: `## 📐 Formulas & Definitions Quick Sheet
- **Formula 1:** \\( E = mc^2 \\)
- **Formula 2:** 

## 🔑 Summary Rules
1. Rule 1: 
2. Rule 2: 
`,
};

const QUICK_NOTE_TAGS = [
  "Lecture",
  "MidExam",
  "FinalExam",
  "Formula",
  "Important",
  "Lab",
];

export default function AddMaterialModal({
  isOpen,
  onClose,
  onSubmit,
  submitting,
  courseName,
  projectName,
}) {
  const displayName = courseName || projectName || "Course";
  const [activeTab, setActiveTab] = useState("document"); // 'document' | 'link' | 'note'
  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [contentText, setContentText] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  // Note specific states
  const [selectedTags, setSelectedTags] = useState(["Lecture"]);

  if (!isOpen) return null;

  const handleFileChange = (selectedFile) => {
    if (selectedFile) {
      setFile(selectedFile);
      if (!title.trim()) {
        const baseName = selectedFile.name.replace(/\.[^/.]+$/, "");
        setTitle(baseName);
      }
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleInsertTool = (snippet) => {
    setContentText((prev) => {
      if (!prev) return snippet;
      if (prev.endsWith("\n")) return prev + snippet;
      return prev + "\n" + snippet;
    });
  };

  const handleApplyTemplate = (templateKey) => {
    const template = NOTE_TEMPLATES[templateKey];
    if (!template) return;
    if (
      contentText.trim().length > 10 &&
      !window.confirm("Replace current note with this template?")
    ) {
      return;
    }
    setContentText(template);
    if (!title.trim()) {
      setTitle(
        templateKey === "lecture"
          ? "Lecture Study Notes"
          : templateKey === "exam"
            ? "Exam Preparation Notes"
            : "Formulas & Definitions",
      );
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please provide a title for this material.");
      return;
    }

    if (activeTab === "document" && !file && !contentText.trim()) {
      setError("Please select a document file or paste document notes.");
      return;
    }

    if (activeTab === "link") {
      if (!linkUrl.trim()) {
        setError("Please enter a valid URL for the resource.");
        return;
      }
      try {
        new URL(linkUrl);
      } catch {
        setError("Please enter a valid URL including http:// or https://");
        return;
      }
    }

    if (activeTab === "note" && !contentText.trim()) {
      setError("Please write some notes before saving.");
      return;
    }

    setError("");

    // Build FormData
    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("material_type", activeTab);

    if (activeTab === "document") {
      if (file) formData.append("file", file);
      if (contentText.trim())
        formData.append("content_text", contentText.trim());
    } else if (activeTab === "link") {
      formData.append("link_url", linkUrl.trim());
      if (contentText.trim())
        formData.append("content_text", contentText.trim());
    } else if (activeTab === "note") {
      formData.append("content_text", contentText.trim());
      formData.append("category", "Lecture Note");
      if (selectedTags.length > 0) {
        formData.append("tags", JSON.stringify(selectedTags));
      }
    }

    onSubmit(formData);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content-card modal-materials-card"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "680px", width: "94%" }}
      >
        <div className="modal-header-row">
          <div>
            <h3 className="modal-title">
              {activeTab === "note" ? "Add Course Note" : "Add Study Material"}
            </h3>
            <p className="modal-subtitle">
              Adding to{" "}
              <span className="text-accent font-semibold">{displayName}</span>
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

        {/* Tab switchers */}
        <div className="material-tab-switchers">
          <button
            type="button"
            className={`mat-tab-btn ${activeTab === "document" ? "mat-tab-active" : ""}`}
            onClick={() => {
              setActiveTab("document");
              setError("");
            }}
          >
            📄 PDF / Book File
          </button>
          <button
            type="button"
            className={`mat-tab-btn ${activeTab === "link" ? "mat-tab-active" : ""}`}
            onClick={() => {
              setActiveTab("link");
              setError("");
            }}
          >
            🔗 Resource Link
          </button>
          <button
            type="button"
            className={`mat-tab-btn ${activeTab === "note" ? "mat-tab-active" : ""}`}
            onClick={() => {
              setActiveTab("note");
              setError("");
            }}
          >
            📝 Course Note
          </button>
        </div>

        {error && (
          <div className="alert-banner alert-banner-error mb-3">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="modal-body-content">
          {activeTab === "note" ? (
            /* ============================================================
               STANDARD, CLEAN & USEFUL COURSE NOTEBOOK
               ============================================================ */
            <div className="standard-notebook-container">
              {/* Note Title Input */}
              <div className="form-group" style={{ marginBottom: "12px" }}>
                <label className="form-label" htmlFor="note-title-field">
                  Note Title <span className="text-danger">*</span>
                </label>
                <input
                  id="note-title-field"
                  type="text"
                  className="form-input"
                  placeholder="e.g., Chapter 4: Database Transactions & ACID Properties"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={submitting}
                  autoFocus
                  style={{
                    fontSize: "0.975rem",
                    fontWeight: "700",
                    padding: "9px 12px",
                  }}
                />
              </div>

              {/* Starter Templates Bar */}
              <div className="note-starter-templates-bar">
                <span className="templates-label">Templates:</span>
                <button
                  type="button"
                  className="template-pill-chip"
                  onClick={() => handleApplyTemplate("lecture")}
                >
                  📝 Lecture Outline
                </button>
                <button
                  type="button"
                  className="template-pill-chip"
                  onClick={() => handleApplyTemplate("exam")}
                >
                  🎯 Exam Checklist
                </button>
                <button
                  type="button"
                  className="template-pill-chip"
                  onClick={() => handleApplyTemplate("formulas")}
                >
                  📐 Formulas
                </button>
              </div>

              {/* Writing Canvas */}
              <div className="note-canvas-wrapper">
                {/* Formatting Tools Strip */}
                <div className="note-formatting-tools-strip">
                  <div className="formatting-tools-group">
                    <button
                      type="button"
                      className="format-tool-btn"
                      onClick={() => handleInsertTool("- [ ] ")}
                      title="Add Checklist Item"
                    >
                      ☑️ Checklist
                    </button>
                    <button
                      type="button"
                      className="format-tool-btn"
                      onClick={() => handleInsertTool("• ")}
                      title="Add Bullet Point"
                    >
                      • Bullet
                    </button>
                    <button
                      type="button"
                      className="format-tool-btn"
                      onClick={() => handleInsertTool("> 💡 **Important:** ")}
                      title="Add Highlight Quote"
                    >
                      💡 Callout
                    </button>
                    <button
                      type="button"
                      className="format-tool-btn"
                      onClick={() =>
                        handleInsertTool("```\n// Code or formula\n```")
                      }
                      title="Add Code Block"
                    >
                      ⌨️ Code
                    </button>
                  </div>

                  <div className="note-canvas-counter">
                    <span>
                      {contentText.trim()
                        ? contentText.trim().split(/\s+/).length
                        : 0}{" "}
                      words
                    </span>
                    <span>•</span>
                    <span>{contentText.length} chars</span>
                  </div>
                </div>

                <textarea
                  className="standard-note-textarea"
                  rows={9}
                  placeholder="Write your study notes, formulas, lecture transcript, or revision points here..."
                  value={contentText}
                  onChange={(e) => setContentText(e.target.value)}
                  disabled={submitting}
                />
              </div>

              {/* Topic Tags */}
              <div className="note-tags-selection-row">
                <span className="tags-label">Tags:</span>
                <div className="tags-chips-list">
                  {QUICK_NOTE_TAGS.map((tag) => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        className={`tag-toggle-chip ${isSelected ? "tag-selected" : ""}`}
                        onClick={() => toggleTag(tag)}
                      >
                        #{tag}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* ============================================================
               DOCUMENT / RESOURCE LINK TABS
               ============================================================ */
            <>
              <div className="form-group">
                <label className="form-label" htmlFor="mat-title">
                  Material Title <span className="text-danger">*</span>
                </label>
                <input
                  id="mat-title"
                  type="text"
                  className="form-input"
                  placeholder={
                    activeTab === "document"
                      ? "e.g., Chapter 4 - Operating Systems Processes.pdf"
                      : "e.g., MIT OCW Linear Algebra Course Portal"
                  }
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={submitting}
                  autoFocus
                />
              </div>

              {/* TAB 1: Document Upload */}
              {activeTab === "document" && (
                <>
                  <div
                    className={`file-drop-zone ${isDragging ? "drop-zone-active" : ""} ${
                      file ? "drop-zone-has-file" : ""
                    }`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="file-hidden-input"
                      accept=".pdf,.doc,.docx,.txt"
                      onChange={(e) => handleFileChange(e.target.files?.[0])}
                      disabled={submitting}
                    />
                    <div className="drop-zone-icon">{file ? "📑" : "📤"}</div>
                    {file ? (
                      <div className="file-info-preview">
                        <p className="file-preview-name">{file.name}</p>
                        <p className="file-preview-size">
                          {(file.size / (1024 * 1024)).toFixed(2)} MB • Ready to
                          upload
                        </p>
                        <span className="file-replace-text">
                          Click or drag to change file
                        </span>
                      </div>
                    ) : (
                      <div className="drop-zone-labels">
                        <p className="drop-main-text">
                          Drag and drop your{" "}
                          <strong>PDF notes or book chapter</strong> here
                        </p>
                        <p className="drop-sub-text">
                          or click to browse from device (PDF, DOCX, TXT)
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="mat-doc-notes">
                      Additional Notes / Chapter Excerpt (Optional)
                    </label>
                    <textarea
                      id="mat-doc-notes"
                      className="form-textarea"
                      rows={2}
                      placeholder="Key focus areas, homework problems, or instructor hints for this document..."
                      value={contentText}
                      onChange={(e) => setContentText(e.target.value)}
                      disabled={submitting}
                    />
                  </div>
                </>
              )}

              {/* TAB 2: Resource Link */}
              {activeTab === "link" && (
                <>
                  <div className="form-group">
                    <label className="form-label" htmlFor="mat-link-url">
                      Resource URL <span className="text-danger">*</span>
                    </label>
                    <input
                      id="mat-link-url"
                      type="url"
                      className="form-input"
                      placeholder="https://..."
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      disabled={submitting}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="mat-link-notes">
                      Context / Summary of Link (Optional)
                    </label>
                    <textarea
                      id="mat-link-notes"
                      className="form-textarea"
                      rows={3}
                      placeholder="Why is this resource useful? e.g., Visual algorithm simulator for graph theory exam..."
                      value={contentText}
                      onChange={(e) => setContentText(e.target.value)}
                      disabled={submitting}
                    />
                  </div>
                </>
              )}
            </>
          )}

          <div
            className="modal-footer-row"
            style={{ marginTop: "16px", paddingTop: "12px" }}
          >
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={submitting}>
              {activeTab === "note" ? "Save Course Note" : "Add Material"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
