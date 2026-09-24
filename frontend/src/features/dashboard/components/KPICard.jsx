import { motion } from "framer-motion";

export default function KPICard({
  title,
  icon: Icon,
  variant = "kpi-indigo",
  value,
  trend,
  trendColor = "text-emerald bg-emerald-subtle",
  progressPercent = 0,
  progressColor = "bg-primary",
  subtext,
  iconBg = "bg-indigo-subtle text-indigo",
  onClick,
}) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.015 }}
      whileTap={{ scale: 0.985 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={`dash-card-24 dash-kpi-card ${variant}`}
      onClick={onClick}
      style={{ cursor: onClick ? "pointer" : "default" }}
    >
      <div className="dash-kpi-header">
        <span className="dash-kpi-title">{title}</span>
        <div className={`dash-kpi-icon-wrap ${iconBg}`}>
          <Icon size={15} />
        </div>
      </div>

      <div className="dash-kpi-main-row">
        <span className="dash-kpi-number">{value}</span>
        {trend && (
          <span className={`dash-kpi-trend-pill ${trendColor}`}>{trend}</span>
        )}
      </div>

      <div>
        <div className="dash-kpi-progress-line">
          <motion.div
            className={`dash-kpi-progress-fill ${progressColor}`}
            initial={{ width: 0 }}
            animate={{
              width: `${Math.min(100, Math.max(4, progressPercent))}%`,
            }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          />
        </div>
        {subtext && <div className="dash-kpi-footer-sub">{subtext}</div>}
      </div>
    </motion.div>
  );
}
