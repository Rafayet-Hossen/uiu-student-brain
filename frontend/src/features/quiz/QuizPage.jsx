import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  Flame,
  HelpCircle,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Target,
  X,
  XCircle,
  Zap,
} from "lucide-react";
import Badge from "../../components/Badge";
import Button from "../../components/Button";
import Card from "../../components/Card";
import Navbar from "../../components/Navbar";
import Spinner from "../../components/Spinner";
import {
  evaluateQuiz,
  extractMaterialsErrorMessage,
  generateQuiz,
  getMaterialById,
} from "../materials/api";

export default function QuizPage() {
  const { materialId } = useParams();
  const navigate = useNavigate();

  // Material & Quiz generation state
  const [material, setMaterial] = useState(null);
  const [loadingMaterial, setLoadingMaterial] = useState(true);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [quiz, setQuiz] = useState(null);
  const [error, setError] = useState("");

  // Test taking state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({}); // { [qIdx]: optionIdx }
  const [evaluating, setEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState(null);
  const [timeElapsed, setTimeElapsed] = useState(0);

  // Load material details
  useEffect(() => {
    async function loadMaterialData() {
      try {
        setLoadingMaterial(true);
        setError("");
        const data = await getMaterialById(materialId);
        setMaterial(data);
      } catch (err) {
        setError(extractMaterialsErrorMessage(err));
      } finally {
        setLoadingMaterial(false);
      }
    }

    if (materialId) {
      loadMaterialData();
    }
  }, [materialId]);

  const [generationStep, setGenerationStep] = useState(0);

  // Dynamic step animation while generating quiz
  useEffect(() => {
    if (!generatingQuiz) {
      setGenerationStep(0);
      return;
    }
    const timer = setInterval(() => {
      setGenerationStep((prev) => (prev + 1) % 4);
    }, 700);
    return () => clearInterval(timer);
  }, [generatingQuiz]);

  // Timer while test is running
  useEffect(() => {
    if (!quiz || evaluationResult) return;
    const interval = setInterval(() => {
      setTimeElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [quiz, evaluationResult]);

  // Handler to generate or regenerate quiz
  const handleStartQuiz = async () => {
    if (!material) return;
    try {
      setGeneratingQuiz(true);
      setError("");
      setEvaluationResult(null);
      setSelectedAnswers({});
      setCurrentQuestionIndex(0);
      setTimeElapsed(0);

      const subject =
        material.course_title ||
        material.course_code ||
        material.course?.title ||
        material.title ||
        "Course Material";
      const topics =
        material.key_topics && material.key_topics.length > 0
          ? material.key_topics
          : material.ai_analysis?.key_topics &&
              material.ai_analysis.key_topics.length > 0
            ? material.ai_analysis.key_topics
            : [material.title];

      const quizData = await generateQuiz({
        subject,
        topics,
        num_questions: 5,
        difficulty: material.difficulty_level || "Intermediate",
      });

      setQuiz(quizData);
    } catch (err) {
      setError(extractMaterialsErrorMessage(err));
    } finally {
      setGeneratingQuiz(false);
    }
  };

  // Auto-start quiz generation once material is loaded
  useEffect(() => {
    if (material && !quiz && !generatingQuiz && !error) {
      handleStartQuiz();
    }
  }, [material]);

  const handleSelectOption = (optionIndex) => {
    if (evaluationResult) return; // Locked once submitted
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestionIndex]: optionIndex,
    }));
  };

  const handleNext = () => {
    if (quiz && currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleSubmitQuiz = async () => {
    if (!quiz || !material) return;
    try {
      setEvaluating(true);
      setError("");

      const subject =
        material.course?.title || material.title || "Course Material";
      const question_results = quiz.questions.map((q, idx) => {
        const selIdx = selectedAnswers[idx];
        const isCorrect = selIdx === q.correct_answer_index;
        return {
          question: q.question,
          selected_option:
            selIdx !== undefined ? q.options[selIdx] : "Not Answered",
          correct_option: q.options[q.correct_answer_index],
          is_correct: isCorrect,
          topic: q.topic_tag || q.topic || "",
        };
      });

      // 1. Calculate local instant evaluation
      const totalQ = question_results.length;
      const correctCount = question_results.filter((q) => q.is_correct).length;
      const accuracy = totalQ > 0 ? (correctCount / totalQ) * 100 : 0;
      const weakTopics = [
        ...new Set(
          question_results
            .filter((q) => !q.is_correct)
            .map((q) => q.topic || "Core Concept"),
        ),
      ];
      const masteredTopics = [
        ...new Set(
          question_results
            .filter((q) => q.is_correct)
            .map((q) => q.topic || "Core Concept"),
        ),
      ];

      const localTier =
        accuracy >= 90
          ? "Scholar Elite (Exceptional Performance)"
          : accuracy >= 75
            ? "Advanced Proficiency"
            : accuracy >= 50
              ? "Competent (Targeted Remediation Recommended)"
              : "Needs Priority Reinforcement";

      const localRecs =
        weakTopics.length > 0
          ? [
              `Focus deliberate practice on: ${weakTopics.slice(0, 3).join(", ")}.`,
              "Apply Active Recall and solve 3-5 standard textbook problem sets for weak topics.",
              "Re-take this diagnostic quiz after reviewing lecture notes to consolidate concepts.",
            ]
          : [
              "Outstanding mastery across all tested concepts! Maintain your active study streak.",
              "Review advanced case studies and practice timed past exam questions.",
            ];

      // 2. Call backend evaluation for logging and persistence
      let evalData = null;
      try {
        evalData = await evaluateQuiz({
          subject,
          question_results,
        });
      } catch {
        // Fallback to instant local evaluation if network is offline
        evalData = {
          accuracy_percentage: accuracy,
          performance_tier: localTier,
          weak_topics: weakTopics,
          mastered_topics: masteredTopics,
          study_recommendations: localRecs,
          recommendations: localRecs,
        };
      }

      setEvaluationResult(
        evalData || {
          accuracy_percentage: accuracy,
          performance_tier: localTier,
          weak_topics: weakTopics,
          mastered_topics: masteredTopics,
          study_recommendations: localRecs,
          recommendations: localRecs,
        },
      );

      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(extractMaterialsErrorMessage(err));
    } finally {
      setEvaluating(false);
    }
  };

  const formatSeconds = (sec) => {
    const mins = Math.floor(sec / 60);
    const remaining = sec % 60;
    return `${mins}:${remaining < 10 ? "0" : ""}${remaining}`;
  };

  const currentQ = quiz?.questions
    ? quiz.questions[currentQuestionIndex]
    : null;
  const answeredCount = Object.keys(selectedAnswers).length;
  const totalQuestions = quiz?.questions ? quiz.questions.length : 0;
  const isAllAnswered = answeredCount === totalQuestions;

  // Render Loading Material
  if (loadingMaterial) {
    return (
      <div className="app-screen">
        <Navbar />
        <main className="main-content quiz-page-container">
          <div className="quiz-loading-state">
            <Spinner standalone />
            <h3>Loading Course Assessment...</h3>
            <p className="text-muted">
              Fetching learning material & diagnostic context
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-screen">
      <Navbar />

      <main className="main-content quiz-page-container">
        {/* Top Breadcrumbs & Back Navigation */}
        <div className="quiz-top-nav-row">
          <button
            type="button"
            className="quiz-back-btn"
            onClick={() => navigate("/study-center?tab=materials")}
          >
            <ArrowLeft size={16} />
            <span>Back to Course Materials</span>
          </button>

          <div className="quiz-top-meta-badge">
            <span className="quiz-course-tag">
              {material?.course_code || material?.course_title || "Course"}
            </span>
            <span className="quiz-material-title-pill" title={material?.title}>
              Topic: {material?.title}
            </span>
          </div>
        </div>

        {/* Global Error Notice */}
        {error && (
          <div className="quiz-error-banner">
            <XCircle size={18} />
            <span>{error}</span>
            <Button size="sm" variant="outline" onClick={handleStartQuiz}>
              Retry
            </Button>
          </div>
        )}

        {/* Generating Quiz State */}
        {generatingQuiz && (
          <div className="quiz-generating-state">
            <div className="generating-ambient-glow" />
            <BookOpen
              size={36}
              className="generating-ai-sparkle animate-pulse text-primary"
            />
            <h2>Generating Practice Quiz</h2>
            <p className="generating-subtext">
              Analyzing <strong>{material?.title}</strong> and creating
              high-yield examination questions targeting core concepts.
            </p>
            <div className="generating-steps-pill">
              <span className="live-dot" />
              <span>
                {
                  [
                    "Extracting syllabus concepts & key definitions...",
                    "Formulating diagnostic multiple-choice questions...",
                    "Calibrating plausible options & detailed explanations...",
                    "Finalizing dynamic examination test...",
                  ][generationStep]
                }
              </span>
            </div>
            <div
              style={{
                width: "240px",
                height: "4px",
                background: "var(--color-border)",
                borderRadius: "4px",
                overflow: "hidden",
                marginTop: "14px",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${((generationStep + 1) / 4) * 100}%`,
                  background:
                    "linear-gradient(90deg, var(--color-primary), #06b6d4)",
                  transition: "width 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              />
            </div>
          </div>
        )}

        {/* Active Quiz Test Taking Screen */}
        {!generatingQuiz && quiz && !evaluationResult && (
          <div className="quiz-active-wrapper">
            {/* Progress Header */}
            <div className="quiz-progress-header">
              <div className="quiz-header-left">
                <div className="quiz-pill-indicator">
                  <Flame size={15} className="text-amber" />
                  <span>Concept Diagnostic Assessment</span>
                </div>
                <h1 className="quiz-active-title">
                  {quiz.quiz_title || `Assessment: ${material?.title}`}
                </h1>
              </div>

              <div className="quiz-header-right">
                <div className="quiz-timer-box">
                  <Clock size={16} />
                  <span>{formatSeconds(timeElapsed)}</span>
                </div>
                <div className="quiz-count-box">
                  Question <strong>{currentQuestionIndex + 1}</strong> of{" "}
                  {totalQuestions}
                </div>
              </div>
            </div>

            {/* Horizontal Question Progress Bar */}
            <div className="quiz-progress-track">
              <div
                className="quiz-progress-fill"
                style={{
                  width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%`,
                }}
              />
            </div>

            {/* Question Quick Jump Pills */}
            <div className="quiz-jump-pills-row">
              {quiz.questions.map((_, idx) => {
                const isAnswered = selectedAnswers[idx] !== undefined;
                const isCurrent = currentQuestionIndex === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    className={`quiz-jump-pill ${
                      isCurrent
                        ? "pill-current"
                        : isAnswered
                          ? "pill-answered"
                          : ""
                    }`}
                    onClick={() => setCurrentQuestionIndex(idx)}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Main Question Card */}
            {currentQ && (
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentQuestionIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="quiz-card-surface"
                >
                  <div className="question-header-row">
                    <span className="question-topic-tag">
                      ◈ {currentQ.topic_tag || currentQ.topic || "Core Concept"}
                    </span>
                    <Badge variant="accent">
                      {material?.difficulty_level || "Intermediate"}
                    </Badge>
                  </div>

                  <h2 className="question-prompt-text">{currentQ.question}</h2>

                  {/* 4 Multi-Choice Options */}
                  <div className="quiz-options-list">
                    {currentQ.options.map((option, optIdx) => {
                      const isSelected =
                        selectedAnswers[currentQuestionIndex] === optIdx;
                      const letter = String.fromCharCode(65 + optIdx); // A, B, C, D
                      return (
                        <div
                          key={optIdx}
                          className={`quiz-option-card ${isSelected ? "option-selected" : ""}`}
                          onClick={() => handleSelectOption(optIdx)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              handleSelectOption(optIdx);
                            }
                          }}
                        >
                          <div className="option-letter-badge">{letter}</div>
                          <div className="option-text-content">{option}</div>
                          {isSelected && (
                            <div className="option-check-circle">
                              <Check size={14} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              </AnimatePresence>
            )}

            {/* Navigation Bottom Controls */}
            <div className="quiz-bottom-controls-bar">
              <Button
                variant="secondary"
                onClick={handlePrev}
                disabled={currentQuestionIndex === 0}
                icon={ChevronLeft}
              >
                Previous
              </Button>

              <div className="quiz-bottom-middle-info">
                <span>
                  {answeredCount} of {totalQuestions} answered
                </span>
              </div>

              {currentQuestionIndex < totalQuestions - 1 ? (
                <Button
                  variant="primary"
                  onClick={handleNext}
                  icon={ChevronRight}
                >
                  Next Question
                </Button>
              ) : (
                <Button
                  variant="primary"
                  onClick={handleSubmitQuiz}
                  loading={evaluating}
                  disabled={answeredCount === 0 || evaluating}
                  icon={evaluating ? undefined : CheckCircle2}
                  style={{ minWidth: "180px", justifyContent: "center" }}
                >
                  {evaluating
                    ? "Submitting Assessment..."
                    : "Submit Assessment"}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Results & AI Diagnostic Screen */}
        {!generatingQuiz && evaluationResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="quiz-results-container"
          >
            {/* Top Score Banner */}
            <div className="quiz-score-banner">
              <div className="score-badge-circle">
                <span className="score-percentage">
                  {Math.round(evaluationResult.accuracy_percentage)}%
                </span>
                <span className="score-label">Accuracy</span>
              </div>

              <div className="score-meta-copy">
                <div className="score-tier-badge">
                  <Award size={18} />
                  <span>
                    {evaluationResult.performance_tier ||
                      "Assessment Submitted & Evaluated"}
                  </span>
                </div>
                <h2 className="score-headline">
                  Assessment Completed in {formatSeconds(timeElapsed)}
                </h2>
                <p className="score-subtext">
                  AI diagnostic evaluation directly synthesized from{" "}
                  <strong>{material?.title}</strong>.
                </p>
              </div>

              <div className="score-action-btns">
                <Button
                  variant="outline"
                  onClick={handleStartQuiz}
                  icon={RotateCcw}
                >
                  Retake Quiz
                </Button>
                <Button
                  variant="primary"
                  onClick={() => navigate("/study-center?tab=materials")}
                  icon={BookOpen}
                >
                  Back to Materials
                </Button>
              </div>
            </div>

            {/* Weak & Mastered Topics Diagnostic Cards */}
            <div className="quiz-diagnostics-grid">
              {/* Weak Topics */}
              <Card className="diagnostic-card card-weaknesses">
                <div className="diagnostic-header">
                  <div className="diag-icon-box bg-rose-subtle text-rose">
                    <Target size={20} />
                  </div>
                  <div>
                    <h3 className="diag-card-title">
                      Priority Focus & Weak Topics
                    </h3>
                    <p className="diag-card-sub">
                      Concepts where mistakes occurred
                    </p>
                  </div>
                </div>

                <div className="diag-body-content">
                  {evaluationResult.weak_topics &&
                  evaluationResult.weak_topics.length > 0 ? (
                    <div className="topics-tags-wrap">
                      {evaluationResult.weak_topics.map((wt, i) => (
                        <span key={i} className="weak-topic-pill">
                          ⚠️ {wt}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-emerald text-sm font-semibold">
                      🎉 Outstanding! No critical weaknesses identified in this
                      assessment.
                    </p>
                  )}

                  {/* Study Recommendations */}
                  {evaluationResult.study_recommendations &&
                    evaluationResult.study_recommendations.length > 0 && (
                      <div className="study-recommendations-box">
                        <strong>💡 AI Action Recommendations:</strong>
                        <ul>
                          {evaluationResult.study_recommendations.map(
                            (rec, rIdx) => (
                              <li key={rIdx}>{rec}</li>
                            ),
                          )}
                        </ul>
                      </div>
                    )}
                </div>
              </Card>

              {/* Mastered Topics */}
              <Card className="diagnostic-card card-mastered">
                <div className="diagnostic-header">
                  <div className="diag-icon-box bg-emerald-subtle text-emerald">
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <h3 className="diag-card-title">Demonstrated Mastery</h3>
                    <p className="diag-card-sub">
                      Core concepts answered with precision
                    </p>
                  </div>
                </div>

                <div className="diag-body-content">
                  {evaluationResult.mastered_topics &&
                  evaluationResult.mastered_topics.length > 0 ? (
                    <div className="topics-tags-wrap">
                      {evaluationResult.mastered_topics.map((mt, i) => (
                        <span key={i} className="mastered-topic-pill">
                          ✓ {mt}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted text-sm">
                      Keep practicing to reinforce concept retention and unlock
                      topic mastery.
                    </p>
                  )}

                  <div className="review-quick-tip">
                    <HelpCircle size={16} className="text-indigo" />
                    <span>
                      Save this assessment result to schedule targeted spaced
                      repetition in your routine planner.
                    </span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Detailed Question by Question Solution Breakdown */}
            <div className="quiz-solutions-section">
              <h3 className="solutions-heading">Detailed Solution Breakdown</h3>
              <p className="solutions-subheading">
                Review your responses alongside in-depth AI explanations for
                every question.
              </p>

              <div className="solutions-list">
                {quiz.questions.map((q, idx) => {
                  const selIdx = selectedAnswers[idx];
                  const isUnanswered = selIdx === undefined || selIdx === null;
                  const isCorrect =
                    !isUnanswered && selIdx === q.correct_answer_index;
                  return (
                    <div
                      key={idx}
                      className={`solution-item-card ${
                        isCorrect
                          ? "solution-correct"
                          : isUnanswered
                            ? "solution-unanswered"
                            : "solution-incorrect"
                      }`}
                    >
                      <div className="solution-item-header">
                        <span className="solution-q-number">
                          Question {idx + 1}
                        </span>
                        <div className="solution-status-badge">
                          {isCorrect ? (
                            <span className="badge-correct">
                              <Check size={14} /> Correct
                            </span>
                          ) : isUnanswered ? (
                            <span className="badge-unanswered">
                              <HelpCircle size={14} /> Unanswered
                            </span>
                          ) : (
                            <span className="badge-incorrect">
                              <X size={14} /> Incorrect
                            </span>
                          )}
                        </div>
                      </div>

                      <h4 className="solution-question-text">{q.question}</h4>

                      <div className="solution-options-review">
                        {q.options.map((opt, optIdx) => {
                          const isUserChoice = selIdx === optIdx;
                          const isCorrectChoice =
                            optIdx === q.correct_answer_index;
                          const letter = String.fromCharCode(65 + optIdx);
                          return (
                            <div
                              key={optIdx}
                              className={`review-option-card ${
                                isCorrectChoice
                                  ? "option-is-correct"
                                  : isUserChoice
                                    ? "option-is-user-wrong"
                                    : "option-is-neutral"
                              }`}
                            >
                              <div className="review-letter-badge">
                                {letter}
                              </div>
                              <div className="review-text-content">{opt}</div>
                              <div className="review-status-indicator">
                                {isCorrectChoice && isUserChoice && (
                                  <span className="badge-solution-tag tag-success">
                                    <Check size={13} /> Correct (Your Choice)
                                  </span>
                                )}
                                {isCorrectChoice && !isUserChoice && (
                                  <span className="badge-solution-tag tag-success">
                                    <Check size={13} /> Correct Answer
                                  </span>
                                )}
                                {isUserChoice && !isCorrectChoice && (
                                  <span className="badge-solution-tag tag-danger">
                                    <X size={13} /> Your Choice
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {q.explanation && (
                        <div className="solution-explanation-box">
                          <div className="solution-explanation-header">
                            <Sparkles size={14} className="text-amber" />
                            <span>AI Concept Explanation</span>
                          </div>
                          <p className="solution-explanation-text">
                            {q.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
