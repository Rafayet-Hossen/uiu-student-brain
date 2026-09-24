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
    (user?.id ? `scholar_${user.id}` : "scholar_student");
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

  // Fallback: Inline SVG Human Scholar Cartoon Characters
  const cartoonPalettes = [
    {
      bg: "#4f46e5",
      cap: "#1e1b4b",
      skin: "#fed7aa",
      hair: "#9a3412",
      acc: "#fbbf24",
    },
    {
      bg: "#059669",
      cap: "#064e3b",
      skin: "#fde047",
      hair: "#374151",
      acc: "#34d399",
    },
    {
      bg: "#2563eb",
      cap: "#1e3a8a",
      skin: "#fbcfe8",
      hair: "#1f2937",
      acc: "#60a5fa",
    },
    {
      bg: "#7c3aed",
      cap: "#4c1d95",
      skin: "#fed7aa",
      hair: "#78350f",
      acc: "#f472b6",
    },
    {
      bg: "#d97706",
      cap: "#78350f",
      skin: "#fde68a",
      hair: "#18181b",
      acc: "#fde047",
    },
    {
      bg: "#db2777",
      cap: "#831843",
      skin: "#fed7aa",
      hair: "#451a03",
      acc: "#f9a8d4",
    },
  ];
  const charCode = (seed.charCodeAt(0) || 65) + (seed.charCodeAt(1) || 66);
  const theme = cartoonPalettes[charCode % cartoonPalettes.length];

  return (
    <div
      className={`scholar-avatar-box ${className}`}
      style={{
        ...containerStyle,
        background: `linear-gradient(135deg, ${theme.bg} 0%, #0f172a 100%)`,
      }}
      title={user?.full_name || "Scholar"}
    >
      <svg
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: "85%", height: "85%" }}
      >
        {/* Head / Face */}
        <circle cx="20" cy="18" r="8" fill={theme.skin} />
        {/* Hair */}
        <path
          d="M13 17c0-4.5 3-8 7-8s7 3.5 7 8c-2-1.5-5-2-7-2s-5 .5-7 2z"
          fill={theme.hair}
        />
        {/* Glasses */}
        <rect
          x="15"
          y="16"
          width="4"
          height="3"
          rx="1"
          stroke="#1e293b"
          strokeWidth="1.2"
          fill="none"
        />
        <rect
          x="21"
          y="16"
          width="4"
          height="3"
          rx="1"
          stroke="#1e293b"
          strokeWidth="1.2"
          fill="none"
        />
        <path d="M19 17.5h2" stroke="#1e293b" strokeWidth="1.2" />
        {/* Smile */}
        <path
          d="M18 22c.8.8 2.2.8 3 0"
          stroke="#b45309"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
        {/* Graduation Cap or Headband */}
        <path d="M20 7l10 5-10 5-10-5 10-5z" fill={theme.cap} />
        <rect x="14" y="11" width="12" height="2" fill={theme.cap} />
        <path
          d="M26 12v4"
          stroke={theme.acc}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <circle cx="26" cy="16.5" r="1" fill={theme.acc} />
        {/* Body / Shoulders */}
        <path
          d="M8 38c0-6.5 5.5-12 12-12s12 5.5 12 12"
          fill="#ffffff"
          fillOpacity="0.9"
        />
      </svg>
    </div>
  );
}
