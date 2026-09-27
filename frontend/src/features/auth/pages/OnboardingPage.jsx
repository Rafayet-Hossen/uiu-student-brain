import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Award,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  Flame,
  GraduationCap,
  Info,
  LogOut,
  Sparkles,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";
import Button from "../../../components/Button";
import FormError from "../../../components/FormError";
import StudentBrainLogo from "../../../components/StudentBrainLogo";
import ThemeToggle from "../../../components/ThemeToggle";
import { completeOnboarding, extractErrorMessage } from "../api";
import { useAuth } from "../useAuth";

const DEPARTMENTS = [
  "Computer Science & Engineering (CSE)",
  "Data Science & AI",
  "Electrical & Electronic Engineering (EEE)",
  "Bachelor of Business Administration (BBA)",
  "Economics",
  "Civil Engineering",
  "English & Humanities",
  "Other / General Studies",
];

const TRIMESTERS = [
  "1st Trimester",
  "2nd Trimester",
  "3rd Trimester",
  "4th Trimester",
  "5th Trimester",
  "6th Trimester",
  "7th Trimester",
  "8th Trimester",
  "9th Trimester",
  "10th Trimester",
  "11th Trimester",
  "12th Trimester",
  "Final Trimester / Internship",
];

const CGPA_PRESETS = ["3.00", "3.30", "3.50", "3.75", "3.90", "4.00"];
const TARGET_PRESETS = ["3.50", "3.75", "3.85", "3.95", "4.00"];
const TOTAL_CREDIT_PRESETS = ["140", "136", "130", "120", "148"];

export default function OnboardingPage() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();

  const [department, setDepartment] = useState(
    user?.department || "Computer Science & Engineering (CSE)",
  );
  const [currentGpa, setCurrentGpa] = useState(
    user?.current_gpa ? String(user.current_gpa) : "3.50",
  );
  const [targetGpa, setTargetGpa] = useState(
    user?.target_gpa ? String(user.target_gpa) : "3.85",
  );
  const [completedCredits, setCompletedCredits] = useState(
    user?.completed_credits ? String(user.completed_credits) : "45.0",
  );
  const [totalCredits, setTotalCredits] = useState(
    user?.total_credits ? String(user.total_credits) : "140.0",
  );
  const [currentTrimester, setCurrentTrimester] = useState(
    user?.current_trimester || "4th Trimester",
  );
  const [optInLeaderboard, setOptInLeaderboard] = useState(
    user?.opt_in_leaderboard ?? true,
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const cGpaNum = parseFloat(currentGpa);
    const tGpaNum = parseFloat(targetGpa);
    const cCredNum = parseFloat(completedCredits);
    const tCredNum = parseFloat(totalCredits);

    if (isNaN(cGpaNum) || cGpaNum < 0 || cGpaNum > 4.0) {
      setError("Please enter a valid Current CGPA between 0.00 and 4.00");
      return;
    }

    if (isNaN(tGpaNum) || tGpaNum < 0 || tGpaNum > 4.0) {
      setError("Please enter a valid Target CGPA between 0.00 and 4.00");
      return;
    }

    if (isNaN(cCredNum) || cCredNum < 0) {
      setError("Please enter valid completed credits (0 or more).");
      return;
    }

    if (isNaN(tCredNum) || tCredNum <= 0) {
      setError("Please enter valid total degree credits (e.g., 140.0).");
      return;
    }

    if (cCredNum > tCredNum) {
      setError(
        "Completed credits cannot exceed total degree requirements.",
      );
      return;
    }

    setLoading(true);

    try {
      const payload = {
        department: department.trim(),
        current_gpa: cGpaNum,
        target_gpa: tGpaNum,
        completed_credits: cCredNum,
        total_credits: tCredNum,
        current_trimester: currentTrimester,
        opt_in_leaderboard: Boolean(optInLeaderboard),
      };

      const updatedUser = await completeOnboarding(payload);
      if (updateUser) {
        updateUser(updatedUser);
      }
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  const completionPct =
    totalCredits && completedCredits
      ? Math.min(
          100,
          Math.max(
            0,
            Math.round(
              (parseFloat(completedCredits) / parseFloat(totalCredits)) * 100,
            ),
          ),
        )
      : 0;

  return (
    <div
      className="onboarding-screen-container"
      style={{
        minHeight: "100vh",
        background: "var(--color-bg)",
        color: "var(--color-text)",
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
    >
      {/* Top Bar with Brand Logo and Theme Toggle */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px 24px",
          borderBottom: "1px solid var(--color-border-subtle)",
          background: "var(--color-surface)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <StudentBrainLogo size={32} />
          <span
            style={{
              fontWeight: 800,
              fontSize: "1.2rem",
              letterSpacing: "-0.02em",
            }}
          >
            Student<span style={{ color: "#4f46e5" }}>Brain</span>
          </span>
          <span
            style={{
              fontSize: "0.72rem",
              fontWeight: 700,
              padding: "2px 8px",
              borderRadius: "var(--radius-full)",
              background: "rgba(99, 102, 241, 0.12)",
              color: "#4f46e5",
              marginLeft: "6px",
            }}
          >
            Academic Calibration
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <ThemeToggle />
          <Button
            variant="secondary"
            size="sm"
            onClick={logout}
            icon={LogOut}
            title="Sign Out"
          >
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main Container */}
      <main
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "clamp(16px, 3vw, 40px) 16px",
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="onboarding-card"
          style={{
            width: "100%",
            maxWidth: "680px",
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-2xl, 20px)",
            padding: "clamp(20px, 3.5vw, 36px)",
            boxShadow: "var(--shadow-lg, 0 10px 30px rgba(0,0,0,0.08))",
            boxSizing: "border-box",
          }}
        >
          {/* Welcome Header */}
          <div style={{ textAlign: "center", marginBottom: "28px" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, rgba(99, 102, 241, 0.16), rgba(6, 182, 212, 0.16))",
                color: "#4f46e5",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "12px",
              }}
            >
              <GraduationCap size={26} />
            </div>
            <h1
              style={{
                fontSize: "clamp(1.25rem, 3vw, 1.65rem)",
                fontWeight: 800,
                marginBottom: "6px",
                letterSpacing: "-0.02em",
              }}
            >
              Welcome, {user?.full_name || "Scholar"}! 🎓
            </h1>
            <p
              style={{
                fontSize: "0.875rem",
                color: "var(--color-text-muted)",
                maxWidth: "520px",
                margin: "0 auto",
                lineHeight: 1.5,
              }}
            >
              Please calibrate your academic baseline. This mandatory step
              enables automated GPA projections, study roadmap calculations, and
              personalized analytics.
            </p>
          </div>

          {error && <FormError message={error} />}

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: "20px" }}
          >
            {/* 1. Department / Major */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontWeight: 700 }}>
                Academic Department / Program *
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="form-input"
                style={{
                  width: "100%",
                  padding: "11px 14px",
                  borderRadius: "var(--radius-lg)",
                  fontSize: "0.9rem",
                }}
                disabled={loading}
                required
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. CGPA & Target CGPA Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: "16px",
              }}
            >
              {/* Current CGPA */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "6px",
                  }}
                >
                  <label className="form-label" style={{ fontWeight: 700, margin: 0 }}>
                    Current CGPA *
                  </label>
                  <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                    Scale: 0.00 – 4.00
                  </span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="4.00"
                  className="form-input"
                  value={currentGpa}
                  onChange={(e) => setCurrentGpa(e.target.value)}
                  placeholder="e.g., 3.65"
                  style={{
                    width: "100%",
                    padding: "11px 14px",
                    borderRadius: "var(--radius-lg)",
                    fontWeight: 700,
                    fontSize: "0.95rem",
                  }}
                  disabled={loading}
                  required
                />
                {/* Quick Presets */}
                <div
                  style={{
                    display: "flex",
                    gap: "6px",
                    marginTop: "6px",
                    flexWrap: "wrap",
                  }}
                >
                  {CGPA_PRESETS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setCurrentGpa(p)}
                      style={{
                        padding: "3px 8px",
                        fontSize: "0.72rem",
                        fontWeight: 600,
                        borderRadius: "var(--radius-md)",
                        border: "1px solid var(--color-border)",
                        background:
                          currentGpa === p
                            ? "var(--color-primary-subtle)"
                            : "var(--color-surface-subtle)",
                        color:
                          currentGpa === p
                            ? "var(--color-primary)"
                            : "var(--color-text-muted)",
                        cursor: "pointer",
                      }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Target CGPA */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "6px",
                  }}
                >
                  <label className="form-label" style={{ fontWeight: 700, margin: 0 }}>
                    Target CGPA *
                  </label>
                  <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                    Graduation Goal
                  </span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="4.00"
                  className="form-input"
                  value={targetGpa}
                  onChange={(e) => setTargetGpa(e.target.value)}
                  placeholder="e.g., 3.85"
                  style={{
                    width: "100%",
                    padding: "11px 14px",
                    borderRadius: "var(--radius-lg)",
                    fontWeight: 700,
                    fontSize: "0.95rem",
                  }}
                  disabled={loading}
                  required
                />
                {/* Quick Presets */}
                <div
                  style={{
                    display: "flex",
                    gap: "6px",
                    marginTop: "6px",
                    flexWrap: "wrap",
                  }}
                >
                  {TARGET_PRESETS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setTargetGpa(p)}
                      style={{
                        padding: "3px 8px",
                        fontSize: "0.72rem",
                        fontWeight: 600,
                        borderRadius: "var(--radius-md)",
                        border: "1px solid var(--color-border)",
                        background:
                          targetGpa === p
                            ? "rgba(16, 185, 129, 0.15)"
                            : "var(--color-surface-subtle)",
                        color:
                          targetGpa === p
                            ? "#10b981"
                            : "var(--color-text-muted)",
                        cursor: "pointer",
                      }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 3. Completed Credits & Total Credits Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: "16px",
              }}
            >
              {/* Completed Credits */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontWeight: 700 }}>
                  Credits Completed So Far *
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  className="form-input"
                  value={completedCredits}
                  onChange={(e) => setCompletedCredits(e.target.value)}
                  placeholder="e.g., 45.0"
                  style={{
                    width: "100%",
                    padding: "11px 14px",
                    borderRadius: "var(--radius-lg)",
                  }}
                  disabled={loading}
                  required
                />
              </div>

              {/* Total Degree Credits */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "6px",
                  }}
                >
                  <label className="form-label" style={{ fontWeight: 700, margin: 0 }}>
                    Total Degree Credits *
                  </label>
                  <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                    Syllabus Total
                  </span>
                </div>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  className="form-input"
                  value={totalCredits}
                  onChange={(e) => setTotalCredits(e.target.value)}
                  placeholder="e.g., 140.0"
                  style={{
                    width: "100%",
                    padding: "11px 14px",
                    borderRadius: "var(--radius-lg)",
                  }}
                  disabled={loading}
                  required
                />
                {/* Quick Presets */}
                <div
                  style={{
                    display: "flex",
                    gap: "6px",
                    marginTop: "6px",
                    flexWrap: "wrap",
                  }}
                >
                  {TOTAL_CREDIT_PRESETS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setTotalCredits(p)}
                      style={{
                        padding: "3px 8px",
                        fontSize: "0.72rem",
                        fontWeight: 600,
                        borderRadius: "var(--radius-md)",
                        border: "1px solid var(--color-border)",
                        background:
                          totalCredits === p
                            ? "var(--color-primary-subtle)"
                            : "var(--color-surface-subtle)",
                        color:
                          totalCredits === p
                            ? "var(--color-primary)"
                            : "var(--color-text-muted)",
                        cursor: "pointer",
                      }}
                    >
                      {p} cr
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Progress Preview Bar */}
            <div
              style={{
                padding: "12px 16px",
                borderRadius: "var(--radius-lg)",
                background: "var(--color-surface-subtle)",
                border: "1px solid var(--color-border)",
                display: "flex",
                flexDirection: "column",
                gap: "6px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                }}
              >
                <span>Degree Completion Progress</span>
                <span style={{ color: "#4f46e5", fontWeight: 700 }}>
                  {completedCredits || 0} / {totalCredits || 140} Credits ({completionPct}%)
                </span>
              </div>
              <div
                style={{
                  height: "7px",
                  borderRadius: "var(--radius-full)",
                  background: "var(--color-border)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${completionPct}%`,
                    background: "linear-gradient(90deg, #6366F1, #06B6D4)",
                    borderRadius: "var(--radius-full)",
                    transition: "width 0.3s ease",
                  }}
                />
              </div>
            </div>

            {/* 4. Current Trimester / Semester */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontWeight: 700 }}>
                Current Trimester / Semester *
              </label>
              <select
                value={currentTrimester}
                onChange={(e) => setCurrentTrimester(e.target.value)}
                className="form-input"
                style={{
                  width: "100%",
                  padding: "11px 14px",
                  borderRadius: "var(--radius-lg)",
                  fontSize: "0.9rem",
                }}
                disabled={loading}
                required
              >
                {TRIMESTERS.map((tri) => (
                  <option key={tri} value={tri}>
                    {tri}
                  </option>
                ))}
              </select>
            </div>

            {/* 5. Leaderboard Opt-In Toggle Card */}
            <div
              onClick={() => setOptInLeaderboard(!optInLeaderboard)}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "14px",
                padding: "14px 16px",
                borderRadius: "var(--radius-xl)",
                background: optInLeaderboard
                  ? "rgba(99, 102, 241, 0.08)"
                  : "var(--color-surface-subtle)",
                border: optInLeaderboard
                  ? "1.5px solid rgba(99, 102, 241, 0.4)"
                  : "1px solid var(--color-border)",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              <input
                type="checkbox"
                checked={optInLeaderboard}
                onChange={(e) => setOptInLeaderboard(e.target.checked)}
                style={{ marginTop: "3px", width: "18px", height: "18px", cursor: "pointer" }}
              />
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontWeight: 700,
                    fontSize: "0.9rem",
                    marginBottom: "3px",
                  }}
                >
                  <Trophy size={16} className="text-amber" />
                  <span>Opt-in to Scholar Community Leaderboard</span>
                </div>
                <p
                  style={{
                    fontSize: "0.78rem",
                    color: "var(--color-text-muted)",
                    margin: 0,
                    lineHeight: 1.45,
                  }}
                >
                  Display your study streak and focus rankings among fellow
                  university scholars. (You can toggle this anytime in profile settings).
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ marginTop: "10px" }}>
              <Button
                type="submit"
                variant="primary"
                loading={loading}
                style={{
                  width: "100%",
                  padding: "13px 20px",
                  fontSize: "1rem",
                  fontWeight: 700,
                  borderRadius: "var(--radius-xl)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  boxShadow: "0 4px 14px rgba(79, 70, 229, 0.35)",
                }}
              >
                {loading ? (
                  "Calibrating Academic Brain..."
                ) : (
                  <>
                    <span>Complete Calibration & Enter Dashboard</span>
                    <ChevronRight size={18} />
                  </>
                )}
              </Button>
            </div>
          </form>
        </motion.div>
      </main>
    </div>
  );
}
