import { useEffect, useState } from "react";
import Badge from "../../components/Badge";
import Button from "../../components/Button";
import Card from "../../components/Card";
import FormError from "../../components/FormError";
import Navbar from "../../components/Navbar";
import Spinner from "../../components/Spinner";
import {
  createStudySession,
  deleteStudySession,
  extractTrackerErrorMessage,
  getRewards,
  getStreakSummary,
  getStudySessions,
  updateStudySession,
} from "./api";
import RewardsShelf from "./components/RewardsShelf";
import StreakCard from "./components/StreakCard";
import StudySessionForm from "./components/StudySessionForm";

export default function TrackerPage() {
  const [sessions, setSessions] = useState([]);
  const [streakData, setStreakData] = useState(null);
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("sessions"); // "sessions" | "rewards"

  async function loadTrackerData() {
    setLoading(true);
    setError("");

    try {
      const [sessionsRes, streakRes, rewardsRes] = await Promise.allSettled([
        getStudySessions(),
        getStreakSummary(),
        getRewards(),
      ]);

      if (sessionsRes.status === "fulfilled") setSessions(sessionsRes.value);
      if (streakRes.status === "fulfilled") setStreakData(streakRes.value);
      if (rewardsRes.status === "fulfilled") setRewards(rewardsRes.value);
    } catch (err) {
      setError(extractTrackerErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTrackerData();
  }, []);

  async function handleCreate(payload) {
    setSubmitting(true);
    setError("");

    try {
      const session = await createStudySession(payload);
      // Reload streak & rewards alongside sessions
      await loadTrackerData();
      return session;
    } catch (err) {
      setError(extractTrackerErrorMessage(err));
      throw err;
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdate(id, payload) {
    setSubmitting(true);
    setError("");

    try {
      const session = await updateStudySession(id, payload);
      await loadTrackerData();
      return session;
    } catch (err) {
      setError(extractTrackerErrorMessage(err));
      throw err;
    } finally {
      setSubmitting(false);
    }
  }

  function handleCreated() {
    setEditingSession(null);
    setShowForm(false);
    setError("");
  }

  function handleUpdated() {
    setEditingSession(null);
    setShowForm(false);
    setError("");
  }

  function handleEdit(session) {
    setEditingSession(session);
    setShowForm(true);
    setError("");

    setTimeout(() => {
      document.getElementById("study-session-form")?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 100);
  }

  function handleCancel() {
    setEditingSession(null);
    setShowForm(false);
    setError("");
  }

  function handleAddSession() {
    setEditingSession(null);
    setShowForm((current) => !current);
    setError("");
  }

  async function handleDelete(sessionId) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this study session?",
    );

    if (!confirmed) return;

    try {
      setError("");
      await deleteStudySession(sessionId);
      await loadTrackerData();

      if (editingSession?.id === sessionId) {
        handleCancel();
      }
    } catch (err) {
      setError(extractTrackerErrorMessage(err));
    }
  }

  const unlockedTrophiesCount = rewards.filter((r) => r.unlocked).length;

  return (
    <div className="app-screen">
      <Navbar />

      <main className="main-content">
        {/* Page Header */}
        <div className="page-header">
          <div className="page-header-row">
            <div>
              <h1 className="page-title">
                <span>⏱️</span>
                <span>Study Tracker & Streaks</span>
              </h1>
              <p className="page-description">
                Log daily study sessions, maintain focus streaks, and unlock academic milestone trophies.
              </p>
            </div>

            <Button onClick={handleAddSession}>
              {showForm && !editingSession ? "✕ Close Form" : "➕ Log Study Session"}
            </Button>
          </div>
        </div>

        {/* Dynamic Streak & Daily Goal Hero Card */}
        {!loading && streakData && (
          <StreakCard
            streakData={streakData}
            onGoalUpdated={loadTrackerData}
          />
        )}

        {/* Study Session Form Modal/Card */}
        {showForm && (
          <Card style={{ marginBottom: "28px" }}>
            <div className="card-header">
              <h2 className="card-title">
                <span>{editingSession ? "✏️" : "📝"}</span>
                <span>
                  {editingSession
                    ? "Edit Logged Session"
                    : "Log New Study Session"}
                </span>
              </h2>
            </div>

            <StudySessionForm
              session={editingSession}
              onCreated={handleCreated}
              onUpdated={handleUpdated}
              onCancel={handleCancel}
              createSession={handleCreate}
              updateSession={handleUpdate}
              submitting={submitting}
            />
          </Card>
        )}

        {/* Section Navigation Tabs */}
        <div className="tracker-subnav-tabs">
          <button
            type="button"
            className={`tracker-subnav-tab ${
              activeTab === "sessions" ? "tab-active" : ""
            }`}
            onClick={() => setActiveTab("sessions")}
          >
            📋 Study Sessions ({sessions.length})
          </button>
          <button
            type="button"
            className={`tracker-subnav-tab ${
              activeTab === "rewards" ? "tab-active" : ""
            }`}
            onClick={() => setActiveTab("rewards")}
          >
            🏆 Trophies & Rewards ({unlockedTrophiesCount}/{rewards.length})
          </button>
        </div>

        {/* Loading Spinner */}
        {loading && (
          <Card className="empty-state-card">
            <Spinner standalone />
            <p className="page-loading-text">Loading your study progress...</p>
          </Card>
        )}

        {/* Error Alert */}
        {!loading && error && (
          <Card className="empty-state-card">
            <FormError message={error} className="form-error-block" />
            <Button onClick={loadTrackerData}>Try Again</Button>
          </Card>
        )}

        {/* TAB 1: SESSIONS LOG */}
        {!loading && !error && activeTab === "sessions" && (
          <div>
            {sessions.length === 0 && !showForm ? (
              <Card className="empty-state-card">
                <div className="empty-state-icon">⏱️</div>
                <h2 className="empty-state-title">No study sessions logged yet</h2>
                <p className="empty-state-desc">
                  Track your daily study blocks, record notes and topic coverage, and build your study streak.
                </p>
                <Button onClick={handleAddSession}>Log Your First Session</Button>
              </Card>
            ) : (
              <div className="sessions-grid">
                {sessions.map((session) => {
                  const sessionHours = Math.floor(
                    session.duration_minutes / 60,
                  );
                  const sessionMins = session.duration_minutes % 60;
                  const formattedDuration =
                    sessionHours > 0
                      ? `${sessionHours}h ${
                          sessionMins > 0 ? `${sessionMins}m` : ""
                        }`
                      : `${sessionMins} mins`;

                  return (
                    <Card key={session.id} className="session-card">
                      <div>
                        <div className="session-header">
                          <div>
                            <h3 className="session-subject">{session.subject}</h3>
                            <span
                              style={{
                                fontSize: "0.8125rem",
                                color: "var(--color-text-muted)",
                              }}
                            >
                              📅 {session.session_date}
                            </span>
                          </div>
                          <Badge variant="accent">{formattedDuration}</Badge>
                        </div>

                        {session.notes && (
                          <div style={{ marginTop: "12px" }}>
                            <p className="session-notes">{session.notes}</p>
                          </div>
                        )}
                      </div>

                      <div className="card-actions-row">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleEdit(session)}
                        >
                          ✏️ Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleDelete(session.id)}
                        >
                          🗑️ Delete
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: REWARDS & TROPHIES */}
        {!loading && !error && activeTab === "rewards" && (
          <RewardsShelf rewards={rewards} />
        )}
      </main>
    </div>
  );
}
