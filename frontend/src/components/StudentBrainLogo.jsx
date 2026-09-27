import React from "react";

export default function StudentBrainLogo({ size = 28, className = "" }) {
  return (
    <div
      className={`student-brain-brand-logo ${className}`}
      style={{
        width: size,
        height: size,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient
            id="sbGradPrimary"
            x1="4"
            y1="4"
            x2="44"
            y2="44"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#F26522" />
            <stop offset="50%" stopColor="#EA580C" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>

          <linearGradient
            id="sbGradAccent"
            x1="12"
            y1="10"
            x2="36"
            y2="38"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#FED7AA" />
          </linearGradient>
        </defs>

        {/* Outer Rounded Container */}
        <rect
          x="3"
          y="3"
          width="42"
          height="42"
          rx="12"
          fill="url(#sbGradPrimary)"
        />

        {/* Subtle Glass Top Highlight */}
        <rect
          x="3"
          y="3"
          width="42"
          height="21"
          rx="12"
          fill="white"
          fillOpacity="0.15"
        />

        {/* Academic Mortarboard Top Rhombus */}
        <path
          d="M24 13L37 19.5L24 26L11 19.5L24 13Z"
          fill="url(#sbGradAccent)"
          stroke="#FFFFFF"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />

        {/* Cap Bottom Skullcap Arc */}
        <path
          d="M15.5 22.5V28C15.5 31 19.3 33.5 24 33.5C28.7 33.5 32.5 31 32.5 28V22.5"
          stroke="url(#sbGradAccent)"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Neural Synapse Nodes on Lower Arc */}
        <circle cx="24" cy="30" r="1.8" fill="#F26522" />
        <circle cx="19" cy="27" r="1.4" fill="#FED7AA" />
        <circle cx="29" cy="27" r="1.4" fill="#FED7AA" />

        {/* Neural Connective Arc Lines */}
        <path
          d="M19 27C21 29 27 29 29 27"
          stroke="#F26522"
          strokeWidth="1.2"
          strokeLinecap="round"
        />

        {/* Graduation Cap Tassel */}
        <path
          d="M33 20V27.5L34.5 30"
          stroke="#FEF3C7"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="34.5" cy="31" r="1.5" fill="#FEF08A" />

        {/* Top Synapse Sparkle */}
        <circle cx="24" cy="19.5" r="1.2" fill="#F26522" />
      </svg>
    </div>
  );
}
