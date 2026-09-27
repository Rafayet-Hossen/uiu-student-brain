import { useState, useId } from "react";
import { useNavigate } from "react-router-dom";
import {
  Award,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  Flame,
  GraduationCap,
  Sparkles,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Button from "../../../components/Button";
import FormError from "../../../components/FormError";
import { submitOnboarding, extractErrorMessage } from "../api";
import { useAuth } from "../useAuth";

const DEPARTMENTS = [
  "Computer Science & Engineering (CSE)",
  "Software Engineering (SE)",
  "Data Science & AI",
  "Electrical & Electronic Engineering (EEE)",
  "Business Administration (BBA)",
  "Economics",
  "Media Studies & Journalism",
  "Other Department / Major",
];

const TOTAL_CREDIT_PRESETS = [136, 140, 144, 148, 160];

export default function AcademicOnboardingModal({ isOpen = true, onClose, onComplete }) {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  // Form states
  const [currentGpa, setCurrentGpa] = useState(
    user?.current_gpa ? String(user.current_gpa) : "3.50",
  );
  const [targetGpa, setTargetGpa] = useState(
    user?.target_gpa ? String(user.target_gpa) : "3.85",
  );
  const [completedCredits, setCompletedCredits] = useState(
    user?.completed_credits !== null && user?.completed_credits !== undefined
      ? String(user.completed_credits)
      : "30",
  );
  const [totalCredits, setTotalCredits] = useState(
    user?.total_credits ? String(user.total_credits) : "140",
  );
  const [optInLeaderboard, setOptInLeaderboard] = useState(true);
  const [department, setDepartment] = useState(
    user?.department || "Computer Science & Engineering (CSE)",
  );

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const currentGpaNum = parseFloat(currentGpa) || 0;
  const targetGpaNum = parseFloat(targetGpa) || 0;
  const completedCrNum = parseFloat(completedCredits) || 0;
  const totalCrNum = parseFloat(totalCredits) || 140;
  const remainingCr = Math.max(0, totalCrNum - completedCrNum);
  const progressPercent = totalCrNum > 0 ? Math.min(100, Math.round((completedCrNum / totalCrNum) * 100)) : 0;

  const handleQuickCurrentGpa = (val) => setCurrentGpa(val.toFixed(2));
  const handleQuickTargetGpa = (val) => setTargetGpa(val.toFixed(2));
  const handleQuickCompleted = (val) => setCompletedCredits(String(val));

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError("");

    // Validate inputs
    if (currentGpaNum < 0 || currentGpaNum > 4.0) {
      setError("Current CGPA must be between 0.00 and 4.00.");
      return;
    }
    if (targetGpaNum < 0 || targetGpaNum > 4.0) {
      setError("Target CGPA Goal must be between 0.00 and 4.00.");
      return;
    }
    if (completedCrNum < 0) {
      setError("Completed credits cannot be negative.");
      return;
    }
    if (totalCrNum <= 0) {
      setError("Total degree credits must be greater than 0.");
      return;
    }
    if (completedCrNum > totalCrNum) {
      setError("Completed credits cannot exceed total degree credits.");
      return;
    }

    setSubmitting(true);
    try {
      await submitOnboarding({
        current_gpa: currentGpaNum,
        target_gpa: targetGpaNum,
        completed_credits: completedCrNum,
        total_credits: totalCrNum,
        opt_in_leaderboard: optInLeaderboard,
        department: department.trim(),
      });

      if (refreshUser) {
        await refreshUser();
      }

      if (onComplete) {
        onComplete();
      } else {
        navigate("/dashboard", { replace: true });
      }
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = async () => {
    setSubmitting(true);
    try {
      await submitOnboarding({
        current_gpa: currentGpaNum || 3.5,
        target_gpa: targetGpaNum || 3.8,
        completed_credits: completedCrNum || 0,
        total_credits: totalCrNum || 140,
        opt_in_leaderboard: true,
        department: department || "General",
      });
      if (refreshUser) await refreshUser();
    } catch {
      // Non-blocking skip
    } finally {
      setSubmitting(false);
      if (onClose) onClose();
      navigate("/dashboard", { replace: true });
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="modal-backdrop academic-onboarding-backdrop" role="dialog" aria-modal="true">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="modal-content-card academic-onboarding-card"
        >
          {/* Top Brand Banner */}
          <div className="onboarding-banner-row">
            <div className="onboarding-brand-badge">
              <GraduationCap size={22} className="text-white" />
            </div>
            <div className="onboarding-header-meta">
              <div className="flex items-center gap-2">
                <span className="onboarding-step-chip">Step 1 of 1 • Academic Setup</span>
                <span className="onboarding-sparkle-tag">
                  <Sparkles size={12} /> AI Personalization
                </span>
              </div>
              <h2 className="onboarding-main-title">
                Welcome, {user?.full_name?.split(" ")[0] || "Scholar"}! 🎓
              </h2>
              <p className="onboarding-subtitle">
                Set up your academic targets, completed credits, and leaderboard preferences to tailor your personalized study dashboard.
              </p>
            </div>
          </div>

          {error && <FormError message={error} className="onboarding-error-box" />}

          {/* Live Academic Road-map Preview Card */}
          <div className="onboarding-preview-pill-card">
            <div className="preview-stat-item">
              <span className="preview-stat-label">🎓 Current CGPA</span>
              <strong className="preview-stat-val text-primary">
                {currentGpaNum.toFixed(2)}
              </strong>
            </div>
            <div className="preview-divider" />
            <div className="preview-stat-item">
              <span className="preview-stat-label">🎯 Target Goal</span>
              <strong className="preview-stat-val text-accent">
                {targetGpaNum.toFixed(2)}
              </strong>
            </div>
            <div className="preview-divider" />
            <div className="preview-stat-item">
              <span className="preview-stat-label">📊 Degree Progress</span>
              <strong className="preview-stat-val text-emerald">
                {completedCrNum} / {totalCrNum} cr ({progressPercent}%)
              </strong>
            </div>
          </div>

          {/* Main Question Form */}
          <form onSubmit={handleSubmit} className="onboarding-form-body" noValidate>
            {/* Row 1: CGPA Goals */}
            <div className="onboarding-grid-2col">
              {/* Question 1: Current CGPA */}
              <div className="onboarding-field-box">
                <label className="onboarding-field-label">
                  🎓 1. Current Cumulative CGPA
                </label>
                <div className="onboarding-input-wrap">
                  <input
                    type="number"
                    step="0.01"
                    min="0.00"
                    max="4.00"
                    value={currentGpa}
                    onChange={(e) => setCurrentGpa(e.target.value)}
                    placeholder="e.g. 3.50"
                    className="onboarding-input-control"
                    required
                    disabled={submitting}
                  />
                  <span className="onboarding-input-suffix">/ 4.00</span>
                </div>
                {/* Quick Presets */}
                <div className="onboarding-quick-pills">
                  {[3.0, 3.25, 3.5, 3.75, 4.0].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleQuickCurrentGpa(val)}
                      className={`onboarding-quick-pill ${currentGpaNum === val ? "pill-active" : ""}`}
                    >
                      {val.toFixed(2)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question 2: Target CGPA */}
              <div className="onboarding-field-box">
                <label className="onboarding-field-label">
                  🎯 2. Target CGPA Goal
                </label>
                <div className="onboarding-input-wrap">
                  <input
                    type="number"
                    step="0.01"
                    min="0.00"
                    max="4.00"
                    value={targetGpa}
                    onChange={(e) => setTargetGpa(e.target.value)}
                    placeholder="e.g. 3.85"
                    className="onboarding-input-control"
                    required
                    disabled={submitting}
                  />
                  <span className="onboarding-input-suffix">/ 4.00</span>
                </div>
                {/* Quick Presets */}
                <div className="onboarding-quick-pills">
                  {[3.5, 3.7, 3.85, 3.95, 4.0].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleQuickTargetGpa(val)}
                      className={`onboarding-quick-pill ${targetGpaNum === val ? "pill-active" : ""}`}
                    >
                      {val.toFixed(2)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Row 2: Completed & Total Credits */}
            <div className="onboarding-grid-2col">
              {/* Question 3: Completed Credits */}
              <div className="onboarding-field-box">
                <label className="onboarding-field-label">
                  ✅ 3. Completed Degree Credits
                </label>
                <div className="onboarding-input-wrap">
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max={totalCrNum}
                    value={completedCredits}
                    onChange={(e) => setCompletedCredits(e.target.value)}
                    placeholder="e.g. 45"
                    className="onboarding-input-control"
                    required
                    disabled={submitting}
                  />
                  <span className="onboarding-input-suffix">Credits</span>
                </div>
                {/* Quick Credit Presets */}
                <div className="onboarding-quick-pills">
                  {[0, 24, 45, 75, 105].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleQuickCompleted(val)}
                      className={`onboarding-quick-pill ${completedCrNum === val ? "pill-active" : ""}`}
                    >
                      {val === 0 ? "0 (Freshman)" : `${val} cr`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question 4: Total Degree Credits */}
              <div className="onboarding-field-box">
                <label className="onboarding-field-label">
                  📚 4. Total Degree Credits Required
                </label>
                <div className="onboarding-input-wrap">
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={totalCredits}
                    onChange={(e) => setTotalCredits(e.target.value)}
                    placeholder="e.g. 140"
                    className="onboarding-input-control"
                    required
                    disabled={submitting}
                  />
                  <span className="onboarding-input-suffix">Total</span>
                </div>
                {/* Quick Presets */}
                <div className="onboarding-quick-pills">
                  {TOTAL_CREDIT_PRESETS.map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setTotalCredits(String(val))}
                      className={`onboarding-quick-pill ${totalCrNum === val ? "pill-active" : ""}`}
                    >
                      {val} cr
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Row 3: Department / Major Selection */}
            <div className="onboarding-field-box">
              <label className="onboarding-field-label">
                🏫 5. Academic Department / Major
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="onboarding-input-control onboarding-select-control"
                disabled={submitting}
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            {/* Question 6: Scholar Leaderboard Opt-In Toggle Card */}
            <div
              className={`onboarding-leaderboard-toggle-card ${optInLeaderboard ? "leaderboard-opted-in" : ""}`}
              onClick={() => setOptInLeaderboard(!optInLeaderboard)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setOptInLeaderboard(!optInLeaderboard);
                }
              }}
            >
              <div className="leaderboard-toggle-left">
                <div className="leaderboard-icon-badge">
                  <Trophy size={20} className={optInLeaderboard ? "text-amber" : "text-muted"} />
                </div>
                <div className="leaderboard-text-meta">
                  <strong className="leaderboard-title">
                    🏆 6. Join UIU Scholar Leaderboard & Streaks
                  </strong>
                  <p className="leaderboard-desc">
                    Showcase your weekly study streaks and XP rankings on the campus community leaderboard. (You can toggle this anytime in profile settings).
                  </p>
                </div>
              </div>

              <div className="leaderboard-toggle-action">
                <span className={`leaderboard-status-pill ${optInLeaderboard ? "status-opted-in" : "status-opted-out"}`}>
                  {optInLeaderboard ? "✓ Opted In" : "✕ Hidden"}
                </span>
              </div>
            </div>

            {/* Footer Action Buttons */}
            <div className="onboarding-footer-row">
              <button
                type="button"
                onClick={handleSkip}
                className="onboarding-skip-btn"
                disabled={submitting}
              >
                Skip for now
              </button>

              <Button
                type="submit"
                loading={submitting}
                disabled={submitting}
                className="onboarding-submit-btn"
                icon={ChevronRight}
              >
                {submitting ? "Personalizing..." : "Save & Launch Dashboard 🚀"}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
