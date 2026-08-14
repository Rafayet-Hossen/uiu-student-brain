import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Button from "../../components/Button";
import Card from "../../components/Card";
import FormError from "../../components/FormError";
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
      "Are you sure you want to delete this schedule?",
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
    <div className="dashboard-screen">
      <header className="dashboard-header">
        <Link to="/dashboard" className="dashboard-brand">
          Student Brain
        </Link>
      </header>

      <main className="dashboard-main">
        <h1>Study Planner</h1>

        <p className="auth-subtitle">
          Organize your study schedule and deadlines.
        </p>

        <Button onClick={handleAddSchedule}>
          {showForm && !editingSchedule ? "Close Form" : "Add Schedule"}
        </Button>

        {showForm && (
          <ScheduleForm
            schedule={editingSchedule}
            onCreated={handleCreated}
            onUpdated={handleUpdated}
            onCancel={handleCancelEdit}
          />
        )}

        {loading && (
          <Card>
            <Spinner standalone />
            <p>Loading your schedules...</p>
          </Card>
        )}

        {!loading && error && (
          <Card>
            <FormError message={error} className="form-error-block" />

            <Button onClick={loadSchedules}>Try again</Button>
          </Card>
        )}

        {!loading && !error && schedules.length === 0 && (
          <Card>
            <h2>No schedules yet</h2>

            <p className="auth-subtitle">
              Create your first study schedule to get started.
            </p>
          </Card>
        )}

        {!loading && !error && schedules.length > 0 && (
          <div className="planner-list">
            {schedules.map((schedule) => (
              <Card key={schedule.id}>
                <h2>{schedule.subject}</h2>

                <p>
                  {schedule.start_time.slice(0, 5)} -{" "}
                  {schedule.end_time.slice(0, 5)}
                </p>

                <p>Days: {schedule.days.join(", ")}</p>

                {schedule.deadline && <p>Deadline: {schedule.deadline}</p>}

                <div className="planner-card-actions">
                  <Button onClick={() => handleEdit(schedule)}>Edit</Button>

                  <Button
                    variant="secondary"
                    onClick={() => handleDelete(schedule.id)}
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
