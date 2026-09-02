import { useEffect, useState } from "react";
import {
  BookOpen,
  Brain,
  Clock,
  FileText,
  Filter,
  Plus,
  Search,
  Sparkles,
  Tag,
  UploadCloud,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Badge from "../../components/Badge";
import Button from "../../components/Button";
import Card from "../../components/Card";
import EmptyState from "../../components/EmptyState";
import ErrorState from "../../components/ErrorState";
import Navbar from "../../components/Navbar";
import { CardSkeleton, StatSkeleton } from "../../components/Skeleton";
import {
  deleteMaterial,
  extractMaterialErrorMessage,
  getMaterials,
  getMaterialStats,
} from "./api";
import MaterialCard from "./components/MaterialCard";
import MaterialDetailModal from "./components/MaterialDetailModal";
import MaterialUploadModal from "./components/MaterialUploadModal";

const CATEGORIES = [
  "All",
  "Lecture Note",
  "Textbook Chapter",
  "Cheat Sheet",
  "Lab Report",
  "Research Paper",
  "Other",
];

export default function MaterialsPage() {
  const [materials, setMaterials] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [inspectingMaterial, setInspectingMaterial] = useState(null);

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const [materialsData, statsData] = await Promise.all([
        getMaterials(null, selectedCategory, searchQuery),
        getMaterialStats(),
      ]);
      setMaterials(materialsData);
      setStats(statsData);
    } catch (err) {
      setError(extractMaterialErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [selectedCategory]);

  function handleCreated(newMaterial) {
    setMaterials((prev) => [newMaterial, ...prev]);
    getMaterialStats().then(setStats).catch(console.error);
  }

  function handleUpdated(updatedMaterial) {
    setMaterials((prev) =>
      prev.map((m) => (m.id === updatedMaterial.id ? updatedMaterial : m)),
    );
    if (inspectingMaterial?.id === updatedMaterial.id) {
      setInspectingMaterial(updatedMaterial);
    }
    getMaterialStats().then(setStats).catch(console.error);
  }

  async function handleDelete(materialId) {
    if (
      !window.confirm("Remove this study document from your materials hub?")
    ) {
      return;
    }

    try {
      await deleteMaterial(materialId);
      setMaterials((prev) => prev.filter((m) => m.id !== materialId));
      if (inspectingMaterial?.id === materialId) {
        setInspectingMaterial(null);
      }
      getMaterialStats().then(setStats).catch(console.error);
    } catch (err) {
      console.error("Failed to delete material", err);
    }
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
                <FileText size={28} className="text-rose" />
                <span>Study Materials & Topic Extraction</span>
              </h1>
              <p className="page-description">
                Upload lecture notes, past papers, and slides. Automatically
                extract syllabus concepts, key definitions, and practice
                questions.
              </p>
            </div>

            <Button
              variant="primary"
              onClick={() => setShowUploadModal(true)}
              icon={UploadCloud}
            >
              Upload Study Material
            </Button>
          </div>
        </div>

        {/* 4 Stats Cards */}
        <div className="stats-cards-row">
          {loading && !stats ? (
            <>
              <StatSkeleton />
              <StatSkeleton />
              <StatSkeleton />
              <StatSkeleton />
            </>
          ) : (
            <>
              <Card variant="stat" className="stat-indigo">
                <div className="stat-top-row">
                  <span className="stat-header-label">Study Materials</span>
                  <div className="stat-icon-pill bg-indigo-subtle">
                    <FileText size={16} className="text-indigo" />
                  </div>
                </div>
                <div className="stat-number-row">
                  <strong className="stat-metric-value">
                    {stats?.total_materials ?? materials.length}
                  </strong>
                </div>
                <span className="stat-footer-subtext">
                  Uploaded notes & documents
                </span>
              </Card>

              <Card variant="stat" className="stat-amber">
                <div className="stat-top-row">
                  <span className="stat-header-label">Extracted Topics</span>
                  <div className="stat-icon-pill bg-amber-subtle">
                    <Tag size={16} className="text-amber" />
                  </div>
                </div>
                <div className="stat-number-row">
                  <strong className="stat-metric-value">
                    {stats?.total_topics ?? 0}
                  </strong>
                </div>
                <span className="stat-footer-subtext">
                  Unique syllabus areas identified
                </span>
              </Card>

              <Card variant="stat" className="stat-emerald">
                <div className="stat-top-row">
                  <span className="stat-header-label">Reading Time</span>
                  <div className="stat-icon-pill bg-emerald-subtle">
                    <Clock size={16} className="text-emerald" />
                  </div>
                </div>
                <div className="stat-number-row">
                  <strong className="stat-metric-value">
                    {stats?.total_reading_time_mins ?? 0}m
                  </strong>
                </div>
                <span className="stat-footer-subtext">
                  Estimated total reading volume
                </span>
              </Card>

              <Card variant="stat" className="stat-rose">
                <div className="stat-top-row">
                  <span className="stat-header-label">Words Analyzed</span>
                  <div className="stat-icon-pill bg-rose-subtle">
                    <Brain size={16} className="text-rose" />
                  </div>
                </div>
                <div className="stat-number-row">
                  <strong className="stat-metric-value">
                    {stats?.total_words_analyzed ?? 0}
                  </strong>
                </div>
                <span className="stat-footer-subtext">
                  Processed study vocabulary
                </span>
              </Card>
            </>
          )}
        </div>

        {/* Filter & Search Bar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "16px",
            marginBottom: "24px",
            flexWrap: "wrap",
          }}
        >
          {/* Category Filter Pills */}
          <div
            className="community-tabs-bar"
            style={{
              overflowX: "auto",
              display: "flex",
              gap: "6px",
              paddingBottom: "2px",
            }}
          >
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`community-tab-btn ${
                  selectedCategory === cat ? "tab-active" : ""
                }`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              loadData();
            }}
            style={{
              display: "flex",
              gap: "8px",
              flex: "1",
              maxWidth: "340px",
            }}
          >
            <div style={{ position: "relative", width: "100%" }}>
              <input
                type="text"
                placeholder="Search by title or topic..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-input-control"
                style={{ paddingRight: "36px" }}
              />
              <button
                type="submit"
                style={{
                  position: "absolute",
                  right: "6px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--color-text-muted)",
                }}
              >
                <Search size={16} />
              </button>
            </div>
          </form>
        </div>

        {/* Loading Skeletons */}
        {loading && (
          <div className="materials-grid">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <ErrorState
            title="Failed to load study materials"
            message={error}
            onRetry={loadData}
          />
        )}

        {/* Empty State */}
        {!loading && !error && materials.length === 0 && (
          <EmptyState
            icon={FileText}
            title="No study materials found"
            description="Upload your first lecture note, slide deck, or past paper to extract syllabus topics and flashcards automatically."
            actionLabel="Upload Material Now"
            onAction={() => setShowUploadModal(true)}
          />
        )}

        {/* Materials Grid */}
        {!loading && !error && materials.length > 0 && (
          <div className="materials-grid">
            {materials.map((material) => (
              <MaterialCard
                key={material.id}
                material={material}
                onInspect={() => setInspectingMaterial(material)}
                onDelete={() => handleDelete(material.id)}
              />
            ))}
          </div>
        )}

        {/* Upload Modal */}
        {showUploadModal && (
          <MaterialUploadModal
            onClose={() => setShowUploadModal(false)}
            onCreated={handleCreated}
          />
        )}

        {/* Detail & AI Inspection Modal */}
        {inspectingMaterial && (
          <MaterialDetailModal
            material={inspectingMaterial}
            onClose={() => setInspectingMaterial(null)}
            onUpdated={handleUpdated}
            onDelete={() => handleDelete(inspectingMaterial.id)}
          />
        )}
      </main>
    </div>
  );
}
