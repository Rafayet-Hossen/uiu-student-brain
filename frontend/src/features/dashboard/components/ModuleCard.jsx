import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Badge from "../../../components/Badge";

export default function ModuleCard({
  title,
  description,
  badgeText,
  badgeVariant = "primary",
  icon: Icon,
  iconBg = "bg-indigo-subtle text-indigo",
  ctaText = "Open Module",
  to,
  preview,
}) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      style={{ height: "100%" }}
    >
      <Link
        to={to}
        className="dash-card-24 dash-module-card"
        style={{ height: "100%" }}
      >
        <div className="dash-module-top">
          <div className={`dash-module-icon-box ${iconBg}`}>
            <Icon size={22} />
          </div>
          {badgeText && <Badge variant={badgeVariant}>{badgeText}</Badge>}
        </div>

        <div className="dash-module-content">
          <h3 className="dash-module-title">{title}</h3>
          <p className="dash-module-desc">{description}</p>
          {preview && <div className="mt-2">{preview}</div>}
        </div>

        <div className="dash-module-footer">
          <span className="dash-module-action-cta">
            <span>{ctaText}</span>
            <ArrowRight size={15} />
          </span>
        </div>
      </Link>
    </motion.div>
  );
}
