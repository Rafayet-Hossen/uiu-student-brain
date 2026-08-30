import { useEffect, useState } from "react";
import Badge from "../../components/Badge";
import Button from "../../components/Button";
import Card from "../../components/Card";
import FormError from "../../components/FormError";
import Navbar from "../../components/Navbar";
import Spinner from "../../components/Spinner";
import {
  createGradePlan,
  deleteGradePlan,
  extractGradeErrorMessage,
  getGradePlans,
} from "./api";
import GradePlanForm from "./components/GradePlanForm";

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
      "Are you sure you want to delete this grade plan?",
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

    const remainingCredits = totalCredits - completedCredits;

    if (remainingCredits <= 0) {
      return {
        remainingCredits: 0,
        requiredGpa: null,
        possible: currentGpa >= targetGpa,
        percentComplete: 100,
      };
    }

    const requiredGpa =
      (targetGpa * totalCredits - currentGpa * completedCredits) /
      remainingCredits;

    const percentComplete = Math.min(
      100,
      Math.max(0, Math.round((completedCredits / totalCredits) * 100)),
    );

    return {
      remainingCredits,
      requiredGpa,
      possible: requiredGpa <= 4,
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
                <span>🎓</span>
                <span>Grade Planner & GPA Projection</span>
              </h1>
              <p className="page-description">
                Model target GPAs, analyze credit completion progress, and project required scores for graduation honors.
              </p>
            </div>

            <Button onClick={handleAddPlan}>
              {showForm ? "✕ Close Form" : "➕ New Grade Plan"}
            </Button>
          </div>
        </div>

        {/* Form Modal/Card */}
        {showForm && (
          <Card style={{ marginBottom: "28px" }}>
            <div className="card-header">
              <h2 className="card-title">
                <span>🎯</span>
                <span>Create Grade Goal Plan</span>
              </h2>
            </div>
            <GradePlanForm
              onSubmit={handleCreate}
              submitting={submitting}
              onCancel={() => setShowForm(false)}
            />
          </Card>
        )}

        {/* Error Alert */}
        {!loading && error && (
          <Card className="empty-state-card">
            <FormError message={error} className="form-error-block" />
            <Button onClick={loadPlans}>Try Again</Button>
          </Card>
        )}

        {/* Loading Spinner */}
        {loading && (
          <Card className="empty-state-card">
            <Spinner standalone />
            <p className="page-loading-text">Loading your grade plans...</p>
          </Card>
        )}

        {/* Empty State */}
        {!loading && !error && plans.length === 0 && !showForm && (
          <Card className="empty-state-card">
            <div className="empty-state-icon">🎓</div>
            <h2 className="empty-state-title">No grade plans created yet</h2>
            <p className="empty-state-desc">
              Create your first degree or semester grade plan to calculate what GPA you need in your remaining credits.
            </p>
            <Button onClick={handleAddPlan}>Create Grade Plan Now</Button>
          </Card>
        )}

        {/* Grade Plans Grid */}
        {!loading && !error && plans.length > 0 && (
          <div className="grades-grid">
            {plans.map((plan) => {
              const projection = calculateProjection(plan);

              let statusVariant = "default";
              let statusLabel = "In Progress";

              if (projection.remainingCredits === 0) {
                if (projection.possible) {
                  statusVariant = "success";
                  statusLabel = "Target Met";
                } else {
                  statusVariant = "danger";
                  statusLabel = "Target Missed";
                }
              } else if (!projection.possible) {
                statusVariant = "danger";
                statusLabel = "Unachievable (>4.0 GPA)";
              } else if (projection.requiredGpa <= 3.0) {
                statusVariant = "success";
                statusLabel = "Easily Achievable";
              } else if (projection.requiredGpa <= 3.8) {
                statusVariant = "accent";
                statusLabel = "Achievable";
              } else {
                statusVariant = "warning";
                statusLabel = "High Effort Required";
              }

              return (
                <Card key={plan.id} className="grade-plan-card">
                  <div>
                    <div className="card-header">
                      <h3 className="card-title">{plan.name}</h3>
                      <Badge variant={statusVariant}>{statusLabel}</Badge>
                    </div>

                    {/* GPA Comparison Row */}
                    <div className="gpa-metrics-row">
                      <div className="gpa-metric-box">
                        <p className="gpa-metric-label">Current GPA</p>
                        <p className="gpa-metric-value">{Number(plan.current_gpa).toFixed(2)}</p>
                      </div>

                      <div className="gpa-metric-box">
                        <p className="gpa-metric-label">Target GPA</p>
                        <p className="gpa-metric-value" style={{ color: "var(--color-accent)" }}>
                          {Number(plan.target_gpa).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Credit Progress */}
                  <div className="progress-container">
                    <div className="progress-header">
                      <span>Credits Completed</span>
                      <span>
                        {plan.completed_credits} / {plan.total_credits} credits ({projection.percentComplete}%)
                      </span>
                    </div>

                    <div className="progress-bar-track">
                      <div
                        className="progress-bar-fill"
                        style={{ width: `${projection.percentComplete}%` }}
                      />
                    </div>
                  </div>

                  {/* Projection Box */}
                  <div className="projection-box">
                    <div className="projection-header">
                      <span className="projection-title">Academic Projection</span>
                      <span style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
                        {projection.remainingCredits} credits remaining
                      </span>
                    </div>

                    {projection.requiredGpa !== null ? (
                      <div>
                        <p className="projection-message" style={{ fontWeight: 600, marginBottom: "4px" }}>
                          Required Remaining GPA:{" "}
                          <span
                            style={{
                              color: projection.possible
                                ? "var(--color-accent)"
                                : "var(--color-rose-text)",
                              fontSize: "1.0625rem",
                            }}
                          >
                            {projection.requiredGpa.toFixed(2)}
                          </span>
                        </p>

                        <p className="projection-message" style={{ color: "var(--color-text-muted)", fontSize: "0.8125rem" }}>
                          {projection.possible
                            ? "Maintain this minimum GPA across your remaining courses to hit your cumulative target."
                            : "This target requires higher than a 4.00 average on remaining courses."}
                        </p>
                      </div>
                    ) : (
                      <p className="projection-message">
                        {projection.possible
                          ? "Congratulations! You have completed all credits and reached your target GPA."
                          : "Credit limit reached. Target GPA is no longer achievable."}
                      </p>
                    )}
                  </div>

                  <div className="card-actions-row">
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDelete(plan.id)}
                    >
                      🗑️ Delete Plan
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
