import { useEffect, useState } from "react";
import { AVATAR_PRESETS, getScholarAvatar } from "../avatarHelper";

export default function ScholarAvatar({
  user,
  size = 36,
  avatarOverride = null,
  className = "",
  style = {},
}) {
  const [avatar, setAvatar] = useState(
    () => avatarOverride || getScholarAvatar(user),
  );
  const [cartoonImgFailed, setCartoonImgFailed] = useState(false);

  useEffect(() => {
    if (avatarOverride !== null && avatarOverride !== undefined) {
      setAvatar(avatarOverride);
      return;
    }

    setAvatar(getScholarAvatar(user));

    function handleAvatarUpdate() {
      setAvatar(getScholarAvatar(user));
    }

    window.addEventListener("scholarAvatarUpdated", handleAvatarUpdate);
    return () =>
      window.removeEventListener("scholarAvatarUpdated", handleAvatarUpdate);
  }, [user, avatarOverride]);

  const getInitials = (name) => {
    if (!name) return "SB";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const preset = AVATAR_PRESETS.find((p) => p.id === avatar);

  const containerStyle = {
    width: `${size}px`,
    height: `${size}px`,
    minWidth: `${size}px`,
    minHeight: `${size}px`,
    borderRadius: "50%",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: size > 40 ? "1.25rem" : size > 30 ? "0.875rem" : "0.75rem",
    fontWeight: 700,
    color: "#ffffff",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.12)",
    ...style,
  };

  // Case 1: Custom Uploaded Image (data URL or web URL)
  if (
    avatar &&
    (avatar.startsWith("data:image/") || avatar.startsWith("http"))
  ) {
    return (
      <div className={`scholar-avatar-box ${className}`} style={containerStyle}>
        <img
          src={avatar}
          alt={user?.full_name || "Scholar Avatar"}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          onError={() => setAvatar(null)}
        />
      </div>
    );
  }

  // Case 2: Academic Preset Emoji & Gradient
  if (preset) {
    return (
      <div
        className={`scholar-avatar-box ${className}`}
        style={{ ...containerStyle, background: preset.gradient }}
      >
        <span style={{ fontSize: `${size * 0.52}px`, lineHeight: 1 }}>
          {preset.emoji}
        </span>
      </div>
    );
  }

  // Case 3: Default Initials + Indigo Gradient
  // Case 3: Cartoon Human / Scholar Icon
  const seed =
    user?.email ||
    user?.full_name ||
    (user?.id ? `scholar_${user.id}` : "scholar_uiu");
  const cartoonUrl = `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(seed)}&backgroundColor=e0e7ff,fde68a,bbf7d0,bfdbfe,fbcfe8,fed7aa`;

  if (!cartoonImgFailed) {
    return (
      <div
        className={`scholar-avatar-box ${className}`}
        style={{
          ...containerStyle,
          background: "var(--color-surface-subtle, #f1f5f9)",
        }}
      >
        <img
          src={cartoonUrl}
          alt={user?.full_name || "Student Avatar"}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          onError={() => setCartoonImgFailed(true)}
          loading="lazy"
        />
      </div>
    );
  }

  // Fallback: Inline SVG Human Scholar Cartoon
  const colors = [
    "#4f46e5",
    "#2563eb",
    "#059669",
    "#7c3aed",
    "#d97706",
    "#db2777",
  ];
  const colorIdx =
    (seed.charCodeAt(0) + (seed.charCodeAt(1) || 0)) % colors.length;
  const bg = colors[colorIdx];

  return (
    <div
      className={`scholar-avatar-box ${className}`}
      style={{
        ...containerStyle,
        background: "linear-gradient(135deg, #4f46e5 0%, #2563eb 100%)",
        background: `linear-gradient(135deg, ${bg} 0%, #1e1b4b 100%)`,
      }}
    >
      <span>{getInitials(user?.full_name)}</span>
      <svg
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: "80%", height: "80%" }}
      >
        <circle cx="18" cy="14" r="6" fill="#fde047" />
        <path d="M12 11h12v2H12z" fill="#1e293b" />
        <path d="M18 6l8 4-8 4-8-4 8-4z" fill="#1e293b" />
        <path d="M24 10v4" stroke="#eab308" strokeWidth="1.5" />
        <path
          d="M8 32c0-5.5 4.5-10 10-10s10 4.5 10 10"
          fill="#ffffff"
          fillOpacity="0.9"
        />
      </svg>
    </div>
  );
}
