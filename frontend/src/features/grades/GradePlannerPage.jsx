import { useEffect, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  Award,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  Info,
  Lightbulb,
  Plus,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  UploadCloud,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Badge from "../../components/Badge";
import Button from "../../components/Button";
import Card from "../../components/Card";
import EmptyState from "../../components/EmptyState";
import ErrorState from "../../components/ErrorState";
import Navbar from "../../components/Navbar";
import { CardSkeleton } from "../../components/Skeleton";
import {
  createGradePlan,
  deleteGradePlan,
  extractGradeErrorMessage,
  getGradePlans,
} from "./api";
import GradePlanForm from "./components/GradePlanForm";
import CourseRetakeAdvisor from "./components/CourseRetakeAdvisor";

function CircularGpaMeter({ currentGpa, targetGpa, size = 100 }) {
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const currentRatio = Math.min(1, Math.max(0, Number(currentGpa) / 4.0));
  const strokeDashoffset = circumference - currentRatio * circumference;
  const targetRatio = Math.min(1, Math.max(0, Number(targetGpa) / 4.0));

  return (
    <div
      className="gpa-gauge-widget"
      style={{
        width: size,
        height: size,
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        style={{ transform: "rotate(-90deg)" }}
      >
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth="7"
          opacity="0.5"
        />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="rgba(79, 70, 229, 0.22)"
          strokeWidth="7"
          strokeDasharray={`${targetRatio * circumference} ${circumference}`}
        />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="var(--module-gpa, #4f46e5)"
          strokeWidth="7"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          textAlign: "center",
          pointerEvents: "none",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <span
          style={{
            fontSize: "1.15rem",
            fontWeight: 800,
            color: "var(--color-text)",
            lineHeight: 1,
            letterSpacing: "-0.02em",
          }}
        >
          {Number(currentGpa).toFixed(2)}
        </span>
        <span
          style={{
            fontSize: "0.62rem",
            fontWeight: 600,
            color: "var(--color-text-muted)",
            marginTop: "2px",
          }}
        >
          / 4.00
        </span>
      </div>
    </div>
  );
}

export default function GradePlannerPage() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  async function loadPlans() {
    setLoading(true);
    setError("");

    try {
      const data = await getGradePlans();
      setPlans(data);
    } catch (err) {
      setError(extractGradeErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPlans();
  }, []);

  async function handleCreate(plan) {
    setSubmitting(true);
    setError("");

    try {
      const createdPlan = await createGradePlan(plan);
      setPlans((current) => [createdPlan, ...current]);
      setShowForm(false);
    } catch (err) {
      setError(extractGradeErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(planId) {
    const confirmed = window.confirm(
      "Remove this degree plan from your planner?",
    );

    if (!confirmed) return;

    try {
      setError("");
      await deleteGradePlan(planId);
      setPlans((current) => current.filter((plan) => plan.id !== planId));
    } catch (err) {
      setError(extractGradeErrorMessage(err));
    }
  }

  function handleAddPlan() {
    setShowForm((current) => !current);
    setError("");
  }

  function calculateProjection(plan) {
    const currentGpa = Number(plan.current_gpa);
    const completedCredits = Number(plan.completed_credits);
    const totalCredits = Number(plan.total_credits);
    const targetGpa = Number(plan.target_gpa);

    const remainingCredits = Math.max(0, totalCredits - completedCredits);

    if (remainingCredits <= 0) {
      return {
        remainingCredits: 0,
        requiredGpa: null,
        possible: currentGpa >= targetGpa,
        percentComplete: 100,
        maxPossibleGpa: currentGpa.toFixed(2),
      };
    }

    const requiredGpa =
      (targetGpa * totalCredits - currentGpa * completedCredits) /
      remainingCredits;

    const maxPossibleGpa = (
      (currentGpa * completedCredits + 4.0 * remainingCredits) /
      totalCredits
    ).toFixed(2);

    const percentComplete = Math.min(
      100,
      Math.max(0, Math.round((completedCredits / totalCredits) * 100)),
    );

    const possible = requiredGpa <= 4.0;

    return {
      remainingCredits,
      requiredGpa: requiredGpa > 0 ? requiredGpa.toFixed(2) : "0.00",
      maxPossibleGpa,
      possible,
      percentComplete,
    };
  }

  return (
    <div className="app-screen">
      <Navbar />

      <main className="main-content">
        {/* Page Header */}
        <div className="page-header">
          <div className="page-header-row grade-planner-header-row">
            <div>
              <h1 className="page-title">
                <GraduationCap size={28} className="text-emerald" />
                <span>Grade Planner & Degree Projections</span>
              </h1>
              <p className="page-description">
                Forecast required semester grades across remaining credits, plan
                study terms, and secure graduation honors.
              </p>
            </div>

            <div className="grade-page-header-actions">
              <Button
                variant="primary"
                onClick={() => setShowUploadModal(true)}
                icon={UploadCloud}
                title="Upload PDF, screenshot image, or CSV transcript"
              >
                Upload Transcript
              </Button>
              <Button
                variant={showForm ? "secondary" : "outline"}
                onClick={handleAddPlan}
                icon={showForm ? X : Plus}
              >
                {showForm ? "Close Form" : "New Degree Goal"}
              </Button>
            </div>
          </div>
        </div>

        {/* Grade Plan Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              style={{ marginBottom: "24px" }}
            >
              <Card className="grade-plan-form-card">
                <div className="grade-form-card-header">
                  <div className="flex items-center gap-2">
                    <Target size={18} className="text-primary" />
                    <h3 className="grade-form-card-title">
                      Configure Degree & Target CGPA
                    </h3>
                  </div>
                  <p className="grade-form-card-desc">
                    Specify total credits and goal GPA to compute your exact required future semester performance.
                  </p>
                </div>
                <GradePlanForm
                  onSubmit={handleCreate}
                  onCancel={() => setShowForm(false)}
                  loading={submitting}
                />
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* AI Course Retake Optimizer & Advisor */}
        <CourseRetakeAdvisor
          showUploadModal={showUploadModal}
          setShowUploadModal={setShowUploadModal}
        />

        {/* Loading Skeletons */}
        {loading && (
          <div className="grades-grid">
            <CardSkeleton />
            <CardSkeleton />
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <ErrorState
            title="Unable to load grade plans"
            message={error}
            onRetry={loadPlans}
          />
        )}

        {/* Empty State */}
        {!loading && !error && plans.length === 0 && !showForm && (
          <EmptyState
            icon={GraduationCap}
            title="No degree targets set yet"
            description="Set your total degree credits and target cumulative CGPA to see exact required semester scores."
            actionLabel="Set Up Degree Goal"
            onAction={handleAddPlan}
          />
        )}

        {/* Plans Grid */}
        {!loading && !error && plans.length > 0 && (
          <div className="grades-grid">
            {plans.map((plan) => {
              const proj = calculateProjection(plan);
              return (
                <motion.div
                  key={plan.id}
                  whileHover={{ y: -3 }}
                  transition={{ duration: 0.18 }}
                >
                  <Card variant="feature" className="grade-plan-card">
                    <div>
                      {/* Financial-Dashboard Top Split */}
                      <div className="grade-plan-top-split">
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "16px",
                          }}
                        >
                          <CircularGpaMeter
                            currentGpa={plan.current_gpa}
                            targetGpa={plan.target_gpa}
                          />
                          <div>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                              }}
                            >
                              <h3
                                className="grade-plan-name"
                                style={{ margin: 0 }}
                              >
                                {plan.degree_name || "Bachelor's Degree Plan"}
                              </h3>
                            </div>
                            <span
                              className="grade-plan-sub"
                              style={{ display: "block", marginTop: "4px" }}
                            >
                              Target Cumulative CGPA:{" "}
                              <strong style={{ color: "var(--color-primary)" }}>
                                {Number(plan.target_gpa).toFixed(2)}
                              </strong>
                            </span>
                          </div>
                        </div>

                        <Badge variant={proj.possible ? "success" : "accent"}>
                          {proj.possible
                            ? "Target On Track"
                            : "Academic Push Required"}
                        </Badge>
                      </div>

                      {/* 3 Metric Summary Boxes */}
                      <div className="grade-metric-boxes-grid">
                        <div className="grade-metric-box">
                          <span className="metric-box-label">Current CGPA</span>
                          <strong className="metric-box-val text-indigo">
                            {Number(plan.current_gpa).toFixed(2)}
                          </strong>
                          <span className="metric-box-sub">
                            {plan.completed_credits} credits completed
                          </span>
                        </div>

                        <div className="grade-metric-box">
                          <span className="metric-box-label">
                            Required Semester GPA
                          </span>
                          <strong
                            className={`metric-box-val ${
                              proj.possible ? "text-emerald" : "text-amber"
                            }`}
                          >
                            {proj.requiredGpa
                              ? `${proj.requiredGpa}`
                              : "Achieved 🎉"}
                          </strong>
                          <span className="metric-box-sub">
                            on {proj.remainingCredits} remaining credits
                          </span>
                        </div>

                        <div className="grade-metric-box">
                          <span className="metric-box-label">
                            Degree Completion
                          </span>
                          <strong className="metric-box-val text-emerald">
                            {proj.percentComplete}%
                          </strong>
                          <span className="metric-box-sub">
                            {plan.completed_credits} / {plan.total_credits}{" "}
                            total credits
                          </span>
                        </div>
                      </div>

                      {/* Visual Progress Bar & Milestone Timeline */}
                      <div className="degree-progress-bar-container">
                        <div className="degree-progress-bar-bg">
                          <div
                            className="degree-progress-bar-fill"
                            style={{ width: `${proj.percentComplete}%` }}
                          />
                        </div>
                        <div className="degree-progress-bar-labels">
                          <span>
                            {plan.completed_credits} credits completed
                          </span>
                          <span>{proj.remainingCredits} credits remaining</span>
                          <span>{plan.total_credits} total</span>
                        </div>
                      </div>

                      {/* Financial-Dashboard Credit Milestone Roadmap */}
                      <div className="credit-milestone-timeline">
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            color: "var(--color-text)",
                            marginBottom: "4px",
                          }}
                        >
                          <span>Academic Degree Timeline</span>
                          <span style={{ color: "var(--color-primary)" }}>
                            {proj.percentComplete}% Complete
                          </span>
                        </div>
                        <div className="milestones-labels-row">
                          <span
                            className={
                              proj.percentComplete >= 25
                                ? "milestone-active"
                                : ""
                            }
                          >
                            ● Freshman (30 cr)
                          </span>
                          <span
                            className={
                              proj.percentComplete >= 50
                                ? "milestone-active"
                                : ""
                            }
                          >
                            ● Sophomore (60 cr)
                          </span>
                          <span
                            className={
                              proj.percentComplete >= 75
                                ? "milestone-active"
                                : ""
                            }
                          >
                            ● Junior (90 cr)
                          </span>
                          <span
                            className={
                              proj.percentComplete >= 100
                                ? "milestone-active"
                                : ""
                            }
                          >
                            ● Senior (Graduation)
                          </span>
                        </div>
                      </div>

                      {/* Academic Roadmap Alert Box */}
                      <div
                        style={{
                          marginTop: "16px",
                          padding: "12px 16px",
                          borderRadius: "var(--radius-md)",
                          background: proj.possible
                            ? "rgba(16, 185, 129, 0.08)"
                            : "rgba(245, 158, 11, 0.08)",
                          border: `1px solid ${
                            proj.possible
                              ? "rgba(16, 185, 129, 0.25)"
                              : "rgba(245, 158, 11, 0.25)"
                          }`,
                          fontSize: "0.84rem",
                          lineHeight: 1.5,
                          color: "var(--color-text)",
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "10px",
                        }}
                      >
                        {proj.possible ? (
                          <>
                            <CheckCircle2
                              size={18}
                              className="text-emerald"
                              style={{ flexShrink: 0, marginTop: "2px" }}
                            />
                            <span>
                              <strong>Academic Roadmap</strong>: Maintaining a
                              term average of{" "}
                              <strong>{proj.requiredGpa} GPA</strong> across
                              your remaining{" "}
                              <strong>{proj.remainingCredits} credits</strong>{" "}
                              will successfully achieve your{" "}
                              <strong>{plan.target_gpa} CGPA</strong> graduation
                              goal.
                            </span>
                          </>
                        ) : (
                          <>
                            <Lightbulb
                              size={18}
                              className="text-amber"
                              style={{ flexShrink: 0, marginTop: "2px" }}
                            />
                            <span>
                              <strong>Academic Advisor Tip</strong>: Reaching a{" "}
                              <strong>{plan.target_gpa} CGPA</strong> requires a{" "}
                              <strong>{proj.requiredGpa} GPA</strong> on your
                              remaining{" "}
                              <strong>{proj.remainingCredits} credits</strong>.
                              Achieving maximum grades (4.00) in all remaining
                              courses will bring your final CGPA to{" "}
                              <strong>~{proj.maxPossibleGpa}</strong>!
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div
                      className="grade-card-actions"
                      style={{
                        marginTop: "16px",
                        display: "flex",
                        justifyContent: "flex-end",
                        borderTop: "1px solid var(--color-border-subtle)",
                        paddingTop: "12px",
                      }}
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={Trash2}
                        onClick={() => handleDelete(plan.id)}
                        style={{ color: "var(--color-danger)" }}
                      >
                        Delete Goal
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
