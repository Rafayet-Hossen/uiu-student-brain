export default function StudentBrainLogo({ size = 28, className = "", style = {} }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: "inline-block", verticalAlign: "middle", flexShrink: 0, ...style }}
      aria-label="Student Brain Logo"
    >
      <defs>
        {/* Primary Warm Vibrant UIU Gradient */}
        <linearGradient id="sbLogoGradPrimary" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ff782e" />
          <stop offset="50%" stopColor="#f26522" />
          <stop offset="100%" stopColor="#e11d48" />
        </linearGradient>

        {/* Brain Node & Intellect Glow Gradient */}
        <linearGradient id="sbLogoGradNeural" x1="12" y1="8" x2="36" y2="38" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#fed7aa" stopOpacity="0.85" />
        </linearGradient>

        {/* Soft Shadow Filter for Premium Depth */}
        <filter id="sbLogoShadow" x="-10%" y="-10%" width="130%" height="130%" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#ea580c" floodOpacity="0.25" />
        </filter>
      </defs>

      {/* Rounded Hexagonal / Squircle Emblem Background */}
      <rect
        x="2"
        y="2"
        width="44"
        height="44"
        rx="13"
        fill="url(#sbLogoGradPrimary)"
        filter="url(#sbLogoShadow)"
      />

      {/* Subtle Inner Glow Rim */}
      <rect
        x="3"
        y="3"
        width="42"
        height="42"
        rx="12"
        stroke="rgba(255, 255, 255, 0.35)"
        strokeWidth="1.5"
        fill="none"
      />

      {/* Modern Humanized Brain-Integrated Graduation Cap & Academic Crest */}
      <g fill="none" stroke="url(#sbLogoGradNeural)" strokeLinecap="round" strokeLinejoin="round">
        {/* Mortarboard Diamond Top */}
        <path
          d="M24 10.5L37.5 17L24 23.5L10.5 17L24 10.5Z"
          fill="rgba(255, 255, 255, 0.95)"
          stroke="#ffffff"
          strokeWidth="1.5"
        />

        {/* Mortarboard Tassel & Ribbon */}
        <path
          d="M34 18.5V25.5C34 26.5 35 27.5 36 27.5"
          stroke="#ffffff"
          strokeWidth="1.6"
        />

        {/* Human Neural Hemisphere Left (Curved Synapse Pathways) */}
        <path
          d="M17 26.5C14.5 28 13.5 30.5 14 33C14.5 35.2 16.8 37 19.5 37C21.5 37 23.2 35.8 24 34"
          stroke="#ffffff"
          strokeWidth="2.2"
        />

        {/* Human Neural Hemisphere Right (Curved Synapse Pathways) */}
        <path
          d="M31 26.5C33.5 28 34.5 30.5 34 33C33.5 35.2 31.2 37 28.5 37C26.5 37 24.8 35.8 24 34"
          stroke="#ffffff"
          strokeWidth="2.2"
        />

        {/* Central Intellect Core & Knowledge Spark Pillar */}
        <path
          d="M24 24.5V37.5"
          stroke="#ffffff"
          strokeWidth="2.2"
        />

        {/* Open Book Wings at Base */}
        <path
          d="M16 38.5C18.5 37.5 21.5 37.8 24 39.5C26.5 37.8 29.5 37.5 32 38.5"
          stroke="#ffffff"
          strokeWidth="2"
        />
      </g>

      {/* Sparkle of Wisdom / Active Synapse Dots */}
      <circle cx="24" cy="28.5" r="1.5" fill="#ffffff" />
      <circle cx="18.5" cy="31" r="1.2" fill="#ffffff" />
      <circle cx="29.5" cy="31" r="1.2" fill="#ffffff" />
    </svg>
  );
}
