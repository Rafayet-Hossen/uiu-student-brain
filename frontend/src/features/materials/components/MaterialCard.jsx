import { useState } from "react";
import {
  BookOpen,
  Calendar,
  Clock,
  Download,
  Eye,
  FileCode,
  FileText,
  CheckCircle2,
  Tag,
  Trash2,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";
import Badge from "../../../components/Badge";
import Button from "../../../components/Button";
import Card from "../../../components/Card";

export default function MaterialCard({ material, onInspect, onDelete }) {
  const [hovered, setHovered] = useState(false);

  const getDifficultyVariant = (level) => {
    if (level === "Beginner") return "success";
    if (level === "Advanced") return "danger";
    return "accent";
  };

  const formattedDate = new Date(material.created_at).toLocaleDateString(
    undefined,
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    },
  );

  function handleDownloadText(e) {
    e.stopPropagation();
    const element = document.createElement("a");
    const file = new Blob([material.raw_text || material.summary], {
      type: "text/plain",
    });
    element.href = URL.createObjectURL(file);
    element.download = `${material.title || "study_material"}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      style={{ height: "100%" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Card className="premium-material-doc-card">
        {/* Top Thumbnail Banner */}
        <div
          className="doc-thumbnail-banner"
          onClick={() => onInspect(material)}
        >
          <div className="doc-banner-icon-wrap">
            <FileText size={32} className="text-primary" />
          </div>

          <div className="doc-banner-overlay-badges">
            <Badge variant="primary" size="sm">
              {material.subject || "Course"}
            </Badge>
            <Badge
              variant={getDifficultyVariant(material.difficulty_level)}
              size="sm"
            >
              {material.difficulty_level || "Intermediate"}
            </Badge>
          </div>

          <div className="doc-ai-verified-chip">
            <CheckCircle2 size={11} className="text-emerald" />
            <span>Indexed</span>
          </div>
        </div>

        {/* Middle Document Info */}
        <div className="doc-card-body" onClick={() => onInspect(material)}>
          <h3 className="doc-card-title">{material.title}</h3>

          <div className="doc-meta-info-row">
            <div className="doc-meta-item">
              <Clock size={12} className="text-indigo" />
              <span>{material.estimated_reading_time}m read</span>
            </div>
            <span className="doc-meta-dot">•</span>
            <div className="doc-meta-item">
              <FileText size={12} className="text-amber" />
              <span>{material.word_count} words</span>
            </div>
            <span className="doc-meta-dot">•</span>
            <div className="doc-meta-item">
              <Calendar size={12} className="text-muted" />
              <span>{formattedDate}</span>
            </div>
          </div>

          {/* Extracted Topics */}
          {material.key_topics && material.key_topics.length > 0 && (
            <div className="doc-topics-chips-row">
              {material.key_topics.slice(0, 3).map((topic, i) => (
                <span key={i} className="doc-topic-pill">
                  #{topic}
                </span>
              ))}
              {material.key_topics.length > 3 && (
                <span className="doc-topic-more-tag">
                  +{material.key_topics.length - 3}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Bottom Actions Bar */}
        <div className="doc-card-action-bar">
          <Button
            size="sm"
            variant="primary"
            onClick={() => onInspect(material)}
            icon={BookOpen}
            style={{ flex: 1, justifyContent: "center" }}
          >
            Preview & Study
          </Button>

          <button
            type="button"
            className="doc-icon-action-btn"
            onClick={handleDownloadText}
            title="Download Notes"
          >
            <Download size={14} />
          </button>

          <button
            type="button"
            className="doc-icon-action-btn btn-delete"
            onClick={() => onDelete(material.id)}
            title="Delete Document"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </Card>
    </motion.div>
  );
}
