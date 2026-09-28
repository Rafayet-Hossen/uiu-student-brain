import { useEffect, useState } from "react";
import {
  AlertCircle,
  BookOpen,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  FileCode,
  FileDown,
  FileEdit,
  FileText,
  HelpCircle,
  Image as ImageIcon,
  Layers,
  Lightbulb,
  Maximize2,
  Minimize2,
  Moon,
  Presentation,
  RotateCcw,
  Search,
  Sparkles,
  Sun,
  Table,
  Tag,
  Zap,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Badge from "../../../components/Badge";
import Button from "../../../components/Button";
import Card from "../../../components/Card";
import Spinner from "../../../components/Spinner";
import { formatRichContent } from "../../../lib/markdownHelper";
import { analyzeMaterial } from "../api";
import MaterialNotepad from "./MaterialNotepad";

function getAbsoluteFileUrl(fileField) {
  if (!fileField) return null;
  if (fileField.startsWith("http://") || fileField.startsWith("https://")) {
    return fileField;
  }
  const baseUrl = "http://127.0.0.1:8000";
  return fileField.startsWith("/")
    ? `${baseUrl}${fileField}`
    : `${baseUrl}/${fileField}`;
}

function detectFileType(fileUrl, fileName) {
  const target = (fileUrl || fileName || "").toLowerCase().split("?")[0];
  if (target.endsWith(".pdf")) return "pdf";
  if (target.endsWith(".docx") || target.endsWith(".doc")) return "docx";
  if (target.endsWith(".pptx") || target.endsWith(".ppt")) return "pptx";
  if (
    target.endsWith(".xlsx") ||
    target.endsWith(".xls") ||
    target.endsWith(".csv")
  )
    return "xlsx";
  if (
    target.endsWith(".jpg") ||
    target.endsWith(".jpeg") ||
    target.endsWith(".png") ||
    target.endsWith(".webp") ||
    target.endsWith(".gif") ||
    target.endsWith(".bmp") ||
    target.endsWith(".avif") ||
    target.endsWith(".svg")
  ) {
    return "image";
  }
  return "text";
}

export default function MaterialDetailModal({ material, onClose, onUpdated }) {
  const [currentMaterial, setCurrentMaterial] = useState(material);
  const [analyzing, setAnalyzing] = useState(false);

  const fileUrl = getAbsoluteFileUrl(currentMaterial?.file);
  const fileType = detectFileType(fileUrl, currentMaterial?.title);

  // If a file is uploaded, default to "file_viewer", else default to "extracted_notes"
  const [activeTab, setActiveTab] = useState(
    fileUrl ? "file_viewer" : "extracted_notes",
  );

  // Blob URL for embedding PDF without X-Frame-Options block
  const [blobUrl, setBlobUrl] = useState(null);
  const [blobLoading, setBlobLoading] = useState(false);

  // In-App Extracted Text Reader controls
  const [zoomLevel, setZoomLevel] = useState(100);
  const [readingDarkMode, setReadingDarkMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [docSearchQuery, setDocSearchQuery] = useState("");
  const [revealedQuestions, setRevealedQuestions] = useState({});
  const [copiedIndex, setCopiedIndex] = useState(null);

  // 1. Lock body scrolling on mount and restore on unmount
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // 2. Keyboard shortcut listener (ESC to close or exit fullscreen)
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(console.warn);
        } else {
          onClose();
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // 3. HTML5 Fullscreen API synchronization
  useEffect(() => {
    function onFullscreenChange() {
      setIsFullscreen(Boolean(document.fullscreenElement));
    }
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  function handleToggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.warn("Fullscreen request error:", err);
        setIsFullscreen(true);
      });
    } else {
      document.exitFullscreen().catch((err) => {
        console.warn("Exit fullscreen error:", err);
        setIsFullscreen(false);
      });
    }
  }

  // 4. Fetch file as blob to bypass X-Frame-Options DENY on cross-port localhost
  useEffect(() => {
    if (!fileUrl) return;

    let active = true;
    let createdBlobUrl = null;

    async function loadFileBlob() {
      setBlobLoading(true);
      try {
        const token =
          localStorage.getItem("token") || localStorage.getItem("access_token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const response = await fetch(fileUrl, { headers });

        if (!response.ok) {
          throw new Error(`HTTP status ${response.status}`);
        }

        const blob = await response.blob();
        if (active) {
          createdBlobUrl = URL.createObjectURL(blob);
          setBlobUrl(createdBlobUrl);
        }
      } catch (err) {
        console.warn("Could not load as blob, using direct URL", err);
        if (active) {
          setBlobUrl(fileUrl);
        }
      } finally {
        if (active) setBlobLoading(false);
      }
    }

    loadFileBlob();

    return () => {
      active = false;
      if (createdBlobUrl) {
        URL.revokeObjectURL(createdBlobUrl);
      }
    };
  }, [fileUrl]);

  if (!currentMaterial) return null;

  async function handleReanalyze() {
    setAnalyzing(true);
    try {
      const updated = await analyzeMaterial(currentMaterial.id);
      setCurrentMaterial(updated);
      if (onUpdated) onUpdated(updated);
    } catch (err) {
      console.error("Failed to re-analyze material", err);
    } finally {
      setAnalyzing(false);
    }
  }

  function handleToggleRevealQuestion(idx) {
    setRevealedQuestions((prev) => ({ ...prev, [idx]: !prev[idx] }));
  }

  function handleCopySnippet(text, idx) {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  }

  function handleDownloadRawText() {
    const textToDownload =
      currentMaterial.content ||
      currentMaterial.raw_text ||
      currentMaterial.summary;
    const element = document.createElement("a");
    const file = new Blob([textToDownload], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `${currentMaterial.title || "study_material"}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }

  const rawContent =
    currentMaterial.content ||
    currentMaterial.raw_text ||
    currentMaterial.summary ||
    "No text content available.";

  const getDifficultyPercent = (level) => {
    if (level === "Beginner") return 35;
    if (level === "Advanced") return 90;
    return 65; // Intermediate
  };

  return (
    <div className="native-fullscreen-reader-overlay">
      {/* ============================================================
          1. FIXED TOP HEADER (48px)
          ============================================================ */}
      <header className="native-reader-header">
        <div className="native-header-left">
          <div className="native-doc-icon">
            {fileType === "pdf" ? (
              <FileText size={17} className="text-rose" />
            ) : fileType === "pptx" ? (
              <Presentation size={17} className="text-amber" />
            ) : (
              <BookOpen size={17} className="text-primary" />
            )}
          </div>

          <div className="native-title-group">
            <h2 className="native-doc-title" title={currentMaterial.title}>
              {currentMaterial.title}
            </h2>
            <div className="native-meta-pill-line">
              <span className="native-subject-tag">
                {currentMaterial.subject}
              </span>
              <span className="native-meta-sep">•</span>
              <span className="native-meta-dim">
                {currentMaterial.category}
              </span>
              <span className="native-meta-sep">•</span>
              <span className="native-meta-dim">
                {currentMaterial.estimated_reading_time}m read
              </span>
              <span className="native-meta-sep">•</span>
              <span className="native-meta-dim">
                {currentMaterial.word_count} words
              </span>
            </div>
          </div>
        </div>

        <div className="native-header-right">
          <Button
            size="sm"
            variant="secondary"
            onClick={handleReanalyze}
            disabled={analyzing}
            icon={RotateCcw}
            className="native-reanalyze-btn"
          >
            {analyzing ? "Analyzing..." : "Re-analyze"}
          </Button>

          {fileUrl && (
            <a
              href={fileUrl}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="native-icon-btn"
              title="Download File"
            >
              <Download size={15} />
            </a>
          )}

          {fileUrl && (
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="native-icon-btn desktop-only"
              title="Open in Dedicated Tab"
            >
              <ExternalLink size={15} />
            </a>
          )}

          <button
            type="button"
            className="native-icon-btn"
            onClick={handleToggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Reader"}
          >
            {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>

          <button
            type="button"
            className="native-icon-btn btn-close-reader"
            onClick={onClose}
            aria-label="Close"
            title="Close Reader (Esc)"
          >
            ✕
          </button>
        </div>
      </header>

      {/* ============================================================
          2. FIXED STICKY NAVIGATION TABS (34px)
          ============================================================ */}
      <nav className="native-reader-tabs-bar">
        <div className="native-tabs-pills">
          {fileUrl && (
            <button
              type="button"
              className={`native-tab-pill ${
                activeTab === "file_viewer" ? "tab-pill-active" : ""
              }`}
              onClick={() => setActiveTab("file_viewer")}
            >
              {fileType === "image" ? <ImageIcon size={13} /> : <FileText size={13} />}
              <span>
                {fileType === "image"
                  ? "Image Viewer"
                  : fileType === "pdf"
                    ? "PDF Viewer"
                    : "File / Document"}
              </span>
            </button>
          )}

          <button
            type="button"
            className={`native-tab-pill ${
              activeTab === "my_notepad" ? "tab-pill-active" : ""
            }`}
            onClick={() => setActiveTab("my_notepad")}
          >
            <FileEdit size={13} />
            <span>Notepad 📝</span>
          </button>

          <button
            type="button"
            className={`native-tab-pill ${
              activeTab === "extracted_notes" ? "tab-pill-active" : ""
            }`}
            onClick={() => setActiveTab("extracted_notes")}
          >
            <BookOpen size={13} />
            <span>Extracted Content</span>
          </button>

          <button
            type="button"
            className={`native-tab-pill ${
              activeTab === "insights" ? "tab-pill-active" : ""
            }`}
            onClick={() => setActiveTab("insights")}
          >
            <FileText size={13} />
            <span>Summary</span>
          </button>

          <button
            type="button"
            className={`native-tab-pill ${
              activeTab === "concepts" ? "tab-pill-active" : ""
            }`}
            onClick={() => setActiveTab("concepts")}
          >
            <Lightbulb size={13} />
            <span>Key Terms ({currentMaterial.key_concepts?.length || 0})</span>
          </button>

          <button
            type="button"
            className={`native-tab-pill ${
              activeTab === "questions" ? "tab-pill-active" : ""
            }`}
            onClick={() => setActiveTab("questions")}
          >
            <HelpCircle size={13} />
            <span>Quiz ({currentMaterial.key_questions?.length || 0})</span>
          </button>

          <button
            type="button"
            className={`native-tab-pill ${
              activeTab === "topics" ? "tab-pill-active" : ""
            }`}
            onClick={() => setActiveTab("topics")}
          >
            <Tag size={13} />
            <span>Topics ({currentMaterial.key_topics?.length || 0})</span>
          </button>
        </div>
      </nav>

      {/* ============================================================
          3. MAIN FULLSCREEN VIEWPORT (100% WIDTH, 100% HEIGHT)
          ============================================================ */}
      <main className="native-reader-main-viewport">
        {/* PDF / File Viewer */}
        {activeTab === "file_viewer" && fileUrl && (
          <div className="native-pdf-canvas-container">
            {blobLoading ? (
              <div className="native-pdf-loading">
                <Spinner size="md" standalone />
                <span>Loading PDF document...</span>
              </div>
            ) : fileType === "pdf" ? (
              <iframe
                src={`${blobUrl || fileUrl}#toolbar=1&navpanes=1&scrollbar=1&view=FitH,100`}
                className="native-pdf-iframe-full"
                title="PDF Document"
              />
            ) : fileType === "image" ? (
              <div className="native-image-canvas">
                <img
                  src={blobUrl || fileUrl}
                  alt={currentMaterial.title}
                  className="native-image-elem"
                />
              </div>
            ) : (
              <div className="native-office-canvas">
                <div className="native-office-card">
                  <div className="office-icon-wrap">
                    {fileType === "pptx" ? (
                      <Presentation size={36} className="text-amber" />
                    ) : (
                      <FileText size={36} className="text-primary" />
                    )}
                  </div>
                  <h3 className="office-doc-title">{currentMaterial.title}</h3>
                  <p className="office-doc-sub">
                    This is a <strong>.{fileType.toUpperCase()}</strong> file.
                    You can download and open it in Microsoft Office /
                    PowerPoint or read the extracted notes.
                  </p>
                  <div className="office-doc-actions-row">
                    <a
                      href={fileUrl}
                      download
                      className="office-primary-download-btn"
                    >
                      <Download size={16} />
                      <span>
                        Download & Open in{" "}
                        {fileType === "pptx"
                          ? "PowerPoint"
                          : fileType === "xlsx"
                            ? "Excel / Spreadsheet"
                            : "Word / Editor"}
                      </span>
                    </a>
                    <button
                      type="button"
                      onClick={() => setActiveTab("extracted_notes")}
                      className="office-secondary-read-btn"
                    >
                      <BookOpen size={16} />
                      <span>Read Extracted Notes</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Real Interactive Study Notepad */}
        {activeTab === "my_notepad" && (
          <MaterialNotepad material={currentMaterial} />
        )}

        {/* Extracted Notes */}
        {activeTab === "extracted_notes" && (
          <div className="native-notes-canvas">
            <div className="doc-reading-toolbar">
              <div className="reading-toolbar-left">
                <div className="doc-search-box">
                  <Search size={14} className="text-muted" />
                  <input
                    type="text"
                    placeholder="Search in notes..."
                    value={docSearchQuery}
                    onChange={(e) => setDocSearchQuery(e.target.value)}
                    className="doc-search-input"
                  />
                </div>
              </div>

              <div className="reading-toolbar-right">
                <div className="zoom-controls-group">
                  <button
                    type="button"
                    className="toolbar-btn"
                    onClick={() => setZoomLevel((z) => Math.max(75, z - 15))}
                    title="Zoom Out"
                  >
                    <ZoomOut size={14} />
                  </button>
                  <span className="zoom-level-text">{zoomLevel}%</span>
                  <button
                    type="button"
                    className="toolbar-btn"
                    onClick={() => setZoomLevel((z) => Math.min(160, z + 15))}
                    title="Zoom In"
                  >
                    <ZoomIn size={14} />
                  </button>
                </div>

                <button
                  type="button"
                  className={`toolbar-btn ${readingDarkMode ? "btn-active" : ""}`}
                  onClick={() => setReadingDarkMode(!readingDarkMode)}
                  title="Toggle Paper Dark Mode"
                >
                  {readingDarkMode ? <Sun size={15} /> : <Moon size={15} />}
                </button>

                <button
                  type="button"
                  className="toolbar-btn"
                  onClick={handleDownloadRawText}
                  title="Download Text"
                >
                  <Download size={15} />
                </button>
              </div>
            </div>

            <div
              className={`doc-viewport ${
                readingDarkMode ? "paper-dark-mode" : "paper-light-mode"
              }`}
            >
              <div
                className="doc-paper-sheet"
                style={{
                  transform: `scale(${zoomLevel / 100})`,
                  transformOrigin: "top center",
                }}
              >
                <div className="paper-header">
                  <span className="paper-title-tag">
                    {currentMaterial.title}
                  </span>
                  <span className="paper-page-indicator">
                    {currentMaterial.subject} • {currentMaterial.category}
                  </span>
                </div>

                <div className="paper-content-stream">
                  {formatRichContent(rawContent)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AI Summary */}
        {activeTab === "insights" && (
          <div className="native-scrollable-content-tab">
            <div className="ai-summary-note-card">
              <div className="summary-card-header">
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <FileText size={18} className="text-primary" />
                  <strong className="summary-heading">
                    Executive Syllabus Summary
                  </strong>
                </div>
                <button
                  type="button"
                  className="copy-snippet-btn"
                  onClick={() =>
                    handleCopySnippet(currentMaterial.summary, "summary")
                  }
                >
                  {copiedIndex === "summary" ? (
                    <Check size={14} className="text-emerald" />
                  ) : (
                    <Copy size={14} />
                  )}
                  <span>
                    {copiedIndex === "summary" ? "Copied" : "Copy Notes"}
                  </span>
                </button>
              </div>
              <div className="summary-body-text">
                {formatRichContent(
                  currentMaterial.summary || "Generating summary insights...",
                )}
              </div>
            </div>

            <div className="ai-metrics-cards-grid">
              <Card className="ai-metric-panel">
                <div className="metric-panel-header">
                  <span className="panel-label">Academic Difficulty</span>
                  <Badge
                    variant={
                      currentMaterial.difficulty_level === "Advanced"
                        ? "danger"
                        : currentMaterial.difficulty_level === "Beginner"
                          ? "success"
                          : "accent"
                    }
                  >
                    {currentMaterial.difficulty_level || "Intermediate"}
                  </Badge>
                </div>
                <div className="difficulty-gauge-bar">
                  <div
                    className="difficulty-gauge-fill"
                    style={{
                      width: `${getDifficultyPercent(
                        currentMaterial.difficulty_level,
                      )}%`,
                    }}
                  />
                </div>
                <span className="panel-subtext">
                  Estimated prerequisite complexity for university coursework.
                </span>
              </Card>

              <Card className="ai-metric-panel">
                <div className="metric-panel-header">
                  <span className="panel-label">Reading Investment</span>
                  <Clock size={16} className="text-indigo" />
                </div>
                <strong className="panel-large-number">
                  {currentMaterial.estimated_reading_time} min
                </strong>
                <span className="panel-subtext">
                  Standard academic reading speed (~200 words/min).
                </span>
              </Card>

              <Card className="ai-metric-panel">
                <div className="metric-panel-header">
                  <span className="panel-label">Document Volume</span>
                  <FileText size={16} className="text-amber" />
                </div>
                <strong className="panel-large-number">
                  {currentMaterial.word_count} words
                </strong>
                <span className="panel-subtext">
                  Total parsed text volume across lecture notes & slides.
                </span>
              </Card>
            </div>
          </div>
        )}

        {/* Key Terms */}
        {activeTab === "concepts" && (
          <div className="native-scrollable-content-tab">
            {currentMaterial.key_concepts &&
            currentMaterial.key_concepts.length > 0 ? (
              <div className="concepts-card-grid">
                {currentMaterial.key_concepts.map((concept, idx) => (
                  <Card key={idx} className="concept-definition-card">
                    <div className="concept-card-top">
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <div className="concept-bullet-badge">{idx + 1}</div>
                        <strong className="concept-term-title">
                          {concept.term}
                        </strong>
                      </div>
                      <button
                        type="button"
                        className="copy-mini-btn"
                        onClick={() =>
                          handleCopySnippet(
                            `${concept.term}: ${concept.definition}`,
                            idx,
                          )
                        }
                        title="Copy Concept"
                      >
                        {copiedIndex === idx ? (
                          <Check size={13} className="text-emerald" />
                        ) : (
                          <Copy size={13} />
                        )}
                      </button>
                    </div>
                    <p className="concept-def-text">{concept.definition}</p>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="concepts-empty-box">
                <Lightbulb size={24} className="text-amber" />
                <span>
                  No key concepts extracted yet. Click Re-analyze AI to
                  generate!
                </span>
              </div>
            )}
          </div>
        )}

        {/* Practice Quiz */}
        {activeTab === "questions" && (
          <div className="native-scrollable-content-tab">
            {currentMaterial.key_questions &&
            currentMaterial.key_questions.length > 0 ? (
              <div className="quiz-questions-list">
                {currentMaterial.key_questions.map((q, idx) => {
                  const isRevealed = revealedQuestions[idx];
                  return (
                    <Card key={idx} className="quiz-question-card">
                      <div className="quiz-q-header">
                        <span className="quiz-q-pill">Question {idx + 1}</span>
                        <button
                          type="button"
                          className={`reveal-answer-btn ${
                            isRevealed ? "btn-revealed" : ""
                          }`}
                          onClick={() => handleToggleRevealQuestion(idx)}
                        >
                          {isRevealed ? (
                            <EyeOff size={14} />
                          ) : (
                            <Eye size={14} />
                          )}
                          <span>
                            {isRevealed ? "Hide Answer" : "Reveal Answer"}
                          </span>
                        </button>
                      </div>

                      <h4 className="quiz-q-text">{q.question}</h4>

                      <AnimatePresence>
                        {isRevealed && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="quiz-answer-drawer"
                          >
                            <div className="answer-box">
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "6px",
                                  marginBottom: "6px",
                                }}
                              >
                                <CheckCircle2
                                  size={16}
                                  className="text-emerald"
                                />
                                <strong className="answer-heading">
                                  Expected Academic Answer:
                                </strong>
                              </div>
                              <p className="answer-body-text">{q.answer}</p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="concepts-empty-box">
                <HelpCircle size={24} className="text-primary" />
                <span>
                  No practice questions generated yet. Click Re-analyze AI to
                  build a quiz!
                </span>
              </div>
            )}
          </div>
        )}

        {/* Syllabus Topics */}
        {activeTab === "topics" && (
          <div className="native-scrollable-content-tab">
            {currentMaterial.key_topics &&
            currentMaterial.key_topics.length > 0 ? (
              <div className="topics-cloud-card">
                <h4 className="topics-cloud-title">
                  Identified Syllabus Concepts & Keywords
                </h4>
                <div className="topics-cloud-grid">
                  {currentMaterial.key_topics.map((topic, idx) => (
                    <div key={idx} className="topic-cloud-pill">
                      <Tag size={12} className="text-indigo" />
                      <span>#{topic}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="concepts-empty-box">
                <Tag size={24} className="text-indigo" />
                <span>No syllabus topics extracted yet.</span>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
