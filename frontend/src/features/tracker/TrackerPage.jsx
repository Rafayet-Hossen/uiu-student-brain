import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
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
  Search,
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
import StudySessionCard from "./components/StudySessionCard";
import StudySessionForm from "./components/StudySessionForm";
import FocusTimer from "./components/FocusTimer";

export default function TrackerPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const subtabParam = searchParams.get("subtab");

  const [sessions, setSessions] = useState([]);
  const [streakData, setStreakData] = useState(null);
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [sessionSearch, setSessionSearch] = useState("");
  const [activeTab, setActiveTab] = useState(() =>
    subtabParam === "timer" ? "timer" : "sessions",
  ); // "sessions" | "timer" | "rewards"

  async function loadTrackerData() {
    setLoading(true);
    setError("");

    try {
      const [sessionsRes, streakRes, rewardsRes] = await Promise.allSettled([
        getStudySessions(),
        getStreakSummary(),
        getRewards(),
      ]);

      if (sessionsRes.status === "fulfilled") {
        const val = sessionsRes.value;
        setSessions(Array.isArray(val) ? val : val?.results || []);
      }
      if (streakRes.status === "fulfilled") {
        setStreakData(streakRes.value || null);
      }
      if (rewardsRes.status === "fulfilled") {
        const val = rewardsRes.value;
        setRewards(Array.isArray(val) ? val : val?.results || []);
      }
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

  const safeSessions = Array.isArray(sessions) ? sessions : [];

  const totalStudyMinutes = safeSessions.reduce(
    (total, session) => total + Number(session?.duration_minutes || 0),
    0,
  );
  const totalHours = Math.floor(totalStudyMinutes / 60);
  const remainingMins = totalStudyMinutes % 60;

  const filteredSessions = useMemo(() => {
    if (!sessionSearch.trim()) return safeSessions;
    const q = sessionSearch.toLowerCase();
    return safeSessions.filter(
      (s) =>
        (s?.subject && s.subject.toLowerCase().includes(q)) ||
        (s?.notes && s.notes.toLowerCase().includes(q)) ||
        (s?.session_date && s.session_date.toLowerCase().includes(q)),
    );
  }, [safeSessions, sessionSearch]);

  const availableSubjects = useMemo(() => {
    const set = new Set();
    safeSessions.forEach((s) => {
      if (s?.subject) set.add(s.subject);
    });
    return Array.from(set);
  }, [safeSessions]);

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

      {/* Session Form Modal */}
      <AnimatePresence>
        {showForm && (
          <div
            className="tracker-session-modal-overlay"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                handleCancelForm();
              }
            }}
          >
            <motion.div
              className="tracker-session-modal-dialog"
              initial={{ opacity: 0, scale: 0.96, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 14 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="tracker-modal-header">
                <div className="tracker-modal-title-box">
                  <span className="tracker-modal-icon">⏱️</span>
                  <div>
                    <h3 className="tracker-modal-heading">
                      {editingSession
                        ? "Edit Study Session"
                        : "Log Study Session"}
                    </h3>
                    <p className="tracker-modal-subheading">
                      {editingSession
                        ? "Update details for this logged study session."
                        : "Record your focused time to build consistency streaks."}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="tracker-modal-close-btn"
                  onClick={handleCancelForm}
                  title="Close modal"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="tracker-modal-body">
                <StudySessionForm
                  session={editingSession}
                  onCreate={handleCreate}
                  onUpdate={handleUpdate}
                  onCreated={handleCreated}
                  onUpdated={handleUpdated}
                  onCancel={handleCancelForm}
                  submitting={submitting}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Tabs Bar */}
      <div
        className="community-tabs-bar"
        style={{
          marginBottom: "20px",
          display: "flex",
          gap: "8px",
          overflowX: "auto",
        }}
      >
        <button
          type="button"
          className={`community-tab-btn ${
            activeTab === "timer" ? "tab-active" : ""
          }`}
          onClick={() => {
            setActiveTab("timer");
            setSearchParams({ tab: "tracker", subtab: "timer" });
          }}
        >
          <Timer size={16} />
          <span>⏱️ Focus Timer (Pomodoro)</span>
        </button>
        <button
          type="button"
          className={`community-tab-btn ${
            activeTab === "sessions" ? "tab-active" : ""
          }`}
          onClick={() => {
            setActiveTab("sessions");
            setSearchParams({ tab: "tracker", subtab: "sessions" });
          }}
        >
          <Clock size={16} />
          <span>Session Logs ({sessions.length})</span>
        </button>
        <button
          type="button"
          className={`community-tab-btn ${
            activeTab === "rewards" ? "tab-active" : ""
          }`}
          onClick={() => {
            setActiveTab("rewards");
            setSearchParams({ tab: "tracker", subtab: "rewards" });
          }}
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
      {/* TAB 1: FOCUS TIMER */}
      {!loading && !error && activeTab === "timer" && (
        <FocusTimer
          onSessionCompleted={async (payload) => {
            await handleCreate(payload);
          }}
          availableSubjects={availableSubjects}
        />
      )}

      {/* TAB 2: SESSIONS LIST */}
      {!loading && !error && activeTab === "sessions" && (
        <>
          {sessions.length > 0 && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              <div
                className="community-search-box"
                style={{ flex: "1", maxWidth: "380px" }}
              >
                <input
                  type="text"
                  placeholder="Search logs by subject or notes..."
                  value={sessionSearch}
                  onChange={(e) => setSessionSearch(e.target.value)}
                  className="form-input form-input-sm"
                />
              </div>
              <span className="text-xs text-muted">
                Showing {filteredSessions.length} of {sessions.length} sessions
              </span>
            </div>
          )}

          {sessions.length === 0 && !showForm ? (
            <EmptyState
              icon={Timer}
              title="No study sessions logged yet"
              description="Use the Focus Timer or log a completed study block to start your consistency streak flame."
              actionLabel="Start Focus Timer"
              onAction={() => {
                setActiveTab("timer");
                setSearchParams({ tab: "tracker", subtab: "timer" });
              }}
            />
          ) : filteredSessions.length === 0 ? (
            <div className="materials-empty-card my-3">
              <div className="empty-card-icon">🔍</div>
              <h4>No sessions found</h4>
              <p>No logged study blocks match "{sessionSearch}".</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSessionSearch("")}
              >
                Clear Search
              </Button>
            </div>
          ) : (
            <div className="study-sessions-grid">
              {filteredSessions.map((session) => (
                <StudySessionCard
                  key={session.id}
                  session={session}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* TAB 2: REWARDS SHELF */}
      {/* TAB 3: REWARDS SHELF */}
      {!loading && !error && activeTab === "rewards" && (
        <RewardsShelf
          rewards={rewards}
          currentStreak={streakData?.current_streak || 0}
        />
      )}
    </div>
  );
}
