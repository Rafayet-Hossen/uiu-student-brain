import { useEffect, useState, useRef } from "react";
import {
  AlertCircle,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  FileText,
  FileUp,
  Layers,
  PenTool,
  Plus,
  Sparkles,
  Tag,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Button from "../../../components/Button";
import FormError from "../../../components/FormError";
import Input from "../../../components/Input";
import {
  getMaterials,
  getSemesters,
  getCourses,
  createMaterial,
  extractMaterialsErrorMessage,
} from "../../materials/api";
import { createStudySession } from "../api";

const CATEGORIES = [
  "Lecture Note",
  "Textbook Chapter",
  "Cheat Sheet",
  "Lab Report",
  "Other",
];

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

  // Inline Quick Upload Drawer State
  const [showQuickUpload, setShowQuickUpload] = useState(false);
  const [uploadType, setUploadType] = useState("document"); // "document" | "note"
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadCategory, setUploadCategory] = useState("Lecture Note");
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadContentText, setUploadContentText] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccessToast, setUploadSuccessToast] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // Load user courses on mount or open
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setLoadingInitial(true);
    setError("");

    const loadAllCourses = async () => {
      try {
        const semsData = await getSemesters();
        if (!isMounted) return;
        const sems = Array.isArray(semsData)
          ? semsData
          : semsData?.results || [];
        setSemesters(sems);

        let allCourses = [];
        // 1. Check if courses are attached to semesters
        (sems || []).forEach((sem) => {
          (sem.courses || []).forEach((c) => {
            allCourses.push({
              ...c,
              semesterName: sem.name,
              semester_name: sem.name,
            });
          });
        });

        // 2. If no courses found nested, query each semester in parallel
        if (allCourses.length === 0 && sems.length > 0) {
          const nested = await Promise.all(
            sems.map(async (sem) => {
              try {
                const cList = await getCourses(sem.id);
                const items = Array.isArray(cList)
                  ? cList
                  : cList?.results || [];
                return items.map((c) => ({
                  ...c,
                  semesterName: sem.name,
                  semester_name: sem.name,
                }));
              } catch {
                return [];
              }
            }),
          );
          allCourses = nested.flat();
        }

        // 3. Fallback to global getCourses()
        if (allCourses.length === 0) {
          try {
            const globalCourses = await getCourses();
            const items = Array.isArray(globalCourses)
              ? globalCourses
              : globalCourses?.results || [];
            allCourses = items.map((c) => ({
              ...c,
              semesterName:
                c.semester_name || c.semester?.name || "Enrolled Course",
              semester_name:
                c.semester_name || c.semester?.name || "Enrolled Course",
            }));
          } catch {
            // ignore
          }
        }

        if (!isMounted) return;
        setCourses(allCourses);
        if (allCourses.length > 0) {
          setSelectedCourseId(String(allCourses[0].id));
        } else {
          setSelectedCourseId("");
        }
      } catch (err) {
        if (isMounted) {
          console.error("Failed to load semesters/courses for booking", err);
          setError("Failed to load your enrolled courses.");
        }
      } finally {
        if (isMounted) setLoadingInitial(false);
      }
    };

    loadAllCourses();

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

    async function loadCourseMaterials() {
      try {
        const data = await getMaterials(Number(selectedCourseId));
        if (!isMounted) return;
        const matList = Array.isArray(data) ? data : data?.results || [];
        setMaterials(matList);
        if (matList.length > 0) {
          setSelectedMaterialId(String(matList[0].id));
          const course = courses.find(
            (c) => String(c.id) === String(selectedCourseId),
          );
          const codePrefix = course?.code ? `[${course.code}] ` : "";
          setSubject(`${codePrefix}${matList[0].title}`);
        } else {
          setSelectedMaterialId("");
          const course = courses.find(
            (c) => String(c.id) === String(selectedCourseId),
          );
          const codePrefix = course?.code ? `[${course.code}] ` : "";
          setSubject(course ? `${codePrefix}${course.title}` : "Study Session");
        }
      } catch (err) {
        if (isMounted) {
          console.error("Failed to fetch course materials", err);
        }
      } finally {
        if (isMounted) setLoadingMaterials(false);
      }
    }

    loadCourseMaterials();

    return () => {
      isMounted = false;
    };
  }, [selectedCourseId, courses]);

  // Update subject when material changes
  const handleMaterialChange = (matId) => {
    setSelectedMaterialId(matId);
    const chosen = materials.find((m) => String(m.id) === String(matId));
    const course = courses.find(
      (c) => String(c.id) === String(selectedCourseId),
    );
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

  const handleQuickTime = (timeStr) => {
    setStartTime(timeStr);
  };

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
      if (!uploadTitle.trim()) {
        const cleanName = file.name.replace(/\.[^/.]+$/, "");
        setUploadTitle(cleanName);
      }
    }
  };

  // Handle Drag & Drop
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setUploadFile(file);
      if (!uploadTitle.trim()) {
        const cleanName = file.name.replace(/\.[^/.]+$/, "");
        setUploadTitle(cleanName);
      }
    }
  };

  // Handle Inline Quick Upload Submit
  const handleInlineUploadSubmit = async (e) => {
    e.preventDefault();
    setUploadError("");

    if (!selectedCourseId) {
      setUploadError("Please select a course before attaching materials.");
      return;
    }

    if (!uploadTitle.trim()) {
      setUploadError("Please enter a title for the material.");
      return;
    }

    if (uploadType === "document" && !uploadFile && !uploadContentText.trim()) {
      setUploadError("Please choose a file or paste document text.");
      return;
    }

    if (uploadType === "note" && !uploadContentText.trim()) {
      setUploadError("Please enter note or lecture content.");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("title", uploadTitle.trim());
      formData.append("category", uploadCategory);
      formData.append("material_type", uploadType);

      if (uploadType === "document" && uploadFile) {
        formData.append("file", uploadFile);
      }
      if (uploadContentText.trim()) {
        formData.append("content", uploadContentText.trim());
        formData.append("content_text", uploadContentText.trim());
      }

      const created = await createMaterial(Number(selectedCourseId), formData);

      // Successfully created: add to materials list and select it
      setMaterials((prev) => [created, ...prev]);
      setSelectedMaterialId(String(created.id));

      const course = courses.find(
        (c) => String(c.id) === String(selectedCourseId),
      );
      const codePrefix = course?.code ? `[${course.code}] ` : "";
      setSubject(`${codePrefix}${created.title}`);

      setUploadSuccessToast(`✓ Attached "${created.title}" to this session!`);
      // Reset upload form
      setUploadTitle("");
      setUploadFile(null);
      setUploadContentText("");
      setShowQuickUpload(false);

      setTimeout(() => {
        setUploadSuccessToast("");
      }, 4500);
    } catch (err) {
      console.error("Inline upload failed", err);
      setUploadError(extractMaterialsErrorMessage(err));
    } finally {
      setIsUploading(false);
    }
  };

  // Main Session Booking Submit
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
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Fixed / Sticky Modal Header (Nav bar inside modal) */}
        <div className="tracker-modal-header">
          <div className="tracker-modal-title-box">
            <span className="tracker-modal-icon">
              <Calendar size={18} />
            </span>
            <div className="tracker-modal-text-wrap">
              <h3 className="tracker-modal-heading">
                Book Scheduled Study Session
              </h3>
              <p className="tracker-modal-subheading">
                Commit to dedicated focus with course materials for post-session
                AI diagnostic quizzes.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="tracker-modal-close-btn"
            onClick={onClose}
            title="Close modal"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="tracker-modal-body">
          {error && <FormError message={error} className="mb-4" />}

          {uploadSuccessToast && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="tracker-material-attached-badge mb-4"
            >
              <CheckCircle2 size={16} />
              <span>{uploadSuccessToast}</span>
            </motion.div>
          )}

          {/* ============================================================ */}
          {/* STEP 1: COURSE & MATERIAL */}
          {/* ============================================================ */}
          <div className="tracker-modal-card-section">
            <div className="tracker-modal-step-header">
              <div className="tracker-modal-section-title">
                <span className="tracker-modal-step-badge">1</span>
                <span>Course & Study Material</span>
              </div>
              <span
                style={{
                  fontSize: "0.72rem",
                  color: "var(--color-primary)",
                  fontWeight: 600,
                  background: "var(--color-primary-light)",
                  padding: "2px 8px",
                  borderRadius: "12px",
                }}
              >
                Required for AI Quiz
              </span>
            </div>

            {/* Course Selector */}
            <div className="form-group mb-3">
              <label className="form-label text-xs font-medium text-muted mb-1 block">
                <Layers size={13} className="inline mr-1 text-primary" />
                Target Course
              </label>
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="form-input form-input-sm"
                disabled={submitting || loadingInitial}
                required
              >
                {courses.length === 0 && (
                  <option value="">
                    {loadingInitial
                      ? "Loading courses..."
                      : "No courses available"}
                  </option>
                )}
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.code ? `[${course.code}] ` : ""}
                    {course.title} ({course.semesterName || "Current Semester"})
                  </option>
                ))}
              </select>
            </div>

            {/* Study Material Selector & Inline Upload Toggle */}
            <div className="form-group mb-1">
              <div className="flex justify-between items-center mb-1">
                <label className="form-label text-xs font-medium text-muted mb-0">
                  <FileText size={13} className="inline mr-1 text-amber" />
                  Study Material / Topic Source
                </label>
                <button
                  type="button"
                  onClick={() => setShowQuickUpload(!showQuickUpload)}
                  className="text-xs font-semibold flex items-center gap-1 text-primary hover:underline"
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  <Plus size={13} />
                  {showQuickUpload
                    ? "Close Uploader"
                    : "Quick Upload File / Notes"}
                </button>
              </div>

              {loadingMaterials ? (
                <div className="text-xs text-muted py-2 flex items-center gap-2">
                  <span className="spinner-border spinner-border-sm" />
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
                <div
                  className="p-3 mb-2"
                  style={{
                    background: "rgba(245, 158, 11, 0.08)",
                    border: "1px dashed rgba(245, 158, 11, 0.35)",
                    borderRadius: "8px",
                  }}
                >
                  <div className="flex items-start gap-2 text-xs">
                    <AlertCircle
                      size={15}
                      className="text-amber flex-shrink-0 mt-0.5"
                    />
                    <div>
                      <p className="font-semibold text-amber mb-1">
                        No materials attached to this course yet
                      </p>
                      <p className="text-muted mb-2">
                        Upload a PDF, slides, or paste lecture notes right here
                        to unlock AI diagnostic tests.
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowQuickUpload(true)}
                        className="text-xs font-bold text-primary flex items-center gap-1 hover:underline"
                      >
                        <FileUp size={13} />
                        Click here to upload or paste notes directly
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Selected Material Key Topics Preview */}
              {selectedMaterial && (
                <div
                  className="mt-2 p-2.5"
                  style={{
                    background: "var(--color-surface)",
                    borderRadius: "8px",
                    border: "1px solid var(--color-border)",
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className="text-xs font-semibold text-text"
                      style={{ fontSize: "0.76rem" }}
                    >
                      📖 {selectedMaterial.title}
                    </span>
                    <span
                      style={{
                        fontSize: "0.7rem",
                        color: "var(--color-text-muted)",
                      }}
                    >
                      {selectedMaterial.estimated_reading_time
                        ? `~${selectedMaterial.estimated_reading_time} min read`
                        : `${selectedMaterial.category || "Study Material"}`}
                    </span>
                  </div>
                  {selectedMaterial.key_topics &&
                  selectedMaterial.key_topics.length > 0 ? (
                    <div>
                      <span
                        className="text-xs text-muted block mb-1 font-medium"
                        style={{ fontSize: "0.7rem" }}
                      >
                        🎯 AI Assessed Topics:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {selectedMaterial.key_topics
                          .slice(0, 5)
                          .map((topic, i) => (
                            <span
                              key={i}
                              style={{
                                background: "var(--color-primary-light)",
                                color: "var(--color-primary)",
                                fontSize: "0.68rem",
                                padding: "1px 7px",
                                borderRadius: "10px",
                                fontWeight: 600,
                              }}
                            >
                              {topic}
                            </span>
                          ))}
                      </div>
                    </div>
                  ) : (
                    <p
                      className="text-muted text-xs mb-0"
                      style={{ fontSize: "0.7rem" }}
                    >
                      ✨ Post-session quiz will automatically extract topics
                      from this material.
                    </p>
                  )}
                </div>
              )}

              {/* ============================================================ */}
              {/* INLINE QUICK UPLOAD DRAWER */}
              {/* ============================================================ */}
              <AnimatePresence>
                {showQuickUpload && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="tracker-inline-upload-box"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4
                        className="text-xs font-bold text-text flex items-center gap-1.5"
                        style={{ margin: 0 }}
                      >
                        <Sparkles size={14} className="text-primary" />
                        Quick Material Attachment
                      </h4>
                      <button
                        type="button"
                        onClick={() => setShowQuickUpload(false)}
                        className="text-muted hover:text-text p-1"
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        <X size={14} />
                      </button>
                    </div>

                    {uploadError && (
                      <div className="alert-banner alert-banner-danger p-2 text-xs mb-3">
                        <AlertCircle size={13} className="inline mr-1" />
                        {uploadError}
                      </div>
                    )}

                    {/* Type Tabs */}
                    <div className="tracker-upload-tab-bar">
                      <button
                        type="button"
                        className={`tracker-upload-tab-btn ${
                          uploadType === "document" ? "active" : ""
                        }`}
                        onClick={() => setUploadType("document")}
                      >
                        <FileUp size={13} />
                        Upload Document (.pdf, .docx, .txt)
                      </button>
                      <button
                        type="button"
                        className={`tracker-upload-tab-btn ${
                          uploadType === "note" ? "active" : ""
                        }`}
                        onClick={() => setUploadType("note")}
                      >
                        <PenTool size={13} />
                        Type / Paste Notes
                      </button>
                    </div>

                    {/* Title Input */}
                    <div className="mb-2">
                      <label className="text-xs text-muted block mb-1 font-medium">
                        Material Title *
                      </label>
                      <input
                        type="text"
                        className="form-input form-input-sm"
                        placeholder="e.g. Chapter 4: Greedy Algorithms & Shortest Path"
                        value={uploadTitle}
                        onChange={(e) => setUploadTitle(e.target.value)}
                        disabled={isUploading}
                        required
                      />
                    </div>

                    {/* Category Selector Pills */}
                    <div className="mb-3">
                      <label className="text-xs text-muted block mb-1 font-medium">
                        Category
                      </label>
                      <div className="tracker-preset-pills">
                        {CATEGORIES.map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            className={`tracker-preset-pill ${
                              uploadCategory === cat ? "active" : ""
                            }`}
                            onClick={() => setUploadCategory(cat)}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Upload Mode 1: Document File */}
                    {uploadType === "document" && (
                      <div className="mb-3">
                        <input
                          type="file"
                          ref={fileInputRef}
                          style={{ display: "none" }}
                          accept=".pdf,.docx,.doc,.txt,.md,.ppt,.pptx,.csv"
                          onChange={handleFileChange}
                        />

                        {!uploadFile ? (
                          <div
                            className={`tracker-upload-dropzone ${
                              isDragOver ? "drag-active" : ""
                            }`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <UploadCloud
                              size={28}
                              className="text-primary mb-1 mx-auto"
                            />
                            <p className="text-xs font-semibold text-text mb-0.5">
                              Click or Drag & Drop File Here
                            </p>
                            <p
                              className="text-muted mb-0"
                              style={{ fontSize: "0.7rem" }}
                            >
                              PDF, Word, Markdown, Plain Text (max 25MB)
                            </p>
                          </div>
                        ) : (
                          <div className="tracker-upload-file-preview">
                            <div className="flex items-center gap-2 overflow-hidden">
                              <FileText
                                size={18}
                                className="text-primary flex-shrink-0"
                              />
                              <div className="overflow-hidden">
                                <p
                                  className="text-xs font-semibold text-text truncate mb-0"
                                  style={{ maxWidth: "340px" }}
                                >
                                  {uploadFile.name}
                                </p>
                                <span
                                  className="text-muted"
                                  style={{ fontSize: "0.7rem" }}
                                >
                                  {(uploadFile.size / 1024).toFixed(1)} KB
                                </span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setUploadFile(null);
                                if (fileInputRef.current)
                                  fileInputRef.current.value = "";
                              }}
                              className="text-muted hover:text-danger p-1"
                              style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                              }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Upload Mode 2: Type / Paste Text */}
                    {uploadType === "note" && (
                      <div className="mb-3">
                        <label className="text-xs text-muted block mb-1 font-medium">
                          Note Content / Text *
                        </label>
                        <textarea
                          className="form-input form-input-sm"
                          rows="4"
                          placeholder="Paste lecture text, key definitions, or textbook summary here..."
                          value={uploadContentText}
                          onChange={(e) => setUploadContentText(e.target.value)}
                          disabled={isUploading}
                          required
                        />
                      </div>
                    )}

                    {/* Upload Action Button */}
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => setShowQuickUpload(false)}
                        disabled={isUploading}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        loading={isUploading}
                        onClick={handleInlineUploadSubmit}
                        disabled={
                          isUploading ||
                          (!uploadFile && !uploadContentText.trim())
                        }
                      >
                        Upload & Attach to Session
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* ============================================================ */}
          {/* STEP 2: FOCUS TOPIC */}
          {/* ============================================================ */}
          <div className="tracker-modal-card-section">
            <div className="tracker-modal-step-header">
              <div className="tracker-modal-section-title">
                <span className="tracker-modal-step-badge">2</span>
                <span>Focus Topic & Objectives</span>
              </div>
            </div>

            <div className="form-group mb-3">
              <label className="form-label text-xs font-medium text-muted mb-1 block">
                Study Session Topic / Title *
              </label>
              <input
                type="text"
                className="form-input form-input-sm"
                placeholder="e.g. Graph Algorithms & Shortest Path Implementation"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={submitting}
                required
              />
            </div>

            <div className="form-group mb-0">
              <label className="form-label text-xs font-medium text-muted mb-1 block">
                Session Goals / Specific Notes (Optional)
              </label>
              <textarea
                className="form-input form-input-sm"
                rows="2"
                placeholder="e.g. Solve 3 practice problems on Dijkstra and review time complexities."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={submitting}
              />
            </div>
          </div>

          {/* ============================================================ */}
          {/* STEP 3: SCHEDULE DATE, TIME & DURATION */}
          {/* ============================================================ */}
          <div className="tracker-modal-card-section">
            <div className="tracker-modal-step-header">
              <div className="tracker-modal-section-title">
                <span className="tracker-modal-step-badge">3</span>
                <span>Date, Time & Duration</span>
              </div>
            </div>

            {/* Date and Start Time Grid */}
            <div className="tracker-datetime-grid">
              {/* Date */}
              <div className="form-group mb-0">
                <div className="flex justify-between items-center mb-1">
                  <label className="form-label text-xs font-medium text-muted mb-0">
                    <Calendar size={13} className="inline mr-1" />
                    Date
                  </label>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      className="text-xs text-muted hover:text-primary font-medium"
                      style={{
                        fontSize: "0.72rem",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                      }}
                      onClick={() => handleQuickDate("today")}
                    >
                      Today
                    </button>
                    <span className="text-muted">•</span>
                    <button
                      type="button"
                      className="text-xs text-muted hover:text-primary font-medium"
                      style={{
                        fontSize: "0.72rem",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                      }}
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

              {/* Start Time */}
              <div className="form-group mb-0">
                <div className="flex justify-between items-center mb-1">
                  <label className="form-label text-xs font-medium text-muted mb-0">
                    <Clock size={13} className="inline mr-1" />
                    Start Time
                  </label>
                </div>
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

            {/* Quick Time Presets */}
            <div className="mb-3">
              <span
                className="text-muted block mb-1 font-medium"
                style={{ fontSize: "0.72rem" }}
              >
                Quick Time Presets:
              </span>
              <div className="tracker-preset-pills">
                {[
                  { label: "10:00 AM", val: "10:00" },
                  { label: "02:00 PM", val: "14:00" },
                  { label: "07:00 PM", val: "19:00" },
                  { label: "09:00 PM", val: "21:00" },
                ].map((slot) => (
                  <button
                    key={slot.val}
                    type="button"
                    className={`tracker-preset-pill ${
                      startTime === slot.val ? "active" : ""
                    }`}
                    onClick={() => handleQuickTime(slot.val)}
                  >
                    {slot.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Duration Selector */}
            <div className="form-group mb-0">
              <label className="form-label text-xs font-medium text-muted mb-1 block">
                Duration:{" "}
                <strong className="text-text">{durationMinutes} minutes</strong>
              </label>
              <div className="tracker-preset-pills">
                {[
                  { mins: 25, label: "25m (Pomodoro)" },
                  { mins: 45, label: "45m" },
                  { mins: 60, label: "60m (1 hr)" },
                  { mins: 90, label: "90m (1.5 hr)" },
                  { mins: 120, label: "120m (2 hr)" },
                ].map((item) => (
                  <button
                    key={item.mins}
                    type="button"
                    className={`tracker-preset-pill ${
                      durationMinutes === item.mins ? "active" : ""
                    }`}
                    onClick={() => handleQuickDuration(item.mins)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Enhanced AI Diagnostic & Consistency Card */}
          <div className="tracker-ai-guarantee-card mb-4">
            <div className="tracker-ai-badge-header">
              <div className="tracker-ai-sparkle-pill">
                <Sparkles size={14} className="text-primary flex-shrink-0" />
                <span>AI Diagnostic Engine</span>
              </div>
              <span className="tracker-ai-model-tag">Gemini AI</span>
            </div>
            <p className="tracker-ai-desc">
              When your session concludes, Gemini AI generates a 5-question
              diagnostic quiz directly based on your attached material to test
              conceptual recall and identify weak areas.
            </p>
            <div className="tracker-consistency-rule-chip">
              <span className="text-amber">⚡</span>
              <span>
                <strong>Strict Consistency:</strong> Must be attended during its
                booked window to qualify for daily goals & streak progress.
              </span>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="tracker-modal-footer-actions">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onClose}
              disabled={submitting}
              className="tracker-btn-cancel"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={submitting}
              disabled={submitting || loadingInitial}
              className="tracker-btn-confirm"
            >
              Confirm & Book Session
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
