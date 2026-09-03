import { useState, useEffect, useMemo } from "react";
import Button from "../../components/Button";
import Spinner from "../../components/Spinner";
import Navbar from "../../components/Navbar";
import {
  getProjects,
  createProject,
  deleteProject,
  getMaterials,
  createMaterial,
  deleteMaterial,
  analyzeMaterial,
  extractMaterialsErrorMessage,
} from "./api";
import CreateProjectModal from "./components/CreateProjectModal";
import AddMaterialModal from "./components/AddMaterialModal";
import MaterialAnalysisModal from "./components/MaterialAnalysisModal";

export default function MaterialsPage() {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  const [analyzingId, setAnalyzingId] = useState(null);

  // Filters & Search
  const [projectSearch, setProjectSearch] = useState("");
  const [materialSearch, setMaterialSearch] = useState("");
  const [materialFilter, setMaterialFilter] = useState("all"); // 'all' | 'document' | 'link' | 'note'

  // Modals
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [isAddMaterialOpen, setIsAddMaterialOpen] = useState(false);
  const [selectedAnalysisMaterial, setSelectedAnalysisMaterial] = useState(null);
  const [submittingProject, setSubmittingProject] = useState(false);
  const [submittingMaterial, setSubmittingMaterial] = useState(false);

  // Feedback
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Load Projects
  const fetchProjects = async (keepSelectedId = null) => {
    try {
      setLoadingProjects(true);
      const data = await getProjects();
      setProjects(data);

      if (data.length > 0) {
        if (keepSelectedId && data.some((p) => p.id === keepSelectedId)) {
          setSelectedProjectId(keepSelectedId);
        } else if (!selectedProjectId || !data.some((p) => p.id === selectedProjectId)) {
          setSelectedProjectId(data[0].id);
        }
      } else {
        setSelectedProjectId(null);
      }
    } catch (err) {
      setErrorMsg(extractMaterialsErrorMessage(err));
    } finally {
      setLoadingProjects(false);
    }
  };

  // Load Materials for Selected Project
  const fetchMaterials = async (projId) => {
    if (!projId) {
      setMaterials([]);
      return;
    }
    try {
      setLoadingMaterials(true);
      const data = await getMaterials(projId, {
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

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      fetchMaterials(selectedProjectId);
    }
  }, [selectedProjectId, materialFilter, materialSearch]);

  const selectedProject = useMemo(() => {
    return projects.find((p) => p.id === selectedProjectId) || null;
  }, [projects, selectedProjectId]);

  // Handle Project Creation
  const handleCreateProject = async (payload) => {
    try {
      setSubmittingProject(true);
      setErrorMsg("");
      const created = await createProject(payload);
      setSuccessMsg(`Project "${created.title}" created successfully!`);
      setIsCreateProjectOpen(false);
      await fetchProjects(created.id);
    } catch (err) {
      setErrorMsg(extractMaterialsErrorMessage(err));
    } finally {
      setSubmittingProject(false);
    }
  };

  // Handle Project Deletion
  const handleDeleteProject = async (proj) => {
    if (!window.confirm(`Are you sure you want to delete the project "${proj.title}" and all its materials?`)) {
      return;
    }
    try {
      await deleteProject(proj.id);
      setSuccessMsg(`Project "${proj.title}" deleted.`);
      await fetchProjects();
    } catch (err) {
      setErrorMsg(extractMaterialsErrorMessage(err));
    }
  };

  // Handle Material Creation
  const handleCreateMaterial = async (formData) => {
    if (!selectedProjectId) return;
    try {
      setSubmittingMaterial(true);
      setErrorMsg("");
      const newMat = await createMaterial(selectedProjectId, formData);
      setSuccessMsg(`Material "${newMat.title}" added to project.`);
      setIsAddMaterialOpen(false);
      await fetchMaterials(selectedProjectId);
      await fetchProjects(selectedProjectId);
    } catch (err) {
      setErrorMsg(extractMaterialsErrorMessage(err));
    } finally {
      setSubmittingMaterial(false);
    }
  };

  // Handle Material Deletion
  const handleDeleteMaterial = async (mat) => {
    if (!window.confirm(`Delete "${mat.title}"?`)) return;
    try {
      await deleteMaterial(mat.id);
      setSuccessMsg(`Material deleted.`);
      await fetchMaterials(selectedProjectId);
      await fetchProjects(selectedProjectId);
    } catch (err) {
      setErrorMsg(extractMaterialsErrorMessage(err));
    }
  };

  // Handle AI Analysis Trigger
  const handleAnalyzeMaterial = async (matId) => {
    try {
      setAnalyzingId(matId);
      setErrorMsg("");
      const updated = await analyzeMaterial(matId);
      setSuccessMsg(`AI analysis completed for "${updated.title}"!`);

      // Update material in state
      setMaterials((prev) =>
        prev.map((m) => (m.id === matId ? updated : m))
      );

      // Refresh project to update topic count
      await fetchProjects(selectedProjectId);

      // Open report modal
      setSelectedAnalysisMaterial(updated);
    } catch (err) {
      setErrorMsg(extractMaterialsErrorMessage(err));
    } finally {
      setAnalyzingId(null);
    }
  };

  // Filtered projects
  const filteredProjects = useMemo(() => {
    if (!projectSearch.trim()) return projects;
    const term = projectSearch.toLowerCase();
    return projects.filter(
      (p) =>
        p.title.toLowerCase().includes(term) ||
        p.subject.toLowerCase().includes(term) ||
        (p.description && p.description.toLowerCase().includes(term))
    );
  }, [projects, projectSearch]);

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
    <div className="page-shell">
      <Navbar />

      <main className="main-content">
        {/* Page Hero Header */}
        <section className="academic-hero">
          <div className="hero-content-row">
            <div>
              <span className="hero-badge">📚 Feature #7: Study Hub</span>
              <h1 className="hero-title">Materials & AI Knowledge Hub</h1>
              <p className="hero-subtitle">
                Create subject projects, upload PDF notes & textbooks, save resource links,
                and extract high-yield topics, formulas, and summaries with Gemini AI.
              </p>
            </div>
            <div className="hero-actions">
              <Button
                variant="primary"
                onClick={() => setIsCreateProjectOpen(true)}
              >
                + Create Subject Project
              </Button>
            </div>
          </div>
        </section>

        {/* Feedback Alerts */}
        {errorMsg && (
          <div className="alert-banner alert-banner-error mb-4">
            <span>{errorMsg}</span>
            <button
              className="alert-dismiss-btn"
              onClick={() => setErrorMsg("")}
            >
              ✕
            </button>
          </div>
        )}
        {successMsg && (
          <div className="alert-banner alert-banner-success mb-4">
            <span>{successMsg}</span>
            <button
              className="alert-dismiss-btn"
              onClick={() => setSuccessMsg("")}
            >
              ✕
            </button>
          </div>
        )}

        {/* Workspace Layout */}
        <div className="materials-workspace-grid">
          {/* Left Column: Projects List */}
          <aside className="materials-sidebar">
            <div className="sidebar-header-row">
              <h3 className="sidebar-title">Subject Projects</h3>
              <span className="badge badge-subtle">{projects.length}</span>
            </div>

            {/* Search Projects */}
            <div className="sidebar-search-box">
              <input
                type="text"
                className="form-input form-input-sm"
                placeholder="Search subject or course..."
                value={projectSearch}
                onChange={(e) => setProjectSearch(e.target.value)}
              />
            </div>

            {loadingProjects ? (
              <div className="sidebar-loading">
                <Spinner standalone />
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="sidebar-empty-state">
                <p className="empty-text">No matching projects found.</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreateProjectOpen(true)}
                >
                  + Create First Project
                </Button>
              </div>
            ) : (
              <div className="project-list-container">
                {filteredProjects.map((p) => {
                  const isSelected = p.id === selectedProjectId;
                  return (
                    <div
                      key={p.id}
                      className={`project-nav-card ${isSelected ? "project-card-active" : ""}`}
                      onClick={() => setSelectedProjectId(p.id)}
                      style={{
                        borderLeftColor: p.color || "#2563eb",
                      }}
                    >
                      <div className="project-card-top">
                        <span className="project-subject-pill" style={{ color: p.color }}>
                          {p.subject}
                        </span>
                        {p.analyzed_materials_count > 0 && (
                          <span className="badge badge-accent badge-xs">
                            ✨ {p.analyzed_materials_count} AI
                          </span>
                        )}
                      </div>
                      <h4 className="project-card-title">{p.title}</h4>
                      <div className="project-card-stats">
                        <span className="card-stat-text">
                          {p.materials_count} {p.materials_count === 1 ? "item" : "items"}
                        </span>
                        {p.extracted_topics?.length > 0 && (
                          <span className="card-stat-topics">
                            • {p.extracted_topics.length} topics
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </aside>

          {/* Right Column: Active Project Workspace */}
          <section className="materials-active-workspace">
            {loadingProjects ? (
              <div className="workspace-loading-box">
                <Spinner standalone />
              </div>
            ) : !selectedProject ? (
              <div className="workspace-no-selection">
                <div className="no-selection-icon">📁</div>
                <h3>No Subject Project Selected</h3>
                <p>Select a project from the left sidebar or create a new one to begin uploading materials.</p>
                <Button
                  variant="primary"
                  onClick={() => setIsCreateProjectOpen(true)}
                >
                  + Create Subject Project
                </Button>
              </div>
            ) : (
              <>
                {/* Active Project Banner */}
                <div
                  className="active-project-banner"
                  style={{ borderTopColor: selectedProject.color || "#2563eb" }}
                >
                  <div className="banner-details">
                    <div className="banner-tag-row">
                      <span
                        className="project-subject-tag"
                        style={{ backgroundColor: `${selectedProject.color}15`, color: selectedProject.color }}
                      >
                        {selectedProject.subject}
                      </span>
                      <span className="badge badge-subtle">
                        {selectedProject.materials_count} Materials
                      </span>
                      {selectedProject.analyzed_materials_count > 0 && (
                        <span className="badge badge-accent">
                          ✨ {selectedProject.analyzed_materials_count} Analyzed
                        </span>
                      )}
                    </div>
                    <h2 className="banner-project-title">{selectedProject.title}</h2>
                    {selectedProject.description && (
                      <p className="banner-project-desc">{selectedProject.description}</p>
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
                      onClick={() => handleDeleteProject(selectedProject)}
                      title="Delete Project"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {/* Aggregated Syllabus Topics */}
                {selectedProject.extracted_topics && selectedProject.extracted_topics.length > 0 && (
                  <div className="project-topics-syllabus-box">
                    <div className="syllabus-header">
                      <span className="syllabus-icon">🎓</span>
                      <span className="syllabus-title">
                        Course Knowledge Graph & Extracted Topics ({selectedProject.extracted_topics.length})
                      </span>
                    </div>
                    <div className="syllabus-chips-wrap">
                      {selectedProject.extracted_topics.map((top, idx) => (
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
                      placeholder="Search within this project..."
                      value={materialSearch}
                      onChange={(e) => setMaterialSearch(e.target.value)}
                    />
                  </div>
                </div>

                {/* Materials Cards Grid */}
                {loadingMaterials ? (
                  <div className="materials-grid-loading">
                    <Spinner standalone />
                  </div>
                ) : materials.length === 0 ? (
                  <div className="materials-empty-card">
                    <div className="empty-card-icon">📤</div>
                    <h4>No materials uploaded yet</h4>
                    <p>
                      Upload lecture slides, PDF textbook chapters, save YouTube / web links,
                      or write quick notes to analyze with AI.
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
                                <span>📄 PDF Document</span>
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
          </section>
        </div>
      </main>

      {/* Modals */}
      <CreateProjectModal
        isOpen={isCreateProjectOpen}
        onClose={() => setIsCreateProjectOpen(false)}
        onSubmit={handleCreateProject}
        submitting={submittingProject}
      />

      <AddMaterialModal
        isOpen={isAddMaterialOpen}
        onClose={() => setIsAddMaterialOpen(false)}
        onSubmit={handleCreateMaterial}
        submitting={submittingMaterial}
        projectName={selectedProject?.title || "Project"}
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
