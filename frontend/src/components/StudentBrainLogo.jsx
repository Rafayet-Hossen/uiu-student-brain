import React from "react";
import logoImg from "../assets/logo.jpg";

/**
 * StudentBrainLogo
 * Official brand emblem for StudentBrain matching UIU university color theme
 * (UIU Signature Glowing Orange #f26522, Warm Gold #f59e0b, and Emerald #10b981).
 */
export default function StudentBrainLogo({
  size = 32,
  className = "",
  showText = false,
  rounded = true,
}) {
  const borderRadius = rounded ? Math.max(6, Math.round(size * 0.22)) : 0;

  return (
    <div
      className={`student-brain-brand-wrap ${className}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "10px",
        userSelect: "none",
        textDecoration: "none",
      }}
    >
      <div
        className="student-brain-logo-frame"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: `${borderRadius}px`,
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 2px 8px rgba(242, 101, 34, 0.25)",
          border: "1.5px solid rgba(242, 101, 34, 0.35)",
          background: "#0c1017",
          flexShrink: 0,
        }}
      >
        <img
          src={logoImg}
          alt="StudentBrain Logo"
          width={size}
          height={size}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
          loading="eager"
        />
      </div>

      {showText && (
        <span
          className="student-brain-brand-text"
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
              background: "linear-gradient(135deg, #f26522 0%, #f59e0b 100%)",
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
