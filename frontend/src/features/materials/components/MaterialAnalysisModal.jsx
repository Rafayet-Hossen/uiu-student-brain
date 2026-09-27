import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Download,
  FileDown,
  FileText,
  HelpCircle,
  RotateCcw,
  Sparkles,
  X,
} from "lucide-react";
import Button from "../../../components/Button";
import { downloadMaterialFile, exportMaterialAnalysisPDF } from "../api";

export default function MaterialAnalysisModal({
  isOpen,
  onClose,
  material,
  onReanalyze,
  analyzing,
}) {
  const navigate = useNavigate();
  const [localAnalyzing, setLocalAnalyzing] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [downloadingOriginal, setDownloadingOriginal] = useState(false);
  const [modalError, setModalError] = useState("");
  const [modalSuccess, setModalSuccess] = useState("");

  if (!isOpen || !material) return null;

  const isBusy = Boolean(analyzing || localAnalyzing);
  const isAnalyzed = Boolean(material.analyzed_at || material.ai_analysis?.summary);

  const handleExportPdf = async () => {
    try {
      setExportingPdf(true);
      setModalError("");
      await exportMaterialAnalysisPDF(material.id, material.title);
      setModalSuccess("AI Summary PDF Report downloaded successfully!");
    } catch (err) {
      setModalError(
        err?.response?.data?.detail ||
          err?.message ||
          "Failed to export analysis PDF report.",
      );
    } finally {
      setExportingPdf(false);
    }
  };

  const handleDownloadOriginalFile = async () => {
    try {
      setDownloadingOriginal(true);
      setModalError("");
      await downloadMaterialFile(material.id, material.title);
      setModalSuccess("Original file downloaded successfully!");
    } catch (err) {
      if (material.file_url) {
        window.open(material.file_url, "_blank");
      } else {
        setModalError(
          err?.response?.data?.detail ||
            err?.message ||
            "Failed to download original material file.",
        );
      }
    } finally {
      setDownloadingOriginal(false);
    }
  };

  const handleLocalReanalyze = async () => {
    try {
      setLocalAnalyzing(true);
      setModalError("");
      setModalSuccess("");
      await onReanalyze(material.id);
      setModalSuccess("AI analysis finished! Topics & concepts extracted.");
    } catch (err) {
      setModalError(
        err?.response?.data?.detail ||
          err?.message ||
          "Failed to run AI analysis. Please verify your connection.",
      );
    } finally {
      setLocalAnalyzing(false);
    }
  };

  const analysis = material.ai_analysis || {};
  const {
    title,
    summary,
    difficulty = "Intermediate",
    key_topics = [],
    key_formulas_or_definitions = [],
  } = analysis;

  const getDifficultyBadgeClass = (level) => {
    switch (level?.toLowerCase()) {
      case "beginner":
        return "badge-success";
      case "advanced":
        return "badge-purple";
      default:
        return "badge-warning";
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return "Recently";
    try {
      return new Date(isoString).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Recently";
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content-card modal-analysis-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header-row">
          <div className="modal-header-info">
            <div className="modal-tag-row">
              <span className="badge badge-accent">
                {isAnalyzed ? "AI Study Analysis Report" : "Material Details"}
              </span>
              {isAnalyzed && (
                <span className={`badge ${getDifficultyBadgeClass(difficulty)}`}>
                  {difficulty} Level
                </span>
              )}
              {material.analyzed_at && (
                <span className="analysis-timestamp">
                  Analyzed on {formatDate(material.analyzed_at)}
                </span>
              )}
            </div>
            <h3 className="modal-title">{title || material.title}</h3>
            <p className="modal-subtitle">
              Course:{" "}
              <span className="font-semibold">
                {material.subject || material.course?.title || "Academic Coursework"}
              </span>
              {material.formatted_file_size && (
                <span> • {material.formatted_file_size}</span>
              )}
            </p>
          </div>
          <div className="modal-header-actions">
            <button
              type="button"
              className="modal-close-btn"
              onClick={onClose}
              aria-label="Close modal"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="modal-body-content analysis-body-scroll">
          {modalError && (
            <div className="analysis-alert-banner alert-error mb-4">
              <AlertCircle size={18} className="shrink-0" />
              <span>{modalError}</span>
            </div>
          )}

          {modalSuccess && (
            <div className="analysis-alert-banner alert-success mb-4">
              <CheckCircle2 size={18} className="shrink-0" />
              <span>{modalSuccess}</span>
            </div>
          )}

          {!isAnalyzed && (
            <div
              style={{
                background: "linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(16, 185, 129, 0.08))",
                border: "1px dashed var(--color-primary)",
                borderRadius: "var(--radius-xl)",
                padding: "20px",
                marginBottom: "20px",
                textAlign: "center",
              }}
            >
              <div style={{ display: "inline-flex", padding: "10px", borderRadius: "50%", background: "var(--color-primary-subtle)", color: "var(--color-primary)", marginBottom: "10px" }}>
                <Sparkles size={24} />
              </div>
              <h4 style={{ margin: "0 0 6px 0", fontSize: "1.05rem" }}>Ready for Gemini AI Analysis</h4>
              <p style={{ margin: "0 0 14px 0", fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                Extract core curriculum topics, generate an executive summary, and detect key formulas or definitions from this material.
              </p>
              <Button
                type="button"
                variant="primary"
                icon={Sparkles}
                onClick={handleLocalReanalyze}
                loading={isBusy}
                disabled={isBusy}
              >
                {isBusy ? "Analyzing Material with AI..." : "⚡ Analyze with AI Now"}
              </Button>
            </div>
          )}

          {/* Executive Summary */}
          <section className="analysis-section">
            <h4 className="analysis-section-title">
              <span className="section-title-icon">📖</span>
              Executive Academic Summary
            </h4>
            <div className="analysis-summary-box">
              <p className="analysis-summary-text">
                {summary ||
                  material.summary ||
                  material.content_text ||
                  "This material is ready for synthesis. Click 'Analyze with AI' to generate a full executive summary."}
              </p>
            </div>
          </section>

          {/* Extracted Key Topics */}
          {(key_topics.length > 0 || (material.key_topics && material.key_topics.length > 0)) && (
            <section className="analysis-section">
              <h4 className="analysis-section-title">
                <span className="section-title-icon">🎯</span>
                Extracted Core Topics & Concepts ({(key_topics.length || material.key_topics?.length || 0)})
              </h4>
              <div className="topics-chip-grid">
                {(key_topics.length > 0 ? key_topics : material.key_topics || []).map((topic, idx) => (
                  <div key={idx} className="topic-badge-card">
                    <span className="topic-bullet">◈</span>
                    <span className="topic-text">{topic}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Key Formulas & Principles */}
          {key_formulas_or_definitions &&
            key_formulas_or_definitions.length > 0 && (
              <section className="analysis-section">
                <h4 className="analysis-section-title">
                  <span className="section-title-icon">📐</span>
                  Key Formulas & Critical Definitions
                </h4>
                <div className="formulas-container">
                  {key_formulas_or_definitions.map((item, idx) => (
                    <div key={idx} className="formula-item-row">
                      <span className="formula-icon">⚡</span>
                      <code className="formula-code-text">{item}</code>
                    </div>
                  ))}
                </div>
              </section>
            )}

          {/* Diagnostic Quiz Assessment CTA Banner */}
          <div className="analysis-quiz-cta-banner active-quiz-cta">
            <div className="cta-banner-text">
              <div className="cta-header-pill">
                <span className="badge badge-accent">
                  🎯 Concept Assessment
                </span>
                <span className="cta-sparkle-pill">Practice Quiz</span>
              </div>
              <h5>Test Your Concept Comprehension</h5>
              <p>
                Take an interactive practice quiz based on the key concepts
                extracted from this material.
              </p>
            </div>
            <Button
              type="button"
              variant="primary"
              icon={HelpCircle}
              className="quiz-launch-btn"
              onClick={() => {
                onClose();
                navigate(`/quiz/${material.id}`);
              }}
            >
              Start Practice Quiz →
            </Button>
          </div>
        </div>

        <div className="modal-footer-row material-modal-footer">
          <div className="material-modal-footer-actions">
            <Button
              type="button"
              variant="outline"
              onClick={handleLocalReanalyze}
              loading={isBusy}
              disabled={isBusy || exportingPdf || downloadingOriginal}
              icon={RotateCcw}
              className="mat-footer-btn"
            >
              {isBusy ? "Analyzing..." : isAnalyzed ? "Re-run AI Analysis" : "Analyze with AI"}
            </Button>

            {/* Download 1: AI Generated Summary PDF */}
            <Button
              type="button"
              variant="secondary"
              icon={FileDown}
              onClick={handleExportPdf}
              loading={exportingPdf}
              disabled={isBusy || exportingPdf}
              title="Download AI-generated summary as publication-grade PDF"
              className="mat-footer-btn"
            >
              {exportingPdf ? "Generating PDF..." : "AI Summary PDF"}
            </Button>

            {/* Download 2: Original Uploaded File */}
            <Button
              type="button"
              variant="secondary"
              icon={Download}
              onClick={handleDownloadOriginalFile}
              loading={downloadingOriginal}
              disabled={isBusy || downloadingOriginal}
              title="Download original file uploaded by student"
              className="mat-footer-btn"
            >
              {downloadingOriginal ? "Downloading..." : "Original File"}
            </Button>
          </div>

          <Button
            type="button"
            variant="primary"
            onClick={onClose}
            disabled={isBusy || exportingPdf}
            className="mat-footer-close-btn"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
