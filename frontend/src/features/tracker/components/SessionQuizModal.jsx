import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Loader2,
  Sparkles,
  X,
  XCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Button from "../../../components/Button";
import Spinner from "../../../components/Spinner";
import { generateSessionQuiz, submitSessionQuiz } from "../api";

export default function SessionQuizModal({
  session,
  isOpen,
  onClose,
  onQuizCompleted,
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quizData, setQuizData] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({}); // { [questionIndex]: optionIndex }
  const [submitting, setSubmitting] = useState(false);

  // Load Quiz
  useEffect(() => {
    if (!isOpen || !session?.id) return;

    let isMounted = true;
    setLoading(true);
    setError("");
    setSelectedAnswers({});
    setCurrentIndex(0);

    generateSessionQuiz(session.id)
      .then((data) => {
        if (!isMounted) return;
        setQuizData(data);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("Failed to generate session quiz", err);
        setError("Failed to generate AI quiz for this study material. Please try again.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, session?.id]);

  if (!isOpen) return null;

  const questions = quizData?.questions || [];
  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;
  const isAnswered = selectedAnswers[currentIndex] !== undefined;
  const isLastQuestion = currentIndex === totalQuestions - 1;
  const answeredCount = Object.keys(selectedAnswers).length;

  const handleSelectOption = (optIndex) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentIndex]: optIndex,
    }));
  };

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleSubmitQuiz = async () => {
    if (answeredCount < totalQuestions) {
      setError("Please answer all questions before submitting your diagnostic test.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const questionResults = questions.map((q, idx) => {
        const userChoiceIdx = selectedAnswers[idx];
        const correctIdx = q.correct_answer_index ?? 0;
        const isCorrect = userChoiceIdx === correctIdx;
        const selectedOptText = q.options ? q.options[userChoiceIdx] : "";
        const correctOptText = q.options ? q.options[correctIdx] : "";

        return {
          question_index: idx,
          question: q.question,
          options: q.options || [],
          user_answer_index: userChoiceIdx,
          correct_answer_index: correctIdx,
          selected_option: selectedOptText,
          correct_option: correctOptText,
          is_correct: isCorrect,
          topic: q.topic || session.subject || "Course Topic",
          explanation: q.explanation || "",
        };
      });

      const updatedSession = await submitSessionQuiz(session.id, questionResults);
      if (onQuizCompleted) {
        onQuizCompleted(updatedSession);
      }
      onClose();
    } catch (err) {
      console.error("Failed to submit session quiz", err);
      setError("Failed to evaluate quiz diagnostic results. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="tracker-session-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <motion.div
        className="tracker-session-modal-dialog session-quiz-dialog"
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "620px" }}
      >
        {/* Header */}
        <div className="tracker-modal-header">
          <div className="tracker-modal-title-box">
            <span className="tracker-modal-icon">✨</span>
            <div>
              <h3 className="tracker-modal-heading">
                AI Diagnostic Concept Test
              </h3>
              <p className="tracker-modal-subheading">
                Course: <strong>{session?.subject}</strong> • 5 Targeted
                Questions
              </p>
            </div>
          </div>
          <button
            type="button"
            className="tracker-modal-close-btn"
            onClick={onClose}
            disabled={submitting}
            title="Close quiz"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="tracker-modal-body" style={{ minHeight: "340px" }}>
          {loading && (
            <div className="quiz-loading-state py-12 text-center">
              <Spinner size="lg" />
              <p className="mt-3 font-semibold text-primary">
                Gemini AI is generating targeted assessment questions...
              </p>
              <p className="text-xs text-muted mt-1">
                Analyzing key topics from "{session?.subject}"
              </p>
            </div>
          )}

          {error && !loading && (
            <div className="alert-banner alert-banner-danger my-3">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {!loading && !error && currentQuestion && (
            <div>
              {/* Question Progress Bar & Steps */}
              <div className="quiz-progress-bar-container mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-semibold text-primary">
                    Question {currentIndex + 1} of {totalQuestions}
                  </span>
                  <span className="text-xs text-muted">
                    {answeredCount}/{totalQuestions} Answered
                  </span>
                </div>

                <div className="quiz-steps-strip">
                  {questions.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCurrentIndex(idx)}
                      className={`quiz-step-dot ${
                        idx === currentIndex
                          ? "current"
                          : selectedAnswers[idx] !== undefined
                            ? "answered"
                            : ""
                      }`}
                      title={`Go to Question ${idx + 1}`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question Card */}
              <div className="quiz-question-box">
                {currentQuestion.topic && (
                  <span className="quiz-topic-badge mb-2 inline-block">
                    🏷️ {currentQuestion.topic}
                  </span>
                )}
                <h4 className="quiz-question-text">{currentQuestion.question}</h4>

                {/* Options List */}
                <div className="quiz-options-list mt-3">
                  {(currentQuestion.options || []).map((option, optIdx) => {
                    const isSelected = selectedAnswers[currentIndex] === optIdx;
                    const letter = String.fromCharCode(65 + optIdx);

                    return (
                      <button
                        key={optIdx}
                        type="button"
                        className={`quiz-option-card ${
                          isSelected ? "option-selected" : ""
                        }`}
                        onClick={() => handleSelectOption(optIdx)}
                      >
                        <span className="option-letter">{letter}</span>
                        <span className="option-text">{option}</span>
                        {isSelected && (
                          <CheckCircle2
                            size={16}
                            className="option-check-icon text-primary"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Navigation Controls */}
              <div className="quiz-nav-footer mt-5 flex justify-between items-center">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={ChevronLeft}
                  onClick={handlePrev}
                  disabled={currentIndex === 0 || submitting}
                >
                  Previous
                </Button>

                <div className="flex gap-2">
                  {!isLastQuestion ? (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleNext}
                      disabled={!isAnswered || submitting}
                    >
                      <span>Next Question</span>
                      <ChevronRight size={16} className="ml-1" />
                    </Button>
                  ) : (
                    <Button
                      variant="success"
                      size="sm"
                      icon={Sparkles}
                      loading={submitting}
                      disabled={answeredCount < totalQuestions || submitting}
                      onClick={handleSubmitQuiz}
                    >
                      Submit & Analyze Diagnostic
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
