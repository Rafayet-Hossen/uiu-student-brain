import React from "react";
import logoImg from "../assets/logo.jpg";

/**
 * StudentBrainLogo
 * Official brand logo mark for StudentBrain matching UIU theme colors.
 */
export default function StudentBrainLogo({
  size = 36,
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
          minWidth: `${size}px`,
          minHeight: `${size}px`,
          borderRadius: `${borderRadius}px`,
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 2px 8px rgba(242, 101, 34, 0.35)",
          border: "1.5px solid rgba(242, 101, 34, 0.45)",
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
          className="student-brain-brand-title"
          style={{
            fontSize: `${Math.max(16, Math.round(size * 0.55))}px`,
            fontWeight: 800,
            letterSpacing: "-0.02em",
            color: "#ffffff",
            lineHeight: 1,
            display: "inline-flex",
            alignItems: "center",
          }}
        >
          Student
          <span
            style={{
              background: "linear-gradient(135deg, #F26522 0%, #F59E0B 100%)",
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
