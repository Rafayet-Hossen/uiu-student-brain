import { useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  Award,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileText,
  HelpCircle,
  Lightbulb,
  RotateCcw,
  Sparkles,
  X,
  XCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import Button from "../../../components/Button";

export default function QuizDiagnosticModal({
  session,
  isOpen,
  onClose,
  onRetakeQuiz,
}) {
  const [expandedQuestionIdx, setExpandedQuestionIdx] = useState(null);

  if (!isOpen || !session) return null;

  const results = session.quiz_results || {};
  const score = session.quiz_score ?? results.correct_count ?? 0;
  const total = results.total_questions || 5;
  const accuracy = session.quiz_accuracy ?? results.accuracy ?? 0;
  const weakTopics = results.weak_topics || [];
  const masteredTopics = results.mastered_topics || [];
  const recommendations = results.recommendations || [];
  const questions = results.questions || [];

  const toggleExpand = (idx) => {
    setExpandedQuestionIdx((curr) => (curr === idx ? null : idx));
  };

  const getTier = () => {
    if (accuracy >= 80) {
      return {
        label: "Mastery Achieved",
        icon: "🏆",
        colorClass: "tier-mastery",
        summary:
          "Excellent conceptual grasp! You demonstrated high proficiency on this material.",
      };
    }
    if (accuracy >= 60) {
      return {
        label: "Proficient Pace",
        icon: "⚡",
        colorClass: "tier-proficient",
        summary:
          "Good understanding of core principles, with a few sub-topics that require review.",
      };
    }
    return {
      label: "Needs Revision",
      icon: "⚠️",
      colorClass: "tier-needs-work",
      summary:
        "Identified several knowledge gaps. Review the weak topics below before exam day.",
    };
  };

  const tier = getTier();

  return (
    <div
      className="tracker-session-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        className="tracker-session-modal-dialog diagnostic-report-dialog"
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "680px", width: "95vw" }}
      >
        {/* Pinned Header */}
        <div className="tracker-modal-header diagnostic-report-header">
          <div className="tracker-modal-title-box">
            <span className="tracker-modal-icon">📊</span>
            <div>
              <h3 className="tracker-modal-heading">
                AI Diagnostic Assessment Report
              </h3>
              <p className="tracker-modal-subheading">
                Topic: <strong>{session.subject}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            className="tracker-modal-close-btn"
            onClick={onClose}
            title="Close report"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Report Body */}
        <div className="diagnostic-report-scroll-body">
          {/* Top Score Banner */}
          <div className={`diagnostic-score-hero ${tier.colorClass}`}>
            <div className="score-dial-box">
              <span className="score-fraction">
                {score}
                <span className="score-total">/{total}</span>
              </span>
              <span className="score-percentage">{accuracy}% Accuracy</span>
            </div>

            <div className="score-hero-details">
              <div className="tier-tag-pill">
                <span className="tier-icon">{tier.icon}</span>
                <span className="tier-label">{tier.label}</span>
              </div>
              <p className="tier-summary-text">{tier.summary}</p>
            </div>
          </div>

          {/* Weak Topics & Mastered Topics Responsive Grid */}
          <div className="diagnostic-topics-grid">
            {/* Weak Topics */}
            <div className="diagnostic-topics-card card-weak">
              <div className="topic-card-header topic-header-danger">
                <span className="topic-card-icon-badge badge-danger">
                  <AlertTriangle size={14} />
                </span>
                <span className="topic-card-title">Weak Sub-Topics (Review Needed)</span>
              </div>
              {weakTopics.length > 0 ? (
                <ul className="topics-bullet-list">
                  {weakTopics.map((topic, i) => (
                    <li key={i} className="weak-topic-pill">
                      <span className="topic-bullet-dot">⚠</span>
                      <span>{topic}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="topic-empty-text text-success">
                  🎉 No weak spots identified! Flawless performance.
                </p>
              )}
            </div>

            {/* Mastered Topics */}
            <div className="diagnostic-topics-card card-mastered">
              <div className="topic-card-header topic-header-success">
                <span className="topic-card-icon-badge badge-success">
                  <CheckCircle2 size={14} />
                </span>
                <span className="topic-card-title">Mastered Concepts (Strengths)</span>
              </div>
              {masteredTopics.length > 0 ? (
                <ul className="topics-bullet-list">
                  {masteredTopics.map((topic, i) => (
                    <li key={i} className="mastered-topic-pill">
                      <span className="topic-bullet-dot">✓</span>
                      <span>{topic}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="topic-empty-text">
                  Continue practicing to solidify concepts.
                </p>
              )}
            </div>
          </div>

          {/* AI Recommendations */}
          {recommendations.length > 0 && (
            <div className="diagnostic-recommendations-box">
              <div className="recommendations-header">
                <span className="rec-icon-badge">
                  <Lightbulb size={16} />
                </span>
                <span className="rec-header-title">Gemini AI Actionable Study Recommendations:</span>
              </div>
              <ul className="recommendations-list">
                {recommendations.map((rec, i) => (
                  <li key={i} className="rec-item">
                    <span className="rec-bullet">👉</span>
                    <span className="rec-text">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Detailed Question Breakdown Accordion */}
          {questions.length > 0 && (
            <div className="diagnostic-questions-section">
              <div className="section-title-row">
                <FileText size={15} className="text-primary" />
                <h4 className="section-title">Detailed Question Breakdown</h4>
              </div>

              <div className="breakdown-list">
                {questions.map((q, idx) => {
                  const isCorrect = q.is_correct;
                  const isExpanded = expandedQuestionIdx === idx;

                  return (
                    <div
                      key={idx}
                      className={`breakdown-item ${isCorrect ? "item-correct" : "item-incorrect"}`}
                    >
                      <button
                        type="button"
                        className="breakdown-item-header"
                        onClick={() => toggleExpand(idx)}
                      >
                        <div className="breakdown-item-header-left">
                          <span
                            className={`breakdown-status-badge ${
                              isCorrect ? "status-correct" : "status-incorrect"
                            }`}
                          >
                            {isCorrect ? (
                              <CheckCircle2 size={15} />
                            ) : (
                              <XCircle size={15} />
                            )}
                          </span>
                          <span className="breakdown-q-badge">
                            Q{idx + 1}
                          </span>
                          <span className="breakdown-q-title">
                            {q.question}
                          </span>
                        </div>
                        <span className="breakdown-chevron-box">
                          {isExpanded ? (
                            <ChevronUp size={16} />
                          ) : (
                            <ChevronDown size={16} />
                          )}
                        </span>
                      </button>

                      {isExpanded && (
                        <div className="breakdown-item-details">
                          <p className="breakdown-full-question">
                            {q.question}
                          </p>

                          <div className="breakdown-answers-card">
                            <div className="answer-row">
                              <span className="answer-label">Your Answer:</span>
                              <span
                                className={`answer-value ${
                                  isCorrect ? "val-correct" : "val-incorrect"
                                }`}
                              >
                                {q.selected_option || "(Not Answered)"}
                              </span>
                            </div>

                            {!isCorrect && (
                              <div className="answer-row">
                                <span className="answer-label">Correct Answer:</span>
                                <span className="answer-value val-correct">
                                  {q.correct_option}
                                </span>
                              </div>
                            )}
                          </div>

                          {q.explanation && (
                            <div className="explanation-bubble">
                              <span className="explanation-header">
                                <Lightbulb size={13} className="text-amber" />
                                <span>Insight & Explanation:</span>
                              </span>
                              <p className="explanation-text">{q.explanation}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Dedicated Fixed Footer */}
        <div className="diagnostic-modal-footer">
          {onRetakeQuiz && (
            <Button
              variant="outline"
              size="sm"
              icon={RotateCcw}
              onClick={() => {
                onClose();
                onRetakeQuiz(session);
              }}
            >
              Retake Assessment
            </Button>
          )}

          <Button
            variant="primary"
            size="sm"
            onClick={onClose}
            className="footer-close-btn"
          >
            Done / Close
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
