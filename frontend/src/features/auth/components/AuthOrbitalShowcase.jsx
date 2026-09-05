import {
  Bell,
  BookOpen,
  CalendarDays,
  Bot,
  FileText,
  Brain,
  GraduationCap,
} from "lucide-react";

export default function AuthOrbitalShowcase() {
  const orbitNodes = [
    {
      id: "reminders",
      icon: Bell,
      iconColor: "#4f46e5",
      iconBg: "rgba(79, 70, 229, 0.1)",
      text: "Smart Session Reminders",
      positionClass: "node-top-left",
      delay: 0,
    },
    {
      id: "quizzes",
      icon: BookOpen,
      iconColor: "#10b981",
      iconBg: "rgba(16, 185, 129, 0.1)",
      text: "Practice Unlimited Quizzes",
      positionClass: "node-top-right",
      delay: 0.7,
    },
    {
      id: "braingym",
      icon: Brain,
      iconColor: "#8b5cf6",
      iconBg: "rgba(139, 92, 246, 0.1)",
      text: "Brain Gym & GPA Tracking",
      positionClass: "node-mid-left",
      delay: 1.4,
    },
    {
      id: "routines",
      icon: CalendarDays,
      iconColor: "#0ea5e9",
      iconBg: "rgba(14, 165, 233, 0.1)",
      text: "Weekly Routine & Exams",
      positionClass: "node-mid-right",
      delay: 1.0,
    },
    {
      id: "aibot",
      icon: Bot,
      iconColor: "#6366f1",
      iconBg: "rgba(99, 102, 241, 0.1)",
      text: "AI Copilot & Step Guidance",
      positionClass: "node-bot-left",
      delay: 0.35,
    },
    {
      id: "worksheets",
      icon: FileText,
      iconColor: "#f59e0b",
      iconBg: "rgba(245, 158, 11, 0.1)",
      text: "Course Notes & Worksheets",
      positionClass: "node-bot-right",
      delay: 1.7,
    },
  ];

  return (
    <div className="auth-orbital-showcase">
      {/* Title Header */}
      <div className="auth-orbital-header">
        <div className="auth-orbital-pill-badge">
          <GraduationCap size={14} />
          <span>Academic Intelligence</span>
        </div>
        <h1 className="auth-orbital-title">
          Personalized Learning
          <span className="auth-orbital-title-highlight">Dashboard</span>
        </h1>
        <p className="auth-orbital-subtitle">
          Your centralized workspace for routines, GPA projection, and
          collaborative study.
        </p>
      </div>

      {/* Orbit System Canvas */}
      <div className="auth-orbit-system-canvas">
        {/* Ambient Glow */}
        <div className="auth-orbit-ambient-glow" />

        {/* Concentric Dashed Orbit Rings */}
        <div className="orbit-ring orbit-ring-outer" />
        <div className="orbit-ring orbit-ring-mid" />
        <div className="orbit-ring orbit-ring-inner" />

        {/* Central Illustrated Laptop */}
        <div className="auth-center-laptop-stage">
          <div className="auth-laptop-wrapper">
            <svg
              className="auth-laptop-svg"
              viewBox="0 0 140 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient
                  id="sbLaptopBody"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#4f46e5" />
                  <stop offset="100%" stopColor="#312e81" />
                </linearGradient>
                <linearGradient
                  id="sbLaptopScreen"
                  x1="0%"
                  y1="0%"
                  x2="0%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#1e1b4b" />
                  <stop offset="100%" stopColor="#0f172a" />
                </linearGradient>
                <filter
                  id="sbLaptopGlow"
                  x="-20%"
                  y="-20%"
                  width="140%"
                  height="150%"
                >
                  <feDropShadow
                    dx="0"
                    dy="6"
                    stdDeviation="5"
                    floodColor="#4f46e5"
                    floodOpacity="0.3"
                  />
                </filter>
              </defs>

              {/* Lid */}
              <rect
                x="28"
                y="10"
                width="84"
                height="54"
                rx="6"
                fill="url(#sbLaptopBody)"
                filter="url(#sbLaptopGlow)"
              />
              {/* Screen */}
              <rect
                x="33"
                y="15"
                width="74"
                height="44"
                rx="3"
                fill="url(#sbLaptopScreen)"
              />
              {/* Dots */}
              <circle cx="39" cy="20" r="1.8" fill="#ef4444" />
              <circle cx="44" cy="20" r="1.8" fill="#f59e0b" />
              <circle cx="49" cy="20" r="1.8" fill="#10b981" />

              {/* Screen Mini UI Bars */}
              <rect
                x="58"
                y="19"
                width="42"
                height="3"
                rx="1.5"
                fill="#6366f1"
                opacity="0.8"
              />
              <rect
                x="39"
                y="28"
                width="62"
                height="4"
                rx="2"
                fill="#818cf8"
                opacity="0.7"
              />
              <text
                x="70"
                y="43"
                textAnchor="middle"
                fontSize="7.5"
                fontWeight="700"
                fill="#ffffff"
                fontFamily="Space Grotesk, sans-serif"
              >
                Student Dashboard
              </text>
              <rect
                x="42"
                y="48"
                width="24"
                height="3"
                rx="1.5"
                fill="#10b981"
                opacity="0.8"
              />
              <rect
                x="74"
                y="48"
                width="24"
                height="3"
                rx="1.5"
                fill="#38bdf8"
                opacity="0.8"
              />

              {/* Hinge */}
              <path d="M62 64 H78 V66 H62 Z" fill="#1e1b4b" />

              {/* Base */}
              <polygon points="16,76 124,76 132,86 8,86" fill="#1e293b" />
              <polygon points="20,77 120,77 127,84 13,84" fill="#334155" />
              <rect
                x="28"
                y="78"
                width="84"
                height="3"
                rx="1"
                fill="#1e293b"
                opacity="0.7"
              />
              <rect
                x="60"
                y="82"
                width="20"
                height="1.5"
                rx="0.75"
                fill="#475569"
              />

              {/* Desk shadow */}
              <ellipse
                cx="70"
                cy="92"
                rx="52"
                ry="4"
                fill="#4f46e5"
                opacity="0.12"
              />
            </svg>

            {/* Label Pill */}
            <div className="auth-laptop-label-pill">
              <GraduationCap size={13} className="auth-laptop-pill-icon" />
              <span>Student Dashboard</span>
            </div>
          </div>
        </div>

        {/* Feature Badges (Fixed & Static) */}
        {orbitNodes.map((node) => {
          const NodeIcon = node.icon;
          return (
            <div
              key={node.id}
              className={`auth-orbit-node ${node.positionClass}`}
            >
              <div
                className="orbit-node-icon-box"
                style={{
                  backgroundColor: node.iconBg,
                  color: node.iconColor,
                  borderColor: node.iconColor + "33",
                }}
              >
                <NodeIcon size={17} strokeWidth={2.2} />
              </div>
              <span className="orbit-node-text">{node.text}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
