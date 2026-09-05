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
import RoutineCard from "./components/RoutineCard";
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
              <RoutineCard
                key={schedule.id}
                schedule={schedule}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
