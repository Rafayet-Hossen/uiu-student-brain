// Avatar Helper for Custom Image Uploads & Academic Avatar Presets

export const AVATAR_PRESETS = [
  {
    id: "preset_scholar",
    label: "Scholar Cap",
    emoji: "🎓",
    gradient: "linear-gradient(135deg, #4f46e5, #7c3aed)",
  },
  {
    id: "preset_rocket",
    label: "Voyager",
    emoji: "🚀",
    gradient: "linear-gradient(135deg, #0284c7, #06b6d4)",
  },
  {
    id: "preset_lightning",
    label: "Quantum",
    emoji: "⚡",
    gradient: "linear-gradient(135deg, #10b981, #059669)",
  },
  {
    id: "preset_fire",
    label: "Focus Flame",
    emoji: "🔥",
    gradient: "linear-gradient(135deg, #f59e0b, #d97706)",
  },
  {
    id: "preset_star",
    label: "Stellar",
    emoji: "🌟",
    gradient: "linear-gradient(135deg, #e11d48, #be123c)",
  },
  {
    id: "preset_owl",
    label: "Wise Owl",
    emoji: "🦉",
    gradient: "linear-gradient(135deg, #8b5cf6, #6366f1)",
  },
  {
    id: "preset_brain",
    label: "Innovator",
    emoji: "🧠",
    gradient: "linear-gradient(135deg, #ec4899, #8b5cf6)",
  },
];

export function getScholarAvatar(user) {
  if (!user?.email && !user?.id) return null;
  const key = `studentbrain_avatar_${user.email || user.id}`;
  try {
    const stored = localStorage.getItem(key);
    if (stored) return stored; // can be "data:image/..." or preset id "preset_..."
  } catch (e) {
    console.error("Failed to read scholar avatar from localStorage", e);
  }
  return null;
}

export function setScholarAvatar(user, avatarData) {
  if (!user?.email && !user?.id) return;
  const key = `studentbrain_avatar_${user.email || user.id}`;
  try {
    if (avatarData) {
      localStorage.setItem(key, avatarData);
    } else {
      localStorage.removeItem(key);
    }
    // Dispatch storage event to notify components
    window.dispatchEvent(new Event("scholarAvatarUpdated"));
  } catch (e) {
    console.error("Failed to save scholar avatar to localStorage", e);
  }
}
