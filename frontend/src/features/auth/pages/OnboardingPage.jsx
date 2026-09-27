import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Award,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Compass,
  GraduationCap,
  Layers,
  Sparkles,
  Target,
  Trophy,
  Users,
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
  "Data Science",
  "Software Engineering",
  "Electrical & Electronic Engineering (EEE)",
  "Bachelor of Business Administration (BBA)",
  "Civil Engineering",
  "Economics",
  "Media & Journalism",
  "General / Other",
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
  "12th Trimester (Graduating)",
];

export default function OnboardingPage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [currentGpa, setCurrentGpa] = useState(
    user?.current_gpa !== null && user?.current_gpa !== undefined
      ? String(user.current_gpa)
      : "3.50",
  );
  const [targetGpa, setTargetGpa] = useState(
    user?.target_gpa !== null && user?.target_gpa !== undefined
      ? String(user.target_gpa)
      : "3.80",
  );
  const [completedCredits, setCompletedCredits] = useState(
    user?.completed_credits !== null && user?.completed_credits !== undefined
      ? String(user.completed_credits)
      : "30",
  );
  const [totalCredits, setTotalCredits] = useState(
    user?.total_credits !== null && user?.total_credits !== undefined
      ? String(user.total_credits)
      : "140",
  );
  const [department, setDepartment] = useState(
    user?.department || "Computer Science & Engineering (CSE)",
  );
  const [currentTrimester, setCurrentTrimester] = useState(
    user?.current_trimester || "5th Trimester",
  );
  const [optInLeaderboard, setOptInLeaderboard] = useState(
    user?.opt_in_leaderboard ?? true,
  );

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const numCurrent = parseFloat(currentGpa) || 0;
  const numTarget = parseFloat(targetGpa) || 0;
  const numCompleted = parseFloat(completedCredits) || 0;
  const numTotal = parseFloat(totalCredits) || 140;

  const percentComplete = Math.min(
    100,
    Math.max(0, Math.round((numCompleted / (numTotal || 140)) * 100)),
  );
  const gpaGap = Math.max(0, numTarget - numCurrent).toFixed(2);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (numCurrent < 0 || numCurrent > 4.0) {
      setFormError("Current CGPA must be between 0.00 and 4.00.");
      return;
    }

    if (numTarget < 0 || numTarget > 4.0) {
      setFormError("Target CGPA must be between 0.00 and 4.00.");
      return;
    }

    if (numCompleted < 0) {
      setFormError("Completed credits cannot be negative.");
      return;
    }

    if (numCompleted > numTotal) {
      setFormError("Completed credits cannot exceed total degree credits.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        current_gpa: numCurrent,
        target_gpa: numTarget,
        completed_credits: numCompleted,
        total_credits: numTotal,
        department,
        current_trimester: currentTrimester,
        opt_in_leaderboard: optInLeaderboard,
      };

      const updated = await completeOnboarding(payload);
      if (updateUser) {
        updateUser(updated);
      }
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setFormError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="onboarding-screen-wrapper">
      {/* Top Brand Bar */}
      <header className="onboarding-top-bar">
        <div className="onboarding-brand">
          <StudentBrainLogo size={32} />
          <span className="onboarding-brand-name">
            Student<span className="brand-accent-text">Brain</span>
          </span>
        </div>
        <div className="onboarding-top-right">
          <ThemeToggle />
        </div>
      </header>

      {/* Main Container */}
      <main className="onboarding-main-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="onboarding-card-box"
        >
          {/* Header Badge & Title */}
          <div className="onboarding-header">
            <div className="onboarding-pill-badge">
              <Sparkles size={14} className="text-orange" />
              <span>Step 1 of 1 • Academic Calibration</span>
            </div>
            <h1 className="onboarding-title">Welcome, Scholar! 👋</h1>
            <p className="onboarding-subtitle">
              Set up your academic profile to calibrate your personalized GPA
              trajectory, degree progress tracker, and AI study schedules.
            </p>
          </div>

          {formError && <FormError message={formError} className="mb-4" />}

          {/* Form */}
          <form onSubmit={handleSubmit} className="onboarding-form">
            {/* Grid 1: CGPA Target & Current */}
            <div className="onboarding-grid-2">
              <div className="form-group mb-3">
                <label className="onboarding-field-label">
                  <Target size={14} className="text-orange inline mr-1" />
                  Current CGPA *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="4.00"
                  value={currentGpa}
                  onChange={(e) => setCurrentGpa(e.target.value)}
                  placeholder="e.g. 3.65"
                  className="form-input form-input-lg"
                  required
                />
                <span className="onboarding-helper-text">
                  Your current cumulative GPA (0.00 – 4.00)
                </span>
              </div>

              <div className="form-group mb-3">
                <label className="onboarding-field-label">
                  <Award size={14} className="text-emerald inline mr-1" />
                  Target Goal CGPA *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="4.00"
                  value={targetGpa}
                  onChange={(e) => setTargetGpa(e.target.value)}
                  placeholder="e.g. 3.85"
                  className="form-input form-input-lg"
                  required
                />
                <span className="onboarding-helper-text">
                  Your graduation goal or next milestone
                </span>
              </div>
            </div>

            {/* Grid 2: Completed Credits & Total Credits */}
            <div className="onboarding-grid-2">
              <div className="form-group mb-3">
                <label className="onboarding-field-label">
                  <BookOpen size={14} className="text-indigo inline mr-1" />
                  Completed Credits *
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="250"
                  value={completedCredits}
                  onChange={(e) => setCompletedCredits(e.target.value)}
                  placeholder="e.g. 45"
                  className="form-input form-input-lg"
                  required
                />
                <span className="onboarding-helper-text">
                  Credits completed prior to this semester
                </span>
              </div>

              <div className="form-group mb-3">
                <label className="onboarding-field-label">
                  <Layers size={14} className="text-blue inline mr-1" />
                  Total Degree Credits *
                </label>
                <input
                  type="number"
                  step="1"
                  min="30"
                  max="250"
                  value={totalCredits}
                  onChange={(e) => setTotalCredits(e.target.value)}
                  placeholder="140"
                  className="form-input form-input-lg"
                  required
                />
                <span className="onboarding-helper-text">
                  Total credits required for degree (e.g. 140 for UIU CSE)
                </span>
              </div>
            </div>

            {/* Grid 3: Department & Current Trimester */}
            <div className="onboarding-grid-2">
              <div className="form-group mb-3">
                <label className="onboarding-field-label">
                  <GraduationCap size={14} className="text-purple inline mr-1" />
                  Academic Department *
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="form-input form-input-lg"
                  required
                >
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group mb-3">
                <label className="onboarding-field-label">
                  <Compass size={14} className="text-amber inline mr-1" />
                  Current Semester / Trimester *
                </label>
                <select
                  value={currentTrimester}
                  onChange={(e) => setCurrentTrimester(e.target.value)}
                  className="form-input form-input-lg"
                  required
                >
                  {TRIMESTERS.map((tri) => (
                    <option key={tri} value={tri}>
                      {tri}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Live Progress Preview Card */}
            <div className="onboarding-live-preview-card mb-4">
              <div className="preview-top-row">
                <div>
                  <span className="preview-kpi-label">DEGREE COMPLETION</span>
                  <div className="preview-kpi-val">
                    {percentComplete}% Complete
                  </div>
                </div>
                <div className="text-right">
                  <span className="preview-kpi-label">TARGET GAP</span>
                  <div className="preview-kpi-val text-orange">
                    +{gpaGap} GPA
                  </div>
                </div>
              </div>
              <div className="preview-progress-track">
                <motion.div
                  className="preview-progress-fill"
                  initial={{ width: 0 }}
                  animate={{ width: `${percentComplete}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted mt-1.5 font-medium">
                <span>{numCompleted} Credits Done</span>
                <span>{Math.max(0, numTotal - numCompleted)} Credits Remaining</span>
              </div>
            </div>

            {/* Leaderboard Opt-In Switch Card */}
            <div
              className={`onboarding-toggle-card ${
                optInLeaderboard ? "toggle-card-active" : ""
              }`}
              onClick={() => setOptInLeaderboard(!optInLeaderboard)}
            >
              <div className="toggle-card-left">
                <div className="toggle-icon-pill">
                  <Trophy size={18} className="text-amber" />
                </div>
                <div>
                  <strong className="toggle-card-title">
                    Opt-in to Scholar Community Leaderboard
                  </strong>
                  <p className="toggle-card-desc">
                    Show your focus streak badges and earn academic XP alongside
                    fellow university scholars.
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={optInLeaderboard}
                onChange={(e) => setOptInLeaderboard(e.target.checked)}
                className="onboarding-switch-checkbox"
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            {/* Submit Button */}
            <div className="onboarding-submit-wrap mt-4">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={submitting}
                disabled={submitting}
                className="onboarding-submit-btn"
              >
                <span>Save Profile & Launch Dashboard</span>
                <ChevronRight size={18} />
              </Button>
            </div>
          </form>
        </motion.div>
      </main>
    </div>
  );
}
