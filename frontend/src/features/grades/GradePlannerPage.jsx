import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Button from "../../components/Button";
import Card from "../../components/Card";
import FormError from "../../components/FormError";
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
      };
    }

    const requiredGpa =
      (targetGpa * totalCredits - currentGpa * completedCredits) /
      remainingCredits;

    return {
      remainingCredits,
      requiredGpa,
      possible: requiredGpa <= 4,
    };
  }

  return (
    <div className="dashboard-screen">
      <header className="dashboard-header">
        <Link to="/dashboard" className="dashboard-brand">
          Student Brain
        </Link>
      </header>

      <main className="dashboard-main">
        <h1>Grade Planner</h1>

        <p className="auth-subtitle">
          Set your target GPA and see what you need in your remaining credits.
        </p>

        <Button onClick={handleAddPlan}>
          {showForm ? "Close Form" : "Add Grade Plan"}
        </Button>

        {showForm && (
          <Card>
            <GradePlanForm onSubmit={handleCreate} submitting={submitting} />
          </Card>
        )}

        {!loading && error && (
          <Card>
            <FormError message={error} className="form-error-block" />
            <Button onClick={loadPlans}>Try again</Button>
          </Card>
        )}

        {loading && (
          <Card>
            <Spinner standalone />
            <p>Loading your grade plans...</p>
          </Card>
        )}

        {!loading && !error && plans.length === 0 && (
          <Card>
            <h2>No grade plans yet</h2>

            <p className="auth-subtitle">
              Create your first grade plan to start tracking your GPA target.
            </p>
          </Card>
        )}

        {!loading && !error && plans.length > 0 && (
          <div className="planner-list">
            {plans.map((plan) => {
              const projection = calculateProjection(plan);

              return (
                <Card key={plan.id}>
                  <h2>{plan.name}</h2>

                  <p>Current GPA: {plan.current_gpa}</p>
                  <p>Target GPA: {plan.target_gpa}</p>
                  <p>
                    Credits: {plan.completed_credits} / {plan.total_credits}
                  </p>

                  <hr />

                  <h3>Projection</h3>

                  <p>Remaining credits: {projection.remainingCredits}</p>

                  {projection.requiredGpa !== null ? (
                    <>
                      <p>Required GPA: {projection.requiredGpa.toFixed(2)}</p>

                      <p>
                        {projection.possible
                          ? "Target is achievable within a 4.00 GPA."
                          : "Target is not achievable with the remaining credits."}
                      </p>
                    </>
                  ) : (
                    <p>
                      {projection.possible
                        ? "You have already reached your target GPA."
                        : "The target GPA is no longer achievable."}
                    </p>
                  )}

                  <div className="planner-card-actions">
                    <Button
                      variant="secondary"
                      onClick={() => handleDelete(plan.id)}
                    >
                      Delete
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
