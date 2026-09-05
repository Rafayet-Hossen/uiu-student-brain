import { motion } from "framer-motion";

export default function Card({
  children,
  variant = "default", // default | feature | stat | progress | glass
  className = "",
  style = {},
  hoverEffect = false,
  onClick,
  ...props
}) {
  const getVariantClass = () => {
    switch (variant) {
      case "feature":
        return "card-feature";
      case "stat":
        return "card-stat";
      case "progress":
        return "card-progress";
      case "glass":
        return "card-glass";
      case "default":
      default:
        return "card-default";
    }
  };

  const isInteractive = Boolean(onClick) || hoverEffect;

  if (isInteractive) {
    return (
      <motion.div
        whileHover={{ y: -3, transition: { duration: 0.18, ease: "easeOut" } }}
        className={`card ${getVariantClass()} card-interactive ${className}`}
        style={style}
        onClick={onClick}
        {...props}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div className={`card ${getVariantClass()} ${className}`} style={style} {...props}>
      {children}
    </div>
  );
}
