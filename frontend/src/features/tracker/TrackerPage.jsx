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
  getStudySessions,
  updateStudySession,
} from "./api";
import StudySessionForm from "./components/StudySessionForm";

export default function TrackerPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function loadSessions() {
    setLoading(true);
    setError("");

    try {
      const data = await getStudySessions();
      setSessions(data);
    } catch (err) {
      setError(extractTrackerErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSessions();
  }, []);

  async function handleCreate(payload) {
    setSubmitting(true);
    setError("");

    try {
      const session = await createStudySession(payload);
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
      return session;
    } catch (err) {
      setError(extractTrackerErrorMessage(err));
      throw err;
    } finally {
      setSubmitting(false);
    }
  }

  function handleCreated(session) {
    setSessions((current) => [session, ...current]);
    setEditingSession(null);
    setShowForm(false);
    setError("");
  }

  function handleUpdated(session) {
    setSessions((current) =>
      current.map((item) => (item.id === session.id ? session : item)),
    );
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
      setSessions((current) =>
        current.filter((session) => session.id !== sessionId),
      );

      if (editingSession?.id === sessionId) {
        handleCancel();
      }
    } catch (err) {
      setError(extractTrackerErrorMessage(err));
    }
  }

  const totalMinutes = sessions.reduce(
    (total, session) => total + Number(session.duration_minutes || 0),
    0,
  );

  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;

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
                <span>Study Session Tracker</span>
              </h1>
              <p className="page-description">
                Log and analyze time spent per subject to build consistent academic habits.
              </p>
            </div>

            <Button onClick={handleAddSession}>
              {showForm && !editingSession ? "✕ Close Form" : "➕ Log Study Session"}
            </Button>
          </div>
        </div>

        {/* Study Time Hero Banner */}
        {!loading && !error && (
          <div className="tracker-hero-stat">
            <div>
              <Badge variant="accent">Cumulative Academic Focus</Badge>
              <div className="tracker-hero-total">
                {totalHours > 0 ? `${totalHours} hrs ` : ""}
                {remainingMinutes} mins
              </div>
              <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", marginTop: "4px" }}>
                Total recorded study duration across {sessions.length} logged sessions
              </p>
            </div>

            <Button variant="secondary" onClick={handleAddSession}>
              ⚡ Log Today's Session
            </Button>
          </div>
        )}

        {/* Study Session Form Modal/Card */}
        {showForm && (
          <Card style={{ marginBottom: "28px" }}>
            <div className="card-header">
              <h2 className="card-title">
                <span>{editingSession ? "✏️" : "📝"}</span>
                <span>{editingSession ? "Edit Logged Session" : "Log New Study Session"}</span>
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

        {/* Loading Spinner */}
        {loading && (
          <Card className="empty-state-card">
            <Spinner standalone />
            <p className="page-loading-text">Loading your study sessions...</p>
          </Card>
        )}

        {/* Error Alert */}
        {!loading && error && (
          <Card className="empty-state-card">
            <FormError message={error} className="form-error-block" />
            <Button onClick={loadSessions}>Try Again</Button>
          </Card>
        )}

        {/* Empty State */}
        {!loading && !error && sessions.length === 0 && !showForm && (
          <Card className="empty-state-card">
            <div className="empty-state-icon">⏱️</div>
            <h2 className="empty-state-title">No study sessions logged yet</h2>
            <p className="empty-state-desc">
              Track your daily study blocks, record notes and topic coverage, and monitor your focus over time.
            </p>
            <Button onClick={handleAddSession}>Log Your First Session</Button>
          </Card>
        )}

        {/* Sessions Grid */}
        {!loading && !error && sessions.length > 0 && (
          <div className="sessions-grid">
            {sessions.map((session) => {
              const sessionHours = Math.floor(session.duration_minutes / 60);
              const sessionMins = session.duration_minutes % 60;
              const formattedDuration =
                sessionHours > 0
                  ? `${sessionHours}h ${sessionMins > 0 ? `${sessionMins}m` : ""}`
                  : `${sessionMins} mins`;

              return (
                <Card key={session.id} className="session-card">
                  <div>
                    <div className="session-header">
                      <div>
                        <h3 className="session-subject">{session.subject}</h3>
                        <span style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
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
      </main>
    </div>
  );
}
