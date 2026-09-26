import { useEffect, useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Flame,
  Layers,
  Pencil,
  Play,
  Plus,
  RotateCcw,
  Search,
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
  completeStudySession,
  createStudySession,
  deleteStudySession,
  extendStudySession,
  extractTrackerErrorMessage,
  getRewards,
  getStreakSummary,
  getStudySessions,
  startStudySession,
  updateStudySession,
} from "./api";
import RewardsShelf from "./components/RewardsShelf";
import StreakCard from "./components/StreakCard";
import StudySessionCard from "./components/StudySessionCard";
import StudySessionForm from "./components/StudySessionForm";
import ScheduledSessionCard from "./components/ScheduledSessionCard";
import BookSessionModal from "./components/BookSessionModal";
import SessionQuizModal from "./components/SessionQuizModal";
import QuizDiagnosticModal from "./components/QuizDiagnosticModal";
import FocusTimer from "./components/FocusTimer";

export default function TrackerPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const subtabParam = searchParams.get("subtab");

  const [sessions, setSessions] = useState([]);
  const [streakData, setStreakData] = useState(null);
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modals state
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [isDiagnosticModalOpen, setIsDiagnosticModalOpen] = useState(false);
  const [activeQuizSession, setActiveQuizSession] = useState(null);
  const [activeTimerSession, setActiveTimerSession] = useState(null);

  const [showEditForm, setShowEditForm] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [sessionSearch, setSessionSearch] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("all");

  const [activeTab, setActiveTab] = useState(() => {
    if (subtabParam === "timer") return "timer";
    if (subtabParam === "scheduled") return "scheduled";
    if (subtabParam === "rewards") return "rewards";
    if (subtabParam === "history") return "history";
    return "scheduled";
  });

  async function loadTrackerData(silent = false) {
    if (!silent) setLoading(true);
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
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => {
    loadTrackerData();
  }, []);

  // Session state transition handlers
  const handleStartSession = async (session) => {
    try {
      const updated = await startStudySession(session.id);
      setActiveTimerSession(updated);
      setActiveTab("timer");
      setSearchParams({ tab: "tracker", subtab: "timer" });
      await loadTrackerData();
    } catch (err) {
      setError(extractTrackerErrorMessage(err));
    }
  };

  const handleCompleteSession = async (session) => {
    try {
      const updated = await completeStudySession(session.id);
      setActiveTimerSession(null);
      await loadTrackerData();
      // Prompt quiz ONLY if this session has attached study material!
      const hasMaterial = Boolean(
        updated?.material ||
        updated?.material_details ||
        updated?.material_id ||
        session?.material ||
        session?.material_details ||
        session?.material_id
      );
      if (hasMaterial) {
        setActiveQuizSession(updated || session);
        setIsQuizModalOpen(true);
      }
    } catch (err) {
      setError(extractTrackerErrorMessage(err));
    }
  };

  const handleExtendSession = async (session, mins = 15) => {
    try {
      await extendStudySession(session.id, mins);
      await loadTrackerData();
    } catch (err) {
      setError(extractTrackerErrorMessage(err));
    }
  };

  const handleOpenQuiz = (session) => {
    setActiveQuizSession(session);
    setIsQuizModalOpen(true);
  };

  const handleOpenDiagnostic = (session) => {
    setActiveQuizSession(session);
    setIsDiagnosticModalOpen(true);
  };

  const handleQuizCompleted = async (updatedSession) => {
    await loadTrackerData();
    setActiveQuizSession(updatedSession);
    setIsDiagnosticModalOpen(true);
  };

  const handleReschedule = (session) => {
    setEditingSession(session);
    setShowEditForm(true);
  };

  const handleEdit = (session) => {
    setEditingSession(session);
    setShowEditForm(true);
  };

  const handleDelete = async (sessionId) => {
    const confirmed = window.confirm(
      "Remove this study session from your schedule and habit logs?",
    );
    if (!confirmed) return;

    try {
      await deleteStudySession(sessionId);
      await loadTrackerData();
    } catch (err) {
      setError(extractTrackerErrorMessage(err));
    }
  };

  const handleUpdate = async (id, payload) => {
    setSubmitting(true);
    try {
      const updateData = { ...payload };
      if (editingSession?.status === "missed") {
        updateData.status = "scheduled";
      }
      const session = await updateStudySession(id, updateData);
      await loadTrackerData();
      setShowEditForm(false);
      setEditingSession(null);
      return session;
    } catch (err) {
      setError(extractTrackerErrorMessage(err));
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreate = async (payload) => {
    setSubmitting(true);
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
  };

  const todayStr = new Date().toISOString().split("T")[0];

  const handleGoalUpdated = async (newGoalMinutes) => {
    // 1. Instant optimistic state update on current page
    setStreakData((prev) => {
      if (!prev) return prev;
      const todayMins = prev.today_minutes || 0;
      const achieved = todayMins >= newGoalMinutes && todayMins > 0;
      const updatedWeekly = (prev.weekly_consistency || []).map((day) => {
        const isToday = day.date === todayStr || day.is_today;
        const mins = day.minutes || 0;
        return {
          ...day,
          goal_met: mins >= newGoalMinutes && mins > 0,
        };
      });
      return {
        ...prev,
        daily_goal_minutes: newGoalMinutes,
        daily_goal_achieved: achieved,
        weekly_consistency: updatedWeekly,
      };
    });

    // 2. Silently sync fresh server stats, streak milestones, and rewards in background
    try {
      await loadTrackerData(true);
    } catch (err) {
      console.error("Silent reload after goal update failed:", err);
    }
  };

  const safeSessions = Array.isArray(sessions) ? sessions : [];

  // Today's Scheduled Sessions
  const todaysSessions = useMemo(() => {
    return safeSessions.filter(
      (s) => s?.session_date === todayStr || s?.status === "in_progress",
    );
  }, [safeSessions, todayStr]);

  // Upcoming Scheduled Sessions (Future dates)
  const upcomingSessions = useMemo(() => {
    return safeSessions.filter(
      (s) => s?.session_date > todayStr && s?.status === "scheduled",
    );
  }, [safeSessions, todayStr]);

  // Completed Sessions
  const completedSessions = useMemo(() => {
    return safeSessions.filter((s) => s?.status === "completed");
  }, [safeSessions]);

  // Filtered History list
  const filteredHistorySessions = useMemo(() => {
    let list = safeSessions;
    if (selectedStatusFilter !== "all") {
      list = list.filter((s) => s?.status === selectedStatusFilter);
    }
    if (sessionSearch.trim()) {
      const q = sessionSearch.toLowerCase();
      list = list.filter(
        (s) =>
          (s?.subject && s.subject.toLowerCase().includes(q)) ||
          (s?.notes && s.notes.toLowerCase().includes(q)) ||
          (s?.session_date && s.session_date.toLowerCase().includes(q)),
      );
    }
    return list;
  }, [safeSessions, selectedStatusFilter, sessionSearch]);

  const totalStudyMinutes = streakData?.total_minutes ?? 0;
  const totalHours = Math.floor(totalStudyMinutes / 60);
  const remainingMins = totalStudyMinutes % 60;

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
              Schedule time-gated focus blocks with uploaded course materials,
              complete strict consistency goals, and test conceptual retention
              with Gemini AI diagnostic quizzes.
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="primary"
              onClick={() => setIsBookModalOpen(true)}
              icon={Plus}
            >
              Book Study Session
            </Button>
          </div>
        </div>
      </div>

      {/* Top Streak & Summary Hero */}
      <div style={{ marginBottom: "24px" }}>
        <StreakCard
          streakData={streakData}
          totalHours={totalHours}
          remainingMins={remainingMins}
          sessionCount={completedSessions.length}
          onGoalUpdated={handleGoalUpdated}
        />
      </div>

      {/* Navigation Tabs Bar */}
      <div className="tracker-sub-tabs-bar">
        <button
          type="button"
          className={`tracker-sub-tab-btn ${
            activeTab === "scheduled" ? "tab-active" : ""
          }`}
          onClick={() => {
            setActiveTab("scheduled");
            setSearchParams({ tab: "tracker", subtab: "scheduled" });
          }}
        >
          <Calendar size={15} />
          <span>Today's Schedule ({todaysSessions.length})</span>
        </button>

        <button
          type="button"
          className={`tracker-sub-tab-btn ${
            activeTab === "timer" ? "tab-active" : ""
          }`}
          onClick={() => {
            setActiveTab("timer");
            setSearchParams({ tab: "tracker", subtab: "timer" });
          }}
        >
          <Timer size={15} />
          <span>Focus Timer</span>
        </button>

        <button
          type="button"
          className={`tracker-sub-tab-btn ${
            activeTab === "history" ? "tab-active" : ""
          }`}
          onClick={() => {
            setActiveTab("history");
            setSearchParams({ tab: "tracker", subtab: "history" });
          }}
        >
          <Clock size={15} />
          <span>Session History ({safeSessions.length})</span>
        </button>

        <button
          type="button"
          className={`tracker-sub-tab-btn ${
            activeTab === "rewards" ? "tab-active" : ""
          }`}
          onClick={() => {
            setActiveTab("rewards");
            setSearchParams({ tab: "tracker", subtab: "rewards" });
          }}
        >
          <Award size={15} />
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

      {/* ============================================================ */}
      {/* TAB 1: TODAY'S SCHEDULED SESSIONS */}
      {/* ============================================================ */}
      {!loading && !error && activeTab === "scheduled" && (
        <div className="tracker-tab-content">
          {/* Strict Attendance Notice */}
          <div className="tracker-timegate-callout mb-5">
            <div className="callout-icon-box">
              <Clock size={16} className="text-primary" />
            </div>
            <div className="callout-text-content">
              <strong className="callout-title">Strict Time-Gate Rule:</strong>{" "}
              <span>
                Study sessions must be started during their scheduled time
                window. Only completed sessions contribute to your daily goals,
                active habit streaks, and academic achievements.
              </span>
            </div>
          </div>

          {todaysSessions.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No study sessions scheduled for today"
              description="Book a dedicated focus block linked with your course notes to maintain your streak and trigger post-session AI quizzes."
              actionLabel="Book Study Session for Today"
              onAction={() => setIsBookModalOpen(true)}
            />
          ) : (
            <div className="scheduled-sessions-grid mb-6">
              {todaysSessions.map((session) => (
                <ScheduledSessionCard
                  key={session.id}
                  session={session}
                  onStart={handleStartSession}
                  onComplete={handleCompleteSession}
                  onExtend={handleExtendSession}
                  onTakeQuiz={handleOpenQuiz}
                  onViewDiagnostic={handleOpenDiagnostic}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onReschedule={handleReschedule}
                />
              ))}
            </div>
          )}

          {/* Upcoming Days Preview if available */}
          {upcomingSessions.length > 0 && (
            <div className="mt-6 pt-4 border-t">
              <h3 className="text-sm font-bold text-muted uppercase tracking-wider mb-3">
                Upcoming Focus Sessions
              </h3>
              <div className="scheduled-sessions-grid">
                {upcomingSessions.map((session) => (
                  <ScheduledSessionCard
                    key={session.id}
                    session={session}
                    onStart={handleStartSession}
                    onComplete={handleCompleteSession}
                    onExtend={handleExtendSession}
                    onTakeQuiz={handleOpenQuiz}
                    onViewDiagnostic={handleOpenDiagnostic}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onReschedule={handleReschedule}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 2: FOCUS TIMER */}
      {/* ============================================================ */}
      {!error && activeTab === "timer" && (
        <FocusTimer
          activeSession={activeTimerSession}
          onSessionCompleted={async (payload) => {
            if (activeTimerSession) {
              return await completeStudySession(activeTimerSession.id);
            } else {
              return await handleCreate(payload);
            }
          }}
          onExtendSession={handleExtendSession}
          onTakeQuiz={handleOpenQuiz}
          availableSubjects={availableSubjects}
        />
      )}

      {/* ============================================================ */}
      {/* TAB 3: SESSION HISTORY & QUIZ DIAGNOSTICS */}
      {/* ============================================================ */}
      {!loading && !error && activeTab === "history" && (
        <>
          {safeSessions.length > 0 && (
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
                style={{ flex: "1", maxWidth: "340px" }}
              >
                <input
                  type="text"
                  placeholder="Search logs by subject or notes..."
                  value={sessionSearch}
                  onChange={(e) => setSessionSearch(e.target.value)}
                  className="form-input form-input-sm"
                />
              </div>

              {/* Status Filter Chips */}
              <div className="flex gap-1 flex-wrap items-center">
                {["all", "completed", "scheduled", "in_progress", "missed"].map(
                  (st) => (
                    <button
                      key={st}
                      type="button"
                      className={`filter-status-chip ${
                        selectedStatusFilter === st ? "active" : ""
                      }`}
                      onClick={() => setSelectedStatusFilter(st)}
                    >
                      {st === "all"
                        ? "All Logs"
                        : st === "in_progress"
                          ? "In Progress"
                          : st.charAt(0).toUpperCase() + st.slice(1)}
                    </button>
                  ),
                )}
              </div>
            </div>
          )}

          {safeSessions.length === 0 ? (
            <EmptyState
              icon={Timer}
              title="No study sessions recorded yet"
              description="Schedule a focus block or start the timer to log completed sessions and unlock diagnostic quizzes."
              actionLabel="Book Study Session"
              onAction={() => setIsBookModalOpen(true)}
            />
          ) : filteredHistorySessions.length === 0 ? (
            <div className="materials-empty-card my-3">
              <div className="empty-card-icon">🔍</div>
              <h4>No sessions found</h4>
              <p>No logged study blocks match your filter criteria.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSessionSearch("");
                  setSelectedStatusFilter("all");
                }}
              >
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="study-sessions-grid">
              {filteredHistorySessions.map((session) => (
                <StudySessionCard
                  key={session.id}
                  session={session}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onExtend={handleExtendSession}
                  onTakeQuiz={handleOpenQuiz}
                  onViewDiagnostic={handleOpenDiagnostic}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ============================================================ */}
      {/* TAB 4: MILESTONE BADGES */}
      {/* ============================================================ */}
      {!loading && !error && activeTab === "rewards" && (
        <RewardsShelf
          rewards={rewards}
          currentStreak={streakData?.current_streak || 0}
        />
      )}

      {/* ============================================================ */}
      {/* MODALS */}
      {/* ============================================================ */}

      {/* 1. Book Session Modal */}
      <BookSessionModal
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        onSessionBooked={async () => {
          await loadTrackerData();
        }}
        onNavigateToMaterials={() => {
          navigate("/study-center/materials");
        }}
      />

      {/* 2. AI Quiz Modal */}
      <SessionQuizModal
        session={activeQuizSession}
        isOpen={isQuizModalOpen}
        onClose={() => setIsQuizModalOpen(false)}
        onQuizCompleted={handleQuizCompleted}
      />

      {/* 3. AI Quiz Diagnostic Report Modal */}
      <QuizDiagnosticModal
        session={activeQuizSession}
        isOpen={isDiagnosticModalOpen}
        onClose={() => setIsDiagnosticModalOpen(false)}
        onRetakeQuiz={handleOpenQuiz}
      />

      {/* 4. Edit Session Form Modal */}
      <AnimatePresence>
        {showEditForm && editingSession && (
          <div
            className="tracker-session-modal-overlay"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowEditForm(false);
                setEditingSession(null);
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
                      Edit Study Session
                    </h3>
                    <p className="tracker-modal-subheading">
                      Update details for this study block.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="tracker-modal-close-btn"
                  onClick={() => {
                    setShowEditForm(false);
                    setEditingSession(null);
                  }}
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
                  onCreated={() => {
                    setShowEditForm(false);
                    setEditingSession(null);
                  }}
                  onUpdated={() => {
                    setShowEditForm(false);
                    setEditingSession(null);
                  }}
                  onCancel={() => {
                    setShowEditForm(false);
                    setEditingSession(null);
                  }}
                  submitting={submitting}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
