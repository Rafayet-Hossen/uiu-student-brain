import { useEffect, useState } from "react";
import {
  Award,
  Calendar,
  Clock,
  Flame,
  Pencil,
  Plus,
  Sparkles,
  Timer,
  Trash2,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Badge from "../../components/Badge";
import Button from "../../components/Button";
import Card from "../../components/Card";
import EmptyState from "../../components/EmptyState";
import ErrorState from "../../components/ErrorState";
import { CardSkeleton } from "../../components/Skeleton";
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

      if (sessionsRes.status === "fulfilled")
        setSessions(sessionsRes.value || []);
      if (streakRes.status === "fulfilled")
        setStreakData(streakRes.value || null);
      if (rewardsRes.status === "fulfilled") setRewards(rewardsRes.value || []);
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

  function handleCancelForm() {
    setEditingSession(null);
    setShowForm(false);
  }

  function handleEdit(session) {
    setEditingSession(session);
    setShowForm(true);
    setError("");
  }

  async function handleDelete(sessionId) {
    const confirmed = window.confirm(
      "Remove this study session from your habit logs?",
    );

    if (!confirmed) return;

    try {
      setError("");
      await deleteStudySession(sessionId);
      await loadTrackerData();

      if (editingSession?.id === sessionId) {
        setEditingSession(null);
        setShowForm(false);
      }
    } catch (err) {
      setError(extractTrackerErrorMessage(err));
    }
  }

  function handleAddSession() {
    setEditingSession(null);
    setShowForm((current) => !current);
    setError("");
  }

  const totalStudyMinutes = sessions.reduce(
    (total, session) => total + Number(session.duration_minutes || 0),
    0,
  );
  const totalHours = Math.floor(totalStudyMinutes / 60);
  const remainingMins = totalStudyMinutes % 60;

  return (
    <div className="tracker-page-container">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">
              <Timer size={28} className="text-amber" />
              <span>Study Tracker & Focus Habits</span>
            </h1>
            <p className="page-description">
              Log focused learning sessions, maintain uninterrupted habit
              streaks, and unlock academic milestone badges.
            </p>
          </div>

          <Button
            variant={showForm && !editingSession ? "secondary" : "primary"}
            onClick={handleAddSession}
            icon={showForm && !editingSession ? X : Plus}
          >
            {showForm && !editingSession ? "Close Form" : "Log Study Session"}
          </Button>
        </div>
      </div>

      {/* Top Streak & Summary Hero */}
      <div style={{ marginBottom: "24px" }}>
        <StreakCard
          streakData={streakData}
          totalHours={totalHours}
          remainingMins={remainingMins}
          sessionCount={sessions.length}
        />
      </div>

      {/* Session Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
          >
            <StudySessionForm
              session={editingSession}
              onCreate={handleCreate}
              onUpdate={handleUpdate}
              onCreated={handleCreated}
              onUpdated={handleUpdated}
              onCancel={handleCancelForm}
              submitting={submitting}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs Bar */}
      <div
        className="community-tabs-bar"
        style={{
          marginBottom: "20px",
          display: "flex",
          gap: "8px",
        }}
      >
        <button
          type="button"
          className={`community-tab-btn ${
            activeTab === "sessions" ? "tab-active" : ""
          }`}
          onClick={() => setActiveTab("sessions")}
        >
          <Clock size={16} />
          <span>Session Logs ({sessions.length})</span>
        </button>
        <button
          type="button"
          className={`community-tab-btn ${
            activeTab === "rewards" ? "tab-active" : ""
          }`}
          onClick={() => setActiveTab("rewards")}
        >
          <Award size={16} />
          <span>Milestone Badges ({rewards.length})</span>
        </button>
      </div>

      {/* Loading Skeletons */}
      {loading && (
        <div className="schedules-grid">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <ErrorState
          title="Failed to load study tracker"
          message={error}
          onRetry={loadTrackerData}
        />
      )}

      {/* TAB 1: SESSIONS LIST */}
      {!loading && !error && activeTab === "sessions" && (
        <>
          {sessions.length === 0 && !showForm ? (
            <EmptyState
              icon={Timer}
              title="No study sessions logged yet"
              description="Log your first study block to start your consistency streak flame and unlock milestone badges."
              actionLabel="Log Study Session Now"
              onAction={handleAddSession}
            />
          ) : (
            <div className="schedules-grid">
              {sessions.map((session) => (
                <Card
                  key={session.id}
                  variant="feature"
                  className="schedule-card"
                >
                  <div>
                    <div className="schedule-card-header">
                      <h3 className="schedule-subject">{session.subject}</h3>
                      <Badge variant="accent">
                        {session.duration_minutes} mins
                      </Badge>
                    </div>

                    <div className="schedule-meta-row">
                      <div className="schedule-time-badge">
                        <Calendar size={14} />
                        <span>{session.session_date}</span>
                      </div>
                      {session.start_time && (
                        <div className="schedule-time-badge">
                          <Clock size={14} />
                          <span>{session.start_time.slice(0, 5)}</span>
                        </div>
                      )}
                    </div>

                    {session.notes && (
                      <p
                        style={{
                          fontSize: "0.875rem",
                          color: "var(--color-text-muted)",
                          margin: "12px 0 0",
                          lineHeight: 1.5,
                        }}
                      >
                        {session.notes}
                      </p>
                    )}
                  </div>

                  <div
                    className="schedule-card-actions"
                    style={{ marginTop: "16px" }}
                  >
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={Pencil}
                      onClick={() => handleEdit(session)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      icon={Trash2}
                      onClick={() => handleDelete(session.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* TAB 2: REWARDS SHELF */}
      {!loading && !error && activeTab === "rewards" && (
        <RewardsShelf
          rewards={rewards}
          currentStreak={streakData?.current_streak || 0}
        />
      )}
    </div>
  );
}
