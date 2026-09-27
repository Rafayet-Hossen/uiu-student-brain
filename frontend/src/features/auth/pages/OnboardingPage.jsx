import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Award,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  GraduationCap,
  Layers,
  Sparkles,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import { updateProfile } from "../api";
import { useAuth } from "../useAuth";
import StudentBrainLogo from "../../../components/StudentBrainLogo";
import AuthAmbientBackground from "../components/AuthAmbientBackground";
import FormError from "../../../components/FormError";

const DEPARTMENTS = [
  { id: "CSE", name: "Computer Science & Engineering (CSE)", defaultCredits: 140 },
  { id: "EEE", name: "Electrical & Electronic Engineering (EEE)", defaultCredits: 140 },
  { id: "BBA", name: "Bachelor of Business Administration (BBA)", defaultCredits: 130 },
  { id: "Civil", name: "Civil Engineering", defaultCredits: 144 },
  { id: "Economics", name: "Economics", defaultCredits: 120 },
  { id: "Other", name: "Other Department", defaultCredits: 140 },
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
  "Graduating / Final Trimester",
];

export default function OnboardingPage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [department, setDepartment] = useState(user?.department || "CSE");
  const [currentTrimester, setCurrentTrimester] = useState(
    user?.current_trimester || "1st Trimester"
  );
  const [currentGpa, setCurrentGpa] = useState(
    user?.current_gpa !== null && user?.current_gpa !== undefined
      ? String(user.current_gpa)
      : ""
  );
  const [targetGpa, setTargetGpa] = useState(
    user?.target_gpa !== null && user?.target_gpa !== undefined
      ? String(user.target_gpa)
      : "3.80"
  );
  const [completedCredits, setCompletedCredits] = useState(
    user?.completed_credits !== null && user?.completed_credits !== undefined
      ? String(user.completed_credits)
      : "0"
  );
  const [totalCredits, setTotalCredits] = useState(
    user?.total_credits !== null && user?.total_credits !== undefined
      ? String(user.total_credits)
      : "140"
  );
  const [optInLeaderboard, setOptInLeaderboard] = useState(
    user?.opt_in_leaderboard ?? true
  );

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleDeptSelect = (deptId) => {
    setDepartment(deptId);
    const match = DEPARTMENTS.find((d) => d.id === deptId);
    if (match && (!totalCredits || totalCredits === "140" || totalCredits === "130")) {
      setTotalCredits(String(match.defaultCredits));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const cGpa = parseFloat(currentGpa);
    const tGpa = parseFloat(targetGpa);
    const cCredits = parseFloat(completedCredits);
    const tCredits = parseFloat(totalCredits);

    if (isNaN(cGpa) || cGpa < 0 || cGpa > 4.0) {
      setError("Please provide a valid Current CGPA between 0.00 and 4.00");
      return;
    }
    if (isNaN(tGpa) || tGpa < 0 || tGpa > 4.0) {
      setError("Please provide a valid Target CGPA between 0.00 and 4.00");
      return;
    }
    if (isNaN(cCredits) || cCredits < 0) {
      setError("Please provide valid completed credits (0 or more)");
      return;
    }
    if (isNaN(tCredits) || tCredits <= 0) {
      setError("Please provide valid total degree credits (e.g., 140)");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        department,
        current_trimester: currentTrimester,
        current_gpa: cGpa,
        target_gpa: tGpa,
        completed_credits: cCredits,
        total_credits: tCredits,
        opt_in_leaderboard: optInLeaderboard,
        is_onboarded: true,
      };

      const updated = await updateProfile(payload);
      updateUser(updated);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          err?.message ||
          "Failed to save calibration profile. Please retry."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-sb-screen" style={{ minHeight: "100vh", overflowY: "auto", padding: "2rem 1rem" }}>
      <AuthAmbientBackground />

      <div
        style={{
          maxWidth: "760px",
          margin: "0 auto",
          position: "relative",
          zIndex: 10,
        }}
      >
        {/* Brand Header */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            marginBottom: "2rem",
            gap: "0.75rem",
          }}
        >
          <StudentBrainLogo size={52} />
          <div>
            <h1
              style={{
                fontSize: "1.75rem",
                fontWeight: 800,
                color: "#ffffff",
                letterSpacing: "-0.02em",
                margin: 0,
              }}
            >
              Academic Profile Setup
            </h1>
            <p
              style={{
                fontSize: "0.95rem",
                color: "rgba(255, 255, 255, 0.65)",
                margin: "0.35rem 0 0 0",
              }}
            >
              Calibrate your trimester, CGPA targets, and degree credits for personalized study tracking.
            </p>
          </div>
        </div>

        {/* Main Card */}
        <div
          className="auth-sb-card"
          style={{
            background: "rgba(15, 23, 42, 0.85)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(242, 101, 34, 0.25)",
            borderRadius: "18px",
            boxShadow: "0 20px 50px rgba(0, 0, 0, 0.5)",
            padding: "2rem",
          }}
        >
          {error && <FormError message={error} />}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {/* Department Selection */}
            <div>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "0.88rem",
                  fontWeight: 600,
                  color: "#f3f4f6",
                  marginBottom: "0.5rem",
                }}
              >
                <BookOpen size={16} style={{ color: "#F26522" }} />
                Academic Department
              </label>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                  gap: "0.5rem",
                }}
              >
                {DEPARTMENTS.map((dept) => {
                  const isSelected = department === dept.id;
                  return (
                    <button
                      key={dept.id}
                      type="button"
                      onClick={() => handleDeptSelect(dept.id)}
                      style={{
                        padding: "0.6rem 0.8rem",
                        borderRadius: "10px",
                        border: isSelected
                          ? "1.5px solid #F26522"
                          : "1px solid rgba(255, 255, 255, 0.1)",
                        background: isSelected
                          ? "rgba(242, 101, 34, 0.15)"
                          : "rgba(255, 255, 255, 0.03)",
                        color: isSelected ? "#F26522" : "#94a3b8",
                        fontWeight: isSelected ? 700 : 500,
                        fontSize: "0.85rem",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <span>{dept.id}</span>
                      {isSelected && <CheckCircle2 size={14} color="#F26522" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Trimester Select */}
            <div>
              <label
                htmlFor="trimesterSelect"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "0.88rem",
                  fontWeight: 600,
                  color: "#f3f4f6",
                  marginBottom: "0.5rem",
                }}
              >
                <Layers size={16} style={{ color: "#F59E0B" }} />
                Current Trimester / Semester
              </label>
              <select
                id="trimesterSelect"
                value={currentTrimester}
                onChange={(e) => setCurrentTrimester(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem",
                  borderRadius: "10px",
                  background: "rgba(10, 15, 25, 0.8)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  color: "#ffffff",
                  fontSize: "0.9rem",
                  outline: "none",
                }}
              >
                {TRIMESTERS.map((tri) => (
                  <option key={tri} value={tri} style={{ background: "#0f172a", color: "#fff" }}>
                    {tri}
                  </option>
                ))}
              </select>
            </div>

            {/* GPA Dual Column */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "1rem",
              }}
            >
              <div>
                <label
                  htmlFor="currentGpaInput"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "0.88rem",
                    fontWeight: 600,
                    color: "#f3f4f6",
                    marginBottom: "0.5rem",
                  }}
                >
                  <Award size={16} style={{ color: "#F26522" }} />
                  Current CGPA
                </label>
                <input
                  id="currentGpaInput"
                  type="number"
                  step="0.01"
                  min="0.00"
                  max="4.00"
                  placeholder="e.g. 3.45"
                  value={currentGpa}
                  onChange={(e) => setCurrentGpa(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    borderRadius: "10px",
                    background: "rgba(10, 15, 25, 0.8)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    color: "#ffffff",
                    fontSize: "0.95rem",
                    outline: "none",
                  }}
                />
              </div>

              <div>
                <label
                  htmlFor="targetGpaInput"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "0.88rem",
                    fontWeight: 600,
                    color: "#f3f4f6",
                    marginBottom: "0.5rem",
                  }}
                >
                  <Target size={16} style={{ color: "#10B981" }} />
                  Target Goal CGPA
                </label>
                <input
                  id="targetGpaInput"
                  type="number"
                  step="0.01"
                  min="0.00"
                  max="4.00"
                  placeholder="e.g. 3.85"
                  value={targetGpa}
                  onChange={(e) => setTargetGpa(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    borderRadius: "10px",
                    background: "rgba(10, 15, 25, 0.8)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    color: "#ffffff",
                    fontSize: "0.95rem",
                    outline: "none",
                  }}
                />
              </div>
            </div>

            {/* Credits Dual Column */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "1rem",
              }}
            >
              <div>
                <label
                  htmlFor="completedCreditsInput"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "0.88rem",
                    fontWeight: 600,
                    color: "#f3f4f6",
                    marginBottom: "0.5rem",
                  }}
                >
                  <Zap size={16} style={{ color: "#F59E0B" }} />
                  Completed Credits
                </label>
                <input
                  id="completedCreditsInput"
                  type="number"
                  step="0.5"
                  min="0"
                  placeholder="e.g. 45"
                  value={completedCredits}
                  onChange={(e) => setCompletedCredits(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    borderRadius: "10px",
                    background: "rgba(10, 15, 25, 0.8)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    color: "#ffffff",
                    fontSize: "0.95rem",
                    outline: "none",
                  }}
                />
              </div>

              <div>
                <label
                  htmlFor="totalCreditsInput"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "0.88rem",
                    fontWeight: 600,
                    color: "#f3f4f6",
                    marginBottom: "0.5rem",
                  }}
                >
                  <GraduationCap size={16} style={{ color: "#6366F1" }} />
                  Total Degree Credits
                </label>
                <input
                  id="totalCreditsInput"
                  type="number"
                  step="0.5"
                  min="1"
                  placeholder="e.g. 140"
                  value={totalCredits}
                  onChange={(e) => setTotalCredits(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    borderRadius: "10px",
                    background: "rgba(10, 15, 25, 0.8)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    color: "#ffffff",
                    fontSize: "0.95rem",
                    outline: "none",
                  }}
                />
              </div>
            </div>

            {/* Opt-in Leaderboard */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "1rem",
                borderRadius: "12px",
                background: "rgba(242, 101, 34, 0.06)",
                border: "1px solid rgba(242, 101, 34, 0.2)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Trophy size={20} style={{ color: "#F59E0B" }} />
                <div>
                  <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#ffffff" }}>
                    Join Scholar Leaderboard
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "#94a3b8" }}>
                    Compete on study streaks and study hours with fellow students.
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={optInLeaderboard}
                onChange={(e) => setOptInLeaderboard(e.target.checked)}
                style={{
                  width: "20px",
                  height: "20px",
                  accentColor: "#F26522",
                  cursor: "pointer",
                }}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              style={{
                marginTop: "0.5rem",
                padding: "0.9rem",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #F26522 0%, #EA580C 100%)",
                border: "none",
                color: "#ffffff",
                fontSize: "1rem",
                fontWeight: 700,
                cursor: submitting ? "not-allowed" : "pointer",
                boxShadow: "0 8px 24px rgba(242, 101, 34, 0.35)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                transition: "transform 0.15s ease",
              }}
            >
              <Sparkles size={18} />
              {submitting ? "Saving Profile..." : "Save & Launch StudentBrain"}
              <ChevronRight size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
