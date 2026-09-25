import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Calendar,
  Flame,
  GraduationCap,
  Play,
  BookOpen,
  Clock,
  Sparkles,
  ArrowRight,
  Zap,
} from "lucide-react";
import Button from "../../../components/Button";

export default function HeroSection({
  user,
  currentDate,
  topGradePlan,
  currentStreak = 0,
  totalExtractedTopics = 0,
  weeklyPercent = 84,
  todayClasses = [],
}) {
  const navigate = useNavigate();

  const nextClass = todayClasses[0] || {
    subject: "Database Systems",
    start_time: "09:42",
    end_time: "10:43",
  };

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="dash-hero-viewport"
      aria-label="Student Command Center Hero"
    >
      {/* Background Ambience: Organic Blobs, Grid & Radial Glow */}
      <div className="dash-hero-ambient-blob-1" />
      <div className="dash-hero-ambient-blob-2" />
      <div className="dash-hero-ambient-blob-3" />
      <div className="dash-hero-dotted-grid" />

      <div className="dash-hero-content-wrap">
        {/* Left Column: Greeting, Storytelling Typography, Workflow & Actions */}
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="dash-hero-left"
        >
          {/* Top Chips Row */}
          <div className="dash-hero-chips-row">
            <div className="dash-chip-date">
              <GraduationCap size={15} className="text-primary" />
              <span>Academic Hub</span>
              <span className="dash-chip-sep">•</span>
              <span>{currentDate}</span>
            </div>

            <nav className="dash-workflow-pills" aria-label="Academic Workflow">
              <Link to="/planner" className="dash-wf-step active" title="Plan weekly routines">
                <span className="num">1</span> Plan
              </Link>
              <span className="dash-wf-arrow">→</span>
              <Link to="/study-center" className="dash-wf-step" title="Study coursework">
                <span className="num">2</span> Study
              </Link>
              <span className="dash-wf-arrow">→</span>
              <Link to="/study-center?tab=tracker" className="dash-wf-step" title="Analyze consistency">
                <span className="num">3</span> Analyze
              </Link>
              <span className="dash-wf-arrow">→</span>
              <Link to="/grades" className="dash-wf-step" title="Improve GPA">
                <span className="num">4</span> Improve
              </Link>
            </nav>
          </div>

          {/* Emotional Theme Headline */}
          <div className="dash-hero-title-group">
            <span className="dash-hero-eyebrow">
              Hello, {user?.full_name ? user.full_name.split(" ")[0] : "Scholar"} 👋
            </span>
            <h1 className="dash-hero-main-heading">
              Learn Better. <br />
              <span className="dash-hero-gradient-text">Grow Every Day.</span>
            </h1>
          </div>

          <p className="dash-hero-support-copy">
            Welcome to your intelligent academic command center. Build structured weekly routines,
            study with distraction-free focus, and forecast cumulative graduation honors with serene clarity.
          </p>

          {/* Action CTAs */}
          <div className="dash-hero-actions-row">
            <Link to="/study-center?tab=tracker">
              <Button
                variant="primary"
                size="lg"
                icon={Play}
                className="dash-btn-hero-primary"
              >
                Start Focus Session
              </Button>
            </Link>
            <Link to="/planner">
              <Button
                variant="secondary"
                size="lg"
                icon={Calendar}
                className="dash-btn-hero-secondary"
              >
                Weekly Timetable
              </Button>
            </Link>
          </div>

          {/* Trust & Academic Proofline */}
          <div className="dash-hero-trust-strip">
            <div className="dash-trust-badge">
              <span className="dash-trust-num">99.4%</span>
              <span className="dash-trust-lbl">On-Track Rate</span>
            </div>
            <div className="dash-trust-divider" />
            <div className="dash-trust-badge">
              <span className="dash-trust-num">100%</span>
              <span className="dash-trust-lbl">Focused & Ad-Free</span>
            </div>
            <div className="dash-trust-divider" />
            <div className="dash-trust-badge">
              <span className="dash-trust-num text-orange">
                {topGradePlan ? `${topGradePlan.target_gpa} GPA` : "Honors Degree"}
              </span>
              <span className="dash-trust-lbl">Degree Guided</span>
            </div>
          </div>
        </motion.div>

        {/* Right Column: Emotional Academic Desk Illustration + 5 Floating Widgets */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          className="dash-hero-illustration-stage"
        >
          {/* Desk Study Scene Illustration (Clean SVG) */}
          <div className="dash-study-desk-scene">
            <svg
              className="dash-study-illustration-svg"
              viewBox="0 0 520 400"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-label="Student studying at desk with laptop, books, lamp and AI companion"
            >
              <defs>
                {/* Desk Wood Gradient */}
                <linearGradient id="deskGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#e2e8f0" />
                  <stop offset="100%" stopColor="#cbd5e1" />
                </linearGradient>
                <linearGradient id="laptopScreen" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#1e1b4b" />
                  <stop offset="100%" stopColor="#312e81" />
                </linearGradient>
                <radialGradient id="lampGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="aiOrbGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f26522" />
                  <stop offset="100%" stopColor="#ea580c" />
                </linearGradient>
                <linearGradient id="book1" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ea580c" />
                  <stop offset="100%" stopColor="#c2410c" />
                </linearGradient>
                <linearGradient id="book2" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
              </defs>

              {/* Ambient Lamp Glow Light Cone */}
              <circle cx="130" cy="170" r="140" fill="url(#lampGlow)" />

              {/* Wall Study Board / Calendar sheet in background */}
              <rect x="290" y="50" width="110" height="90" rx="8" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
              <rect x="290" y="50" width="110" height="22" rx="8" fill="#f26522" />
              <text x="345" y="66" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">SCHEDULE</text>
              <circle cx="310" cy="85" r="4" fill="#10b981" />
              <rect x="320" y="83" width="60" height="4" rx="2" fill="#94a3b8" />
              <circle cx="310" cy="100" r="4" fill="#f59e0b" />
              <rect x="320" y="98" width="50" height="4" rx="2" fill="#94a3b8" />
              <circle cx="310" cy="115" r="4" fill="#f97316" />
              <rect x="320" y="113" width="68" height="4" rx="2" fill="#94a3b8" />

              {/* Desk Lamp */}
              <path d="M 120 280 L 120 180 Q 120 130 150 130 L 170 145" stroke="#64748b" strokeWidth="5" strokeLinecap="round" fill="none" />
              <path d="M 155 135 L 180 155 L 165 170 Z" fill="#475569" />
              <ellipse cx="120" cy="285" rx="22" ry="6" fill="#94a3b8" />

              {/* The Desk Surface */}
              <path d="M 40 285 L 480 285 L 460 350 L 60 350 Z" fill="url(#deskGrad)" />
              <rect x="40" y="285" width="440" height="8" rx="3" fill="#94a3b8" />

              {/* Desk Legs */}
              <rect x="75" y="293" width="12" height="95" rx="3" fill="#64748b" />
              <rect x="430" y="293" width="12" height="95" rx="3" fill="#64748b" />

              {/* Books Stack on Desk */}
              <rect x="80" y="258" width="60" height="12" rx="2" fill="url(#book1)" />
              <rect x="85" y="244" width="52" height="14" rx="2" fill="url(#book2)" />
              <rect x="90" y="233" width="45" height="11" rx="2" fill="#f59e0b" />
              <path d="M 115 233 L 115 250 L 120 246 L 125 250 L 125 233 Z" fill="#ef4444" />

              {/* Ceramic Coffee Mug with rising animated steam */}
              <rect x="160" y="260" width="20" height="24" rx="4" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
              <path d="M 180 266 Q 188 272 180 278" stroke="#cbd5e1" strokeWidth="2.5" fill="none" />
              <path d="M 166 254 Q 164 246 168 240" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.6" className="dash-steam-anim-1" />
              <path d="M 172 253 Q 175 245 171 238" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.6" className="dash-steam-anim-2" />

              {/* Student Laptop */}
              <rect x="220" y="200" width="120" height="78" rx="6" fill="url(#laptopScreen)" stroke="#475569" strokeWidth="2" />
              <path d="M 205 278 L 355 278 L 345 284 L 215 284 Z" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1" />
              {/* Laptop Screen Content (Graphs & Code lines) */}
              <line x1="235" y1="218" x2="275" y2="218" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" />
              <line x1="235" y1="226" x2="260" y2="226" stroke="#c7d2fe" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M 235 255 Q 255 235 275 245 T 315 230" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />
              <circle cx="315" cy="230" r="3" fill="#34d399" />
              <rect x="290" y="214" width="40" height="28" rx="4" fill="#312e81" opacity="0.8" />
              <line x1="296" y1="222" x2="322" y2="222" stroke="#60a5fa" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="296" y1="228" x2="318" y2="228" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round" />

              {/* Floating AI Scholar Companion Orb */}
              <g className="dash-ai-companion-orb">
                <circle cx="390" cy="180" r="26" fill="url(#aiOrbGrad)" filter="drop-shadow(0 4px 14px rgba(99,102,241,0.4))" />
                <ellipse cx="383" cy="176" rx="3" ry="4" fill="#ffffff" />
                <ellipse cx="397" cy="176" rx="3" ry="4" fill="#ffffff" />
                <path d="M 386 186 Q 390 190 394 186" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" fill="none" />
                <circle cx="390" cy="150" r="3.5" fill="#f59e0b" />
                <line x1="390" y1="154" x2="390" y2="160" stroke="#f59e0b" strokeWidth="1.5" />
              </g>

              {/* Plant Pot on the Right of Desk */}
              <path d="M 430 258 L 446 258 L 442 284 L 434 284 Z" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1" />
              <path d="M 438 258 Q 432 242 426 244 Q 432 254 438 258 Z" fill="#10b981" />
              <path d="M 438 258 Q 444 240 452 246 Q 444 254 438 258 Z" fill="#059669" />
            </svg>
          </div>

          {/* 5 Interconnected Floating Orbiting Widgets */}
          {/* Widget 1: Target GPA (Top-Left) */}
          <motion.div
            animate={{ y: [-6, 7, -6], rotate: [-1, 1.2, -1] }}
            transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
            whileHover={{ scale: 1.08, y: -9 }}
            className="dash-float-widget dash-hero-float-gpa"
            onClick={() => navigate("/grades")}
            title="Open GPA Planner"
          >
            <div className="dash-float-icon-box bg-orange-subtle text-orange">
              <GraduationCap size={20} />
            </div>
            <div className="dash-float-info">
              <div className="dash-float-header-row">
                <span className="dash-float-label">Target Honors</span>
                <span className="dash-float-badge-pill orange">🎯 Goal</span>
              </div>
              <strong className="dash-float-value">
                {topGradePlan ? `${topGradePlan.target_gpa} GPA` : "3.85 GPA"}
              </strong>
            </div>
          </motion.div>

          {/* Widget 2: AI Ready Topics (Top-Right) */}
          <motion.div
            animate={{ y: [7, -7, 7], rotate: [1, -1.2, 1] }}
            transition={{ repeat: Infinity, duration: 6.8, ease: "easeInOut" }}
            whileHover={{ scale: 1.08, y: -9 }}
            className="dash-float-widget dash-hero-float-ai"
            onClick={() => navigate("/materials")}
            title="Open Materials Hub"
          >
            <div className="dash-float-icon-box bg-emerald-subtle text-emerald">
              <BookOpen size={20} />
            </div>
            <div className="dash-float-info">
              <div className="dash-float-header-row">
                <span className="dash-float-label">AI Ready</span>
                <span className="dash-float-badge-pill emerald">✨ Synced</span>
              </div>
              <strong className="dash-float-value text-emerald">
                {totalExtractedTopics > 0 ? `${totalExtractedTopics} Topics` : "AI Syllabus"}
              </strong>
            </div>
          </motion.div>

          {/* Widget 3: Weekly Focus Progress (Bottom-Right) */}
          <motion.div
            animate={{ y: [5, -6, 5] }}
            transition={{ repeat: Infinity, duration: 5.6, ease: "easeInOut" }}
            whileHover={{ scale: 1.08, y: -8 }}
            className="dash-float-widget dash-hero-float-weekly"
            onClick={() => navigate("/study-center?tab=tracker")}
            title="Weekly Focus Progress"
          >
            <div className="dash-float-weekly-body">
              <div className="dash-float-header-row">
                <span className="dash-float-label">Weekly Focus</span>
                <span className="dash-float-badge-pill primary">{weeklyPercent}%</span>
              </div>
              <div className="dash-float-progress-track">
                <div
                  className="dash-float-progress-fill"
                  style={{ width: `${Math.min(100, Math.max(0, weeklyPercent))}%` }}
                />
              </div>
              <span className="dash-float-subtext">Goal: 10 hrs / week</span>
            </div>
          </motion.div>

          {/* Widget 4: Daily Streak (Bottom-Left) */}
          <motion.div
            animate={{ y: [-5, 6, -5] }}
            transition={{ repeat: Infinity, duration: 5.2, ease: "easeInOut" }}
            whileHover={{ scale: 1.08, y: -8 }}
            className="dash-float-widget dash-hero-float-streak"
            onClick={() => navigate("/study-center?tab=tracker")}
            title="Open Study Tracker"
          >
            <div className="dash-float-icon-box bg-amber-subtle text-amber">
              <Flame size={20} className="animate-pulse" />
            </div>
            <div className="dash-float-info">
              <div className="dash-float-header-row">
                <span className="dash-float-label">Streak Status</span>
                <span className="dash-float-badge-pill amber">🔥 Habit</span>
              </div>
              <strong className="dash-float-value text-amber">
                {currentStreak > 0 ? `${currentStreak} Days` : "Streak Ready"}
              </strong>
            </div>
          </motion.div>

          {/* Widget 5: Upcoming Next Lecture (Bottom-Center) */}
          <motion.div
            animate={{ y: [4, -5, 4] }}
            transition={{ repeat: Infinity, duration: 6.2, ease: "easeInOut" }}
            whileHover={{ scale: 1.08, y: -7 }}
            className="dash-float-widget dash-hero-float-class"
            onClick={() => navigate("/planner")}
            title="View Class Routine"
          >
            <div className="dash-float-icon-box bg-orange-subtle text-orange">
              <Clock size={18} />
            </div>
            <div className="dash-float-info">
              <div className="dash-float-header-row">
                <span className="dash-float-label">Next Class</span>
                <span className="dash-float-badge-pill orange">Upcoming</span>
              </div>
              <strong className="dash-float-value-compact">
                {nextClass.subject || "Course Lecture"}
              </strong>
              <span className="dash-float-subtext">
                {nextClass.start_time?.slice(0, 5)} - {nextClass.end_time?.slice(0, 5)}
              </span>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Curved SVG Wave Section Divider (Seamless organic transition to Section 2) */}
      <div className="dash-curved-wave-divider" aria-hidden="true">
        <svg
          viewBox="0 0 1440 96"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
        >
          <path
            d="M 0 30 Q 360 85 720 40 T 1440 45 L 1440 96 L 0 96 Z"
            fill="var(--dash-section-bg, #f8fafc)"
          />
        </svg>
      </div>
    </motion.section>
  );
}
