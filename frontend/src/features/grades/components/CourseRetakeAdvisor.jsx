import { useEffect, useState, useMemo } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Award,
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  FileSpreadsheet,
  Flame,
  GraduationCap,
  Image as ImageIcon,
  Info,
  Lightbulb,
  Pencil,
  Plus,
  RefreshCw,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  Upload,
  UploadCloud,
  X,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Badge from "../../../components/Badge";
import Button from "../../../components/Button";
import Card from "../../../components/Card";
import Spinner from "../../../components/Spinner";
import { parseInlineFormatting } from "../../../lib/markdownHelper";
import {
  createCourseGrade,
  updateCourseGrade,
  deleteCourseGrade,
  extractGradeErrorMessage,
  getCourseRetakeAdvisor,
  uploadTranscript,
} from "../api";

const GRADE_OPTIONS = [
  { letter: "A", gpa: "4.00", label: "A (4.00 - Outstanding)" },
  { letter: "A-", gpa: "3.67", label: "A- (3.67 - Excellent)" },
  { letter: "B+", gpa: "3.33", label: "B+ (3.33 - Very Good)" },
  { letter: "B", gpa: "3.00", label: "B (3.00 - Good)" },
  { letter: "B-", gpa: "2.67", label: "B- (2.67 - Satisfactory)" },
  { letter: "C+", gpa: "2.33", label: "C+ (2.33 - Above Average)" },
  { letter: "C", gpa: "2.00", label: "C (2.00 - Average / Retake Candidate)" },
  {
    letter: "D+",
    gpa: "1.67",
    label: "D+ (1.67 - Pass / High Retake Priority)",
  },
  {
    letter: "D",
    gpa: "1.00",
    label: "D (1.00 - Minimum Pass / High Retake Priority)",
  },
  { letter: "F", gpa: "0.00", label: "F (0.00 - Failed / Mandatory Retake)" },
];

const CREDIT_OPTIONS = [
  { value: "3.0", label: "3.0 Credits (Standard Theory)" },
  { value: "1.5", label: "1.5 Credits (Lab / Practical)" },
  { value: "1.0", label: "1.0 Credit (Lab / Workshop)" },
  { value: "2.0", label: "2.0 Credits (Minor / Elective)" },
  { value: "4.0", label: "4.0 Credits (Capstone / Intensive)" },
];

export default function CourseRetakeAdvisor({
  showUploadModal: externalShowUploadModal,
  setShowUploadModal: externalSetShowUploadModal,
} = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reanalyzing, setReanalyzing] = useState(false);
  const [reanalyzeSuccessMsg, setReanalyzeSuccessMsg] = useState("");
  const [error, setError] = useState("");
  const [selectedCourseIds, setSelectedCourseIds] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [internalShowUploadModal, setInternalShowUploadModal] = useState(false);

  const showUploadModal =
    externalShowUploadModal !== undefined
      ? externalShowUploadModal
      : internalShowUploadModal;
  const setShowUploadModal =
    externalSetShowUploadModal || setInternalShowUploadModal;

  const [editingCourse, setEditingCourse] = useState(null);
  const [submittingCourse, setSubmittingCourse] = useState(false);

  // Transcript Upload state
  const [uploadFile, setUploadFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [rawText, setRawText] = useState("");
  const [uploadTab, setUploadTab] = useState("file"); // "file" | "paste"
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  // Course form state (for Add or Edit)
  const [newCode, setNewCode] = useState("");
  const [newName, setNewName] = useState("");
  const [newCredits, setNewCredits] = useState("");
  const [newGradePoint, setNewGradePoint] = useState("");
  const [newSemester, setNewSemester] = useState("");
  const [formError, setFormError] = useState("");

  // Clipboard paste listener: paste screenshots directly with Ctrl+V
  useEffect(() => {
    if (!showUploadModal) return;

    function handlePaste(e) {
      if (uploadTab !== "file") return;
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            e.preventDefault();
            handleFileSelect(blob);
            break;
          }
        }
      }
    }

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [showUploadModal, uploadTab]);

  function handleFileSelect(file) {
    if (!file) return;
    setUploadFile(file);
    setUploadError("");
    if (previewUrl) URL.revokeObjectURL(previewUrl);

    const isImage =
      file.type.startsWith("image/") ||
      /\.(png|jpe?g|webp|heic|heif|heuc|bmp|tiff?|gif|svg)$/i.test(
        file.name || "",
      );
    if (isImage) {
      try {
        setPreviewUrl(URL.createObjectURL(file));
      } catch (err) {
        setPreviewUrl("");
      }
    } else {
      setPreviewUrl("");
    }
  }

  function handleClearFile() {
    setUploadFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl("");
    }
  }

  async function handleTranscriptUpload(e) {
    if (e) e.preventDefault();
    setUploadError("");
    setUploading(true);
    try {
      let payload;
      if (uploadTab === "file") {
        if (!uploadFile) {
          setUploadError(
            "Please select a transcript file (PDF, screenshot/image, or CSV).",
          );
          setUploading(false);
          return;
        }
        payload = new FormData();
        payload.append("file", uploadFile);
      } else {
        if (!rawText.trim()) {
          setUploadError("Please paste your course grade lines.");
          setUploading(false);
          return;
        }
        payload = { raw_text: rawText };
      }

      const res = await uploadTranscript(payload);
      setShowUploadModal(false);
      handleClearFile();
      setRawText("");

      const retakeCount = res.retake_count || 0;
      const retakeText =
        retakeCount > 0
          ? ` (${retakeCount} course(s) with low grades automatically added to Retake Plan)`
          : "";
      setReanalyzeSuccessMsg(
        `Successfully imported ${res.count} course(s)${retakeText}! AI Retake Optimizer updated.`,
      );
      setTimeout(() => setReanalyzeSuccessMsg(""), 6000);

      await loadAdvisorData(true);

      // Auto-select all retake courses into the simulation
      if (res?.retake_courses && res.retake_courses.length > 0) {
        setSelectedCourseIds(res.retake_courses.map((c) => c.id));
      }
    } catch (err) {
      console.error("Transcript upload failed:", err);
      setUploadError(
        err?.response?.data?.error ||
          "Failed to parse courses from transcript. Please verify the file format.",
      );
    } finally {
      setUploading(false);
    }
  }

  async function loadAdvisorData(cacheBust = false) {
    if (!cacheBust) setLoading(true);
    setError("");
    try {
      const res = await getCourseRetakeAdvisor(cacheBust);
      setData(res);
      // Auto-select top recommended duo or single course
      if (res?.recommended_duo?.courses) {
        setSelectedCourseIds(res.recommended_duo.courses.map((c) => c.id));
      } else if (res?.top_single) {
        setSelectedCourseIds([res.top_single.id]);
      }
    } catch (err) {
      console.error("Failed to load retake advisor data:", err);
      setError("Failed to load AI retake advice. Please refresh.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAdvisorData();
  }, []);

  async function handleReanalyze(e) {
    if (e) e.stopPropagation();
    setReanalyzing(true);
    setError("");
    try {
      const res = await getCourseRetakeAdvisor(true);
      setData(res);
      if (res?.recommended_duo?.courses) {
        setSelectedCourseIds(res.recommended_duo.courses.map((c) => c.id));
      } else if (res?.top_single) {
        setSelectedCourseIds([res.top_single.id]);
      }
      setReanalyzeSuccessMsg(
        "Re-analysis complete! Course retake recommendations and CGPA jumps updated.",
      );
      setTimeout(() => setReanalyzeSuccessMsg(""), 4500);
    } catch (err) {
      console.error("Re-analysis failed:", err);
      setError("Failed to re-analyze. Please try again.");
    } finally {
      setReanalyzing(false);
    }
  }

  function handleToggleCourse(courseId) {
    setSelectedCourseIds((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId],
    );
  }

  function handleOpenAddModal() {
    setEditingCourse(null);
    setNewCode("");
    setNewName("");
    setNewCredits("");
    setNewGradePoint("");
    setNewSemester("");
    setFormError("");
    setShowAddModal(true);
  }

  function handleOpenEditModal(course, e) {
    if (e) e.stopPropagation();
    setEditingCourse(course);
    setNewCode(course.course_code || "");
    setNewName(course.course_name || "");
    setNewCredits(
      course.credits != null
        ? String(Number(course.credits).toFixed(1))
        : "3.0",
    );
    setNewGradePoint(
      course.current_grade_point != null
        ? String(Number(course.current_grade_point).toFixed(2))
        : "",
    );
    setNewSemester(course.semester || "");
    setFormError("");
    setShowAddModal(true);
  }

  async function handleAddOrEditCourse(e) {
    e.preventDefault();
    if (!newCode.trim() || !newName.trim()) {
      setFormError("Please fill in course code and course title.");
      return;
    }
    if (!newGradePoint || isNaN(parseFloat(newGradePoint))) {
      setFormError("Please select a course grade / grade point.");
      return;
    }
    const cr = parseFloat(newCredits);
    const gp = parseFloat(newGradePoint);
    if (isNaN(cr) || cr < 1.0 || cr > 4.0) {
      setFormError("Please select valid credit hours (1.0 to 4.0).");
      return;
    }
    if (isNaN(gp) || gp < 0 || gp > 4.0) {
      setFormError("Grade point must be between 0.00 and 4.00.");
      return;
    }

    setSubmittingCourse(true);
    setFormError("");
    try {
      let closestLetter = "C";
      if (gp >= 3.85) closestLetter = "A";
      else if (gp >= 3.5) closestLetter = "A-";
      else if (gp >= 3.15) closestLetter = "B+";
      else if (gp >= 2.85) closestLetter = "B";
      else if (gp >= 2.5) closestLetter = "B-";
      else if (gp >= 2.15) closestLetter = "C+";
      else if (gp >= 1.5) closestLetter = "C";
      else if (gp >= 0.5) closestLetter = "D";
      else closestLetter = "F";

      const payload = {
        course_code: newCode.trim().toUpperCase(),
        course_name: newName.trim(),
        credits: cr,
        grade_point: gp,
        grade_letter: closestLetter,
        semester: newSemester.trim() || "",
      };

      if (editingCourse) {
        await updateCourseGrade(editingCourse.id, payload);
      } else {
        await createCourseGrade(payload);
      }

      setShowAddModal(false);
      setEditingCourse(null);
      setNewCode("");
      setNewName("");
      setNewCredits("3.0");
      setNewGradePoint("");
      setNewSemester("");
      await loadAdvisorData(true);
      setReanalyzeSuccessMsg(
        editingCourse
          ? `Updated "${payload.course_code}" and re-analyzed retake recovery!`
          : `Added "${payload.course_code}" and re-analyzed retake recovery!`,
      );
      setTimeout(() => setReanalyzeSuccessMsg(""), 4500);
    } catch (err) {
      console.error("Course grade save error:", err);
      const msg = extractGradeErrorMessage(err);
      setFormError(msg || "Failed to save course grade. Please try again.");
    } finally {
      setSubmittingCourse(false);
    }
  }

  async function handleDeleteCourse(id, name) {
    if (!window.confirm(`Delete "${name}" from your course records?`)) return;
    try {
      await deleteCourseGrade(id);
      setSelectedCourseIds((prev) => prev.filter((item) => item !== id));
      await loadAdvisorData(true);
      setReanalyzeSuccessMsg(`Removed course "${name}" and re-analyzed CGPA.`);
      setTimeout(() => setReanalyzeSuccessMsg(""), 4500);
    } catch (err) {
      console.error("Failed to delete course grade", err);
    }
  }

  // Real-time custom simulation based on selected checkboxes
  const simulation = useMemo(() => {
    if (!data || !data.all_courses) return null;

    const baseCgpa = data.baseline_cgpa || 0;
    const effectiveCredits = data.effective_credits || 18.0;
    const targetGpa = data.target_gpa || 3.5;

    const selectedCourses = data.all_courses.filter((c) =>
      selectedCourseIds.includes(c.id),
    );

    let totalSelectedCredits = 0;
    let totalQpGain = 0;

    selectedCourses.forEach((c) => {
      totalSelectedCredits += c.credits;
      totalQpGain += c.qp_gain_4; // upgraded to 4.00
    });

    const cgpaJump = totalQpGain / effectiveCredits;
    const projectedCgpa = Math.min(4.0, baseCgpa + cgpaJump);
    const gapTotal = Math.max(0.01, targetGpa - baseCgpa);
    const progressPercent = Math.min(
      100,
      Math.round((cgpaJump / gapTotal) * 100),
    );

    return {
      count: selectedCourses.length,
      credits: totalSelectedCredits,
      totalQpGain: totalQpGain.toFixed(2),
      cgpaJump: cgpaJump.toFixed(2),
      projectedCgpa: projectedCgpa.toFixed(2),
      progressPercent,
      targetReached: projectedCgpa >= targetGpa,
    };
  }, [data, selectedCourseIds]);

  if (loading) {
    return (
      <Card
        style={{ padding: "32px", textAlign: "center", marginBottom: "28px" }}
      >
        <Spinner standalone />
        <p style={{ marginTop: "12px", color: "var(--color-text-muted)" }}>
          AI Advisor is cross-referencing your course credits, low grades, and
          study habit consistency...
        </p>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card style={{ padding: "24px", marginBottom: "28px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <p style={{ color: "var(--color-danger)", margin: 0 }}>{error}</p>
          <Button
            variant="secondary"
            size="sm"
            onClick={loadAdvisorData}
            icon={RefreshCw}
          >
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  const {
    baseline_cgpa,
    target_gpa,
    advisor_narrative,
    all_courses,
    study_habits,
  } = data;

  return (
    <div style={{ marginBottom: "36px" }}>
      {/* SECTION CONTAINER */}
      <Card
        style={{
          border: "1px solid var(--color-primary-subtle)",
          boxShadow: "var(--shadow-sm)",
          overflow: "hidden",
          padding: 0,
        }}
      >
        {/* TOP ACCENT STRIP */}
        <div
          style={{
            background: "var(--color-primary)",
            height: "3px",
          }}
        />

        <div className="advisor-inner-container">
          {/* 1. HEADER ROW */}
          <div className="advisor-header-row">
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "6px",
                }}
              >
                <span
                  style={{
                    background: "var(--color-primary-subtle)",
                    color: "var(--color-primary)",
                    padding: "6px 12px",
                    borderRadius: "999px",
                    fontSize: "0.8125rem",
                    fontWeight: 700,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <Sparkles size={14} />
                  <span>AI Retake & CGPA Recovery Advisor</span>
                </span>
              </div>
              <h2
                style={{
                  fontSize: "1.375rem",
                  fontWeight: 700,
                  margin: 0,
                  color: "var(--color-text)",
                }}
              >
                Smart Course Retake Optimizer
              </h2>
              <p
                style={{
                  margin: "4px 0 0 0",
                  color: "var(--color-text-muted)",
                  fontSize: "0.875rem",
                }}
              >
                Confused which low grades (e.g. 2.00, 2.33, 2.67) to retake? We
                analyze your course credit weights and tracked study habits to
                recommend the highest CGPA boost with minimum study burnout.
              </p>
            </div>

            <div className="retake-advisor-header-actions">
              {all_courses.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  icon={RefreshCw}
                  loading={reanalyzing}
                  onClick={handleReanalyze}
                  title="Click to re-calculate all retake advice, CGPA impact, and habit insights"
                >
                  {reanalyzing ? "Re-analyzing..." : "Re-analyze"}
                </Button>
              )}
              <Button
                variant={all_courses.length === 0 ? "primary" : "secondary"}
                size="sm"
                icon={Plus}
                onClick={handleOpenAddModal}
              >
                Add Course Grade
              </Button>
            </div>
          </div>

          {/* Re-analysis Feedback Toast/Banner */}
          {reanalyzeSuccessMsg && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              style={{
                padding: "10px 16px",
                borderRadius: "var(--radius-md)",
                background: "rgba(16, 185, 129, 0.12)",
                border: "1px solid rgba(16, 185, 129, 0.35)",
                color: "#10b981",
                fontSize: "0.8125rem",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "18px",
              }}
            >
              <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
              <span>{reanalyzeSuccessMsg}</span>
            </motion.div>
          )}

          {/* 2. THREE-PILLAR CGPA RECOVERY HERO BANNER */}
          {!data?.has_courses || all_courses.length === 0 ? (
            <div className="advisor-empty-setup-card">
              <div className="advisor-empty-setup-header">
                <div className="advisor-empty-icon-box">
                  <GraduationCap size={30} className="text-primary" />
                </div>
                <div>
                  <h3 className="advisor-empty-title">
                    No Course Grades Recorded Yet
                  </h3>
                  <p className="advisor-empty-desc">
                    Upload your university transcript using the button above or
                    click &quot;Add Course Grade&quot; to activate the AI Retake
                    Optimizer. StudentBrain AI will analyze your course credit
                    weights, cross-reference your tracked focus hours, and
                    project the highest CGPA boost with minimum study burnout.
                  </p>
                </div>
              </div>

              {/* Feature Preview Pillars */}
              <div className="advisor-empty-feature-grid">
                <div className="advisor-feature-item">
                  <div className="advisor-feature-icon-badge">🎯</div>
                  <div className="advisor-feature-item-content">
                    <strong>Credit-Weighted Optimization</strong>
                    <span>
                      Prioritizes low grades in high-credit courses to deliver
                      maximum mathematical quality points back to your CGPA.
                    </span>
                  </div>
                </div>
                <div className="advisor-feature-item">
                  <div className="advisor-feature-icon-badge">⏱️</div>
                  <div className="advisor-feature-item-content">
                    <strong>Study Habit Alignment</strong>
                    <span>
                      Cross-references your tracker sessions so you pick retakes
                      in subjects where you already have study momentum.
                    </span>
                  </div>
                </div>
                <div className="advisor-feature-item">
                  <div className="advisor-feature-icon-badge">🚀</div>
                  <div className="advisor-feature-item-content">
                    <strong>Real-Time Retake Simulator</strong>
                    <span>
                      Toggle any course combination to preview your immediate
                      target GPA trajectory in real-time.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* 2. THREE-PILLAR CGPA RECOVERY HERO BANNER */}
              <div className="advisor-hero-pillars">
                {/* Box 1: Baseline */}
                <div
                  style={{
                    background: "var(--color-surface-subtle)",
                    padding: "16px",
                    borderRadius: "var(--radius-lg)",
                    border: "1px solid var(--color-border)",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: "var(--color-text-muted)",
                      textTransform: "uppercase",
                    }}
                  >
                    Current Baseline CGPA
                  </span>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: "8px",
                      marginTop: "4px",
                    }}
                  >
                    <strong
                      style={{
                        fontSize: "1.75rem",
                        fontWeight: 800,
                        color: "var(--color-text)",
                      }}
                    >
                      {baseline_cgpa.toFixed(2)}
                    </strong>
                    <span
                      style={{
                        fontSize: "0.8125rem",
                        color: "var(--color-text-muted)",
                      }}
                    >
                      out of 4.00
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--color-text-muted)",
                      display: "block",
                      marginTop: "4px",
                    }}
                  >
                    Across {all_courses.length} logged courses
                  </span>
                </div>

                {/* Box 2: Target */}
                <div
                  style={{
                    background: "var(--color-surface-subtle)",
                    padding: "16px",
                    borderRadius: "var(--radius-lg)",
                    border: "1px solid var(--color-border)",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: "var(--color-text-muted)",
                      textTransform: "uppercase",
                    }}
                  >
                    Target Graduation Goal
                  </span>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: "8px",
                      marginTop: "4px",
                    }}
                  >
                    <strong
                      style={{
                        fontSize: "1.75rem",
                        fontWeight: 800,
                        color: "var(--color-primary)",
                      }}
                    >
                      {target_gpa.toFixed(2)}
                    </strong>
                    <span
                      style={{
                        fontSize: "0.8125rem",
                        color: "var(--color-text-muted)",
                      }}
                    >
                      CGPA
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--color-text-muted)",
                      display: "block",
                      marginTop: "4px",
                    }}
                  >
                    Gap to close:{" "}
                    <strong>
                      +{Math.max(0, target_gpa - baseline_cgpa).toFixed(2)}
                    </strong>{" "}
                    points
                  </span>
                </div>

                {/* Box 3: Projected with Simulation */}
                <div
                  style={{
                    background: simulation?.targetReached
                      ? "linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(5, 150, 105, 0.18) 100%)"
                      : "linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(124, 58, 237, 0.18) 100%)",
                    padding: "16px",
                    borderRadius: "var(--radius-lg)",
                    border: simulation?.targetReached
                      ? "1px solid #10b981"
                      : "1px solid #6366f1",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        color: simulation?.targetReached
                          ? "#10b981"
                          : "#6366f1",
                        textTransform: "uppercase",
                      }}
                    >
                      🚀 Projected CGPA ({simulation?.count || 0} Retakes)
                    </span>
                    {simulation?.targetReached && (
                      <Badge variant="success" size="sm">
                        Goal Reached!
                      </Badge>
                    )}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: "8px",
                      marginTop: "4px",
                    }}
                  >
                    <strong
                      style={{
                        fontSize: "1.75rem",
                        fontWeight: 800,
                        color: "var(--color-text)",
                      }}
                    >
                      {simulation?.projectedCgpa || baseline_cgpa.toFixed(2)}
                    </strong>
                    <span
                      style={{
                        fontSize: "0.875rem",
                        fontWeight: 700,
                        color: "#10b981",
                      }}
                    >
                      +{simulation?.cgpaJump || "0.00"} Boost
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--color-text-muted)",
                      display: "block",
                      marginTop: "4px",
                    }}
                  >
                    Closes <strong>{simulation?.progressPercent || 0}%</strong>{" "}
                    of your target gap
                  </span>
                </div>
              </div>

              {/* 3. AI STRATEGIC ADVICE SYNTHESIS BANNER */}
              {advisor_narrative && (
                <div
                  style={{
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    borderLeft: "4px solid #6366f1",
                    borderRadius: "var(--radius-md)",
                    padding: "18px 20px",
                    marginBottom: "24px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "8px",
                    }}
                  >
                    <Zap size={18} className="text-indigo" />
                    <strong
                      style={{ fontSize: "1rem", color: "var(--color-text)" }}
                    >
                      {parseInlineFormatting(advisor_narrative.headline)}
                    </strong>
                  </div>
                  <p
                    style={{
                      fontSize: "0.875rem",
                      lineHeight: 1.6,
                      color: "var(--color-text-muted)",
                      margin: "0 0 12px 0",
                    }}
                  >
                    {parseInlineFormatting(advisor_narrative.summary)}
                  </p>

                  {/* Action Plan Bullets */}
                  {advisor_narrative.action_plan &&
                    advisor_narrative.action_plan.length > 0 && (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "6px",
                          marginBottom: "12px",
                        }}
                      >
                        {advisor_narrative.action_plan.map((tip, idx) => (
                          <div
                            key={idx}
                            style={{
                              display: "flex",
                              alignItems: "flex-start",
                              gap: "8px",
                            }}
                          >
                            <CheckCircle2
                              size={15}
                              className="text-emerald"
                              style={{ flexShrink: 0, marginTop: "2px" }}
                            />
                            <span
                              style={{
                                fontSize: "0.8125rem",
                                color: "var(--color-text)",
                                lineHeight: 1.5,
                              }}
                            >
                              {parseInlineFormatting(tip)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                  {/* Workload Warning / Habit Connection */}
                  {advisor_narrative.workload_warning && (
                    <div
                      style={{
                        background: "var(--color-surface-subtle)",
                        padding: "8px 12px",
                        borderRadius: "var(--radius-sm)",
                        fontSize: "0.75rem",
                        color: "var(--color-text-muted)",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <Flame size={14} className="text-amber" />
                      <span>
                        <strong>Habit Reality Check:</strong>{" "}
                        {parseInlineFormatting(
                          advisor_narrative.workload_warning,
                        )}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* 4. INTERACTIVE RETAKE SIMULATOR COURSE TABLE / CARDS */}
              <div>
                <div className="advisor-list-header-row">
                  <div>
                    <h3
                      style={{ fontSize: "1rem", fontWeight: 700, margin: 0 }}
                    >
                      Course Grade Analysis & Retake Feasibility (
                      {all_courses.length})
                    </h3>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--color-text-muted)",
                      }}
                    >
                      Check any course to simulate your immediate new CGPA in
                      real-time.
                    </span>
                  </div>

                  <div className="advisor-list-header-actions">
                    {simulation && simulation.count > 0 && (
                      <div
                        style={{
                          background: "rgba(99, 102, 241, 0.1)",
                          color: "#6366f1",
                          padding: "4px 12px",
                          borderRadius: "999px",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                        }}
                      >
                        Simulating {simulation.count} courses (
                        {simulation.credits} credits)
                      </div>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      icon={RefreshCw}
                      loading={reanalyzing}
                      onClick={handleReanalyze}
                      title="Re-calculate AI recommendations and CGPA gains"
                    >
                      {reanalyzing ? "Re-analyzing..." : "Re-analyze"}
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      icon={Plus}
                      onClick={handleOpenAddModal}
                    >
                      Add Course
                    </Button>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  {all_courses.map((course) => {
                    const isSelected = selectedCourseIds.includes(course.id);
                    const isLowGrade = course.current_grade_point < 3.0;

                    return (
                      <div
                        key={course.id}
                        onClick={() =>
                          course.is_retake_eligible &&
                          handleToggleCourse(course.id)
                        }
                        className={`advisor-course-card ${isSelected ? "advisor-card-selected" : ""}`}
                        style={{
                          cursor: course.is_retake_eligible
                            ? "pointer"
                            : "default",
                        }}
                      >
                        {/* Left: Checkbox & Info */}
                        <div className="advisor-course-main">
                          {course.is_retake_eligible ? (
                            <div
                              className={`advisor-course-checkbox ${isSelected ? "checked" : ""}`}
                            >
                              {isSelected && <Check size={14} />}
                            </div>
                          ) : (
                            <div className="advisor-course-checkbox secured">
                              <Check size={12} />
                            </div>
                          )}

                          <div className="advisor-course-info-content">
                            <div className="advisor-course-title-row">
                              <strong className="advisor-course-code">
                                {course.course_code}
                              </strong>
                              <span className="advisor-course-name">
                                {course.course_name}
                              </span>
                              <span className="advisor-course-credits">
                                {course.credits} Cr
                              </span>
                              {course.semester && (
                                <span className="advisor-course-semester">
                                  • {course.semester}
                                </span>
                              )}
                            </div>

                            {/* Metadata row: Study habit & Strategy tag */}
                            <div className="advisor-course-meta-row">
                              {course.is_retake_eligible && (
                                <span
                                  className="advisor-strategy-tag"
                                  style={{
                                    color:
                                      course.tag_color === "emerald"
                                        ? "#10b981"
                                        : course.tag_color === "primary"
                                          ? "#6366f1"
                                          : "#f59e0b",
                                  }}
                                >
                                  {course.strategy_tag}
                                </span>
                              )}
                              <span className="advisor-familiarity-pill">
                                <Clock size={11} />
                                <span>{course.familiarity_label}</span>
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Right / Actions Row */}
                        <div className="advisor-course-actions-col">
                          {/* Current Grade Badge */}
                          <div className="advisor-grade-badge-wrap">
                            <span
                              className={`advisor-grade-badge ${isLowGrade ? "badge-low-grade" : "badge-good-grade"}`}
                            >
                              {course.current_grade_point.toFixed(2)} (
                              {course.current_grade_letter})
                            </span>
                          </div>

                          {/* Jump if retaken */}
                          {course.is_retake_eligible ? (
                            <div className="advisor-jump-wrap">
                              <strong className="advisor-jump-value">
                                +{course.cgpa_jump_4} CGPA
                              </strong>
                              <span className="advisor-jump-sub">
                                if upgraded to A
                              </span>
                            </div>
                          ) : (
                            <div className="advisor-jump-wrap">
                              <span className="advisor-secured-label">
                                Grade Secured
                              </span>
                            </div>
                          )}

                          {/* Action buttons */}
                          <div className="advisor-item-buttons">
                            <button
                              type="button"
                              className="advisor-icon-btn"
                              onClick={(e) => handleOpenEditModal(course, e)}
                              title="Edit Course Grade / Credits"
                            >
                              <Pencil size={15} />
                            </button>

                            <button
                              type="button"
                              className="advisor-icon-btn advisor-delete-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteCourse(
                                  course.id,
                                  course.course_code,
                                );
                              }}
                              title="Delete Course Record"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </Card>

      {/* MODAL: ADD COURSE GRADE */}
      <AnimatePresence>
        {showAddModal && (
          <div
            className="modal-backdrop"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              className="modal-content-card"
              style={{ maxWidth: "500px" }}
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              <div className="modal-header-row">
                <div>
                  <h3 className="modal-title">
                    {editingCourse
                      ? "Edit Course Grade"
                      : "Add Completed / Current Course"}
                  </h3>
                  <p className="modal-subtitle">
                    {editingCourse
                      ? `Update grade points or credits for ${editingCourse.course_code} to re-calculate CGPA recovery.`
                      : "Record course grade points (e.g. 2.33, 2.67) to run AI retake recovery simulations."}
                  </p>
                </div>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setShowAddModal(false)}
                  aria-label="Close modal"
                >
                  <X size={18} />
                </button>
              </div>

              {formError && (
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: "8px",
                    background: "rgba(239, 68, 68, 0.1)",
                    border: "1px solid rgba(239, 68, 68, 0.25)",
                    color: "var(--color-danger, #ef4444)",
                    fontSize: "0.8125rem",
                    marginTop: "8px",
                  }}
                >
                  {formError}
                </div>
              )}

              <form
                onSubmit={handleAddOrEditCourse}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                  marginTop: "10px",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "12px",
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "6px",
                        fontWeight: 600,
                        fontSize: "0.8125rem",
                        color: "var(--color-text-secondary)",
                      }}
                    >
                      Course Code *
                    </label>
                    <input
                      type="text"
                      className="form-input-control"
                      placeholder="e.g. CSE 220"
                      value={newCode}
                      onChange={(e) => setNewCode(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "6px",
                        fontWeight: 600,
                        fontSize: "0.8125rem",
                        color: "var(--color-text-secondary)",
                      }}
                    >
                      Credit Hours (1.0 - 4.0) *
                    </label>
                    <select
                      className="form-input-control"
                      value={newCredits}
                      onChange={(e) => setNewCredits(e.target.value)}
                      required
                    >
                      <option value="">-- Select Credits --</option>
                      {CREDIT_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "6px",
                      fontWeight: 600,
                      fontSize: "0.8125rem",
                      color: "var(--color-text-secondary)",
                    }}
                  >
                    Course Title *
                  </label>
                  <input
                    type="text"
                    className="form-input-control"
                    placeholder="e.g. Data Structures & Algorithms"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    required
                  />
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.2fr 1fr",
                    gap: "12px",
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "6px",
                        fontWeight: 600,
                        fontSize: "0.8125rem",
                        color: "var(--color-text-secondary)",
                      }}
                    >
                      Course Grade / GPA *
                    </label>
                    <select
                      className="form-input-control"
                      value={newGradePoint}
                      onChange={(e) => setNewGradePoint(e.target.value)}
                      required
                    >
                      <option value="">-- Select Grade --</option>
                      {GRADE_OPTIONS.map((opt) => (
                        <option key={opt.gpa} value={opt.gpa}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "6px",
                        fontWeight: 600,
                        fontSize: "0.8125rem",
                        color: "var(--color-text-secondary)",
                      }}
                    >
                      Semester Taken (Optional)
                    </label>
                    <input
                      type="text"
                      className="form-input-control"
                      placeholder="e.g. Spring 2026, Fall 2025"
                      value={newSemester}
                      onChange={(e) => setNewSemester(e.target.value)}
                    />
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "10px",
                    marginTop: "6px",
                    paddingTop: "14px",
                    borderTop: "1px solid var(--color-border-subtle)",
                  }}
                >
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setShowAddModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    loading={submittingCourse}
                  >
                    {editingCourse ? "Update & Re-analyze" : "Save Course"}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: UPLOAD ACADEMIC TRANSCRIPT */}
      <AnimatePresence>
        {showUploadModal && (
          <div
            className="modal-backdrop"
            onClick={() => {
              setShowUploadModal(false);
              handleClearFile();
            }}
          >
            <motion.div
              className="modal-content-card"
              style={{ maxWidth: "600px" }}
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              <div className="modal-header-row">
                <div>
                  <h3
                    className="modal-title"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <Sparkles size={20} className="text-primary" />
                    <span>Upload Transcript & Retake Analyzer</span>
                  </h3>
                  <p className="modal-subtitle">
                    Upload your UIU grade sheet PDF, portal screenshot (PNG,
                    JPG, WebP, HEIC/HEUC), or CSV. StudentBrain AI extracts your
                    courses and automatically adds low-scoring grades to your
                    Retake Plan.
                  </p>
                </div>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => {
                    setShowUploadModal(false);
                    handleClearFile();
                  }}
                  aria-label="Close modal"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Retake Smart Auto-Detection Callout */}
              <div
                style={{
                  marginTop: "12px",
                  padding: "10px 14px",
                  borderRadius: "var(--radius-md)",
                  background: "rgba(249, 115, 22, 0.08)",
                  border: "1px solid rgba(249, 115, 22, 0.25)",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                }}
              >
                <Target
                  size={18}
                  style={{
                    color: "var(--color-primary)",
                    flexShrink: 0,
                    marginTop: "2px",
                  }}
                />
                <div
                  style={{
                    fontSize: "0.8125rem",
                    color: "var(--color-text)",
                    lineHeight: 1.5,
                  }}
                >
                  <strong style={{ color: "var(--color-primary)" }}>
                    Smart Retake Auto-Detection:
                  </strong>{" "}
                  Courses with low grades (F, D, C-, C, C+, B- or GPA &lt; 3.00)
                  will automatically be identified and added to your Retake Plan
                  with live CGPA recovery projections!
                </div>
              </div>

              {uploadError && (
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: "8px",
                    background: "rgba(239, 68, 68, 0.1)",
                    border: "1px solid rgba(239, 68, 68, 0.25)",
                    color: "var(--color-danger, #ef4444)",
                    fontSize: "0.8125rem",
                    marginTop: "10px",
                  }}
                >
                  {uploadError}
                </div>
              )}

              {/* Tab switcher */}
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  marginTop: "14px",
                  borderBottom: "1px solid var(--color-border-subtle)",
                  paddingBottom: "8px",
                }}
              >
                <button
                  type="button"
                  onClick={() => setUploadTab("file")}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "6px",
                    border: "none",
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    background:
                      uploadTab === "file"
                        ? "var(--color-primary)"
                        : "var(--color-surface-subtle)",
                    color:
                      uploadTab === "file"
                        ? "#ffffff"
                        : "var(--color-text-muted)",
                    transition: "all 0.15s ease",
                  }}
                >
                  Document / Screenshot (PDF, Image, CSV)
                </button>
                <button
                  type="button"
                  onClick={() => setUploadTab("text")}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "6px",
                    border: "none",
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    background:
                      uploadTab === "text"
                        ? "var(--color-primary)"
                        : "var(--color-surface-subtle)",
                    color:
                      uploadTab === "text"
                        ? "#ffffff"
                        : "var(--color-text-muted)",
                    transition: "all 0.15s ease",
                  }}
                >
                  Paste Text / CSV Lines
                </button>
              </div>

              <form
                onSubmit={handleTranscriptUpload}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                  marginTop: "14px",
                }}
              >
                {uploadTab === "file" ? (
                  <div>
                    <input
                      type="file"
                      id="transcript-file-input"
                      accept=".pdf,.csv,.tsv,.txt,.png,.jpg,.jpeg,.webp,.heic,.heif,.heuc,.bmp,.tiff,.tif,image/*,text/csv,text/plain,application/pdf"
                      style={{ display: "none" }}
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleFileSelect(e.target.files[0]);
                        }
                      }}
                    />

                    {uploadFile ? (
                      /* File Selected Preview Card */
                      <div
                        style={{
                          padding: "16px",
                          borderRadius: "var(--radius-lg)",
                          border: "1px solid var(--color-border)",
                          background: "var(--color-surface-subtle)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "14px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "14px",
                            minWidth: 0,
                          }}
                        >
                          {previewUrl ? (
                            <img
                              src={previewUrl}
                              alt="Transcript Screenshot Preview"
                              style={{
                                width: "68px",
                                height: "68px",
                                objectFit: "cover",
                                borderRadius: "8px",
                                border: "1px solid var(--color-border)",
                                flexShrink: 0,
                              }}
                            />
                          ) : uploadFile.name
                              ?.toLowerCase()
                              .endsWith(".pdf") ? (
                            <div
                              style={{
                                width: "54px",
                                height: "54px",
                                borderRadius: "8px",
                                background: "rgba(239, 68, 68, 0.12)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                              }}
                            >
                              <FileText
                                size={28}
                                style={{ color: "#ef4444" }}
                              />
                            </div>
                          ) : (
                            <div
                              style={{
                                width: "54px",
                                height: "54px",
                                borderRadius: "8px",
                                background: "rgba(16, 185, 129, 0.12)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                              }}
                            >
                              <FileSpreadsheet
                                size={28}
                                style={{ color: "#10b981" }}
                              />
                            </div>
                          )}

                          <div style={{ minWidth: 0 }}>
                            <strong
                              style={{
                                fontSize: "0.875rem",
                                color: "var(--color-text)",
                                display: "block",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                              title={uploadFile.name}
                            >
                              {uploadFile.name || "Pasted Screenshot"}
                            </strong>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                marginTop: "4px",
                                flexWrap: "wrap",
                              }}
                            >
                              <span
                                style={{
                                  fontSize: "0.75rem",
                                  color: "var(--color-text-muted)",
                                }}
                              >
                                {(uploadFile.size / 1024).toFixed(1)} KB
                              </span>
                              <Badge variant="primary" size="sm">
                                {previewUrl
                                  ? "Screenshot / Image"
                                  : uploadFile.name
                                        ?.toLowerCase()
                                        .endsWith(".pdf")
                                    ? "PDF Transcript"
                                    : "CSV / Sheet"}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        <div
                          style={{ display: "flex", gap: "8px", flexShrink: 0 }}
                        >
                          <label
                            htmlFor="transcript-file-input"
                            className="btn btn-secondary btn-sm"
                            style={{
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                            }}
                          >
                            Change
                          </label>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            icon={Trash2}
                            onClick={handleClearFile}
                            title="Remove selected file"
                          />
                        </div>
                      </div>
                    ) : (
                      /* Drag & Drop Area */
                      <div
                        className={`transcript-dropzone ${isDragging ? "dragging-over" : ""}`}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsDragging(true);
                        }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setIsDragging(false);
                          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                            handleFileSelect(e.dataTransfer.files[0]);
                          }
                        }}
                        style={{
                          borderColor: isDragging
                            ? "var(--color-primary)"
                            : undefined,
                          background: isDragging
                            ? "rgba(249, 115, 22, 0.08)"
                            : undefined,
                        }}
                      >
                        <label
                          htmlFor="transcript-file-input"
                          className="transcript-dropzone-label"
                        >
                          <div
                            style={{
                              display: "flex",
                              gap: "10px",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <UploadCloud size={36} className="text-primary" />
                            <ImageIcon
                              size={30}
                              style={{
                                color: "var(--color-text-muted)",
                                opacity: 0.7,
                              }}
                            />
                          </div>
                          <div
                            style={{ marginTop: "12px", textAlign: "center" }}
                          >
                            <span
                              style={{
                                fontWeight: 600,
                                fontSize: "0.9375rem",
                                color: "var(--color-text)",
                              }}
                            >
                              Click to select or drag &amp; drop transcript
                            </span>
                            <p
                              style={{
                                margin: "6px 0 0",
                                fontSize: "0.75rem",
                                color: "var(--color-text-muted)",
                              }}
                            >
                              Supports UIU grade sheet PDF, screenshot image
                              (PNG, JPG, WebP, HEIC/HEUC), or CSV
                            </p>
                          </div>
                        </label>
                      </div>
                    )}

                    {/* Clipboard Paste Hint */}
                    <div
                      style={{
                        marginTop: "8px",
                        fontSize: "0.75rem",
                        color: "var(--color-text-muted)",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <Sparkles
                        size={13}
                        style={{ color: "var(--color-primary)" }}
                      />
                      <span>
                        <strong>Quick Paste:</strong> Have a screenshot copied
                        (e.g. <code>Win + Shift + S</code>)? Press{" "}
                        <code>Ctrl + V</code> anywhere to attach instantly!
                      </span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "6px",
                        fontWeight: 600,
                        fontSize: "0.8125rem",
                        color: "var(--color-text-secondary)",
                      }}
                    >
                      Paste Course Grade Records
                    </label>
                    <textarea
                      rows={6}
                      className="form-input-control"
                      style={{
                        fontFamily: "monospace",
                        fontSize: "0.8125rem",
                        resize: "vertical",
                      }}
                      placeholder={`Example:\nCSE 220, 2.33, 3.0\nMATH 187, 2.00, 3.0\nCSE 225, 2.67, 3.0\nPHY 102: C+ (3.0 credits)\nCSE 111, 0.00, 3.0, F`}
                      value={rawText}
                      onChange={(e) => setRawText(e.target.value)}
                    />
                    <span
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--color-text-muted)",
                        marginTop: "4px",
                        display: "block",
                      }}
                    >
                      Each line can contain course code, grade point or letter
                      grade, and credit hours.
                    </span>
                  </div>
                )}

                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "10px",
                    marginTop: "6px",
                    paddingTop: "14px",
                    borderTop: "1px solid var(--color-border-subtle)",
                  }}
                >
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setShowUploadModal(false);
                      handleClearFile();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    loading={uploading}
                    icon={Sparkles}
                  >
                    {uploading
                      ? "Analyzing & Adding to Retake..."
                      : "Analyze & Add to Retake Plan"}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
