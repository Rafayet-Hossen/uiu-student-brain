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
        style={{ maxWidth: "680px" }}
      >
        {/* Header */}
        <div className="tracker-modal-header">
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

        {/* Modal Body */}
        <div
          className="tracker-modal-body"
          style={{ maxHeight: "78vh", overflowY: "auto" }}
        >
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
                <span>{tier.icon}</span>
                <span>{tier.label}</span>
              </div>
              <p className="tier-summary-text">{tier.summary}</p>
            </div>
          </div>

          {/* Weak Topics & Mastered Topics 2-Col Grid */}
          <div
            className="grid grid-cols-2 gap-3 my-4"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "14px",
            }}
          >
            {/* Weak Topics */}
            <div className="diagnostic-topics-card card-weak">
              <div className="flex items-center gap-2 mb-2 text-danger font-semibold text-xs">
                <AlertTriangle size={15} />
                <span>Weak Sub-Topics (Review Needed)</span>
              </div>
              {weakTopics.length > 0 ? (
                <ul className="topics-bullet-list">
                  {weakTopics.map((topic, i) => (
                    <li key={i} className="weak-topic-pill">
                      {topic}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted">
                  🎉 No weak spots identified! Flawless performance.
                </p>
              )}
            </div>

            {/* Mastered Topics */}
            <div className="diagnostic-topics-card card-mastered">
              <div className="flex items-center gap-2 mb-2 text-success font-semibold text-xs">
                <CheckCircle2 size={15} />
                <span>Mastered Concepts (Strengths)</span>
              </div>
              {masteredTopics.length > 0 ? (
                <ul className="topics-bullet-list">
                  {masteredTopics.map((topic, i) => (
                    <li key={i} className="mastered-topic-pill">
                      {topic}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted">
                  Continue practicing to solidify concepts.
                </p>
              )}
            </div>
          </div>

          {/* AI Recommendations */}
          {recommendations.length > 0 && (
            <div className="diagnostic-recommendations-box mb-4">
              <div className="flex items-center gap-2 mb-2 text-primary font-semibold text-xs">
                <Lightbulb size={16} className="text-amber" />
                <span>Gemini AI Actionable Study Recommendations:</span>
              </div>
              <ul className="recommendations-list">
                {recommendations.map((rec, i) => (
                  <li key={i} className="rec-item">
                    <span className="rec-bullet">👉</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Detailed Question Breakdown Accordion */}
          {questions.length > 0 && (
            <div className="diagnostic-questions-section">
              <h4 className="section-title text-xs font-bold text-muted uppercase tracking-wider mb-2">
                Detailed Question Breakdown
              </h4>

              <div
                className="space-y-2"
                style={{ display: "flex", flexDirection: "column", gap: "8px" }}
              >
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
                        <div className="flex items-center gap-2 flex-1 text-left">
                          {isCorrect ? (
                            <CheckCircle2
                              size={16}
                              className="text-success flex-shrink-0"
                            />
                          ) : (
                            <XCircle
                              size={16}
                              className="text-danger flex-shrink-0"
                            />
                          )}
                          <span className="text-xs font-semibold">
                            Q{idx + 1}:
                          </span>
                          <span className="text-xs truncate font-medium">
                            {q.question}
                          </span>
                        </div>
                        {isExpanded ? (
                          <ChevronUp size={16} />
                        ) : (
                          <ChevronDown size={16} />
                        )}
                      </button>

                      {isExpanded && (
                        <div className="breakdown-item-details p-3">
                          <p className="text-xs font-medium text-foreground mb-2">
                            {q.question}
                          </p>

                          <div className="text-xs space-y-1 mb-2">
                            <div className="flex items-center gap-1">
                              <span className="text-muted font-medium">
                                Your Answer:
                              </span>
                              <span
                                className={
                                  isCorrect
                                    ? "text-success font-semibold"
                                    : "text-danger font-semibold"
                                }
                              >
                                {q.selected_option || "(None)"}
                              </span>
                            </div>

                            {!isCorrect && (
                              <div className="flex items-center gap-1">
                                <span className="text-muted font-medium">
                                  Correct Answer:
                                </span>
                                <span className="text-success font-semibold">
                                  {q.correct_option}
                                </span>
                              </div>
                            )}
                          </div>

                          {q.explanation && (
                            <div className="explanation-bubble">
                              <span className="font-semibold block mb-1">
                                💡 Explanation:
                              </span>
                              <span>{q.explanation}</span>
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

          {/* Footer */}
          <div className="flex justify-between items-center mt-5 pt-3 border-t">
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
              className="ml-auto"
            >
              Done / Close
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
