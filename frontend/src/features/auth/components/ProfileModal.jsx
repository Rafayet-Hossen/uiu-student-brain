import { useEffect, useRef, useState } from "react";
import {
  Award,
  Calendar,
  Camera,
  CheckCircle2,
  Image as ImageIcon,
  Sparkles,
  Trash2,
  Upload,
  User as UserIcon,
  X,
} from "lucide-react";
import Badge from "../../../components/Badge";
import Button from "../../../components/Button";
import FormError from "../../../components/FormError";
import Input from "../../../components/Input";
import Spinner from "../../../components/Spinner";
import ThemeToggle from "../../../components/ThemeToggle";
import { extractErrorMessage, getProfileSummary, updateProfile } from "../api";
import {
  AVATAR_PRESETS,
  getScholarAvatar,
  setScholarAvatar,
} from "../avatarHelper";
import ScholarAvatar from "./ScholarAvatar";
import { useAuth } from "../useAuth";

function ToggleSwitch({ checked, onChange, id, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      id={id}
      onClick={() => onChange(!checked)}
      className={`settings-toggle-switch ${checked ? "is-checked" : ""}`}
      title={label || (checked ? "Enabled" : "Disabled")}
    >
      <span className="toggle-switch-track">
        <span className="toggle-switch-thumb" />
      </span>
    </button>
  );
}

export default function ProfileModal({ initialTab = "settings", onClose }) {
  const { user, updateUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState(() => {
    if (initialTab === "performance") return "performance";
    if (initialTab === "profile") return "profile";
    return "settings";
  });

  const [fullName, setFullName] = useState(user?.full_name || "");
  const [department, setDepartment] = useState(user?.department || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [targetDailyMinutes, setTargetDailyMinutes] = useState(
    user?.target_daily_minutes || 120,
  );

  const [currentAvatar, setCurrentAvatar] = useState(() =>
    getScholarAvatar(user),
  );

  const [currentGpa, setCurrentGpa] = useState(() =>
    user?.current_gpa !== null && user?.current_gpa !== undefined
      ? String(user.current_gpa)
      : "",
  );
  const [targetGpa, setTargetGpa] = useState(() =>
    user?.target_gpa !== null && user?.target_gpa !== undefined
      ? String(user.target_gpa)
      : "",
  );

  const [optInLeaderboard, setOptInLeaderboard] = useState(
    () => user?.opt_in_leaderboard ?? true
  );

  async function handleToggleLeaderboard(val) {
    setOptInLeaderboard(val);
    try {
      const updated = await updateProfile({ opt_in_leaderboard: val });
      updateUser(updated);
    } catch (err) {
      console.error("Failed to update leaderboard preference", err);
    }
  }

  const [notifAnnouncements, setNotifAnnouncements] = useState(() => {
    return (
      localStorage.getItem("student_brain_notif_announcements") !== "false"
    );
  });
  const [notifComments, setNotifComments] = useState(() => {
    return localStorage.getItem("student_brain_notif_comments") !== "false";
  });
  const [notifAcademic, setNotifAcademic] = useState(() => {
    return localStorage.getItem("student_brain_notif_academic") !== "false";
  });
  const [notifSound, setNotifSound] = useState(() => {
    return localStorage.getItem("student_brain_notif_sound") !== "false";
  });

  function handleToggleNotif(type) {
    if (type === "announcements") {
      const next = !notifAnnouncements;
      setNotifAnnouncements(next);
      localStorage.setItem("student_brain_notif_announcements", String(next));
    } else if (type === "comments") {
      const next = !notifComments;
      setNotifComments(next);
      localStorage.setItem("student_brain_notif_comments", String(next));
    } else if (type === "academic") {
      const next = !notifAcademic;
      setNotifAcademic(next);
      localStorage.setItem("student_brain_notif_academic", String(next));
    } else if (type === "sound") {
      const next = !notifSound;
      setNotifSound(next);
      localStorage.setItem("student_brain_notif_sound", String(next));
    }
    window.dispatchEvent(new Event("notificationPreferencesUpdated"));
  }

  const [summaryData, setSummaryData] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const fileInputRef = useRef(null);

  useEffect(() => {
    getProfileSummary()
      .then((data) => {
        setSummaryData(data);
        if (data.user) {
          setFullName(data.user.full_name || "");
          setDepartment(data.user.department || "");
          setBio(data.user.bio || "");
          setTargetDailyMinutes(data.user.target_daily_minutes || 120);
        }
        if (data.performance) {
          if (
            data.performance.current_cgpa !== null &&
            data.performance.current_cgpa !== undefined
          ) {
            setCurrentGpa(String(data.performance.current_cgpa));
          }
          if (
            data.performance.target_gpa !== null &&
            data.performance.target_gpa !== undefined
          ) {
            setTargetGpa(String(data.performance.target_gpa));
          }
        }
      })
      .catch((err) => console.error("Failed to fetch profile summary", err))
      .finally(() => setLoadingSummary(false));
  }, []);

  const joinedFormatted = user?.date_joined
    ? new Date(user.date_joined).toLocaleDateString(undefined, {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "Recently joined";

  function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file (PNG, JPG, WEBP).");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError("Image size exceeds 2MB limit.");
      return;
    }

    setError("");
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      setCurrentAvatar(dataUrl);
      setScholarAvatar(user, dataUrl);
      setSuccessMessage("Profile photo updated! 📸");
      setTimeout(() => setSuccessMessage(""), 2500);
    };
    reader.readAsDataURL(file);
  }

  function handleSelectPreset(presetId) {
    setCurrentAvatar(presetId);
    setScholarAvatar(user, presetId);
    setSuccessMessage("Avatar preset applied.");
    setTimeout(() => setSuccessMessage(""), 2500);
  }

  function handleRemoveAvatar() {
    setCurrentAvatar(null);
    setScholarAvatar(user, null);
    setSuccessMessage("Custom avatar reset to initials.");
    setTimeout(() => setSuccessMessage(""), 2500);
  }

  async function handleSaveProfile(e) {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setSaving(true);

    try {
      const payload = {
        full_name: fullName.trim(),
        department: department.trim(),
        bio: bio.trim(),
        target_daily_minutes: Number(targetDailyMinutes) || 120,
        current_gpa: currentGpa === "" ? null : parseFloat(currentGpa),
        target_gpa: targetGpa === "" ? null : parseFloat(targetGpa),
      };
      const updated = await updateProfile(payload);
      updateUser(updated);
      try {
        const freshSummary = await getProfileSummary();
        setSummaryData(freshSummary);
      } catch (e) {
        console.error("Failed to refresh profile summary", e);
      }
      setSuccessMessage("Profile details updated successfully.");
      setTimeout(() => {
        if (onClose) onClose();
      }, 400);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content-card profile-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header-row profile-modal-header">
          <div className="profile-header-user-row">
            <ScholarAvatar
              user={user}
              size={46}
              avatarOverride={currentAvatar}
            />
            <div className="profile-header-text-meta">
              <h3 className="profile-modal-title">
                {fullName || user?.full_name || "Scholar Profile"}
              </h3>
              <div className="profile-header-sub-meta">
                <span className="profile-email-text">{user?.email}</span>
                <span className="profile-meta-dot">•</span>
                <span className="profile-joined-tag">
                  <Calendar size={12} />
                  Joined {joinedFormatted}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="profile-modal-tabs-bar">
          <button
            type="button"
            className={`profile-modal-tab-btn ${activeTab === "profile" ? "tab-active" : ""}`}
            onClick={() => setActiveTab("profile")}
          >
            <span>👤 Edit Profile & Photo</span>
          </button>
          <button
            type="button"
            className={`profile-modal-tab-btn ${activeTab === "performance" ? "tab-active" : ""}`}
            onClick={() => {
              setActiveTab("performance");
              setLoadingSummary(true);
              getProfileSummary()
                .then((data) => setSummaryData(data))
                .catch((err) =>
                  console.error("Failed to refresh profile summary", err),
                )
                .finally(() => setLoadingSummary(false));
            }}
          >
            <span>📊 Overall Performance</span>
          </button>
          <button
            type="button"
            className={`profile-modal-tab-btn ${activeTab === "settings" ? "tab-active" : ""}`}
            onClick={() => setActiveTab("settings")}
          >
            <span>⚙️ Preferences & Account</span>
          </button>
        </div>

        {/* TAB 1: EDIT PROFILE & PHOTO */}
        {activeTab === "profile" && (
          <form
            onSubmit={handleSaveProfile}
            noValidate
            className="academic-form"
          >
            {error && (
              <FormError message={error} className="form-error-block" />
            )}
            {successMessage && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: "var(--radius-md)",
                  background: "rgba(16, 185, 129, 0.12)",
                  border: "1px solid #10b981",
                  color: "#10b981",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  marginBottom: "14px",
                }}
              >
                {successMessage}
              </div>
            )}

            {/* Profile Photo Uploader & Avatar Presets */}
            <div
              style={{
                background: "var(--color-surface-subtle)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-lg)",
                padding: "16px",
                marginBottom: "18px",
              }}
            >
              <label
                className="form-label"
                style={{
                  display: "block",
                  marginBottom: "10px",
                  fontWeight: 700,
                }}
              >
                📸 Profile Picture & Avatar
              </label>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  flexWrap: "wrap",
                  marginBottom: "14px",
                }}
              >
                <ScholarAvatar
                  user={user}
                  size={64}
                  avatarOverride={currentAvatar}
                />

                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: "none" }}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    icon={Camera}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Upload Custom Photo
                  </Button>
                  {currentAvatar && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      icon={Trash2}
                      onClick={handleRemoveAvatar}
                    >
                      Reset Photo
                    </Button>
                  )}
                </div>
              </div>

              {/* Avatar Presets */}
              <div>
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: "var(--color-text-muted)",
                    display: "block",
                    marginBottom: "8px",
                  }}
                >
                  Or choose an academic preset avatar:
                </span>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {AVATAR_PRESETS.map((preset) => {
                    const isSelected = currentAvatar === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleSelectPreset(preset.id)}
                        style={{
                          width: "38px",
                          height: "38px",
                          borderRadius: "50%",
                          background: preset.gradient,
                          border: isSelected
                            ? "3px solid var(--color-text)"
                            : "2px solid transparent",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "1.125rem",
                          transition: "transform 0.15s ease",
                          transform: isSelected ? "scale(1.1)" : "scale(1)",
                        }}
                        title={preset.label}
                      >
                        {preset.emoji}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="modal-grid-2col">
              <Input
                id="prof_name"
                label="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Alex Rivera"
                disabled={saving}
                required
              />

              <Input
                id="prof_dept"
                label="Department / Major"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Computer Science & Engineering"
                disabled={saving}
              />
            </div>

            <div className="form-group" style={{ marginBottom: "16px" }}>
              <label
                className="form-label"
                style={{ fontWeight: 600, fontSize: "0.8125rem" }}
              >
                🎯 Academic Bio & Goals
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Share your academic interests, research goals, or study focus..."
                rows={3}
                className="form-input-control"
                disabled={saving}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "var(--radius-md)",
                  resize: "vertical",
                }}
              />
            </div>

            <div className="modal-grid-2col" style={{ marginBottom: "16px" }}>
              <div className="form-group">
                <label
                  className="form-label"
                  style={{ fontWeight: 600, fontSize: "0.8125rem" }}
                >
                  🎓 Current CGPA (out of 4.00)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.00"
                  max="4.00"
                  value={currentGpa}
                  onChange={(e) => setCurrentGpa(e.target.value)}
                  placeholder="e.g. 3.75"
                  className="form-input-control"
                  disabled={saving}
                />
              </div>

              <div className="form-group">
                <label
                  className="form-label"
                  style={{ fontWeight: 600, fontSize: "0.8125rem" }}
                >
                  🎯 Target CGPA Goal (out of 4.00)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.00"
                  max="4.00"
                  value={targetGpa}
                  onChange={(e) => setTargetGpa(e.target.value)}
                  placeholder="e.g. 3.90"
                  className="form-input-control"
                  disabled={saving}
                />
              </div>
            </div>

            <div className="modal-grid-2col">
              <div className="form-group">
                <label
                  className="form-label"
                  style={{ fontWeight: 600, fontSize: "0.8125rem" }}
                >
                  ⏱️ Target Daily Study Goal (Minutes)
                </label>
                <select
                  value={targetDailyMinutes}
                  onChange={(e) =>
                    setTargetDailyMinutes(Number(e.target.value))
                  }
                  className="form-input-control"
                  disabled={saving}
                >
                  <option value={60}>60 minutes (1 hour / day)</option>
                  <option value={90}>90 minutes (1.5 hours / day)</option>
                  <option value={120}>120 minutes (2 hours / day)</option>
                  <option value={180}>180 minutes (3 hours / day)</option>
                  <option value={240}>240 minutes (4 hours / day)</option>
                </select>
              </div>

              <div className="form-group">
                <label
                  className="form-label"
                  style={{ fontWeight: 600, fontSize: "0.8125rem" }}
                >
                  📧 Account Email (Verified)
                </label>
                <input
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="form-input-control"
                  style={{
                    background: "var(--color-surface-subtle)",
                    color: "var(--color-text-muted)",
                  }}
                />
              </div>
            </div>

            <div className="modal-footer-row" style={{ marginTop: "18px" }}>
              <Button type="button" variant="secondary" onClick={onClose}>
                Close
              </Button>
              <Button type="submit" loading={saving} disabled={saving}>
                {saving ? "Saving..." : "Save Profile Changes"}
              </Button>
            </div>
          </form>
        )}

        {/* TAB 2: OVERALL PERFORMANCE & RANK */}
        {activeTab === "performance" && (
          <div>
            {loadingSummary ? (
              <div style={{ textAlign: "center", padding: "30px" }}>
                <Spinner standalone />
                <p
                  style={{
                    marginTop: "10px",
                    color: "var(--color-text-muted)",
                  }}
                >
                  Aggregating your academic performance metrics...
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                {/* 4 Highlight Metric Cards */}
                <div className="profile-metrics-grid">
                  <div className="profile-metric-item">
                    <span className="metric-item-lbl">Community Rank</span>
                    <strong
                      className="metric-item-val"
                      style={{ color: "var(--color-primary)" }}
                    >
                      🏆 #{summaryData?.performance?.community_rank || 1}
                    </strong>
                    <span className="metric-item-sub">
                      {summaryData?.performance?.total_xp || 0} XP
                    </span>
                  </div>

                  <div className="profile-metric-item">
                    <span className="metric-item-lbl">Academic CGPA</span>
                    <strong
                      className="metric-item-val"
                      style={{ color: "var(--color-text)" }}
                    >
                      🎓{" "}
                      {typeof summaryData?.performance?.current_cgpa ===
                      "number"
                        ? summaryData.performance.current_cgpa.toFixed(2)
                        : currentGpa
                          ? Number(currentGpa).toFixed(2)
                          : "N/A"}
                    </strong>
                    <span className="metric-item-sub">
                      Target:{" "}
                      {typeof summaryData?.performance?.target_gpa === "number"
                        ? summaryData.performance.target_gpa.toFixed(2)
                        : targetGpa
                          ? Number(targetGpa).toFixed(2)
                          : "3.50"}
                    </span>
                  </div>

                  <div className="profile-metric-item">
                    <span className="metric-item-lbl">Study Time</span>
                    <strong
                      className="metric-item-val"
                      style={{ color: "var(--color-text)" }}
                    >
                      ⏱️ {summaryData?.performance?.total_study_hours || 0}h
                    </strong>
                    <span className="metric-item-sub">
                      {summaryData?.performance?.total_sessions || 0} sessions
                    </span>
                  </div>

                  <div className="profile-metric-item">
                    <span className="metric-item-lbl">Active Streak</span>
                    <strong
                      className="metric-item-val"
                      style={{ color: "var(--color-accent)" }}
                    >
                      🔥 {summaryData?.performance?.current_streak_days || 0}{" "}
                      Days
                    </strong>
                    <span className="metric-item-sub">Consecutive habits</span>
                  </div>
                </div>

                {/* Module Highlights Row */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                    gap: "12px",
                  }}
                >
                  <div
                    style={{
                      background: "var(--color-surface)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "var(--radius-md)",
                      padding: "14px",
                    }}
                  >
                    <strong
                      style={{
                        fontSize: "0.9375rem",
                        display: "block",
                        marginBottom: "4px",
                      }}
                    >
                      📅 Study Routines
                    </strong>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "0.875rem",
                        color: "var(--color-text-muted)",
                      }}
                    >
                      <strong>
                        {summaryData?.performance?.routines_count || 0}
                      </strong>{" "}
                      active routines scheduled in your weekly calendar.
                    </p>
                  </div>

                  <div
                    style={{
                      background: "var(--color-surface)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "var(--radius-md)",
                      padding: "14px",
                    }}
                  >
                    <strong
                      style={{
                        fontSize: "0.9375rem",
                        display: "block",
                        marginBottom: "4px",
                      }}
                    >
                      📚 Study Materials
                    </strong>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "0.875rem",
                        color: "var(--color-text-muted)",
                      }}
                    >
                      <strong>
                        {summaryData?.performance?.materials_count || 0}
                      </strong>{" "}
                      documents uploaded with{" "}
                      <strong>
                        {summaryData?.performance?.topics_count || 0}
                      </strong>{" "}
                      extracted syllabus topics.
                    </p>
                  </div>

                  <div
                    style={{
                      background: "var(--color-surface)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "var(--radius-md)",
                      padding: "14px",
                    }}
                  >
                    <strong
                      style={{
                        fontSize: "0.9375rem",
                        display: "block",
                        marginBottom: "4px",
                      }}
                    >
                      💬 Community Engagement
                    </strong>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "0.875rem",
                        color: "var(--color-text-muted)",
                      }}
                    >
                      <strong>
                        {summaryData?.performance?.posts_count || 0}
                      </strong>{" "}
                      discussions started &{" "}
                      <strong>
                        {summaryData?.performance?.rsvps_count || 0}
                      </strong>{" "}
                      study event RSVPs.
                    </p>
                  </div>

                  <div
                    style={{
                      background: "var(--color-surface)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "var(--radius-md)",
                      padding: "14px",
                    }}
                  >
                    <strong
                      style={{
                        fontSize: "0.9375rem",
                        display: "block",
                        marginBottom: "4px",
                      }}
                    >
                      🎖️ Milestone Badges
                    </strong>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "0.875rem",
                        color: "var(--color-text-muted)",
                      }}
                    >
                      <strong>
                        {summaryData?.performance?.badges_earned || 0}
                      </strong>{" "}
                      academic achievement rewards unlocked.
                    </p>
                  </div>
                </div>

                <div className="modal-footer-row" style={{ marginTop: "12px" }}>
                  <Button variant="secondary" onClick={onClose}>
                    Close
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PREFERENCES & ACCOUNT SETTINGS */}
        {activeTab === "settings" && (
          <div className="profile-settings-container">
            {/* Visual Theme */}
            <div className="profile-setting-row-card">
              <div className="setting-text-col">
                <span className="setting-icon-tag">🎨</span>
                <div>
                  <strong className="setting-title">Visual Theme</strong>
                  <span className="setting-desc">
                    Switch between Light and Dark visual academic modes
                  </span>
                </div>
              </div>
              <div className="setting-action-col">
                <ThemeToggle />
              </div>
            </div>

            {/* Community Leaderboard */}
            <div className="profile-setting-row-card">
              <div className="setting-text-col">
                <span className="setting-icon-tag">🏆</span>
                <div>
                  <strong className="setting-title">
                    Community Leaderboard
                  </strong>
                  <span className="setting-desc">
                    Make your study streak and XP visible to fellow scholars
                  </span>
                </div>
              </div>
              <div className="setting-action-col">
                <ToggleSwitch
                  checked={optInLeaderboard}
                  onChange={handleToggleLeaderboard}
                  label="Community Leaderboard"
                />
              </div>
            </div>

            {/* Notification Channels Dynamic Preferences */}
            <div className="profile-notifs-box-card">
              <div className="notifs-box-header">
                <span className="setting-icon-tag">🔔</span>
                <div>
                  <strong className="setting-title">
                    Notification Channels & Alerts
                  </strong>
                  <span className="setting-desc">
                    Toggle individual notification channels and sound alerts.
                  </span>
                </div>
              </div>

              <div className="notifs-channels-list">
                <div className="notif-channel-row">
                  <div className="setting-text-col">
                    <div>
                      <strong className="notif-item-title">
                        📢 Campus Announcements & Events
                      </strong>
                      <span className="notif-item-desc">
                        Exam reviews, study sessions, and university circulars
                      </span>
                    </div>
                  </div>
                  <div className="setting-action-col">
                    <ToggleSwitch
                      checked={notifAnnouncements}
                      onChange={() => handleToggleNotif("announcements")}
                      label="Announcements & Events"
                    />
                  </div>
                </div>

                <div className="notif-channel-row">
                  <div className="setting-text-col">
                    <div>
                      <strong className="notif-item-title">
                        💬 Comments & Discussion Replies
                      </strong>
                      <span className="notif-item-desc">
                        Comments on your posts and community solutions
                      </span>
                    </div>
                  </div>
                  <div className="setting-action-col">
                    <ToggleSwitch
                      checked={notifComments}
                      onChange={() => handleToggleNotif("comments")}
                      label="Comments & Discussion Replies"
                    />
                  </div>
                </div>

                <div className="notif-channel-row">
                  <div className="setting-text-col">
                    <div>
                      <strong className="notif-item-title">
                        🎓 Academic Targets & Habit Streaks
                      </strong>
                      <span className="notif-item-desc">
                        Target CGPA milestones and study streak reminders
                      </span>
                    </div>
                  </div>
                  <div className="setting-action-col">
                    <ToggleSwitch
                      checked={notifAcademic}
                      onChange={() => handleToggleNotif("academic")}
                      label="Academic Targets & Habit Streaks"
                    />
                  </div>
                </div>

                <div className="notif-channel-row">
                  <div className="setting-text-col">
                    <div>
                      <strong className="notif-item-title">
                        🔊 Audio & Alert Chimes
                      </strong>
                      <span className="notif-item-desc">
                        Chimes when focus timers or scheduled slots complete
                      </span>
                    </div>
                  </div>
                  <div className="setting-action-col">
                    <ToggleSwitch
                      checked={notifSound}
                      onChange={() => handleToggleNotif("sound")}
                      label="Audio & Alert Chimes"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Account Logout */}
            <div className="profile-setting-row-card logout-card">
              <div className="setting-text-col">
                <span className="setting-icon-tag">🚪</span>
                <div>
                  <strong className="setting-title text-danger">
                    Account Logout
                  </strong>
                  <span className="setting-desc">
                    Sign out of StudentBrain on this device
                  </span>
                </div>
              </div>
              <div className="setting-action-col">
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    onClose();
                    logout();
                  }}
                >
                  Sign Out
                </Button>
              </div>
            </div>

            <div className="modal-footer-row" style={{ marginTop: "10px" }}>
              <Button variant="secondary" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
