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
  return (
    <div
      className={`scholar-avatar-box ${className}`}
      style={{
        ...containerStyle,
        background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
      }}
    >
      <span>{getInitials(user?.full_name)}</span>
    </div>
  );
}
