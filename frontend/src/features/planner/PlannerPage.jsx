import { useEffect, useState } from "react";
import Badge from "../../components/Badge";
import Button from "../../components/Button";
import Card from "../../components/Card";
import FormError from "../../components/FormError";
import Navbar from "../../components/Navbar";
import Spinner from "../../components/Spinner";
import {
  deleteSchedule,
  extractPlannerErrorMessage,
  getSchedules,
} from "./api";
import ScheduleForm from "./components/ScheduleForm";

export default function PlannerPage() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);

  async function loadSchedules() {
    setLoading(true);
    setError("");

    try {
      const data = await getSchedules();
      setSchedules(data);
    } catch (err) {
      setError(extractPlannerErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSchedules();
  }, []);

  function handleCreated(schedule) {
    setSchedules((current) => [...current, schedule]);
    setShowForm(false);
  }

  function handleEdit(schedule) {
    setEditingSchedule(schedule);
    setShowForm(true);
    setError("");
  }

  function handleUpdated(updatedSchedule) {
    setSchedules((current) =>
      current.map((schedule) =>
        schedule.id === updatedSchedule.id ? updatedSchedule : schedule,
      ),
    );
    setEditingSchedule(null);
    setShowForm(false);
  }

  function handleCancelEdit() {
    setEditingSchedule(null);
    setShowForm(false);
  }

  async function handleDelete(scheduleId) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this study schedule?",
    );

    if (!confirmed) return;

    try {
      setError("");
      await deleteSchedule(scheduleId);

      setSchedules((current) =>
        current.filter((schedule) => schedule.id !== scheduleId),
      );

      if (editingSchedule?.id === scheduleId) {
        setEditingSchedule(null);
        setShowForm(false);
      }
    } catch (err) {
      setError(extractPlannerErrorMessage(err));
    }
  }

  function handleAddSchedule() {
    setEditingSchedule(null);
    setShowForm((current) => !current);
    setError("");
  }

  return (
    <div className="app-screen">
      <Navbar />

      <main className="main-content">
        {/* Header section */}
        <div className="page-header">
          <div className="page-header-row">
            <div>
              <h1 className="page-title">
                <span>📅</span>
                <span>Study Planner</span>
              </h1>
              <p className="page-description">
                Organize your course routines, set regular study blocks, and manage academic deadlines.
              </p>
            </div>

            <Button onClick={handleAddSchedule}>
              {showForm && !editingSchedule ? "✕ Close Form" : "➕ Add Study Routine"}
            </Button>
          </div>
        </div>

        {/* Schedule Form */}
        {showForm && (
          <ScheduleForm
            schedule={editingSchedule}
            onCreated={handleCreated}
            onUpdated={handleUpdated}
            onCancel={handleCancelEdit}
          />
        )}

        {/* Loading State */}
        {loading && (
          <Card className="empty-state-card">
            <Spinner standalone />
            <p className="page-loading-text">Loading your study routines...</p>
          </Card>
        )}

        {/* Error State */}
        {!loading && error && (
          <Card className="empty-state-card">
            <FormError message={error} className="form-error-block" />
            <Button onClick={loadSchedules}>Try Again</Button>
          </Card>
        )}

        {/* Empty State */}
        {!loading && !error && schedules.length === 0 && !showForm && (
          <Card className="empty-state-card">
            <div className="empty-state-icon">📚</div>
            <h2 className="empty-state-title">No study routines yet</h2>
            <p className="empty-state-desc">
              Create your first scheduled routine to structure your weekly study sessions and hit your deadlines.
            </p>
            <Button onClick={handleAddSchedule}>Create Routine Now</Button>
          </Card>
        )}

        {/* Schedules Grid */}
        {!loading && !error && schedules.length > 0 && (
          <div className="schedules-grid">
            {schedules.map((schedule) => (
              <Card key={schedule.id} className="schedule-card">
                <div>
                  <div className="schedule-card-header">
                    <h3 className="schedule-subject">{schedule.subject}</h3>
                    <Badge variant="accent">Routine</Badge>
                  </div>

                  <div className="schedule-meta-row">
                    <div className="schedule-time-badge">
                      <span>⏰</span>
                      <span>
                        {schedule.start_time.slice(0, 5)} – {schedule.end_time.slice(0, 5)}
                      </span>
                    </div>

                    <div className="schedule-days-list">
                      {schedule.days.map((day) => (
                        <Badge key={day} variant="default">
                          {day.slice(0, 3)}
                        </Badge>
                      ))}
                    </div>

                    {schedule.deadline && (
                      <div className="schedule-deadline">
                        <span>🎯 Deadline: {schedule.deadline}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="card-actions-row">
                  <Button size="sm" variant="secondary" onClick={() => handleEdit(schedule)}>
                    ✏️ Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleDelete(schedule.id)}
                  >
                    🗑️ Delete
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
