import React from "react";

/**
 * StudentBrainLogo
 * A humanized, professional, and eye-catching brand logo for StudentBrain.
 * Symbolizes the synergy between human scholarship (academic graduation cap & open book)
 * and cognitive brilliance (neural intelligence arcs & radiant knowledge spark).
 */
export default function StudentBrainLogo({
  size = 32,
  className = "",
  showText = false,
  variant = "gradient", // "gradient" | "monochrome" | "light"
}) {
  return (
    <div
      className={`student-brain-logo-wrap ${className}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "10px",
        userSelect: "none",
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="student-brain-logo-mark"
        style={{ flexShrink: 0, display: "block" }}
      >
        <defs>
          {/* Main Academic & Neural Gradient */}
          <linearGradient
            id="sbBrainGradPrimary"
            x1="4"
            y1="6"
            x2="44"
            y2="42"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#6366F1" />
            <stop offset="50%" stopColor="#0EA5E9" />
            <stop offset="100%" stopColor="#10B981" />
          </linearGradient>

          {/* Accent Glow Gradient */}
          <linearGradient
            id="sbCapGrad"
            x1="8"
            y1="4"
            x2="40"
            y2="24"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#818CF8" />
            <stop offset="100%" stopColor="#38BDF8" />
          </linearGradient>

          {/* Golden Tassel & Spark Gradient */}
          <linearGradient
            id="sbSparkGrad"
            x1="24"
            y1="2"
            x2="46"
            y2="28"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#10B981" />
          </linearGradient>

          {/* Subtle Ambient Glow Filter */}
          <filter
            id="sbLogoGlow"
            x="-10%"
            y="-10%"
            width="120%"
            height="120%"
            filterUnits="userSpaceOnUse"
          >
            <feDropShadow
              dx="0"
              dy="2"
              stdDeviation="2.5"
              floodColor="#4F46E5"
              floodOpacity="0.28"
            />
          </filter>
        </defs>

        {/* 1. Scholar Base / Open Knowledge Foundation Wings */}
        <g filter="url(#sbLogoGlow)">
          {/* Left Knowledge Hemisphere (Book & Brain Lobes) */}
          <path
            d="M 24 38 C 17 38 10 33 8 26 C 7 22.5 8 19 10.5 16.5 C 12.5 14.5 15.5 14 18 15 C 20 12 23 11 24 11"
            stroke="url(#sbBrainGradPrimary)"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Right Knowledge Hemisphere */}
          <path
            d="M 24 38 C 31 38 38 33 40 26 C 41 22.5 40 19 37.5 16.5 C 35.5 14.5 32.5 14 30 15 C 28 12 25 11 24 11"
            stroke="url(#sbBrainGradPrimary)"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Central Cerebral Cortex & Spine of Book */}
          <path
            d="M 24 13 L 24 38"
            stroke="url(#sbBrainGradPrimary)"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Internal Neural Synaptic Bridges (Left) */}
          <path
            d="M 12 24 C 15 23 18 25 24 25"
            stroke="url(#sbBrainGradPrimary)"
            strokeWidth="2.2"
            strokeLinecap="round"
            opacity="0.85"
          />
          <path
            d="M 14 31 C 17 30 20 31.5 24 32"
            stroke="url(#sbBrainGradPrimary)"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.7"
          />

          {/* Internal Neural Synaptic Bridges (Right) */}
          <path
            d="M 36 24 C 33 23 30 25 24 25"
            stroke="url(#sbBrainGradPrimary)"
            strokeWidth="2.2"
            strokeLinecap="round"
            opacity="0.85"
          />
          <path
            d="M 34 31 C 31 30 28 31.5 24 32"
            stroke="url(#sbBrainGradPrimary)"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.7"
          />

          {/* 2. Distinct Humanized Mortarboard Cap Diamond Crown */}
          <path
            d="M 24 4 L 41 12.5 L 24 21 L 7 12.5 Z"
            fill="url(#sbCapGrad)"
            opacity="0.95"
          />

          {/* Cap Lower Rim / Band */}
          <path
            d="M 14 16 L 14 20.5 C 14 23.5 18.5 25.5 24 25.5 C 29.5 25.5 34 23.5 34 20.5 L 34 16"
            stroke="#ffffff"
            strokeWidth="1.8"
            strokeLinecap="round"
            opacity="0.8"
          />

          {/* 3. Golden Tassel & Human Knowledge Spark */}
          <path
            d="M 24 12.5 C 31 13 36.5 16 38 21.5 L 38 27.5"
            stroke="url(#sbSparkGrad)"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          {/* Tassel Bobble */}
          <circle cx="38" cy="28.5" r="2" fill="#F59E0B" />

          {/* Top Brain Center Synapse Point */}
          <circle cx="24" cy="12.5" r="2.2" fill="#ffffff" />
          <circle cx="24" cy="4" r="1.5" fill="#38BDF8" />
        </g>
      </svg>

      {showText && (
        <span
          className="student-brain-logo-brand-text"
          style={{
            fontWeight: 800,
            fontSize: "1.25rem",
            letterSpacing: "-0.02em",
            display: "inline-flex",
            alignItems: "center",
            color: "var(--color-text)",
          }}
        >
          <span>Student</span>
          <span
            style={{
              background: "linear-gradient(135deg, #6366F1 0%, #06B6D4 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              marginLeft: "1px",
            }}
          >
            Brain
          </span>
        </span>
      )}
    </div>
  );
}
