import { useState, useEffect, useRef, useMemo } from "react";
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  List,
  CheckSquare,
  Code,
  Quote,
  Copy,
  Check,
  Download,
  FileEdit,
  Eye,
  Trash2,
  Sparkles,
  Plus,
  Search,
  BookOpen,
  Clock,
  FileText,
  Tag,
  AlertCircle,
  X,
  Save,
} from "lucide-react";
import Button from "../../../components/Button";
import Spinner from "../../../components/Spinner";
import { formatRichContent } from "../../../lib/markdownHelper";
import { createMaterial, updateMaterial, deleteMaterial } from "../api";

const STARTER_TEMPLATES = {
  mid: `# Mid Exam Preparation Notes
Course: %COURSE% | Topic: Mid Exam Revision | Date: %DATE%

## 🎯 High-Priority Topics
- [ ] Topic 1: Core concepts and theoretical foundations
- [ ] Topic 2: Key algorithms and step-by-step procedures
- [ ] Topic 3: Problem solving from past papers

## 💡 Important Definitions & Formulas
> **Definition 1**: Write critical definition here.
> **Formula**: \\( E = mc^2 \\) or step-by-step rule.

## 📝 Practice Questions & Answers
1. **Question**: 
   - **Answer**: 

## ⚠️ Common Pitfalls & Mistakes to Avoid
- Remember to check edge cases
- Keep track of units and standard terminology
`,

  final: `# Final Exam Comprehensive Notes
Course: %COURSE% | Topic: Final Term Review | Date: %DATE%

## 🏆 Full Syllabus Checklist
- [ ] Pre-Midterm refresher concepts
- [ ] Post-Midterm core modules
- [ ] Advanced topics and case studies
- [ ] Lab tasks and practical code review

## 🔑 Key Concepts Summary
### Module 1: Foundational Principles
- Summary points...

### Module 2: Advanced Applications
- Summary points...

## 📊 Quick Reference Table / Formulas
> **Formula 1**: 
> **Important Theorem**: 

## 🎯 Expected Exam Questions
- [ ] Short questions (definitions, differences)
- [ ] Broad theoretical questions
- [ ] Mathematical or design problems
`,

  lecture: `# Lecture Study Notes
Course: %COURSE% | Topic: Lecture Summary | Date: %DATE%

## 📌 Lecture Overview
Summary of main ideas discussed in today's class.

## 📝 Detailed Points
- Point 1: 
- Point 2: 
- Point 3: 

## 💻 Code / Examples
\`\`\`
// Code or algorithmic logic
\`\`\`

## ❓ Questions for Instructor / T.A.
- [ ] Clarify concept X in next office hours
`,

  blank: `# %TOPIC% Notes
Course: %COURSE% | Date: %DATE%

Write your study notes, key ideas, and checklist here...
- [ ] Key review item 1
- [ ] Key review item 2
`,
};

function formatRelativeTime(dateString) {
  if (!dateString) return "Recently";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay === 1) return "Yesterday";
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function CourseNotesWorkspace({
  course,
  notes = [],
  onRefresh,
  onAnalyze,
  analyzingId,
  onViewAnalysis,
  activeNoteToOpen = null,
  onClearActiveNoteToOpen,
}) {
  // Topic filters
  const [selectedTopic, setSelectedTopic] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Notepad Editor Modal / Canvas state
  const [editorNote, setEditorNote] = useState(null);
  const [editorMode, setEditorMode] = useState("edit"); // "edit" | "preview"
  const [saveStatus, setSaveStatus] = useState("idle"); // "idle" | "dirty" | "saving" | "saved"
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [feedbackMsg, setFeedbackMsg] = useState({ type: "", text: "" });

  const textareaRef = useRef(null);

  // If parent requests opening a specific note (e.g. clicked from All Items)
  useEffect(() => {
    if (activeNoteToOpen) {
      const targetMode = activeNoteToOpen.initialMode || "edit";
      openNoteForEdit(activeNoteToOpen, targetMode);
      if (onClearActiveNoteToOpen) {
        setTimeout(() => {
          onClearActiveNoteToOpen();
        }, 150);
      }
    }
  }, [activeNoteToOpen]);

  // Extract all unique topic tags across notes
  const availableTopics = useMemo(() => {
    const topicsMap = new Map();
    // Default suggestions
    const defaults = ["Mid", "Final", "Lecture", "Summary"];
    defaults.forEach((t) =>
      topicsMap.set(t.toLowerCase(), { name: t, count: 0 }),
    );

    notes.forEach((note) => {
      const tags = Array.isArray(note.tags) ? note.tags : [];
      tags.forEach((tag) => {
        if (!tag || typeof tag !== "string") return;
        const clean = tag.trim();
        if (!clean) return;
        const lower = clean.toLowerCase();
        const existing = topicsMap.get(lower);
        if (existing) {
          existing.count += 1;
        } else {
          topicsMap.set(lower, { name: clean, count: 1 });
        }
      });

      // Also check if note title starts with or mentions Mid or Final
      const titleLower = (note.title || "").toLowerCase();
      if (
        titleLower.includes("mid") &&
        !tags.some((t) => t.toLowerCase().includes("mid"))
      ) {
        const midItem = topicsMap.get("mid");
        if (midItem) midItem.count += 1;
      }
      if (
        titleLower.includes("final") &&
        !tags.some((t) => t.toLowerCase().includes("final"))
      ) {
        const finalItem = topicsMap.get("final");
        if (finalItem) finalItem.count += 1;
      }
    });

    return Array.from(topicsMap.values());
  }, [notes]);

  // Filter notes
  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      const noteTitle = (note.title || "").toLowerCase();
      const noteContent = (note.content_text || "").toLowerCase();
      const noteTags = (Array.isArray(note.tags) ? note.tags : []).map((t) =>
        String(t).toLowerCase(),
      );

      // Topic filter
      if (selectedTopic !== "all") {
        const sel = selectedTopic.toLowerCase();
        const matchesTag = noteTags.some((t) => t === sel || t.includes(sel));
        const matchesTitle = noteTitle.includes(sel);
        if (!matchesTag && !matchesTitle) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesQuery =
          noteTitle.includes(q) ||
          noteContent.includes(q) ||
          noteTags.some((t) => t.includes(q));
        if (!matchesQuery) return false;
      }

      return true;
    });
  }, [notes, selectedTopic, searchQuery]);

  // Handler: Start a new note
  const handleStartNewNote = (suggestedTopic = "Mid", templateKey = "mid") => {
    const courseTitle = course?.title || "Course";
    const today = new Date().toLocaleDateString();
    let templateText =
      STARTER_TEMPLATES[templateKey] || STARTER_TEMPLATES.blank;
    templateText = templateText
      .replace(/%COURSE%/g, courseTitle)
      .replace(/%TOPIC%/g, suggestedTopic)
      .replace(/%DATE%/g, today);

    const initialTitle =
      suggestedTopic === "Mid"
        ? "Mid Exam Preparation Notes"
        : suggestedTopic === "Final"
          ? "Final Exam Preparation Notes"
          : `${suggestedTopic} Notes`;

    setEditorNote({
      id: null,
      title: initialTitle,
      content_text: templateText,
      tags: suggestedTopic ? [suggestedTopic] : ["Mid"],
      category: "Lecture Note",
      isNew: true,
    });
    setEditorMode("edit");
    setSaveStatus("dirty");
    setFeedbackMsg({ type: "", text: "" });
  };

  // Handler: Open existing note
  const openNoteForEdit = (note, initialMode = "edit") => {
    const tags = Array.isArray(note.tags) ? [...note.tags] : [];
    // If no tags, check title for mid/final to help user
    if (tags.length === 0) {
      if ((note.title || "").toLowerCase().includes("mid")) tags.push("Mid");
      if ((note.title || "").toLowerCase().includes("final"))
        tags.push("Final");
    }

    setEditorNote({
      id: note.id,
      title: note.title || "Untitled Note",
      content_text: note.content_text || "",
      tags: tags,
      category: note.category || "Lecture Note",
      isNew: false,
      raw: note,
    });
    setEditorMode(initialMode);
    setSaveStatus("saved");
    setFeedbackMsg({ type: "", text: "" });
  };

  // Handler: Save Note (New or Existing)
  const handleSaveNote = async () => {
    if (!editorNote) return;
    const cleanTitle = (editorNote.title || "").trim();
    if (!cleanTitle) {
      setFeedbackMsg({
        type: "error",
        text: "Please enter a title for your note.",
      });
      return;
    }

    try {
      setIsSaving(true);
      setSaveStatus("saving");
      setFeedbackMsg({ type: "", text: "" });

      if (editorNote.isNew || !editorNote.id) {
        // Create new note
        const payload = {
          title: cleanTitle,
          material_type: "note",
          content_text: editorNote.content_text || "",
          tags: editorNote.tags || [],
          category: editorNote.category || "Lecture Note",
        };

        const courseId =
          course?.id || (typeof course === "number" ? course : null);
        const created = await createMaterial(courseId, payload);
        setEditorNote((prev) => ({
          ...prev,
          id: created.id,
          isNew: false,
          raw: created,
        }));
        setSaveStatus("saved");
        setFeedbackMsg({
          type: "success",
          text: `Note "${cleanTitle}" saved successfully!`,
        });
        if (onRefresh) await onRefresh();
      } else {
        // Update existing note
        const payload = {
          title: cleanTitle,
          content_text: editorNote.content_text || "",
          tags: editorNote.tags || [],
          category: editorNote.category || "Lecture Note",
        };

        const updated = await updateMaterial(editorNote.id, payload);
        setEditorNote((prev) => ({
          ...prev,
          raw: updated,
        }));
        setSaveStatus("saved");
        setFeedbackMsg({ type: "success", text: "Changes saved!" });
        if (onRefresh) await onRefresh();
      }
    } catch (err) {
      setSaveStatus("dirty");
      const errDetail =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        (err?.response?.data && typeof err.response.data === "object"
          ? Object.entries(err.response.data)
              .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
              .join(" | ")
          : null) ||
        err?.message ||
        "Failed to save note.";
      setFeedbackMsg({
        type: "error",
        text: errDetail,
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handler: Delete Note
  const handleDeleteNote = async (note, e) => {
    if (e) e.stopPropagation();
    if (
      !window.confirm(`Are you sure you want to delete note "${note.title}"?`)
    ) {
      return;
    }
    try {
      await deleteMaterial(note.id);
      if (editorNote && editorNote.id === note.id) {
        setEditorNote(null);
      }
      if (onRefresh) await onRefresh();
    } catch (err) {
      alert("Failed to delete note: " + (err?.message || "Error"));
    }
  };

  // Toolbar formatting inserter
  const insertFormat = (before, after = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const current = editorNote.content_text || "";
    const selection = current.substring(start, end);
    const replacement = `${before}${selection}${after}`;
    const nextContent =
      current.substring(0, start) + replacement + current.substring(end);

    setEditorNote((prev) => ({ ...prev, content_text: nextContent }));
    setSaveStatus("dirty");

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + selection.length,
      );
    }, 40);
  };

  // Insert template inside active editor
  const handleInsertTemplate = (templateKey) => {
    const courseTitle = course?.title || "Course";
    const today = new Date().toLocaleDateString();
    let templateText = STARTER_TEMPLATES[templateKey] || "";
    templateText = templateText
      .replace(/%COURSE%/g, courseTitle)
      .replace(/%TOPIC%/g, editorNote?.title || "Topic")
      .replace(/%DATE%/g, today);

    if (
      editorNote.content_text &&
      editorNote.content_text.trim().length > 20 &&
      !window.confirm("Append template to existing notes?")
    ) {
      return;
    }

    setEditorNote((prev) => ({
      ...prev,
      content_text:
        (prev.content_text ? prev.content_text + "\n\n" : "") + templateText,
    }));
    setSaveStatus("dirty");
  };

  // Add a tag to active note
  const handleAddTag = (tagToAdd) => {
    const clean = (tagToAdd || "").trim();
    if (!clean) return;
    if (editorNote.tags && editorNote.tags.includes(clean)) return;

    setEditorNote((prev) => ({
      ...prev,
      tags: [...(prev.tags || []), clean],
    }));
    setSaveStatus("dirty");
    setTagInput("");
  };

  // Remove a tag from active note
  const handleRemoveTag = (tagToRemove) => {
    setEditorNote((prev) => ({
      ...prev,
      tags: (prev.tags || []).filter((t) => t !== tagToRemove),
    }));
    setSaveStatus("dirty");
  };

  // Copy full note markdown
  const handleCopyNote = () => {
    if (!editorNote?.content_text) return;
    navigator.clipboard.writeText(editorNote.content_text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download note as markdown
  const handleDownloadNote = () => {
    if (!editorNote) return;
    const safeTitle = (editorNote.title || "note")
      .replace(/[^a-z0-9]/gi, "_")
      .toLowerCase();
    const filename = `${safeTitle}.md`;
    const blob = new Blob([editorNote.content_text || ""], {
      type: "text/markdown;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Word & reading stats
  const noteWords = useMemo(() => {
    const text = (editorNote?.content_text || "").trim();
    return text ? text.split(/\s+/).length : 0;
  }, [editorNote?.content_text]);

  const noteChars = (editorNote?.content_text || "").length;
  const readingTimeMin = Math.max(1, Math.round(noteWords / 180));

  return (
    <div className="course-notes-workspace">
      {/* Top Banner & Action Header */}
      <div className="notes-workspace-header">
        <div className="notes-header-info">
          <div className="notes-title-row">
            <span className="notes-icon-badge">📝</span>
            <div>
              <h3 className="notes-heading">Course Notebook & Topic Notes</h3>
              <p className="notes-subheading">
                Organize topic summaries, Mid & Final exam revisions, and
                lecture takeaways for{" "}
                <span className="font-semibold text-accent">
                  {course?.title}
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="notes-header-actions">
          <Button
            variant="primary"
            onClick={() =>
              handleStartNewNote(
                selectedTopic !== "all" ? selectedTopic : "Mid",
              )
            }
            className="btn-create-note"
          >
            <Plus size={16} />
            <span>+ New Note</span>
          </Button>
        </div>
      </div>

      {/* Topics / Tag Chips Filter Bar & Search */}
      <div className="notes-filter-toolbar">
        <div className="notes-topic-chips-scroll">
          <button
            type="button"
            className={`topic-chip-btn ${selectedTopic === "all" ? "topic-chip-active" : ""}`}
            onClick={() => setSelectedTopic("all")}
          >
            <span>All Notes</span>
            <span className="topic-chip-count">{notes.length}</span>
          </button>

          {availableTopics.map((top) => {
            const isActive =
              selectedTopic.toLowerCase() === top.name.toLowerCase();
            return (
              <button
                key={top.name}
                type="button"
                className={`topic-chip-btn ${isActive ? "topic-chip-active" : ""}`}
                onClick={() => setSelectedTopic(top.name)}
              >
                <span>🏷️ {top.name}</span>
                {top.count > 0 && (
                  <span className="topic-chip-count">{top.count}</span>
                )}
              </button>
            );
          })}
        </div>

        <div className="notes-search-box">
          <Search size={14} className="notes-search-icon" />
          <input
            type="text"
            className="notes-search-input"
            placeholder="Search notes (e.g. Mid, Final, topic)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="notes-search-clear"
              onClick={() => setSearchQuery("")}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Notes Cards Grid or Empty State */}
      {filteredNotes.length === 0 ? (
        <div className="notes-empty-workspace-card">
          <div className="notes-empty-icon-wrap">📓</div>
          <h4 className="notes-empty-title">
            {searchQuery
              ? `No notes matching "${searchQuery}"`
              : selectedTopic !== "all"
                ? `No notes under "${selectedTopic}" yet`
                : "No notes created for this course yet"}
          </h4>
          <p className="notes-empty-desc">
            Keep your study materials organized! Create a note for your Mid
            Exam, Final Exam, or chapter summaries to prepare effectively.
          </p>

          <div className="notes-quick-templates-row">
            <button
              type="button"
              className="btn-quick-template"
              onClick={() => handleStartNewNote("Mid", "mid")}
            >
              <span className="template-icon">🎯</span>
              <span>+ Create "Mid Exam" Note</span>
            </button>

            <button
              type="button"
              className="btn-quick-template"
              onClick={() => handleStartNewNote("Final", "final")}
            >
              <span className="template-icon">🏆</span>
              <span>+ Create "Final Exam" Note</span>
            </button>

            <button
              type="button"
              className="btn-quick-template"
              onClick={() => handleStartNewNote("Lecture", "lecture")}
            >
              <span className="template-icon">📖</span>
              <span>+ Create Lecture Note</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="notes-cards-grid">
          {filteredNotes.map((note) => {
            const isAnalyzed = !!note.analyzed_at;
            const isCurrentlyAnalyzing = analyzingId === note.id;
            const tags = Array.isArray(note.tags) ? note.tags : [];
            const primaryTag =
              tags[0] ||
              (note.title.toLowerCase().includes("mid")
                ? "Mid"
                : note.title.toLowerCase().includes("final")
                  ? "Final"
                  : "Note");

            return (
              <div
                key={note.id}
                className="note-card-item"
                onClick={() => openNoteForEdit(note, "preview")}
              >
                {/* Note Top Bar */}
                <div className="note-card-topbar">
                  <div className="note-tag-badge">
                    <span className="tag-icon">🏷️</span>
                    <span>{primaryTag}</span>
                  </div>
                  <span className="note-time-label">
                    {formatRelativeTime(note.updated_at || note.created_at)}
                  </span>
                </div>

                {/* Note Title & Content Excerpt */}
                <div className="note-card-content">
                  <h4 className="note-card-title">{note.title}</h4>
                  <p className="note-card-excerpt">
                    {note.content_text
                      ? note.content_text
                          .replace(/^#+\s+/gm, "")
                          .replace(/\*\*/g, "")
                          .slice(0, 130) +
                        (note.content_text.length > 130 ? "..." : "")
                      : "Empty note. Click to start writing..."}
                  </p>
                </div>

                {/* Tags row if multiple */}
                {tags.length > 1 && (
                  <div className="note-subtags-row">
                    {tags.slice(1, 4).map((tg, i) => (
                      <span key={i} className="subtag-chip">
                        #{tg}
                      </span>
                    ))}
                    {tags.length > 4 && (
                      <span className="subtag-more">+{tags.length - 4}</span>
                    )}
                  </div>
                )}

                {/* Note Card Footer */}
                <div
                  className="note-card-footer"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="note-stats-meta">
                    <span>
                      {note.word_count ||
                        (note.content_text
                          ? note.content_text.split(/\s+/).length
                          : 0)}{" "}
                      words
                    </span>
                    <span>•</span>
                    <span>{note.estimated_reading_time || 1} min read</span>
                  </div>

                  <div className="note-card-actions">
                    <button
                      type="button"
                      className="btn-note-edit"
                      onClick={(e) => {
                        e.stopPropagation();
                        openNoteForEdit(note, "edit");
                      }}
                      title="Edit Note"
                    >
                      <FileEdit size={13} />
                      <span>Edit</span>
                    </button>

                    {isAnalyzed ? (
                      <button
                        type="button"
                        className="btn-note-report"
                        onClick={() => onViewAnalysis && onViewAnalysis(note)}
                        title="View Study Analysis"
                      >
                        <FileText size={13} />
                        <span>Report</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn-note-analyze"
                        onClick={() => onAnalyze && onAnalyze(note.id)}
                        disabled={isCurrentlyAnalyzing}
                        title="Index and Analyze Note"
                      >
                        <BookOpen size={13} />
                        <span>
                          {isCurrentlyAnalyzing ? "Analyzing..." : "Analyze"}
                        </span>
                      </button>
                    )}

                    <button
                      type="button"
                      className="btn-note-delete"
                      onClick={(e) => handleDeleteNote(note, e)}
                      title="Delete Note"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ============================================================ */}
      {/* NOTEPAD EDITOR & VIEWER MODAL */}
      {/* ============================================================ */}
      {editorNote && (
        <div
          className="notepad-modal-overlay"
          onClick={(e) => {
            if (e.target !== e.currentTarget) return;
            if (
              saveStatus === "dirty" &&
              !window.confirm("You have unsaved changes. Close anyway?")
            ) {
              return;
            }
            setEditorNote(null);
          }}
        >
          <div
            className="notepad-modal-window"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Top Header */}
            <div className="notepad-modal-header">
              <div className="notepad-header-main">
                <div className="notepad-title-box">
                  <span className="notepad-header-icon">📓</span>
                  <input
                    type="text"
                    className="notepad-title-input"
                    value={editorNote.title}
                    onChange={(e) => {
                      setEditorNote((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }));
                      setSaveStatus("dirty");
                    }}
                    placeholder="Note Title (e.g. Mid Exam Notes, Final Revision)..."
                  />
                </div>

                <div className="notepad-header-tools">
                  {/* Mode switch */}
                  <div className="notepad-mode-tabs">
                    <button
                      type="button"
                      className={`notepad-tab-btn ${editorMode === "edit" ? "notepad-tab-active" : ""}`}
                      onClick={() => setEditorMode("edit")}
                    >
                      <FileEdit size={14} />
                      <span>Write</span>
                    </button>
                    <button
                      type="button"
                      className={`notepad-tab-btn ${editorMode === "preview" ? "notepad-tab-active" : ""}`}
                      onClick={() => setEditorMode("preview")}
                    >
                      <Eye size={14} />
                      <span>Preview</span>
                    </button>
                  </div>

                  {/* Save Status badge */}
                  <div className="notepad-save-indicator">
                    {saveStatus === "saving" && (
                      <span className="save-pill save-pill-saving">
                        <Spinner size="xs" />
                        <span>Saving...</span>
                      </span>
                    )}
                    {saveStatus === "saved" && (
                      <span className="save-pill save-pill-saved">
                        <Check size={12} />
                        <span>Saved</span>
                      </span>
                    )}
                    {saveStatus === "dirty" && (
                      <span className="save-pill save-pill-dirty">
                        <span>• Unsaved</span>
                      </span>
                    )}
                  </div>

                  {/* Close button */}
                  <button
                    type="button"
                    className="notepad-close-btn"
                    onClick={() => {
                      if (
                        saveStatus === "dirty" &&
                        !window.confirm(
                          "You have unsaved changes. Close anyway?",
                        )
                      ) {
                        return;
                      }
                      setEditorNote(null);
                    }}
                    title="Close Notepad"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Subheader: Topic Tags Selector */}
              <div className="notepad-tags-bar">
                <div className="notepad-tags-label">
                  <Tag size={13} />
                  <span>Topic Tags:</span>
                </div>

                <div className="notepad-tags-list">
                  {(editorNote.tags || []).map((t, i) => (
                    <span key={i} className="notepad-active-tag-chip">
                      <span>{t}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(t)}
                        title={`Remove tag ${t}`}
                      >
                        ✕
                      </button>
                    </span>
                  ))}

                  {/* Quick add suggestions */}
                  {["Mid", "Final", "Chapter 1", "Formulas"]
                    .filter((s) => !(editorNote.tags || []).includes(s))
                    .slice(0, 3)
                    .map((s) => (
                      <button
                        key={s}
                        type="button"
                        className="notepad-suggested-tag-btn"
                        onClick={() => handleAddTag(s)}
                      >
                        + {s}
                      </button>
                    ))}

                  {/* Custom tag input */}
                  <div className="notepad-add-tag-form">
                    <input
                      type="text"
                      className="notepad-tag-input"
                      placeholder="+ Custom tag..."
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddTag(tagInput);
                        }
                      }}
                    />
                    {tagInput.trim() && (
                      <button
                        type="button"
                        className="btn-add-tag-confirm"
                        onClick={() => handleAddTag(tagInput)}
                      >
                        Add
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Feedback alert if any */}
              {feedbackMsg.text && (
                <div
                  className={`notepad-feedback-banner ${
                    feedbackMsg.type === "error"
                      ? "notepad-feedback-error"
                      : "notepad-feedback-success"
                  }`}
                >
                  <span>{feedbackMsg.text}</span>
                  <button
                    type="button"
                    onClick={() => setFeedbackMsg({ type: "", text: "" })}
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            {/* Formatting Toolbar (shown when in Write/Edit mode) */}
            {editorMode === "edit" && (
              <div className="notepad-editor-toolbar">
                <div className="toolbar-group">
                  <button
                    type="button"
                    className="toolbar-btn"
                    onClick={() => insertFormat("**", "**")}
                    title="Bold"
                  >
                    <Bold size={14} />
                  </button>
                  <button
                    type="button"
                    className="toolbar-btn"
                    onClick={() => insertFormat("*", "*")}
                    title="Italic"
                  >
                    <Italic size={14} />
                  </button>
                  <button
                    type="button"
                    className="toolbar-btn"
                    onClick={() => insertFormat("\n# ", "")}
                    title="Heading 1"
                  >
                    <Heading1 size={14} />
                  </button>
                  <button
                    type="button"
                    className="toolbar-btn"
                    onClick={() => insertFormat("\n## ", "")}
                    title="Heading 2"
                  >
                    <Heading2 size={14} />
                  </button>
                  <button
                    type="button"
                    className="toolbar-btn"
                    onClick={() => insertFormat("\n### ", "")}
                    title="Heading 3"
                  >
                    <Heading3 size={14} />
                  </button>
                </div>

                <div className="toolbar-divider" />

                <div className="toolbar-group">
                  <button
                    type="button"
                    className="toolbar-btn"
                    onClick={() => insertFormat("\n- ", "")}
                    title="Bullet List"
                  >
                    <List size={14} />
                  </button>
                  <button
                    type="button"
                    className="toolbar-btn"
                    onClick={() => insertFormat("\n- [ ] ", "")}
                    title="Checklist Item"
                  >
                    <CheckSquare size={14} />
                  </button>
                  <button
                    type="button"
                    className="toolbar-btn"
                    onClick={() => insertFormat("\n> ", "")}
                    title="Blockquote"
                  >
                    <Quote size={14} />
                  </button>
                  <button
                    type="button"
                    className="toolbar-btn"
                    onClick={() => insertFormat("```\n", "\n```")}
                    title="Code Block"
                  >
                    <Code size={14} />
                  </button>
                </div>

                <div className="toolbar-divider" />

                {/* Templates Quick Insert */}
                <div className="toolbar-templates-group">
                  <span className="templates-label">⚡ Templates:</span>
                  <button
                    type="button"
                    className="toolbar-template-pill"
                    onClick={() => handleInsertTemplate("mid")}
                  >
                    Mid Prep
                  </button>
                  <button
                    type="button"
                    className="toolbar-template-pill"
                    onClick={() => handleInsertTemplate("final")}
                  >
                    Final Prep
                  </button>
                  <button
                    type="button"
                    className="toolbar-template-pill"
                    onClick={() => handleInsertTemplate("lecture")}
                  >
                    Lecture
                  </button>
                </div>
              </div>
            )}

            {/* Editor Body: Write vs Preview */}
            <div className="notepad-modal-body">
              {editorMode === "edit" ? (
                <div className="notepad-textarea-wrap">
                  <textarea
                    ref={textareaRef}
                    className="notepad-textarea"
                    value={editorNote.content_text || ""}
                    onChange={(e) => {
                      setEditorNote((prev) => ({
                        ...prev,
                        content_text: e.target.value,
                      }));
                      setSaveStatus("dirty");
                    }}
                    placeholder="Type your notes here in markdown... Use # for headings, - [ ] for checklists, **bold**, and `code` blocks."
                    spellCheck="false"
                  />
                </div>
              ) : (
                <div className="notepad-preview-wrap">
                  {editorNote.content_text ? (
                    <div className="notepad-preview-content">
                      {formatRichContent(editorNote.content_text)}
                    </div>
                  ) : (
                    <div className="notepad-preview-empty">
                      <p>
                        This note is empty. Switch to <strong>Write</strong>{" "}
                        mode to add content.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Bottom Bar */}
            <div className="notepad-modal-footer">
              <div className="notepad-footer-stats">
                <span className="footer-stat-pill">
                  <strong>{noteWords}</strong> words
                </span>
                <span className="footer-stat-pill">
                  <strong>{noteChars}</strong> characters
                </span>
                <span className="footer-stat-pill">
                  ~<strong>{readingTimeMin}</strong> min read
                </span>
              </div>

              <div className="notepad-footer-actions">
                <button
                  type="button"
                  className="btn-notepad-secondary"
                  onClick={handleCopyNote}
                  title="Copy full note markdown"
                >
                  {copied ? (
                    <Check size={14} className="text-emerald" />
                  ) : (
                    <Copy size={14} />
                  )}
                  <span>{copied ? "Copied!" : "Copy Note"}</span>
                </button>

                <button
                  type="button"
                  className="btn-notepad-secondary"
                  onClick={handleDownloadNote}
                  title="Export as Markdown (.md)"
                >
                  <Download size={14} />
                  <span>Download (.md)</span>
                </button>

                <Button
                  variant="primary"
                  onClick={handleSaveNote}
                  disabled={isSaving}
                  className="btn-notepad-save"
                >
                  {isSaving ? <Spinner size="xs" /> : <Save size={15} />}
                  <span>{isSaving ? "Saving..." : "Save Note"}</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
