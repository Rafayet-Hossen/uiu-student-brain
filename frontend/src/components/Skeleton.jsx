export default function Skeleton({
  variant = "rectangular", // text | circular | rectangular | card | stat
  width,
  height,
  className = "",
  style = {},
  count = 1,
}) {
  const getVariantClass = () => {
    switch (variant) {
      case "text":
        return "skeleton-text";
      case "circular":
        return "skeleton-circular";
      case "card":
        return "skeleton-card";
      case "stat":
        return "skeleton-stat";
      case "rectangular":
      default:
        return "skeleton-rectangular";
    }
  };

  const inlineStyles = {
    ...(width ? { width } : {}),
    ...(height ? { height } : {}),
    ...style,
  };

  if (count > 1) {
    return (
      <div className="skeleton-group">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className={`skeleton ${getVariantClass()} ${className}`}
            style={inlineStyles}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`skeleton ${getVariantClass()} ${className}`}
      style={inlineStyles}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="card card-default skeleton-card-wrapper">
      <div className="skeleton-row">
        <Skeleton variant="circular" width={36} height={36} />
        <div style={{ flex: 1 }}>
          <Skeleton variant="text" width="60%" height={16} />
          <Skeleton
            variant="text"
            width="40%"
            height={12}
            style={{ marginTop: 6 }}
          />
        </div>
      </div>
      <Skeleton
        variant="rectangular"
        height={48}
        style={{ margin: "16px 0", borderRadius: 8 }}
      />
      <div className="skeleton-row" style={{ justifyContent: "space-between" }}>
        <Skeleton variant="text" width="30%" height={14} />
        <Skeleton
          variant="rectangular"
          width={80}
          height={28}
          style={{ borderRadius: 6 }}
        />
      </div>
    </div>
  );
}

export function StatSkeleton() {
  return (
    <div className="card card-stat skeleton-stat-wrapper">
      <Skeleton variant="text" width="45%" height={14} />
      <Skeleton
        variant="text"
        width="35%"
        height={32}
        style={{ margin: "10px 0 6px" }}
      />
      <Skeleton variant="text" width="70%" height={12} />
    </div>
  );
}
