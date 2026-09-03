import { useState, useEffect, useMemo } from "react";
import Button from "../../components/Button";
import Spinner from "../../components/Spinner";
import {
  getSemesters,
  createSemester,
  deleteSemester,
  getCourses,
  createCourse,
  deleteCourse,
  getMaterials,
  createMaterial,
  deleteMaterial,
  analyzeMaterial,
  extractMaterialsErrorMessage,
} from "./api";
import CreateSemesterModal from "./components/CreateSemesterModal";
import CreateCourseModal from "./components/CreateCourseModal";
import AddMaterialModal from "./components/AddMaterialModal";
import MaterialAnalysisModal from "./components/MaterialAnalysisModal";
import CourseAIChat from "./components/CourseAIChat";

export default function MaterialsPage() {
  // Semesters state
  const [semesters, setSemesters] = useState([]);
  const [selectedSemesterId, setSelectedSemesterId] = useState(null);
  const [loadingSemesters, setLoadingSemesters] = useState(true);

  // Courses state
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [loadingCourses, setLoadingCourses] = useState(false);

  // Materials state
  const [materials, setMaterials] = useState([]);
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  const [analyzingId, setAnalyzingId] = useState(null);

  // Active Workspace Sub-Tab: 'materials' | 'chat'
  const [workspaceTab, setWorkspaceTab] = useState("materials");

  // Filters & Search
  const [courseSearch, setCourseSearch] = useState("");
  const [materialSearch, setMaterialSearch] = useState("");
  const [materialFilter, setMaterialFilter] = useState("all"); // 'all' | 'document' | 'link' | 'note'

  // Modals
  const [isCreateSemesterOpen, setIsCreateSemesterOpen] = useState(false);
  const [isCreateCourseOpen, setIsCreateCourseOpen] = useState(false);
  const [isAddMaterialOpen, setIsAddMaterialOpen] = useState(false);
  const [selectedAnalysisMaterial, setSelectedAnalysisMaterial] = useState(null);

  const [submittingSemester, setSubmittingSemester] = useState(false);
  const [submittingCourse, setSubmittingCourse] = useState(false);
  const [submittingMaterial, setSubmittingMaterial] = useState(false);

  // Feedback
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // ============================================================
  // DATA LOADERS
  // ============================================================

  const fetchSemesters = async (keepSemesterId = null) => {
    try {
      setLoadingSemesters(true);
      const data = await getSemesters();
      setSemesters(data);

      if (data.length > 0) {
        if (keepSemesterId && data.some((s) => s.id === keepSemesterId)) {
          setSelectedSemesterId(keepSemesterId);
        } else {
          // Select active or first
          const active = data.find((s) => s.is_current) || data[0];
          setSelectedSemesterId(active.id);
        }
      } else {
        setSelectedSemesterId(null);
        setCourses([]);
        setSelectedCourseId(null);
      }
    } catch (err) {
      setErrorMsg(extractMaterialsErrorMessage(err));
    } finally {
      setLoadingSemesters(false);
    }
  };

  const fetchCourses = async (semId, keepCourseId = null) => {
    if (!semId) {
      setCourses([]);
      setSelectedCourseId(null);
      return;
    }
    try {
      setLoadingCourses(true);
      const data = await getCourses(semId);
      setCourses(data);

      if (data.length > 0) {
        if (keepCourseId && data.some((c) => c.id === keepCourseId)) {
          setSelectedCourseId(keepCourseId);
        } else if (!selectedCourseId || !data.some((c) => c.id === selectedCourseId)) {
          setSelectedCourseId(data[0].id);
        }
      } else {
        setSelectedCourseId(null);
        setMaterials([]);
      }
    } catch (err) {
      setErrorMsg(extractMaterialsErrorMessage(err));
    } finally {
      setLoadingCourses(false);
    }
  };

  const fetchMaterials = async (courseId) => {
    if (!courseId) {
      setMaterials([]);
      return;
    }
    try {
      setLoadingMaterials(true);
      const data = await getMaterials(courseId, {
        type: materialFilter !== "all" ? materialFilter : undefined,
        search: materialSearch.trim() || undefined,
      });
      setMaterials(data);
    } catch (err) {
      setErrorMsg(extractMaterialsErrorMessage(err));
    } finally {
      setLoadingMaterials(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchSemesters();
  }, []);

  // When selected semester changes, load its courses
  useEffect(() => {
    if (selectedSemesterId) {
      fetchCourses(selectedSemesterId);
    }
  }, [selectedSemesterId]);

  // When selected course changes or filter changes, load materials
  useEffect(() => {
    if (selectedCourseId) {
      fetchMaterials(selectedCourseId);
    }
  }, [selectedCourseId, materialFilter, materialSearch]);

  // Selected objects
  const selectedSemester = useMemo(() => {
    return semesters.find((s) => s.id === selectedSemesterId) || null;
  }, [semesters, selectedSemesterId]);

  const selectedCourse = useMemo(() => {
    return courses.find((c) => c.id === selectedCourseId) || null;
  }, [courses, selectedCourseId]);

  // ============================================================
  // HANDLERS
  // ============================================================

  const handleCreateSemester = async (payload) => {
    try {
      setSubmittingSemester(true);
      setErrorMsg("");
      const created = await createSemester(payload);
      setSuccessMsg(`Semester "${created.name}" created!`);
      setIsCreateSemesterOpen(false);
      await fetchSemesters(created.id);
    } catch (err) {
      setErrorMsg(extractMaterialsErrorMessage(err));
    } finally {
      setSubmittingSemester(false);
    }
  };

  const handleDeleteSemester = async (sem) => {
    if (!window.confirm(`Delete semester "${sem.name}" and all associated courses and materials?`)) {
      return;
    }
    try {
      await deleteSemester(sem.id);
      setSuccessMsg(`Semester "${sem.name}" deleted.`);
      await fetchSemesters();
    } catch (err) {
      setErrorMsg(extractMaterialsErrorMessage(err));
    }
  };

  const handleCreateCourse = async (payload) => {
    if (!selectedSemesterId) return;
    try {
      setSubmittingCourse(true);
      setErrorMsg("");
      const created = await createCourse(selectedSemesterId, payload);
      setSuccessMsg(`Course "${created.title}" added to ${selectedSemester?.name}!`);
      setIsCreateCourseOpen(false);
      await fetchCourses(selectedSemesterId, created.id);
    } catch (err) {
      setErrorMsg(extractMaterialsErrorMessage(err));
    } finally {
      setSubmittingCourse(false);
    }
  };

  const handleDeleteCourse = async (course) => {
    if (!window.confirm(`Delete course "${course.title}" and all its study materials?`)) {
      return;
    }
    try {
      await deleteCourse(course.id);
      setSuccessMsg(`Course "${course.title}" deleted.`);
      await fetchCourses(selectedSemesterId);
    } catch (err) {
      setErrorMsg(extractMaterialsErrorMessage(err));
    }
  };

  const handleCreateMaterial = async (formData) => {
    if (!selectedCourseId) return;
    try {
      setSubmittingMaterial(true);
      setErrorMsg("");
      const newMat = await createMaterial(selectedCourseId, formData);
      setSuccessMsg(`Material "${newMat.title}" added.`);
      setIsAddMaterialOpen(false);
      await fetchMaterials(selectedCourseId);
      await fetchCourses(selectedSemesterId, selectedCourseId);
    } catch (err) {
      setErrorMsg(extractMaterialsErrorMessage(err));
    } finally {
      setSubmittingMaterial(false);
    }
  };

  const handleDeleteMaterial = async (mat) => {
    if (!window.confirm(`Delete "${mat.title}"?`)) return;
    try {
      await deleteMaterial(mat.id);
      setSuccessMsg(`Material deleted.`);
      await fetchMaterials(selectedCourseId);
      await fetchCourses(selectedSemesterId, selectedCourseId);
    } catch (err) {
      setErrorMsg(extractMaterialsErrorMessage(err));
    }
  };

  const handleAnalyzeMaterial = async (matId) => {
    try {
      setAnalyzingId(matId);
      setErrorMsg("");
      const updated = await analyzeMaterial(matId);
      setSuccessMsg(`AI analysis completed for "${updated.title}"!`);

      setMaterials((prev) =>
        prev.map((m) => (m.id === matId ? updated : m))
      );
      await fetchCourses(selectedSemesterId, selectedCourseId);
      setSelectedAnalysisMaterial(updated);
    } catch (err) {
      setErrorMsg(extractMaterialsErrorMessage(err));
    } finally {
      setAnalyzingId(null);
    }
  };

  // Filtered courses
  const filteredCourses = useMemo(() => {
    if (!courseSearch.trim()) return courses;
    const term = courseSearch.toLowerCase();
    return courses.filter(
      (c) =>
        c.title.toLowerCase().includes(term) ||
        (c.code && c.code.toLowerCase().includes(term)) ||
        (c.description && c.description.toLowerCase().includes(term))
    );
  }, [courses, courseSearch]);

  const getMaterialTypeIcon = (type) => {
    switch (type) {
      case "document":
        return "📄";
      case "link":
        return "🔗";
      case "note":
        return "📝";
      default:
        return "📁";
    }
  };

  return (
    <div className="materials-hub-container">
      {/* Semester Header & Selector Bar */}
      <div className="semester-selection-bar">
        <div className="semester-bar-left">
          <span className="semester-bar-label">📅 Academic Semester:</span>
          {loadingSemesters ? (
            <span className="text-muted text-sm">Loading terms...</span>
          ) : semesters.length === 0 ? (
            <span className="text-muted text-sm">No semesters created yet.</span>
          ) : (
            <div className="semester-pills-list">
              {semesters.map((sem) => {
                const isActive = sem.id === selectedSemesterId;
                return (
                  <button
                    key={sem.id}
                    type="button"
                    className={`semester-pill-btn ${isActive ? "semester-pill-active" : ""}`}
                    onClick={() => setSelectedSemesterId(sem.id)}
                  >
                    <span>{sem.name}</span>
                    {sem.is_current && <span className="current-term-dot" title="Current Term">•</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="semester-bar-actions">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCreateSemesterOpen(true)}
          >
            + New Semester
          </Button>
          {selectedSemester && (
            <button
              type="button"
              className="btn-delete-semester"
              onClick={() => handleDeleteSemester(selectedSemester)}
              title="Delete Semester"
            >
              🗑️
            </button>
          )}
        </div>
      </div>

      {/* Alerts */}
      {errorMsg && (
        <div className="alert-banner alert-banner-error mb-4">
          <span>{errorMsg}</span>
          <button className="alert-dismiss-btn" onClick={() => setErrorMsg("")}>
            ✕
          </button>
        </div>
      )}
      {successMsg && (
        <div className="alert-banner alert-banner-success mb-4">
          <span>{successMsg}</span>
          <button className="alert-dismiss-btn" onClick={() => setSuccessMsg("")}>
            ✕
          </button>
        </div>
      )}

      {/* Main 2-Column Workspace Grid */}
      <div className="materials-workspace-grid">
        {/* Left Column: Courses in Semester */}
        <aside className="materials-sidebar">
          <div className="sidebar-header-row">
            <div>
              <h3 className="sidebar-title">Enrolled Courses</h3>
              <span className="text-xs text-muted">
                {selectedSemester ? selectedSemester.name : "Select a semester"}
              </span>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsCreateCourseOpen(true)}
              disabled={!selectedSemester}
            >
              + Add Course
            </Button>
          </div>

          {/* Search Courses */}
          <div className="sidebar-search-box">
            <input
              type="text"
              className="form-input form-input-sm"
              placeholder="Search course code or title..."
              value={courseSearch}
              onChange={(e) => setCourseSearch(e.target.value)}
              disabled={courses.length === 0}
            />
          </div>

          {loadingCourses ? (
            <div className="sidebar-loading">
              <Spinner standalone />
            </div>
          ) : !selectedSemester ? (
            <div className="sidebar-empty-state">
              <p className="empty-text">Create a semester to start enrolling courses.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCreateSemesterOpen(true)}
              >
                + Add Semester
              </Button>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="sidebar-empty-state">
              <p className="empty-text">No courses in {selectedSemester.name}.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCreateCourseOpen(true)}
              >
                + Add First Course
              </Button>
            </div>
          ) : (
            <div className="project-list-container">
              {filteredCourses.map((c) => {
                const isSelected = c.id === selectedCourseId;
                return (
                  <div
                    key={c.id}
                    className={`project-nav-card ${isSelected ? "project-card-active" : ""}`}
                    onClick={() => setSelectedCourseId(c.id)}
                    style={{ borderLeftColor: c.color || "#2563eb" }}
                  >
                    <div className="project-card-top">
                      {c.code ? (
                        <span
                          className="course-code-badge"
                          style={{
                            backgroundColor: `${c.color || "#2563eb"}15`,
                            color: c.color || "#2563eb",
                            borderColor: `${c.color || "#2563eb"}35`,
                          }}
                        >
                          {c.code}
                        </span>
                      ) : (
                        <span className="course-code-badge">Course</span>
                      )}

                      {c.analyzed_materials_count > 0 && (
                        <span className="badge badge-accent badge-xs">
                          ✨ {c.analyzed_materials_count} Analyzed
                        </span>
                      )}
                    </div>
                    <h4 className="project-card-title">{c.title}</h4>
                    <div className="project-card-stats">
                      <span className="card-stat-text">
                        {c.materials_count} {c.materials_count === 1 ? "material" : "materials"}
                      </span>
                      {c.extracted_topics?.length > 0 && (
                        <span className="card-stat-topics">
                          • {c.extracted_topics.length} topics
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </aside>

        {/* Right Column: Active Course Workspace */}
        <section className="materials-active-workspace">
          {loadingCourses ? (
            <div className="workspace-loading-box">
              <Spinner standalone />
            </div>
          ) : !selectedCourse ? (
            <div className="workspace-no-selection">
              <div className="no-selection-icon">📚</div>
              <h3>No Course Selected</h3>
              <p>
                {selectedSemester
                  ? `Select a course in ${selectedSemester.name} or add a new course to upload materials and chat with AI.`
                  : "Create an academic semester to get started."}
              </p>
              {selectedSemester && (
                <Button
                  variant="primary"
                  onClick={() => setIsCreateCourseOpen(true)}
                >
                  + Add Course to {selectedSemester.name}
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Active Course Banner */}
              <div
                className="active-project-banner"
                style={{ borderTopColor: selectedCourse.color || "#2563eb" }}
              >
                <div className="banner-details">
                  <div className="banner-tag-row">
                    {selectedCourse.code && (
                      <span
                        className="project-subject-tag"
                        style={{
                          backgroundColor: `${selectedCourse.color}15`,
                          color: selectedCourse.color,
                        }}
                      >
                        {selectedCourse.code}
                      </span>
                    )}
                    <span className="badge badge-subtle">{selectedSemester?.name}</span>
                    <span className="badge badge-subtle">
                      {selectedCourse.materials_count} Materials
                    </span>
                    {selectedCourse.analyzed_materials_count > 0 && (
                      <span className="badge badge-accent">
                        ✨ {selectedCourse.analyzed_materials_count} AI Analyzed
                      </span>
                    )}
                  </div>
                  <h2 className="banner-project-title">{selectedCourse.title}</h2>
                  {selectedCourse.description && (
                    <p className="banner-project-desc">{selectedCourse.description}</p>
                  )}
                </div>

                <div className="banner-action-buttons">
                  <Button
                    variant="primary"
                    onClick={() => setIsAddMaterialOpen(true)}
                  >
                    + Add Material
                  </Button>
                  <button
                    type="button"
                    className="btn-delete-project"
                    onClick={() => handleDeleteCourse(selectedCourse)}
                    title="Delete Course"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {/* Workspace Tab Switcher (Materials vs AI Tutor Chat) */}
              <div className="course-workspace-nav-tabs">
                <button
                  type="button"
                  className={`course-nav-tab ${workspaceTab === "materials" ? "course-tab-active" : ""}`}
                  onClick={() => setWorkspaceTab("materials")}
                >
                  <span className="tab-icon">📚</span>
                  <span>Course Materials ({materials.length})</span>
                </button>
                <button
                  type="button"
                  className={`course-nav-tab ${workspaceTab === "chat" ? "course-tab-active" : ""}`}
                  onClick={() => setWorkspaceTab("chat")}
                >
                  <span className="tab-icon">💬</span>
                  <span>AI Study Assistant & Q&A</span>
                  <span className="badge badge-accent badge-xs">Gemini</span>
                </button>
              </div>

              {/* TAB 1: MATERIALS */}
              {workspaceTab === "materials" && (
                <>
                  {/* Aggregated Syllabus Topics Bar */}
                  {selectedCourse.extracted_topics && selectedCourse.extracted_topics.length > 0 && (
                    <div className="project-topics-syllabus-box">
                      <div className="syllabus-header">
                        <span className="syllabus-icon">🎓</span>
                        <span className="syllabus-title">
                          AI Knowledge Graph & Extracted Topics ({selectedCourse.extracted_topics.length})
                        </span>
                      </div>
                      <div className="syllabus-chips-wrap">
                        {selectedCourse.extracted_topics.map((top, idx) => (
                          <span key={idx} className="syllabus-chip">
                            {top}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Filter and Search Bar for Materials */}
                  <div className="materials-toolbar-row">
                    <div className="materials-type-filters">
                      {[
                        { id: "all", label: "All Items" },
                        { id: "document", label: "📄 PDFs & Books" },
                        { id: "link", label: "🔗 Resource Links" },
                        { id: "note", label: "📝 Course Notes" },
                      ].map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          className={`filter-pill-btn ${materialFilter === f.id ? "filter-pill-active" : ""}`}
                          onClick={() => setMaterialFilter(f.id)}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>

                    <div className="materials-search-field">
                      <input
                        type="text"
                        className="form-input form-input-sm"
                        placeholder="Search within this course..."
                        value={materialSearch}
                        onChange={(e) => setMaterialSearch(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Materials Grid */}
                  {loadingMaterials ? (
                    <div className="materials-grid-loading">
                      <Spinner standalone />
                    </div>
                  ) : materials.length === 0 ? (
                    <div className="materials-empty-card">
                      <div className="empty-card-icon">📤</div>
                      <h4>No materials uploaded yet</h4>
                      <p>
                        Upload lecture slides, PDF textbook chapters, save web references,
                        or write lecture notes to analyze with AI.
                      </p>
                      <Button
                        variant="primary"
                        onClick={() => setIsAddMaterialOpen(true)}
                      >
                        + Add First Study Material
                      </Button>
                    </div>
                  ) : (
                    <div className="materials-cards-grid">
                      {materials.map((mat) => {
                        const isAnalyzed = !!mat.analyzed_at;
                        const isCurrentlyAnalyzing = analyzingId === mat.id;

                        return (
                          <div key={mat.id} className="material-item-card">
                            <div className="mat-card-header">
                              <div className="mat-type-icon-box">
                                {getMaterialTypeIcon(mat.material_type)}
                              </div>
                              <div className="mat-header-text">
                                <span className="mat-type-badge">
                                  {mat.material_type.toUpperCase()}
                                </span>
                                <h4 className="mat-title-text" title={mat.title}>
                                  {mat.title}
                                </h4>
                              </div>
                            </div>

                            <div className="mat-card-body">
                              {mat.material_type === "document" && (
                                <div className="mat-file-meta">
                                  <span>📄 Document</span>
                                  {mat.formatted_file_size && (
                                    <span className="mat-size-pill">
                                      {mat.formatted_file_size}
                                    </span>
                                  )}
                                </div>
                              )}

                              {mat.material_type === "link" && (
                                <div className="mat-link-meta">
                                  <a
                                    href={mat.link_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mat-external-link"
                                  >
                                    🔗 Open Resource ↗
                                  </a>
                                </div>
                              )}

                              {mat.content_text && (
                                <p className="mat-excerpt-text">
                                  {mat.content_text.slice(0, 140)}
                                  {mat.content_text.length > 140 ? "..." : ""}
                                </p>
                              )}

                              {/* AI Summary Snippet if Analyzed */}
                              {isAnalyzed && mat.ai_analysis?.summary && (
                                <div className="mat-ai-snippet-box">
                                  <span className="ai-snippet-label">✨ AI Executive Summary:</span>
                                  <p className="ai-snippet-text">
                                    {mat.ai_analysis.summary.slice(0, 120)}...
                                  </p>
                                </div>
                              )}
                            </div>

                            <div className="mat-card-footer">
                              <div className="mat-status-slot">
                                {isAnalyzed ? (
                                  <span className="badge badge-accent">
                                    ✨ {mat.ai_analysis?.key_topics?.length || 0} Topics
                                  </span>
                                ) : (
                                  <span className="badge badge-subtle">
                                    ⏳ Not Analyzed
                                  </span>
                                )}
                              </div>

                              <div className="mat-actions-slot">
                                {mat.file_url && (
                                  <a
                                    href={mat.file_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn-icon-link"
                                    title="Download / View File"
                                  >
                                    ⬇️
                                  </a>
                                )}

                                {isAnalyzed ? (
                                  <button
                                    type="button"
                                    className="btn-action-ai-report"
                                    onClick={() => setSelectedAnalysisMaterial(mat)}
                                  >
                                    📖 View Report
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    className="btn-action-ai-analyze"
                                    onClick={() => handleAnalyzeMaterial(mat.id)}
                                    disabled={isCurrentlyAnalyzing}
                                  >
                                    {isCurrentlyAnalyzing ? "✨ Analyzing..." : "✨ Analyze"}
                                  </button>
                                )}

                                <button
                                  type="button"
                                  className="btn-icon-danger"
                                  onClick={() => handleDeleteMaterial(mat)}
                                  title="Delete Material"
                                >
                                  🗑️
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}

              {/* TAB 2: AI COURSE CHAT */}
              {workspaceTab === "chat" && (
                <CourseAIChat
                  courseId={selectedCourse.id}
                  courseTitle={selectedCourse.title}
                  courseCode={selectedCourse.code}
                  extractedTopics={selectedCourse.extracted_topics || []}
                />
              )}
            </>
          )}
        </section>
      </div>

      {/* Modals */}
      <CreateSemesterModal
        isOpen={isCreateSemesterOpen}
        onClose={() => setIsCreateSemesterOpen(false)}
        onSubmit={handleCreateSemester}
        submitting={submittingSemester}
      />

      <CreateCourseModal
        isOpen={isCreateCourseOpen}
        onClose={() => setIsCreateCourseOpen(false)}
        onSubmit={handleCreateCourse}
        submitting={submittingCourse}
        semesterName={selectedSemester?.name || "Selected Semester"}
      />

      <AddMaterialModal
        isOpen={isAddMaterialOpen}
        onClose={() => setIsAddMaterialOpen(false)}
        onSubmit={handleCreateMaterial}
        submitting={submittingMaterial}
        courseName={`${selectedCourse?.code ? `[${selectedCourse.code}] ` : ""}${selectedCourse?.title || "Course"}`}
      />

      <MaterialAnalysisModal
        isOpen={!!selectedAnalysisMaterial}
        onClose={() => setSelectedAnalysisMaterial(null)}
        material={selectedAnalysisMaterial}
        onReanalyze={handleAnalyzeMaterial}
        analyzing={analyzingId === selectedAnalysisMaterial?.id}
      />
    </div>
  );
}
