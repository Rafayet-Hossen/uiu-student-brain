import { useEffect, useRef, useState } from "react";
import {
  Calendar,
  Camera,
  Trash2,
  X,
} from "lucide-react";
import Button from "../../../components/Button";
import FormError from "../../../components/FormError";
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

function ToggleSwitch({
  checked,
  onChange,
  disabled = false,
  ariaLabel = "Toggle setting",
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onChange}
      className={`settings-toggle-switch ${checked ? "is-checked" : ""}`}
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

  const [optInLeaderboard, setOptInLeaderboard] = useState(() => {
    return user?.opt_in_leaderboard !== false;
  });

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

  async function handleToggleLeaderboard() {
    const nextVal = !optInLeaderboard;
    setOptInLeaderboard(nextVal);
    try {
      const updated = await updateProfile({ opt_in_leaderboard: nextVal });
      updateUser(updated);
    } catch (e) {
      console.error("Failed to update leaderboard preference", e);
    }
  }

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
      } catch (err) {
        console.error("Failed to refresh profile summary", err);
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
            <X size={18} />
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
            <span>⚙️ Preferences & Settings</span>
          </button>
        </div>

        {/* TAB 1: EDIT PROFILE & PHOTO */}
        {activeTab === "profile" && (
          <form
            onSubmit={handleSaveProfile}
            noValidate
            className="academic-form profile-tab-form"
          >
            {error && (
              <FormError message={error} className="form-error-block" />
            )}
            {successMessage && (
              <div className="profile-success-alert">
                {successMessage}
              </div>
            )}

            {/* Profile Photo Uploader & Avatar Presets */}
            <div className="profile-photo-section-card">
              <label className="form-label profile-section-lbl">
                📸 Profile Picture & Avatar
              </label>

              <div className="profile-avatar-action-row">
                <ScholarAvatar
                  user={user}
                  size={64}
                  avatarOverride={currentAvatar}
                />

                <div className="profile-avatar-buttons">
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
              <div className="profile-presets-container">
                <span className="profile-presets-title">
                  Or choose an academic preset avatar:
                </span>
                <div className="profile-presets-flex">
                  {AVATAR_PRESETS.map((preset) => {
                    const isSelected = currentAvatar === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleSelectPreset(preset.id)}
                        className={`avatar-preset-btn ${isSelected ? "preset-selected" : ""}`}
                        title={preset.name}
                      >
                        <span className="avatar-preset-emoji">
                          {preset.emoji}
                        </span>
                        <span className="avatar-preset-name">
                          {preset.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Form Fields Grid */}
            <div className="modal-grid-2col">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="form-input-control"
                  disabled={saving}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Department / Major</label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Computer Science & Engineering"
                  className="form-input-control"
                  disabled={saving}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Academic Bio / Research Interests</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={2}
                placeholder="Briefly state your academic focus, research goals, or study habits..."
                className="form-input-control"
                disabled={saving}
              />
            </div>

            <div className="modal-grid-2col">
              <div className="form-group">
                <label className="form-label">🎓 Current CGPA (out of 4.00)</label>
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
                <label className="form-label">🎯 Target Graduation CGPA</label>
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
                <label className="form-label">
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
                <label className="form-label">
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
          <div className="profile-performance-container">
            {loadingSummary ? (
              <div className="profile-loading-box">
                <Spinner standalone />
                <p className="profile-loading-text">
                  Aggregating your academic performance metrics...
                </p>
              </div>
            ) : (
              <div className="profile-performance-content">
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
                <div className="profile-modules-grid">
                  <div className="profile-module-card">
                    <strong className="profile-module-title">
                      📅 Study Routines
                    </strong>
                    <p className="profile-module-desc">
                      <strong>
                        {summaryData?.performance?.routines_count || 0}
                      </strong>{" "}
                      active routines scheduled in your weekly calendar.
                    </p>
                  </div>

                  <div className="profile-module-card">
                    <strong className="profile-module-title">
                      📚 Study Materials
                    </strong>
                    <p className="profile-module-desc">
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

                  <div className="profile-module-card">
                    <strong className="profile-module-title">
                      💬 Community Engagement
                    </strong>
                    <p className="profile-module-desc">
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

                  <div className="profile-module-card">
                    <strong className="profile-module-title">
                      🎖️ Milestone Badges
                    </strong>
                    <p className="profile-module-desc">
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
                <strong className="setting-title">🎨 Visual Theme</strong>
                <span className="setting-desc">
                  Switch between Light and Dark visual academic modes
                </span>
              </div>
              <div className="setting-action-col">
                <ThemeToggle />
              </div>
            </div>

            {/* Community Leaderboard */}
            <div className="profile-setting-row-card">
              <div className="setting-text-col">
                <strong className="setting-title">
                  🏆 Community Leaderboard
                </strong>
                <span className="setting-desc">
                  Your rank and XP points are visible to fellow scholars
                </span>
              </div>
              <div className="setting-action-col">
                <ToggleSwitch
                  checked={optInLeaderboard}
                  onChange={handleToggleLeaderboard}
                  ariaLabel="Toggle community leaderboard visibility"
                />
              </div>
            </div>

            {/* Notification Channels Dynamic Preferences */}
            <div className="profile-notifs-box-card">
              <div className="notifs-box-header">
                <strong className="setting-title">
                  🔔 Notification Channels & Dynamic Alerts
                </strong>
                <span className="setting-desc">
                  Disable or enable notifications. Disabled channels will not
                  generate or display alerts.
                </span>
              </div>

              <div className="notifs-channels-list">
                <div className="notif-channel-row">
                  <div className="setting-text-col">
                    <strong className="notif-item-title">
                      📢 Campus Announcements & Events
                    </strong>
                    <span className="notif-item-desc">
                      Faculty exam reviews, study sessions, and university
                      circulars
                    </span>
                  </div>
                  <div className="setting-action-col">
                    <ToggleSwitch
                      checked={notifAnnouncements}
                      onChange={() => handleToggleNotif("announcements")}
                      ariaLabel="Toggle Campus Announcements notifications"
                    />
                  </div>
                </div>

                <div className="notif-channel-row">
                  <div className="setting-text-col">
                    <strong className="notif-item-title">
                      💬 Comments & Discussion Replies
                    </strong>
                    <span className="notif-item-desc">
                      Classmate comments on your posts and solutions marked
                      helpful
                    </span>
                  </div>
                  <div className="setting-action-col">
                    <ToggleSwitch
                      checked={notifComments}
                      onChange={() => handleToggleNotif("comments")}
                      ariaLabel="Toggle Comments and Replies notifications"
                    />
                  </div>
                </div>

                <div className="notif-channel-row">
                  <div className="setting-text-col">
                    <strong className="notif-item-title">
                      🎓 Academic Targets & Habit Streaks
                    </strong>
                    <span className="notif-item-desc">
                      Target CGPA updates and daily study streak consistency
                      reminders
                    </span>
                  </div>
                  <div className="setting-action-col">
                    <ToggleSwitch
                      checked={notifAcademic}
                      onChange={() => handleToggleNotif("academic")}
                      ariaLabel="Toggle Academic targets and streak notifications"
                    />
                  </div>
                </div>

                <div className="notif-channel-row">
                  <div className="setting-text-col">
                    <strong className="notif-item-title">
                      🔊 Audio & Alert Chimes
                    </strong>
                    <span className="notif-item-desc">
                      Sound notifications when study timers or reminders
                      complete
                    </span>
                  </div>
                  <div className="setting-action-col">
                    <ToggleSwitch
                      checked={notifSound}
                      onChange={() => handleToggleNotif("sound")}
                      ariaLabel="Toggle audio chimes and sound effects"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Account Logout */}
            <div className="profile-setting-row-card logout-card">
              <div className="setting-text-col">
                <strong className="setting-title text-danger">
                  🚪 Account Logout
                </strong>
                <span className="setting-desc">
                  Sign out of StudentBrain on this device
                </span>
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
