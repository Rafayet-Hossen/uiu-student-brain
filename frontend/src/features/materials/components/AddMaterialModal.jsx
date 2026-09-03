import { useState, useRef } from "react";
import Button from "../../../components/Button";

export default function AddMaterialModal({
  isOpen,
  onClose,
  onSubmit,
  submitting,
  projectName,
}) {
  const [activeTab, setActiveTab] = useState("document"); // 'document' | 'link' | 'note'
  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [contentText, setContentText] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileChange = (selectedFile) => {
    if (selectedFile) {
      setFile(selectedFile);
      if (!title.trim()) {
        // Strip extension for friendly default title
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
      setError("Please enter the content for this note.");
      return;
    }

    setError("");

    // Build FormData
    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("material_type", activeTab);

    if (activeTab === "document") {
      if (file) formData.append("file", file);
      if (contentText.trim()) formData.append("content_text", contentText.trim());
    } else if (activeTab === "link") {
      formData.append("link_url", linkUrl.trim());
      if (contentText.trim()) formData.append("content_text", contentText.trim());
    } else if (activeTab === "note") {
      formData.append("content_text", contentText.trim());
    }

    onSubmit(formData);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content-card modal-materials-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header-row">
          <div>
            <h3 className="modal-title">Add Study Material</h3>
            <p className="modal-subtitle">
              Adding to <span className="text-accent font-semibold">{projectName}</span>
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

        {error && <div className="alert-banner alert-banner-error">{error}</div>}

        <form onSubmit={handleSubmit} className="modal-body-content">
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
                  : activeTab === "link"
                  ? "e.g., MIT OCW Linear Algebra Course Portal"
                  : "e.g., Summary of Enzyme Kinetics and Inhibitors"
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
                <div className="drop-zone-icon">
                  {file ? "📑" : "📤"}
                </div>
                {file ? (
                  <div className="file-info-preview">
                    <p className="file-preview-name">{file.name}</p>
                    <p className="file-preview-size">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB • Ready to upload
                    </p>
                    <span className="file-replace-text">Click or drag to change file</span>
                  </div>
                ) : (
                  <div className="drop-zone-labels">
                    <p className="drop-main-text">
                      Drag and drop your <strong>PDF notes or book chapter</strong> here
                    </p>
                    <p className="drop-sub-text">or click to browse from device (PDF, DOCX, TXT)</p>
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

          {/* TAB 3: Course Note */}
          {activeTab === "note" && (
            <div className="form-group">
              <label className="form-label" htmlFor="mat-note-content">
                Lecture Notes & Concepts <span className="text-danger">*</span>
              </label>
              <textarea
                id="mat-note-content"
                className="form-textarea"
                rows={6}
                placeholder="Write or paste your study notes, formulas, lecture transcript, or study summary here..."
                value={contentText}
                onChange={(e) => setContentText(e.target.value)}
                disabled={submitting}
              />
            </div>
          )}

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
              Add Material
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
