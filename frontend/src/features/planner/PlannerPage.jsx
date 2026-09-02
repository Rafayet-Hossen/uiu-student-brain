import { useEffect, useState } from "react";
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Layers,
  LayoutGrid,
  List,
  Pencil,
  Plus,
  Trash2,
  Video,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Badge from "../../components/Badge";
import Button from "../../components/Button";
import Card from "../../components/Card";
import EmptyState from "../../components/EmptyState";
import ErrorState from "../../components/ErrorState";
import Navbar from "../../components/Navbar";
import { CardSkeleton } from "../../components/Skeleton";
import {
  deleteSchedule,
  extractPlannerErrorMessage,
  getSchedules,
} from "./api";
import CalendarView from "./components/CalendarView";
import ScheduleForm from "./components/ScheduleForm";

export default function PlannerPage() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState("calendar"); // "calendar" | "list"
  const [showForm, setShowForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [formInitialValues, setFormInitialValues] = useState(null);

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
    setFormInitialValues(null);
  }

  function handleEdit(schedule) {
    setEditingSchedule(schedule);
    setFormInitialValues(null);
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
    setFormInitialValues(null);
    setShowForm(false);
  }

  function handleCancelForm() {
    setEditingSchedule(null);
    setFormInitialValues(null);
    setShowForm(false);
  }

  async function handleDelete(scheduleId) {
    const confirmed = window.confirm(
      "Remove this study routine from your planner?",
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
        setFormInitialValues(null);
        setShowForm(false);
      }
    } catch (err) {
      setError(extractPlannerErrorMessage(err));
    }
  }

  function handleAddSchedule() {
    setEditingSchedule(null);
    setFormInitialValues(null);
    setShowForm((current) => !current);
    setError("");
  }

  function handleSlotClick(dayName, startHour) {
    const startStr = `${startHour.toString().padStart(2, "0")}:00`;
    const endStr = `${Math.min(23, startHour + 2)
      .toString()
      .padStart(2, "0")}:00`;

    setEditingSchedule(null);
    setFormInitialValues({
      days: [dayName],
      start_time: startStr,
      end_time: endStr,
    });
    setShowForm(true);
    window.scrollTo({ top: 120, behavior: "smooth" });
  }

  return (
    <div className="app-screen">
      <Navbar />

      <main className="main-content">
        {/* Page Header */}
        <div className="page-header">
          <div className="page-header-row">
            <div>
              <h1 className="page-title">
                <CalendarIcon size={28} className="text-indigo" />
                <span>Study Planner & Timetable</span>
              </h1>
              <p className="page-description">
                Organize coursework into focused weekly blocks, attach Drive
                notes and video links, and maintain academic momentum.
              </p>
            </div>

            <div
              style={{
                display: "flex",
                gap: "10px",
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              {/* View Toggle */}
              <div className="planner-view-toggle">
                <button
                  type="button"
                  className={`view-toggle-btn ${
                    viewMode === "calendar" ? "btn-active" : ""
                  }`}
                  onClick={() => setViewMode("calendar")}
                >
                  <CalendarIcon size={14} />
                  <span>Calendar</span>
                </button>
                <button
                  type="button"
                  className={`view-toggle-btn ${
                    viewMode === "list" ? "btn-active" : ""
                  }`}
                  onClick={() => setViewMode("list")}
                >
                  <List size={14} />
                  <span>Routine Cards</span>
                </button>
              </div>

              <Button
                variant={showForm && !editingSchedule ? "secondary" : "primary"}
                onClick={handleAddSchedule}
                icon={showForm && !editingSchedule ? X : Plus}
              >
                {showForm && !editingSchedule ? "Close Form" : "Add Routine"}
              </Button>
            </div>
          </div>
        </div>

        {/* Schedule Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
            >
              <ScheduleForm
                schedule={editingSchedule}
                initialValues={formInitialValues}
                onCreated={handleCreated}
                onUpdated={handleUpdated}
                onCancel={handleCancelForm}
              />
            </motion.div>
          )}
        </AnimatePresence>

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
            title="Failed to load study routines"
            message={error}
            onRetry={loadSchedules}
          />
        )}

        {/* Empty State */}
        {!loading && !error && schedules.length === 0 && !showForm && (
          <EmptyState
            icon={CalendarIcon}
            title="No study routines scheduled yet"
            description="Create your first structured routine to see time slots blocked on your weekly calendar and stay on track with exam deadlines."
            actionLabel="Create Routine Now"
            onAction={handleAddSchedule}
          />
        )}

        {/* Mode 1: CALENDAR VIEW */}
        {!loading &&
          !error &&
          schedules.length > 0 &&
          viewMode === "calendar" && (
            <CalendarView
              schedules={schedules}
              onEditSchedule={handleEdit}
              onDeleteSchedule={handleDelete}
              onSlotClick={handleSlotClick}
            />
          )}

        {/* Mode 2: LIST / CARDS VIEW */}
        {!loading && !error && schedules.length > 0 && viewMode === "list" && (
          <div className="schedules-grid">
            {schedules.map((schedule) => (
              <Card
                key={schedule.id}
                variant="feature"
                className="schedule-card"
              >
                <div>
                  <div className="schedule-card-header">
                    <h3 className="schedule-subject">{schedule.subject}</h3>
                    <Badge variant="primary">Routine</Badge>
                  </div>

                  <div className="schedule-meta-row">
                    <div className="schedule-time-badge">
                      <Clock size={14} />
                      <span>
                        {schedule.start_time.slice(0, 5)} –{" "}
                        {schedule.end_time.slice(0, 5)}
                      </span>
                    </div>

                    <div className="schedule-days-list">
                      {schedule.days.map((day) => (
                        <span key={day} className="schedule-day-pill">
                          {day.slice(0, 3)}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Notes & Resources */}
                  {schedule.notes && (
                    <div
                      style={{
                        margin: "12px 0",
                        fontSize: "0.875rem",
                        color: "var(--color-text)",
                        background: "var(--color-surface-subtle)",
                        padding: "8px 12px",
                        borderRadius: "var(--radius-sm)",
                        borderLeft: "3px solid var(--color-primary)",
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 600,
                          fontSize: "0.75rem",
                          color: "var(--color-text-muted)",
                          display: "block",
                          marginBottom: "2px",
                        }}
                      >
                        📝 Study Notes:
                      </span>
                      {schedule.notes}
                    </div>
                  )}

                  {/* Resource Links */}
                  {schedule.resources && schedule.resources.length > 0 && (
                    <div style={{ marginTop: "12px" }}>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          color: "var(--color-text-muted)",
                          display: "block",
                          marginBottom: "6px",
                        }}
                      >
                        🔗 Study Resources:
                      </span>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "6px",
                        }}
                      >
                        {schedule.resources.map((res, index) => (
                          <a
                            key={index}
                            href={res.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "8px",
                              fontSize: "0.8125rem",
                              padding: "6px 10px",
                              background: "var(--color-surface-subtle)",
                              borderRadius: "var(--radius-sm)",
                              border: "1px solid var(--color-border-subtle)",
                              textDecoration: "none",
                              color: "var(--color-text)",
                              transition: "background 0.15s ease",
                            }}
                          >
                            <span>
                              {res.type === "drive"
                                ? "📁"
                                : res.type === "video"
                                  ? "🎥"
                                  : res.type === "doc"
                                    ? "📄"
                                    : "🔗"}
                            </span>
                            <strong
                              style={{
                                flex: 1,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {res.title || "Resource Link"}
                            </strong>
                            <ExternalLink size={12} className="text-muted" />
                          </a>
                        ))}
                      </div>
                    </div>
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
                    onClick={() => handleEdit(schedule)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    icon={Trash2}
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
