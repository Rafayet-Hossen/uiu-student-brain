import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

export default function Button({
  children,
  variant = "primary", // primary | secondary | ghost | outline | success | danger
  size = "md", // sm | md | lg
  loading = false,
  disabled = false,
  className = "",
  type = "button",
  icon: Icon,
  ...props
}) {
  const getVariantClass = () => {
    switch (variant) {
      case "secondary":
        return "btn-secondary";
      case "ghost":
        return "btn-ghost";
      case "outline":
        return "btn-outline";
      case "success":
        return "btn-success";
      case "danger":
        return "btn-danger";
      case "primary":
      default:
        return "btn-primary";
    }
  };

  const getSizeClass = () => {
    switch (size) {
      case "sm":
        return "btn-sm";
      case "lg":
        return "btn-lg";
      case "md":
      default:
        return "btn-md";
    }
  };

  return (
    <motion.button
      type={type}
      disabled={disabled || loading}
      whileHover={disabled || loading ? {} : { y: -2, transition: { duration: 0.15 } }}
      whileTap={disabled || loading ? {} : { scale: 0.98 }}
      className={`btn ${getVariantClass()} ${getSizeClass()} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="btn-spinner animate-spin" size={16} />
      ) : Icon ? (
        <Icon size={16} className="btn-icon" />
      ) : null}
      <span>{children}</span>
    </motion.button>
  );
}
