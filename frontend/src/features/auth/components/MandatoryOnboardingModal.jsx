import { useState } from "react";
import {
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  GraduationCap,
  Sparkles,
  Target,
  User as UserIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import Button from "../../../components/Button";
import FormError from "../../../components/FormError";
import ScholarAvatar from "./ScholarAvatar";
import { updateProfile } from "../api";
import { useAuth } from "../useAuth";

const DEPARTMENTS = [
  "Computer Science & Engineering (CSE)",
  "Software Engineering (SE)",
  "Data Science (DS)",
  "Electrical & Electronic Engineering (EEE)",
  "Civil Engineering (CE)",
  "Bachelor of Business Administration (BBA)",
  "Economics (ECO)",
  "Media Studies & Journalism (MSJ)",
  "English",
  "Environment and Development Studies (EDS)",
  "Other / Multidisciplinary",
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
  "Alumni / Completed",
];

const DAILY_FOCUS_OPTIONS = [
  { value: 60, label: "60 mins (1 hr / day)" },
  { value: 90, label: "90 mins (1.5 hrs / day)" },
  { value: 120, label: "120 mins (2 hrs / day - Standard)" },
  { value: 180, label: "180 mins (3 hrs / day - Intensive)" },
  { value: 240, label: "240 mins (4 hrs / day - Scholar Focus)" },
  { value: 300, label: "300+ mins (5+ hrs / day)" },
];

export default function MandatoryOnboardingModal() {
  const { user, updateUser } = useAuth();

  const [fullName, setFullName] = useState(user?.full_name || "");
  const [department, setDepartment] = useState(user?.department || "");
  const [currentTrimester, setCurrentTrimester] = useState(
    user?.current_trimester || "1st Trimester",
  );
  const [currentGpa, setCurrentGpa] = useState(() =>
    user?.current_gpa !== null && user?.current_gpa !== undefined
      ? String(user.current_gpa)
      : "",
  );
  const [targetGpa, setTargetGpa] = useState(() =>
    user?.target_gpa !== null && user?.target_gpa !== undefined
      ? String(user.target_gpa)
      : "3.80",
  );
  const [targetDailyMinutes, setTargetDailyMinutes] = useState(
    user?.target_daily_minutes || 120,
  );
  const [bio, setBio] = useState(user?.bio || "");
  const [optInLeaderboard, setOptInLeaderboard] = useState(
    user?.opt_in_leaderboard !== false,
  );

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!fullName.trim()) {
      setFormError("Please enter your full name.");
      return;
    }
    if (!department) {
      setFormError("Please select your academic department / major.");
      return;
    }
    if (!currentTrimester) {
      setFormError("Please select your current trimester level.");
      return;
    }

    let parsedCurrentGpa = null;
    if (currentGpa.trim() !== "") {
      parsedCurrentGpa = parseFloat(currentGpa);
      if (isNaN(parsedCurrentGpa) || parsedCurrentGpa < 0 || parsedCurrentGpa > 4.0) {
        setFormError("Current CGPA must be between 0.00 and 4.00.");
        return;
      }
    }

    let parsedTargetGpa = 3.8;
    if (targetGpa.trim() !== "") {
      parsedTargetGpa = parseFloat(targetGpa);
      if (isNaN(parsedTargetGpa) || parsedTargetGpa < 1.0 || parsedTargetGpa > 4.0) {
        setFormError("Target CGPA must be between 1.00 and 4.00.");
        return;
      }
    }

    setSubmitting(true);
    setFormError("");

    try {
      const payload = {
        full_name: fullName.trim(),
        department,
        current_trimester: currentTrimester,
        current_gpa: parsedCurrentGpa,
        target_gpa: parsedTargetGpa,
        target_daily_minutes: parseInt(targetDailyMinutes, 10) || 120,
        bio: bio.trim(),
        opt_in_leaderboard: optInLeaderboard,
        is_onboarded: true,
      };

      const updated = await updateProfile(payload);
      updateUser(updated);
    } catch (err) {
      console.error("Onboarding setup failed:", err);
      setFormError(
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          "Failed to complete profile setup. Please verify your entries.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="modal-backdrop"
      style={{
        zIndex: 99999,
        background: "rgba(15, 23, 42, 0.85)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        padding: "16px",
      }}
    >
      <motion.div
        className="modal-content-card"
        style={{
          maxWidth: "580px",
          width: "100%",
          padding: "24px 22px",
          borderRadius: "var(--radius-xl)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4)",
        }}
        initial={{ scale: 0.92, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
      >
        {/* Header Ribbon */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "14px",
            marginBottom: "16px",
            paddingBottom: "16px",
            borderBottom: "1px solid var(--color-border-subtle)",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background:
                "linear-gradient(135deg, var(--color-primary), #8b5cf6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              flexShrink: 0,
              boxShadow: "0 8px 16px -4px rgba(99, 102, 241, 0.35)",
            }}
          >
            <GraduationCap size={26} />
          </div>

          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                background: "rgba(99, 102, 241, 0.12)",
                color: "var(--color-primary)",
                padding: "2px 8px",
                borderRadius: "var(--radius-full)",
                fontSize: "0.6875rem",
                fontWeight: 700,
                marginBottom: "4px",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              <Sparkles size={11} />
              <span>Mandatory Academic Setup</span>
            </div>
            <h2
              style={{
                margin: 0,
                fontSize: "1.25rem",
                fontWeight: 800,
                color: "var(--color-text)",
                lineHeight: 1.25,
              }}
            >
              Complete Your Scholar Profile
            </h2>
            <p
              style={{
                margin: "4px 0 0",
                fontSize: "0.8125rem",
                color: "var(--color-text-muted)",
              }}
            >
              Please enter your department and academic targets to activate AI Study Brain.
            </p>
          </div>
        </div>

        {formError && (
          <div style={{ marginBottom: "14px" }}>
            <FormError message={formError} />
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "14px" }}
        >
          {/* Full Name & Department */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
              gap: "12px",
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "5px",
                  fontWeight: 600,
                  fontSize: "0.8125rem",
                  color: "var(--color-text)",
                }}
              >
                Full Name *
              </label>
              <input
                type="text"
                className="form-input-control"
                placeholder="e.g. Sourav Saha"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "5px",
                  fontWeight: 600,
                  fontSize: "0.8125rem",
                  color: "var(--color-text)",
                }}
              >
                Department / Program *
              </label>
              <select
                className="form-input-control"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                required
              >
                <option value="">-- Select Your Department --</option>
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Current Trimester & Daily Focus Goal */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
              gap: "12px",
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "5px",
                  fontWeight: 600,
                  fontSize: "0.8125rem",
                  color: "var(--color-text)",
                }}
              >
                Current Trimester Level *
              </label>
              <select
                className="form-input-control"
                value={currentTrimester}
                onChange={(e) => setCurrentTrimester(e.target.value)}
                required
              >
                {TRIMESTERS.map((tri) => (
                  <option key={tri} value={tri}>
                    {tri}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "5px",
                  fontWeight: 600,
                  fontSize: "0.8125rem",
                  color: "var(--color-text)",
                }}
              >
                Daily Focus Study Goal *
              </label>
              <select
                className="form-input-control"
                value={targetDailyMinutes}
                onChange={(e) => setTargetDailyMinutes(e.target.value)}
                required
              >
                {DAILY_FOCUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Current CGPA & Target CGPA */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "5px",
                  fontWeight: 600,
                  fontSize: "0.8125rem",
                  color: "var(--color-text)",
                }}
              >
                Current CGPA (0.00 - 4.00)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="4"
                className="form-input-control"
                placeholder="e.g. 3.25 (or 0 for 1st tri)"
                value={currentGpa}
                onChange={(e) => setCurrentGpa(e.target.value)}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "5px",
                  fontWeight: 600,
                  fontSize: "0.8125rem",
                  color: "var(--color-text)",
                }}
              >
                Target CGPA Goal *
              </label>
              <input
                type="number"
                step="0.01"
                min="1"
                max="4"
                className="form-input-control"
                placeholder="e.g. 3.85"
                value={targetGpa}
                onChange={(e) => setTargetGpa(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Bio / Scholar Tagline */}
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "5px",
                fontWeight: 600,
                fontSize: "0.8125rem",
                color: "var(--color-text)",
              }}
            >
              Scholar Bio & Tagline (Optional)
            </label>
            <input
              type="text"
              className="form-input-control"
              placeholder="e.g. UIU 9th Trimester | Aspiring Software Engineer"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={180}
            />
          </div>

          {/* Community Leaderboard Opt-In Checkbox */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px 12px",
              borderRadius: "var(--radius-md)",
              background: "var(--color-surface-subtle)",
              border: "1px solid var(--color-border-subtle)",
              marginTop: "2px",
            }}
          >
            <input
              type="checkbox"
              id="onboarding-opt-leaderboard"
              checked={optInLeaderboard}
              onChange={(e) => setOptInLeaderboard(e.target.checked)}
              style={{
                width: "16px",
                height: "16px",
                accentColor: "var(--color-primary)",
                cursor: "pointer",
              }}
            />
            <label
              htmlFor="onboarding-opt-leaderboard"
              style={{
                fontSize: "0.8125rem",
                color: "var(--color-text)",
                cursor: "pointer",
                lineHeight: 1.4,
              }}
            >
              <strong>Join Scholar Leaderboard & Student Directory</strong> (Show
              study streak and progress to fellow university peers)
            </label>
          </div>

          {/* Submit Action Button */}
          <div style={{ marginTop: "6px" }}>
            <Button
              type="submit"
              variant="primary"
              loading={submitting}
              icon={CheckCircle2}
              style={{
                width: "100%",
                justifyContent: "center",
                padding: "12px",
                fontWeight: 700,
                fontSize: "0.9375rem",
              }}
            >
              Save & Start Learning
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
