import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import Button from "../../components/Button";
import Card from "../../components/Card";
import FormError from "../../components/FormError";
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
    console.log("EDIT CLICKED:", session);

    setEditingSession(session);
    setShowForm(true);
    setError("");

    // Scroll to the edit form after React renders it
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

    if (!showForm) {
      setTimeout(() => {
        document.getElementById("study-session-form")?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 100);
    }
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
    (total, session) => total + Number(session.duration_minutes),
    0,
  );

  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;

  return (
    <div className="dashboard-screen">
      <header className="dashboard-header">
        <Link to="/dashboard" className="dashboard-brand">
          Student Brain
        </Link>
      </header>

      <main className="dashboard-main">
        <h1>Study Tracker</h1>

        <p className="auth-subtitle">
          Log your study sessions and keep track of your progress.
        </p>

        <Button onClick={handleAddSession}>
          {showForm && !editingSession ? "Close Form" : "Log Study Session"}
        </Button>

        {showForm && (
          <Card>
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

        {!loading && !error && sessions.length > 0 && (
          <Card>
            <h2>Total Study Time</h2>

            <p>
              {totalHours > 0 &&
                `${totalHours} hour${totalHours !== 1 ? "s" : ""}`}

              {totalHours > 0 && remainingMinutes > 0 && " "}

              {remainingMinutes > 0 &&
                `${remainingMinutes} minute${
                  remainingMinutes !== 1 ? "s" : ""
                }`}

              {totalMinutes === 0 && "0 minutes"}
            </p>
          </Card>
        )}

        {loading && (
          <Card>
            <Spinner standalone />
            <p>Loading your study sessions...</p>
          </Card>
        )}

        {!loading && error && (
          <Card>
            <FormError message={error} className="form-error-block" />
          </Card>
        )}

        {!loading && !error && sessions.length === 0 && (
          <Card>
            <h2>No Study Sessions</h2>

            <p>You have not logged any study sessions yet.</p>
          </Card>
        )}

        {!loading && !error && sessions.length > 0 && (
          <div className="planner-grid">
            {sessions.map((session) => (
              <Card key={session.id}>
                <h2>{session.subject}</h2>

                <p>Duration: {session.duration_minutes} minutes</p>

                <p>Date: {session.session_date}</p>

                {session.notes && <p>Notes: {session.notes}</p>}

                <div className="planner-card-actions">
                  <Button type="button" onClick={() => handleEdit(session)}>
                    Edit
                  </Button>

                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => handleDelete(session.id)}
                  >
                    Delete
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
