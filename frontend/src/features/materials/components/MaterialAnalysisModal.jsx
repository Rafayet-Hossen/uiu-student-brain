import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileDown,
  HelpCircle,
  X,
} from "lucide-react";
import Button from "../../../components/Button";
import { exportMaterialAnalysisPDF } from "../api";

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
  const [modalError, setModalError] = useState("");
  const [modalSuccess, setModalSuccess] = useState("");

  if (!isOpen || !material) return null;

  const isBusy = Boolean(analyzing || localAnalyzing);

  const handleExportPdf = async () => {
    try {
      setExportingPdf(true);
      setModalError("");
      await exportMaterialAnalysisPDF(material.id, material.title);
      setModalSuccess("Publication-grade PDF Report downloaded successfully!");
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

  const handleLocalReanalyze = async () => {
    try {
      setLocalAnalyzing(true);
      setModalError("");
      setModalSuccess("");
      await onReanalyze(material.id);
      setModalSuccess("AI re-analysis finished! Topics & concepts refreshed.");
    } catch (err) {
      setModalError(
        err?.response?.data?.detail ||
          err?.message ||
          "Failed to re-run AI analysis. Please verify your connection.",
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
              <span className="badge badge-accent">Study Analysis Report</span>
              <span className={`badge ${getDifficultyBadgeClass(difficulty)}`}>
                {difficulty} Level
              </span>
              <span className="analysis-timestamp">
                Analyzed on {formatDate(material.analyzed_at)}
              </span>
            </div>
            <h3 className="modal-title">{title || material.title}</h3>
            <p className="modal-subtitle">
              Source Material:{" "}
              <span className="font-semibold">{material.title}</span>
            </p>
          </div>
          <div
            className="modal-header-actions"
            style={{ display: "flex", alignItems: "center", gap: "8px" }}
          >
            <button
              type="button"
              className="modal-pdf-download-btn"
              onClick={handleExportPdf}
              disabled={exportingPdf}
              title="Download Publication-Grade PDF Report with Student Brain branding"
            >
              <Download size={13} />
              <span>{exportingPdf ? "Exporting PDF..." : "Download PDF"}</span>
            </button>
            <button
              type="button"
              className="modal-close-btn"
              onClick={onClose}
              aria-label="Close modal"
            >
              ✕
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

          {/* Executive Summary */}
          <section className="analysis-section">
            <h4 className="analysis-section-title">
              <span className="section-title-icon">📖</span>
              Executive Academic Summary
            </h4>
            <div className="analysis-summary-box">
              <p className="analysis-summary-text">
                {summary || "No summary available for this material."}
              </p>
            </div>
          </section>

          {/* Extracted Key Topics */}
          <section className="analysis-section">
            <h4 className="analysis-section-title">
              <span className="section-title-icon">🎯</span>
              Extracted Core Topics & Concepts ({key_topics.length})
            </h4>
            {key_topics.length > 0 ? (
              <div className="topics-chip-grid">
                {key_topics.map((topic, idx) => (
                  <div key={idx} className="topic-badge-card">
                    <span className="topic-bullet">◈</span>
                    <span className="topic-text">{topic}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted text-sm">
                No specific topics extracted.
              </p>
            )}
          </section>

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

        <div className="modal-footer-row">
          <Button
            type="button"
            variant="outline"
            onClick={handleLocalReanalyze}
            loading={isBusy}
            disabled={isBusy || exportingPdf}
          >
            {isBusy ? "Analyzing Material..." : "🔄 Re-run AI Analysis"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            icon={Download}
            onClick={handleExportPdf}
            loading={exportingPdf}
            disabled={isBusy || exportingPdf}
          >
            {exportingPdf
              ? "Generating PDF..."
              : "Download Academic PDF Report"}
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={onClose}
            disabled={isBusy || exportingPdf}
          >
            Close Report
          </Button>
        </div>
      </div>
    </div>
  );
}
