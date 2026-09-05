export default function Badge({
  children,
  variant = "neutral", // primary | secondary | accent | danger | success | warning | neutral
  size = "md", // sm | md
  icon: Icon,
  className = "",
  style = {},
}) {
  const getVariantClass = () => {
    switch (variant) {
      case "primary":
      case "accent":
        return "badge-primary";
      case "secondary":
      case "success":
        return "badge-secondary";
      case "warning":
        return "badge-accent";
      case "danger":
        return "badge-danger";
      case "neutral":
      case "default":
      default:
        return "badge-neutral";
    }
  };

  const sizeClass = size === "sm" ? "badge-sm" : "badge-md";

  return (
    <span className={`badge ${getVariantClass()} ${sizeClass} ${className}`} style={style}>
      {Icon && <Icon size={12} className="badge-icon" />}
      <span>{children}</span>
    </span>
  );
}
