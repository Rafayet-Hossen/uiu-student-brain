import { motion } from "framer-motion";
import { AlertCircle, RefreshCw } from "lucide-react";
import Button from "./Button";

export default function ErrorState({
  title = "Something went wrong",
  message = "We encountered an issue loading this information. Please try refreshing.",
  onRetry,
  className = "",
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`error-state-box ${className}`}
    >
      <div className="error-state-icon-circle">
        <AlertCircle size={26} className="error-state-icon-svg" />
      </div>
      <h3 className="error-state-title">{title}</h3>
      <p className="error-state-desc">{message}</p>
      {onRetry && (
        <div style={{ marginTop: "16px" }}>
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            icon={RefreshCw}
          >
            Try Again
          </Button>
        </div>
      )}
    </motion.div>
  );
}
