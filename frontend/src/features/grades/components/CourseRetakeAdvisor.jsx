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
  Flame,
  GraduationCap,
  Info,
  Lightbulb,
  Pencil,
  Plus,
  RefreshCw,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
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
} from "../api";

export default function CourseRetakeAdvisor() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reanalyzing, setReanalyzing] = useState(false);
  const [reanalyzeSuccessMsg, setReanalyzeSuccessMsg] = useState("");
  const [error, setError] = useState("");
  const [selectedCourseIds, setSelectedCourseIds] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [submittingCourse, setSubmittingCourse] = useState(false);

  // Course form state (for Add or Edit)
  const [newCode, setNewCode] = useState("");
  const [newName, setNewName] = useState("");
  const [newCredits, setNewCredits] = useState("3.0");
  const [newGradePoint, setNewGradePoint] = useState("2.33");
  const [newSemester, setNewSemester] = useState("Spring 2026");
  const [formError, setFormError] = useState("");

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
    setNewCredits("3.0");
    setNewGradePoint("2.33");
    setNewSemester("Spring 2026");
    setFormError("");
    setShowAddModal(true);
  }

  function handleOpenEditModal(course, e) {
    if (e) e.stopPropagation();
    setEditingCourse(course);
    setNewCode(course.course_code || "");
    setNewName(course.course_name || "");
    setNewCredits(String(course.credits || "3.0"));
    setNewGradePoint(String(course.current_grade_point ?? "2.33"));
    setNewSemester(course.semester || "Spring 2026");
    setFormError("");
    setShowAddModal(true);
  }

  async function handleAddOrEditCourse(e) {
    e.preventDefault();
    if (!newCode.trim() || !newName.trim()) {
      setFormError("Please fill in course code and name.");
      return;
    }
    const cr = parseFloat(newCredits);
    const gp = parseFloat(newGradePoint);
    if (isNaN(cr) || cr <= 0) {
      setFormError("Valid credit hours required (e.g. 3.0).");
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
        semester: newSemester.trim() || "Spring 2026",
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
      setNewGradePoint("2.33");
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
          boxShadow: "0 8px 30px rgba(79, 70, 229, 0.08)",
          overflow: "hidden",
          padding: 0,
        }}
      >
        {/* TOP ACCENT STRIP */}
        <div
          style={{
            background:
              "linear-gradient(90deg, #4f46e5 0%, #7c3aed 50%, #06b6d4 100%)",
            height: "5px",
          }}
        />

        <div className="advisor-inner-container">
          {/* 1. HEADER ROW */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              flexWrap: "wrap",
              gap: "16px",
              marginBottom: "20px",
            }}
          >
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
                    background: "rgba(99, 102, 241, 0.12)",
                    color: "#6366f1",
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
                <span
                  style={{
                    background: "rgba(16, 185, 129, 0.12)",
                    color: "#10b981",
                    padding: "4px 10px",
                    borderRadius: "999px",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                  }}
                >
                  Math-Verified Projections
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

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                flexWrap: "wrap",
              }}
            >
              <Button
                variant="primary"
                size="sm"
                icon={RefreshCw}
                loading={reanalyzing}
                onClick={handleReanalyze}
                title="Click to re-calculate all retake advice, CGPA impact, and habit insights"
              >
                {reanalyzing ? "Re-analyzing..." : "Re-analyze Advisor"}
              </Button>
              <Button
                variant="secondary"
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
                    color: simulation?.targetReached ? "#10b981" : "#6366f1",
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
                Closes <strong>{simulation?.progressPercent || 0}%</strong> of
                your target gap
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
                    {parseInlineFormatting(advisor_narrative.workload_warning)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* 4. INTERACTIVE RETAKE SIMULATOR COURSE TABLE / CARDS */}
          <div>
            <div className="advisor-list-header-row">
              <div>
                <h3 style={{ fontSize: "1rem", fontWeight: 700, margin: 0 }}>
                  Course Grade Analysis & Retake Feasibility ({all_courses.length})
                </h3>
                <span
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--color-text-muted)",
                  }}
                >
                  Check any course to simulate your immediate new CGPA in real-time.
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
                    Simulating {simulation.count} courses ({simulation.credits}{" "}
                    credits)
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
              style={{ display: "flex", flexDirection: "column", gap: "10px" }}
            >
              {all_courses.map((course) => {
                const isSelected = selectedCourseIds.includes(course.id);
                const isLowGrade = course.current_grade_point < 3.0;

                return (
                  <div
                    key={course.id}
                    onClick={() =>
                      course.is_retake_eligible && handleToggleCourse(course.id)
                    }
                    className={`advisor-course-card ${isSelected ? "advisor-card-selected" : ""}`}
                    style={{
                      cursor: course.is_retake_eligible ? "pointer" : "default",
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
                            handleDeleteCourse(course.id, course.course_code);
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
                      Credit Hours *
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="1.0"
                      max="6.0"
                      className="form-input-control"
                      value={newCredits}
                      onChange={(e) => setNewCredits(e.target.value)}
                      required
                    />
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
                      Grade Point (0.00 - 4.00) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.00"
                      max="4.00"
                      className="form-input-control"
                      placeholder="e.g. 2.33"
                      value={newGradePoint}
                      onChange={(e) => setNewGradePoint(e.target.value)}
                      required
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
                      Semester Taken
                    </label>
                    <input
                      type="text"
                      className="form-input-control"
                      placeholder="e.g. Spring 2026"
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
    </div>
  );
}
