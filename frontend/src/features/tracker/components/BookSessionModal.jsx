import { useEffect, useState } from "react";
import {
  AlertCircle,
  BookOpen,
  Calendar,
  Clock,
  ExternalLink,
  FileText,
  Layers,
  Sparkles,
  Tag,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import Button from "../../../components/Button";
import FormError from "../../../components/FormError";
import Input from "../../../components/Input";
import { getMaterials, getSemesters } from "../../materials/api";
import { createStudySession } from "../api";

export default function BookSessionModal({
  isOpen,
  onClose,
  onSessionBooked,
  onNavigateToMaterials,
}) {
  const [semesters, setSemesters] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [materials, setMaterials] = useState([]);
  const [selectedMaterialId, setSelectedMaterialId] = useState("");

  const [subject, setSubject] = useState("");
  const [sessionDate, setSessionDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });

  const getInitialStartTime = () => {
    const now = new Date();
    now.setMinutes(Math.ceil(now.getMinutes() / 15) * 15);
    const hrs = String(now.getHours()).padStart(2, "0");
    const mins = String(now.getMinutes()).padStart(2, "0");
    return `${hrs}:${mins}`;
  };

  const [startTime, setStartTime] = useState(getInitialStartTime);
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [notes, setNotes] = useState("");

  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Load user courses on mount
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setLoadingInitial(true);
    setError("");

    getSemesters()
      .then((data) => {
        if (!isMounted) return;
        setSemesters(data || []);
        const allCourses = [];
        (data || []).forEach((sem) => {
          (sem.courses || []).forEach((c) => {
            allCourses.push({ ...c, semesterName: sem.name });
          });
        });
        setCourses(allCourses);
        if (allCourses.length > 0) {
          setSelectedCourseId(String(allCourses[0].id));
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error("Failed to load semesters for booking", err);
          setError("Failed to load your enrolled courses.");
        }
      })
      .finally(() => {
        if (isMounted) setLoadingInitial(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Load materials when selected course changes
  useEffect(() => {
    if (!selectedCourseId) {
      setMaterials([]);
      setSelectedMaterialId("");
      return;
    }

    let isMounted = true;
    setLoadingMaterials(true);

    getMaterials(Number(selectedCourseId))
      .then((data) => {
        if (!isMounted) return;
        const matList = Array.isArray(data) ? data : data?.results || [];
        setMaterials(matList);
        if (matList.length > 0) {
          setSelectedMaterialId(String(matList[0].id));
          const course = courses.find((c) => String(c.id) === String(selectedCourseId));
          const codePrefix = course?.code ? `[${course.code}] ` : "";
          setSubject(`${codePrefix}${matList[0].title}`);
        } else {
          setSelectedMaterialId("");
          const course = courses.find((c) => String(c.id) === String(selectedCourseId));
          const codePrefix = course?.code ? `[${course.code}] ` : "";
          setSubject(course ? `${codePrefix}${course.title}` : "Study Session");
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error("Failed to fetch course materials", err);
        }
      })
      .finally(() => {
        if (isMounted) setLoadingMaterials(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedCourseId, courses]);

  // Update subject when material changes
  const handleMaterialChange = (matId) => {
    setSelectedMaterialId(matId);
    const chosen = materials.find((m) => String(m.id) === String(matId));
    const course = courses.find((c) => String(c.id) === String(selectedCourseId));
    const codePrefix = course?.code ? `[${course.code}] ` : "";
    if (chosen) {
      setSubject(`${codePrefix}${chosen.title}`);
    }
  };

  const handleQuickDuration = (mins) => {
    setDurationMinutes(mins);
  };

  const handleQuickDate = (type) => {
    const d = new Date();
    if (type === "tomorrow") {
      d.setDate(d.getDate() + 1);
    }
    setSessionDate(d.toISOString().split("T")[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!selectedCourseId) {
      setError("Please select a course for this study session.");
      return;
    }

    if (!startTime) {
      setError("Please specify a scheduled start time.");
      return;
    }

    if (durationMinutes <= 0) {
      setError("Study duration must be at least 15 minutes.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        course: Number(selectedCourseId),
        material: selectedMaterialId ? Number(selectedMaterialId) : null,
        subject: subject.trim() || "Course Study Block",
        session_date: sessionDate,
        start_time: startTime.length === 5 ? `${startTime}:00` : startTime,
        duration_minutes: Number(durationMinutes),
        notes: notes.trim(),
        status: "scheduled",
      };

      const newSession = await createStudySession(payload);
      if (onSessionBooked) {
        onSessionBooked(newSession);
      }
      onClose();
    } catch (err) {
      console.error("Failed to schedule session", err);
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        (err?.response?.data && typeof err.response.data === "object"
          ? Object.entries(err.response.data)
              .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
              .join(" | ")
          : null) ||
        "Failed to schedule study session. Please check your inputs.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const selectedMaterial = materials.find(
    (m) => String(m.id) === String(selectedMaterialId),
  );

  return (
    <div
      className="tracker-session-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        className="tracker-session-modal-dialog"
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "560px" }}
      >
        {/* Modal Header */}
        <div className="tracker-modal-header">
          <div className="tracker-modal-title-box">
            <span className="tracker-modal-icon">📅</span>
            <div>
              <h3 className="tracker-modal-heading">
                Book Scheduled Study Session
              </h3>
              <p className="tracker-modal-subheading">
                Reserve your focus block with mandatory course materials for
                post-session AI testing.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="tracker-modal-close-btn"
            onClick={onClose}
            title="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="tracker-modal-body">
          {error && <FormError message={error} className="mb-3" />}

          {/* 1. Course Selection */}
          <div className="form-group mb-3">
            <label className="form-label text-xs">
              <Layers size={14} className="inline mr-1 text-primary" />
              Select Course
            </label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="form-input form-input-sm"
              disabled={submitting || loadingInitial}
              required
            >
              {courses.length === 0 && (
                <option value="">No courses available</option>
              )}
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.code ? `[${course.code}] ` : ""}
                  {course.title} ({course.semesterName || "Current"})
                </option>
              ))}
            </select>
          </div>

          {/* 2. Uploaded Material Selection */}
          <div className="form-group mb-3">
            <div className="flex justify-between items-center mb-1">
              <label className="form-label text-xs mb-0">
                <FileText size={14} className="inline mr-1 text-amber" />
                Select Uploaded Study Material (Topic Source)
              </label>
              {materials.length === 0 && !loadingMaterials && (
                <button
                  type="button"
                  className="text-xs text-primary underline"
                  onClick={() => {
                    onClose();
                    if (onNavigateToMaterials) onNavigateToMaterials();
                  }}
                >
                  Upload in Materials Hub ↗
                </button>
              )}
            </div>

            {loadingMaterials ? (
              <div className="text-xs text-muted py-2">
                Loading course materials...
              </div>
            ) : materials.length > 0 ? (
              <select
                value={selectedMaterialId}
                onChange={(e) => handleMaterialChange(e.target.value)}
                className="form-input form-input-sm"
                disabled={submitting}
              >
                {materials.map((mat) => (
                  <option key={mat.id} value={mat.id}>
                    [{mat.category || mat.material_type}] {mat.title}
                  </option>
                ))}
              </select>
            ) : (
              <div className="alert-banner alert-banner-warning p-2 text-xs">
                <AlertCircle size={14} className="inline mr-1 text-amber" />
                No study materials uploaded for this course yet. You can still
                schedule, but uploading notes gives you instant Gemini AI
                diagnostic quizzes.
              </div>
            )}

            {/* Topics Preview Badge Strip */}
            {selectedMaterial?.key_topics &&
              selectedMaterial.key_topics.length > 0 && (
                <div
                  className="mt-2 p-2"
                  style={{
                    background: "var(--color-surface-subtle)",
                    borderRadius: "8px",
                    border: "1px solid var(--color-border)",
                  }}
                >
                  <span
                    className="text-xs text-muted block mb-1 font-medium"
                    style={{ fontSize: "0.72rem" }}
                  >
                    🎯 Covered Topics (Assessed in Post-Session Quiz):
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {selectedMaterial.key_topics.slice(0, 5).map((topic, i) => (
                      <span
                        key={i}
                        style={{
                          background: "var(--color-primary-light)",
                          color: "var(--color-primary)",
                          fontSize: "0.7rem",
                          padding: "1px 6px",
                          borderRadius: "10px",
                          fontWeight: 500,
                        }}
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              )}
          </div>

          {/* 3. Session Title / Subject */}
          <div className="form-group mb-3">
            <label className="form-label text-xs">Study Focus Topic</label>
            <input
              type="text"
              className="form-input form-input-sm"
              placeholder="e.g. Graph Algorithms & Shortest Paths"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={submitting}
              required
            />
          </div>

          {/* 4. Date & Start Time */}
          <div
            className="grid grid-cols-2 gap-3 mb-3"
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}
          >
            <div className="form-group">
              <div className="flex justify-between items-center mb-1">
                <label className="form-label text-xs mb-0">
                  <Calendar size={13} className="inline mr-1" />
                  Date
                </label>
                <div className="flex gap-1">
                  <button
                    type="button"
                    className="text-xs text-muted hover:text-primary"
                    style={{ fontSize: "0.7rem" }}
                    onClick={() => handleQuickDate("today")}
                  >
                    Today
                  </button>
                  <span className="text-muted">•</span>
                  <button
                    type="button"
                    className="text-xs text-muted hover:text-primary"
                    style={{ fontSize: "0.7rem" }}
                    onClick={() => handleQuickDate("tomorrow")}
                  >
                    Tomorrow
                  </button>
                </div>
              </div>
              <input
                type="date"
                className="form-input form-input-sm"
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
                disabled={submitting}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label text-xs mb-1">
                <Clock size={13} className="inline mr-1" />
                Start Time
              </label>
              <input
                type="time"
                className="form-input form-input-sm"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                disabled={submitting}
                required
              />
            </div>
          </div>

          {/* 5. Duration Selector */}
          <div className="form-group mb-3">
            <label className="form-label text-xs mb-1">
              Duration: <strong>{durationMinutes} minutes</strong>
            </label>
            <div className="flex gap-2 flex-wrap">
              {[30, 45, 60, 90, 120].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => handleQuickDuration(mins)}
                  style={{
                    padding: "4px 10px",
                    borderRadius: "8px",
                    fontSize: "0.78rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    border: "1px solid",
                    borderColor:
                      durationMinutes === mins
                        ? "var(--color-primary)"
                        : "var(--color-border)",
                    background:
                      durationMinutes === mins
                        ? "var(--color-primary-light)"
                        : "var(--color-surface)",
                    color:
                      durationMinutes === mins
                        ? "var(--color-primary)"
                        : "var(--color-text)",
                  }}
                >
                  {mins} min
                </button>
              ))}
            </div>
          </div>

          {/* 6. Notes (Optional) */}
          <div className="form-group mb-3">
            <label className="form-label text-xs">
              Session Goal / Notes (Optional)
            </label>
            <textarea
              className="form-input form-input-sm"
              rows="2"
              placeholder="e.g. Solve 3 practice problems on Dijkstra and review proof steps."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={submitting}
            />
          </div>

          {/* Strict Attendance Warning Notice */}
          <div
            className="alert-banner alert-banner-info mb-4"
            style={{ fontSize: "0.75rem", lineHeight: "1.4" }}
          >
            ⚡ <strong>Strict Consistency Rule:</strong> Scheduled sessions must
            be attended during their booked time window. Unattended sessions
            expire as missed and do not count towards your streaks or daily
            goal.
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-2 mt-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={submitting}
              disabled={submitting || loadingInitial}
            >
              Confirm & Book Session
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
