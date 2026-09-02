import { motion } from "framer-motion";
import {
  BookOpen,
  Calendar,
  FileText,
  Plus,
  Sparkles,
  Trophy,
} from "lucide-react";
import Button from "./Button";

export default function EmptyState({
  icon: Icon = BookOpen,
  title = "No items found",
  description = "Get started by creating your first entry to track your academic progress.",
  actionLabel,
  onAction,
  className = "",
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`empty-state-box ${className}`}
    >
      <div className="empty-state-icon-circle">
        <Icon size={28} className="empty-state-icon-svg" />
      </div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-desc">{description}</p>
      {actionLabel && onAction && (
        <div style={{ marginTop: "18px" }}>
          <Button variant="primary" onClick={onAction} icon={Plus}>
            {actionLabel}
          </Button>
        </div>
      )}
    </motion.div>
  );
}
