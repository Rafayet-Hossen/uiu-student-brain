import { useEffect, useRef, useState } from "react";
import {
  BookOpen,
  Bold,
  Check,
  CheckSquare,
  Clock,
  Code,
  Copy,
  Download,
  Eye,
  FileDown,
  FileEdit,
  FileText,
  Heading1,
  Heading2,
  Italic,
  List,
  Quote,
  RotateCcw,
  Save,
  Trash2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatRichContent } from "../../../lib/markdownHelper";

export default function MaterialNotepad({ material }) {
  const storageKey = `student_material_notes_${material?.id || "global"}`;

  const defaultStarterNote = `# Study Notes: ${material?.title || "Course Material"}
Subject: ${material?.subject || "General"} | Date: ${new Date().toLocaleDateString()}

## Key Takeaways
- 
- 

## Formulae & Definitions
> 

## Review Checklist
- [ ] Review lecture slides
- [ ] Solve chapter practice problems
`;

  const [notes, setNotes] = useState(() => {
    const saved = localStorage.getItem(storageKey);
    return saved !== null ? saved : defaultStarterNote;
  });

  const [mode, setMode] = useState("edit"); // "edit" | "preview"
  const [saveStatus, setSaveStatus] = useState("Saved");
  const [lastSavedTime, setLastSavedTime] = useState("Just now");
  const [copied, setCopied] = useState(false);

  const textareaRef = useRef(null);

  // Auto-save on change
  useEffect(() => {
    setSaveStatus("Saving...");
    const timer = setTimeout(() => {
      localStorage.setItem(storageKey, notes);
      setSaveStatus("Saved");
      const now = new Date();
      setLastSavedTime(
        now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      );
    }, 400);

    return () => clearTimeout(timer);
  }, [notes, storageKey]);

  // Insert helper for toolbar buttons
  function insertFormat(before, after = "") {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selection = notes.substring(start, end);
    const replacement = `${before}${selection}${after}`;

    const newNotes =
      notes.substring(0, start) + replacement + notes.substring(end);
    setNotes(newNotes);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + selection.length,
      );
    }, 50);
  }

  function handleInsertAISummary() {
    if (!material?.summary) return;
    const summaryBlock = `\n\n### 📋 Summary Overview\n${material.summary}\n`;
    setNotes((prev) => prev + summaryBlock);
  }

  function handleInsertKeyTopics() {
    if (!material?.key_topics || material.key_topics.length === 0) return;
    const topicsList = material.key_topics
      .map(
        (t) => `- **${t.name}**: ${t.description || "Core syllabus concept"}`,
      )
      .join("\n");
    const block = `\n\n### 📚 Key Topics\n${topicsList}\n`;
    setNotes((prev) => prev + block);
  }

  function handleCopyAll() {
    navigator.clipboard.writeText(notes);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownloadNotes() {
    const filename = `${(material?.title || "study_notes")
      .replace(/[^a-z0-9]/gi, "_")
      .toLowerCase()}_notes.md`;
    const blob = new Blob([notes], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  function handleClearNotes() {
    const confirmed = window.confirm(
      "Are you sure you want to clear these notes?",
    );
    if (confirmed) {
      setNotes("");
    }
  }

  const wordCount = notes.trim() ? notes.trim().split(/\s+/).length : 0;
  const charCount = notes.length;

  return (
    <div className="material-notepad-container">
      {/* Top Notepad Bar */}
      <div className="notepad-header-toolbar">
        {/* Left: View Toggle & Formatting Buttons */}
        <div className="notepad-toolbar-left">
          {/* Mode toggle */}
          <div className="notepad-view-toggle">
            <button
              type="button"
              className={`notepad-toggle-btn ${mode === "edit" ? "toggle-btn-active" : ""}`}
              onClick={() => setMode("edit")}
            >
              <FileEdit size={13} />
              <span>Write</span>
            </button>
            <button
              type="button"
              className={`notepad-toggle-btn ${mode === "preview" ? "toggle-btn-active" : ""}`}
              onClick={() => setMode("preview")}
            >
              <Eye size={13} />
              <span>Preview</span>
            </button>
          </div>

          {/* Formatting Buttons (when in edit mode) */}
          {mode === "edit" && (
            <div className="notepad-format-tools">
              <button
                type="button"
                className="format-btn"
                onClick={() => insertFormat("**", "**")}
                title="Bold (Ctrl+B)"
              >
                <Bold size={13} />
              </button>
              <button
                type="button"
                className="format-btn"
                onClick={() => insertFormat("*", "*")}
                title="Italic (Ctrl+I)"
              >
                <Italic size={13} />
              </button>
              <button
                type="button"
                className="format-btn"
                onClick={() => insertFormat("\n# ", "")}
                title="Heading 1"
              >
                <Heading1 size={13} />
              </button>
              <button
                type="button"
                className="format-btn"
                onClick={() => insertFormat("\n## ", "")}
                title="Heading 2"
              >
                <Heading2 size={13} />
              </button>
              <button
                type="button"
                className="format-btn"
                onClick={() => insertFormat("\n- ", "")}
                title="Bullet list"
              >
                <List size={13} />
              </button>
              <button
                type="button"
                className="format-btn"
                onClick={() => insertFormat("\n- [ ] ", "")}
                title="Checklist"
              >
                <CheckSquare size={13} />
              </button>
              <button
                type="button"
                className="format-btn"
                onClick={() => insertFormat("```\n", "\n```")}
                title="Code block"
              >
                <Code size={13} />
              </button>
              <button
                type="button"
                className="format-btn"
                onClick={() => insertFormat("\n> ", "")}
                title="Quote"
              >
                <Quote size={13} />
              </button>
            </div>
          )}
        </div>

        {/* Right: AI Quick Inserts, Save Indicator, & Export Actions */}
        <div className="notepad-toolbar-right">
          {/* Quick Inserts */}
          {material?.summary && mode === "edit" && (
            <button
              type="button"
              className="notepad-ai-insert-btn"
              onClick={handleInsertAISummary}
              title="Append summary to notes"
            >
              <FileText size={12} />
              <span>+ Summary</span>
            </button>
          )}

          {material?.key_topics?.length > 0 && mode === "edit" && (
            <button
              type="button"
              className="notepad-ai-insert-btn"
              onClick={handleInsertKeyTopics}
              title="Append key topics to notes"
            >
              <BookOpen size={12} />
              <span>+ Key Topics</span>
            </button>
          )}

          {/* Auto-save Status Indicator */}
          <div className="notepad-save-indicator">
            <span
              className={`save-dot ${
                saveStatus === "Saved" ? "dot-saved" : "dot-saving"
              }`}
            />
            <span className="save-text">
              {saveStatus === "Saved"
                ? `Saved (${lastSavedTime})`
                : "Saving..."}
            </span>
          </div>

          {/* Copy Button */}
          <button
            type="button"
            className="notepad-action-icon-btn"
            onClick={handleCopyAll}
            title="Copy all notes"
          >
            {copied ? (
              <Check size={14} className="text-emerald" />
            ) : (
              <Copy size={14} />
            )}
          </button>

          {/* Download Button */}
          <button
            type="button"
            className="notepad-action-icon-btn"
            onClick={handleDownloadNotes}
            title="Download notes (.md)"
          >
            <Download size={14} />
          </button>

          {/* Clear Button */}
          {mode === "edit" && (
            <button
              type="button"
              className="notepad-action-icon-btn btn-danger-hover"
              onClick={handleClearNotes}
              title="Clear notes"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Main Notepad Body Surface */}
      <div className="notepad-surface-container">
        {mode === "edit" ? (
          <div className="notepad-paper-wrapper">
            <div className="notepad-margin-stripe" />
            <textarea
              ref={textareaRef}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Write your study notes, key formulas, lecture insights, or exam reminders here..."
              className="notepad-real-textarea"
              spellCheck="true"
            />
          </div>
        ) : (
          <div className="notepad-preview-paper">
            {notes.trim() ? (
              <div className="notepad-rendered-markdown">
                {formatRichContent(notes)}
              </div>
            ) : (
              <div className="notepad-empty-preview">
                <p>
                  No notes written yet. Switch to "Write" mode to jot down
                  thoughts.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Status Bar */}
      <div className="notepad-status-footer">
        <div className="status-footer-left">
          <span>📝 {wordCount} words</span>
          <span className="meta-dot">•</span>
          <span>{charCount} characters</span>
          <span className="meta-dot">•</span>
          <span>Auto-saved to local browser storage</span>
        </div>

        <div className="status-footer-right">
          <span>Format: Markdown supported</span>
        </div>
      </div>
    </div>
  );
}
