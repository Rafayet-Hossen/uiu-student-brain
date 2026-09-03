import Button from "../../../components/Button";

export default function MaterialAnalysisModal({
  isOpen,
  onClose,
  material,
  onReanalyze,
  analyzing,
}) {
  if (!isOpen || !material) return null;

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
              <span className="badge badge-accent">✨ AI Analysis Report</span>
              <span className={`badge ${getDifficultyBadgeClass(difficulty)}`}>
                {difficulty} Level
              </span>
              <span className="analysis-timestamp">
                Analyzed on {formatDate(material.analyzed_at)}
              </span>
            </div>
            <h3 className="modal-title">{title || material.title}</h3>
            <p className="modal-subtitle">
              Source Material: <span className="font-semibold">{material.title}</span>
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

        <div className="modal-body-content analysis-body-scroll">
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
              <p className="text-muted text-sm">No specific topics extracted.</p>
            )}
          </section>

          {/* Key Formulas & Principles */}
          {key_formulas_or_definitions && key_formulas_or_definitions.length > 0 && (
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

          {/* Study Recommendations CTA */}
          <div className="analysis-quiz-cta-banner">
            <div className="cta-banner-text">
              <h5>Ready to test your comprehension?</h5>
              <p>Generate an AI diagnostic assessment quiz directly from these extracted topics.</p>
            </div>
            <span className="badge badge-accent">Feature #8 Available Next</span>
          </div>
        </div>

        <div className="modal-footer-row">
          <Button
            type="button"
            variant="outline"
            onClick={() => onReanalyze(material.id)}
            loading={analyzing}
          >
            🔄 Re-run AI Analysis
          </Button>
          <Button type="button" variant="primary" onClick={onClose}>
            Close Report
          </Button>
        </div>
      </div>
    </div>
  );
}
