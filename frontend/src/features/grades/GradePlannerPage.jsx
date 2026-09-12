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

export default function GradePlannerPage() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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
          <div className="page-header-row">
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

            <Button
              variant={showForm ? "secondary" : "primary"}
              onClick={handleAddPlan}
              icon={showForm ? X : Plus}
            >
              {showForm ? "Close Form" : "New Degree Goal"}
            </Button>
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
            >
              <GradePlanForm
                onSubmit={handleCreate}
                onCancel={() => setShowForm(false)}
                loading={submitting}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* AI Course Retake Optimizer & Advisor */}
        <CourseRetakeAdvisor />

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
                      {/* Top Header Row */}
                      <div className="grade-card-header">
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                          }}
                        >
                          <div
                            style={{
                              width: "38px",
                              height: "38px",
                              borderRadius: "var(--radius-md)",
                              background: "var(--color-primary-subtle)",
                              color: "var(--color-primary)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <GraduationCap size={20} />
                          </div>
                          <div>
                            <h3 className="grade-plan-name">
                              {plan.degree_name || "Bachelor's Degree Plan"}
                            </h3>
                            <span className="grade-plan-sub">
                              Target Cumulative CGPA:{" "}
                              <strong>
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

                      {/* Visual Progress Bar */}
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
