import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  Flame,
  GraduationCap,
  Layers,
  Quote,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import Badge from "../../components/Badge";
import Button from "../../components/Button";
import Card from "../../components/Card";
import Navbar from "../../components/Navbar";
import { StatSkeleton } from "../../components/Skeleton";
import { useAuth } from "../auth/useAuth";
import { getGradePlans } from "../grades/api";
import { getMaterials } from "../materials/api";
import { getSchedules } from "../planner/api";
import { getStreakSummary, getStudySessions } from "../tracker/api";

const MOTIVATION_QUOTES = [
  {
    quote: "Success is the sum of small efforts, repeated day in and day out.",
    author: "Robert Collier",
  },
  {
    quote: "The secret to getting ahead is getting started.",
    author: "Mark Twain",
  },
  {
    quote: "It always seems impossible until it's done.",
    author: "Nelson Mandela",
  },
  {
    quote:
      "Live as if you were to die tomorrow. Learn as if you were to live forever.",
    author: "Mahatma Gandhi",
  },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState([]);
  const [gradePlans, setGradePlans] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [streakData, setStreakData] = useState(null);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [flowDayOffset, setFlowDayOffset] = useState(0); // 0 = Today, 1 = Yesterday, 2 = 2 days ago, 3 = 3 days ago

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      try {
        const [schedulesRes, gradesRes, sessionsRes, streakRes, materialsRes] =
          await Promise.allSettled([
            getSchedules(),
            getGradePlans(),
            getStudySessions(),
            getStreakSummary(),
            getMaterials(),
          ]);

        if (schedulesRes.status === "fulfilled")
          setSchedules(schedulesRes.value || []);
        if (gradesRes.status === "fulfilled")
          setGradePlans(gradesRes.value || []);
        if (sessionsRes.status === "fulfilled")
          setSessions(sessionsRes.value || []);
        if (streakRes.status === "fulfilled")
          setStreakData(streakRes.value || null);
        if (materialsRes.status === "fulfilled")
          setMaterials(materialsRes.value || []);
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  const totalStudyMinutes = sessions.reduce(
    (total, session) => total + Number(session.duration_minutes || 0),
    0,
  );
  const totalHours = (totalStudyMinutes / 60).toFixed(1);
  const topGradePlan = gradePlans[0];
  const currentStreak = streakData?.current_streak || 0;

  const totalExtractedTopics = materials.reduce(
    (acc, m) => acc + (m.key_topics?.length || 0),
    0,
  );

  const currentDate = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  // Calculate day-specific data for Today's Flow navigation (Last 3 days)
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() - flowDayOffset);
  const targetIsoDate = targetDate.toISOString().split("T")[0];
  const targetWeekday = targetDate.toLocaleDateString(undefined, {
    weekday: "long",
  });
  const targetDayLabel =
    flowDayOffset === 0
      ? "Today"
      : flowDayOffset === 1
        ? "Yesterday"
        : `${flowDayOffset} Days Ago`;
  const targetFormattedDate = targetDate.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  const daySessions = sessions.filter((s) => {
    if (!s.session_date) return false;
    return s.session_date.startsWith(targetIsoDate);
  });

  const dayTotalMinutes = daySessions.reduce(
    (sum, s) => sum + (Number(s.duration_minutes) || 0),
    0,
  );
  const dayHours = Math.floor(dayTotalMinutes / 60);
  const dayMins = dayTotalMinutes % 60;

  const dayRoutines = schedules.filter((sch) =>
    (sch.days || []).some(
      (d) =>
        d.toLowerCase() === targetWeekday.toLowerCase() ||
        d.toLowerCase().startsWith(targetWeekday.slice(0, 3).toLowerCase()),
    ),
  );

  return (
    <div className="app-screen">
      <Navbar />

      <main className="main-content">
        {/* =================================================================
            1. HERO SECTION (Notion × Linear × Apple Education)
            ================================================================= */}
        <section className="academic-hero-banner">
          <div className="hero-ambient-glow" />
          <div className="hero-grid-matrix" />

          <div className="hero-content-grid">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="hero-left-copy"
            >
              <div className="hero-pill-tag">
                <Sparkles size={14} className="tag-sparkle-icon" />
                <span>The Academic Operating System</span>
                <span className="hero-date-divider">•</span>
                <span>{currentDate}</span>
              </div>

              <h1 className="hero-headline">
                Study Smarter, <br />
                <span className="hero-gradient-text">Not Harder.</span>
              </h1>

              <p className="hero-subtext">
                Welcome back, <strong>{user?.full_name || "Scholar"}</strong>.
                Master routines, project GPA honors, maintain focus streaks, and
                extract syllabus knowledge with AI.
              </p>

              <div className="hero-cta-button-group">
                <Link to="/planner">
                  <Button variant="primary" size="lg" icon={Calendar}>
                    View Routine Planner
                  </Button>
                </Link>
                <Link to="/materials">
                  <Button variant="secondary" size="lg" icon={FileText}>
                    Study Materials
                  </Button>
                </Link>
              </div>
            </motion.div>

            {/* Right: Floating Academic SVG Illustration */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="hero-illustration-wrapper desktop-only"
            >
              <div className="hero-glass-canvas">
                {/* Floating Cap */}
                <motion.div
                  animate={{ y: [-4, 6, -4], rotate: [-1, 2, -1] }}
                  transition={{
                    repeat: Infinity,
                    duration: 4.5,
                    ease: "easeInOut",
                  }}
                  className="floating-asset cap-asset"
                >
                  <div className="asset-icon-box bg-indigo">
                    <GraduationCap size={28} className="text-white" />
                  </div>
                  <div className="asset-meta">
                    <span className="asset-title">Target Honors</span>
                    <strong className="asset-val">
                      {topGradePlan
                        ? `${topGradePlan.target_gpa} GPA`
                        : "3.85 GPA"}
                    </strong>
                  </div>
                </motion.div>

                {/* Floating Streak Flame */}
                <motion.div
                  animate={{ y: [6, -6, 6] }}
                  transition={{
                    repeat: Infinity,
                    duration: 5,
                    ease: "easeInOut",
                  }}
                  className="floating-asset flame-asset"
                >
                  <div className="asset-icon-box bg-amber">
                    <Flame size={24} className="text-white animate-pulse" />
                  </div>
                  <div className="asset-meta">
                    <span className="asset-title">Daily Focus</span>
                    <strong className="asset-val text-amber">
                      {currentStreak > 0
                        ? `${currentStreak} Days 🔥`
                        : "Streak Ready"}
                    </strong>
                  </div>
                </motion.div>

                {/* Floating Knowledge Nodes */}
                <motion.div
                  animate={{ y: [-5, 5, -5], rotate: [1, -1, 1] }}
                  transition={{
                    repeat: Infinity,
                    duration: 6,
                    ease: "easeInOut",
                  }}
                  className="floating-asset book-asset"
                >
                  <div className="asset-icon-box bg-emerald">
                    <BookOpen size={24} className="text-white" />
                  </div>
                  <div className="asset-meta">
                    <span className="asset-title">Knowledge Extracted</span>
                    <strong className="asset-val text-emerald">
                      {totalExtractedTopics > 0
                        ? `${totalExtractedTopics} Topics`
                        : "AI Ready"}
                    </strong>
                  </div>
                </motion.div>

                {/* Center SVG Brain Grid */}
                <svg
                  className="brain-network-svg"
                  viewBox="0 0 300 240"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle
                    cx="150"
                    cy="120"
                    r="60"
                    stroke="var(--color-primary-border)"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                  />
                  <circle
                    cx="150"
                    cy="120"
                    r="95"
                    stroke="var(--color-primary-border)"
                    strokeWidth="1"
                    strokeDasharray="6 6"
                  />
                  <line
                    x1="80"
                    y1="80"
                    x2="150"
                    y2="120"
                    stroke="var(--color-primary)"
                    strokeWidth="1.5"
                    strokeOpacity="0.4"
                  />
                  <line
                    x1="220"
                    y1="80"
                    x2="150"
                    y2="120"
                    stroke="var(--color-secondary)"
                    strokeWidth="1.5"
                    strokeOpacity="0.4"
                  />
                  <line
                    x1="150"
                    y1="120"
                    x2="150"
                    y2="195"
                    stroke="var(--color-accent)"
                    strokeWidth="1.5"
                    strokeOpacity="0.4"
                  />
                  <circle
                    cx="150"
                    cy="120"
                    r="14"
                    fill="var(--color-primary)"
                    fillOpacity="0.15"
                  />
                  <circle cx="150" cy="120" r="6" fill="var(--color-primary)" />
                </svg>
              </div>
            </motion.div>
          </div>
        </section>

        {/* =================================================================
            2. QUICK STATS (Distinct Treatments + Trend Indicators)
            ================================================================= */}
        <section className="stats-cards-row">
          {loading ? (
            <>
              <StatSkeleton />
              <StatSkeleton />
              <StatSkeleton />
              <StatSkeleton />
            </>
          ) : (
            <>
              {/* Stat 1: Total Study Hours */}
              <Card variant="stat" className="stat-indigo">
                <div className="stat-top-row">
                  <span className="stat-header-label">Study Time</span>
                  <div className="stat-icon-pill bg-indigo-subtle">
                    <Clock size={16} className="text-indigo" />
                  </div>
                </div>
                <div className="stat-number-row">
                  <strong className="stat-metric-value">{totalHours}h</strong>
                  <span className="stat-trend-chip chip-positive">
                    <TrendingUp size={12} /> {sessions.length} sessions
                  </span>
                </div>
                <span className="stat-footer-subtext">
                  Total focused learning logged
                </span>
              </Card>

              {/* Stat 2: Streak */}
              <Card variant="stat" className="stat-emerald">
                <div className="stat-top-row">
                  <span className="stat-header-label">Active Streak</span>
                  <div className="stat-icon-pill bg-emerald-subtle">
                    <Flame size={16} className="text-emerald" />
                  </div>
                </div>
                <div className="stat-number-row">
                  <strong className="stat-metric-value">
                    {currentStreak} Days
                  </strong>
                  <span className="stat-trend-chip chip-emerald">
                    🔥{" "}
                    {streakData?.today_minutes > 0
                      ? `${streakData.today_minutes}m today`
                      : "Active"}
                  </span>
                </div>
                <span className="stat-footer-subtext">
                  Daily study consistency
                </span>
              </Card>

              {/* Stat 3: Target GPA */}
              <Card variant="stat" className="stat-amber">
                <div className="stat-top-row">
                  <span className="stat-header-label">Academic Target</span>
                  <div className="stat-icon-pill bg-amber-subtle">
                    <Target size={16} className="text-amber" />
                  </div>
                </div>
                <div className="stat-number-row">
                  <strong className="stat-metric-value">
                    {topGradePlan
                      ? Number(topGradePlan.target_gpa).toFixed(2)
                      : "3.80"}
                  </strong>
                  <span className="stat-trend-chip chip-amber">
                    CGPA:{" "}
                    {topGradePlan
                      ? Number(topGradePlan.current_gpa).toFixed(2)
                      : "Set"}
                  </span>
                </div>
                <span className="stat-footer-subtext">
                  {topGradePlan
                    ? `${topGradePlan.completed_credits}/${topGradePlan.total_credits} credits done`
                    : "Grade goal projection"}
                </span>
              </Card>

              {/* Stat 4: Materials & Topics */}
              <Card variant="stat" className="stat-rose">
                <div className="stat-top-row">
                  <span className="stat-header-label">Study Materials</span>
                  <div className="stat-icon-pill bg-rose-subtle">
                    <FileText size={16} className="text-rose" />
                  </div>
                </div>
                <div className="stat-number-row">
                  <strong className="stat-metric-value">
                    {materials.length}
                  </strong>
                  <span className="stat-trend-chip chip-rose">
                    {totalExtractedTopics} topics
                  </span>
                </div>
                <span className="stat-footer-subtext">
                  Uploaded notes & extracted concepts
                </span>
              </Card>
            </>
          )}
        </section>

        {/* =================================================================
            3. BENTO GRID ACADEMIC MODULES
            ================================================================= */}
        <div className="section-header-row">
          <div>
            <h2 className="section-main-heading">Academic Modules</h2>
            <p className="section-sub-heading">
              Your interconnected tools for high-performance university
              coursework.
            </p>
          </div>
        </div>

        <div className="academic-bento-grid">
          {/* Bento Item 1: Large Routine Planner */}
          <Card
            variant="feature"
            hoverEffect
            className="bento-card bento-span-2"
          >
            <div className="bento-card-inner">
              <div className="bento-header">
                <div className="bento-icon-wrapper bg-indigo-subtle text-indigo">
                  <Calendar size={22} />
                </div>
                <Badge variant="primary">Schedule Engine</Badge>
              </div>

              <div className="bento-body">
                <h3 className="bento-title">Study Planner & Timetable</h3>
                <p className="bento-description">
                  Build structured weekly routines, attach resource drive links,
                  and organize subject workloads.
                </p>

                {/* Quick Schedule Preview */}
                <div className="bento-routines-preview">
                  {schedules.length > 0 ? (
                    schedules.slice(0, 3).map((item) => (
                      <div key={item.id} className="mini-routine-pill">
                        <span className="routine-day-badge">{item.day}</span>
                        <strong className="routine-subject-text">
                          {item.subject}
                        </strong>
                        <span className="routine-time-text">
                          {item.start_time} - {item.end_time}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="mini-empty-hint">
                      <span>
                        No routines scheduled yet — plan your week in seconds.
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bento-footer">
                <Link to="/planner" className="bento-cta-link">
                  <span>Open Planner Timetable</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </Card>

          {/* Bento Item 2: AI Materials & Note Extractor */}
          <Card variant="feature" hoverEffect className="bento-card">
            <div className="bento-card-inner">
              <div className="bento-header">
                <div className="bento-icon-wrapper bg-rose-subtle text-rose">
                  <FileText size={22} />
                </div>
                <Badge variant="danger">AI Parser</Badge>
              </div>

              <div className="bento-body">
                <h3 className="bento-title">Materials & Extraction</h3>
                <p className="bento-description">
                  Upload PDF, DOCX, or markdown lecture notes. Automatically
                  extract syllabus concepts & flashcards.
                </p>

                <div className="mini-materials-indicator">
                  <div className="materials-count-box">
                    <strong className="count-number">{materials.length}</strong>
                    <span className="count-label">Documents</span>
                  </div>
                  <div className="materials-count-box">
                    <strong className="count-number text-rose">
                      {totalExtractedTopics}
                    </strong>
                    <span className="count-label">Topics</span>
                  </div>
                </div>
              </div>

              <div className="bento-footer">
                <Link to="/materials" className="bento-cta-link">
                  <span>Open Materials Hub</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </Card>

          {/* Bento Item 3: Grade Planner & Honors Projection */}
          <Card variant="feature" hoverEffect className="bento-card">
            <div className="bento-card-inner">
              <div className="bento-header">
                <div className="bento-icon-wrapper bg-emerald-subtle text-emerald">
                  <GraduationCap size={22} />
                </div>
                <Badge variant="secondary">GPA Calculator</Badge>
              </div>

              <div className="bento-body">
                <h3 className="bento-title">Grade Planner</h3>
                <p className="bento-description">
                  Calculate required semester GPAs on remaining credit hours to
                  lock in graduation honors.
                </p>

                <div className="gpa-progress-indicator">
                  <div className="gpa-bar-bg">
                    <div
                      className="gpa-bar-fill"
                      style={{
                        width: topGradePlan
                          ? `${Math.min((topGradePlan.current_gpa / topGradePlan.target_gpa) * 100, 100)}%`
                          : "75%",
                      }}
                    />
                  </div>
                  <div className="gpa-bar-labels">
                    <span>Current: {topGradePlan?.current_gpa || "N/A"}</span>
                    <span>Target: {topGradePlan?.target_gpa || "4.00"}</span>
                  </div>
                </div>
              </div>

              <div className="bento-footer">
                <Link to="/grades" className="bento-cta-link">
                  <span>Open Grade Planner</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </Card>

          {/* Bento Item 4: Study Tracker & Streaks */}
          <Card variant="feature" hoverEffect className="bento-card">
            <div className="bento-card-inner">
              <div className="bento-header">
                <div className="bento-icon-wrapper bg-amber-subtle text-amber">
                  <Flame size={22} />
                </div>
                <Badge variant="accent">Habits & Streaks</Badge>
              </div>

              <div className="bento-body">
                <h3 className="bento-title">Focus & Rewards</h3>
                <p className="bento-description">
                  Log focused pomodoros, maintain consistency streaks, and
                  unlock achievement milestone badges.
                </p>

                <div className="streak-badge-highlight">
                  <Flame size={20} className="text-amber animate-pulse" />
                  <span>
                    <strong>{currentStreak} Days</strong> of unbroken academic
                    consistency
                  </span>
                </div>
              </div>

              <div className="bento-footer">
                <Link to="/tracker" className="bento-cta-link">
                  <span>Open Study Tracker</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </Card>

          {/* Bento Item 5: Community & Peer Network */}
          <Card variant="feature" hoverEffect className="bento-card">
            <div className="bento-card-inner">
              <div className="bento-header">
                <div className="bento-icon-wrapper bg-indigo-subtle text-indigo">
                  <Users size={22} />
                </div>
                <Badge variant="primary">Campus Network</Badge>
              </div>

              <div className="bento-body">
                <h3 className="bento-title">Scholar Community</h3>
                <p className="bento-description">
                  Ask exam questions, collaborate on coursework, RSVP for study
                  groups, and climb the leaderboard.
                </p>

                <div className="community-meta-row">
                  <span className="community-tag-pill">💬 Academic Forum</span>
                  <span className="community-tag-pill">🏆 Leaderboard</span>
                  <span className="community-tag-pill">🗓️ Campus Events</span>
                </div>
              </div>

              <div className="bento-footer">
                <Link to="/community" className="bento-cta-link">
                  <span>Open Community Hub</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </Card>
        </div>

        {/* =================================================================
            4. TODAY'S FOCUS & MOTIVATION WIDGETS
            ================================================================= */}
        <div className="dashboard-sub-grid">
          {/* Day-Navigable Focus Flow (Today & Last 3 Days) */}
          <Card className="timeline-focus-card">
            <div className="card-header-with-action">
              <div>
                <div className="flow-title-row">
                  <h3 className="card-title-lg">
                    {targetDayLabel}'s Focus Flow
                  </h3>
                  {flowDayOffset > 0 && (
                    <button
                      type="button"
                      onClick={() => setFlowDayOffset(0)}
                      className="flow-jump-today-btn"
                    >
                      Jump to Today
                    </button>
                  )}
                </div>
                <p className="card-subtitle-sm">
                  {targetFormattedDate} •{" "}
                  {dayTotalMinutes > 0
                    ? `${dayHours > 0 ? `${dayHours}h ` : ""}${dayMins}m focused`
                    : "No sessions logged"}
                </p>
              </div>

              {/* Day Arrow Controls (Browse past 3 days) */}
              <div className="flow-date-navigator">
                <button
                  type="button"
                  className="flow-nav-arrow-btn"
                  onClick={() =>
                    setFlowDayOffset((prev) => Math.min(3, prev + 1))
                  }
                  disabled={flowDayOffset >= 3}
                  title="View Previous Day (up to 3 days ago)"
                  aria-label="Previous day"
                >
                  <ChevronLeft size={16} />
                </button>

                <span className="flow-nav-offset-pill">{targetDayLabel}</span>

                <button
                  type="button"
                  className="flow-nav-arrow-btn"
                  onClick={() =>
                    setFlowDayOffset((prev) => Math.max(0, prev - 1))
                  }
                  disabled={flowDayOffset <= 0}
                  title="View Next Day"
                  aria-label="Next day"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            <div className="focus-timeline-container">
              {/* If sessions exist for this day */}
              {daySessions.length > 0
                ? daySessions.map((session, sIdx) => (
                    <div
                      key={session.id || sIdx}
                      className="timeline-step-item"
                    >
                      <div className="step-bullet-indicator completed-bullet">
                        <CheckCircle2 size={16} />
                      </div>
                      <div className="step-content-box">
                        <div className="step-time-line">
                          <span className="step-time-label">
                            Session #{sIdx + 1} • {session.duration_minutes}{" "}
                            mins
                          </span>
                          <span className="session-completed-tag">
                            ✓ Completed
                          </span>
                        </div>
                        <strong className="step-title-text">
                          {session.subject}
                        </strong>
                        <p className="step-desc-text">
                          {session.notes ||
                            "Focused study session recorded in habit streak."}
                        </p>
                      </div>
                    </div>
                  ))
                : null}

              {/* If scheduled routines match this day and we're looking at Today */}
              {flowDayOffset === 0 && dayRoutines.length > 0
                ? dayRoutines.map((routine, rIdx) => (
                    <div
                      key={routine.id || rIdx}
                      className="timeline-step-item"
                    >
                      <div className="step-bullet-indicator active-bullet">
                        <Zap size={14} className="animate-pulse" />
                      </div>
                      <div className="step-content-box">
                        <div className="step-time-line">
                          <span className="step-time-label">
                            Timetable • {routine.start_time?.slice(0, 5)} -{" "}
                            {routine.end_time?.slice(0, 5)}
                          </span>
                          <span className="routine-scheduled-tag">
                            Scheduled
                          </span>
                        </div>
                        <strong className="step-title-text">
                          {routine.subject}
                        </strong>
                        <p className="step-desc-text">
                          {routine.notes || "Active weekly coursework routine."}
                        </p>
                      </div>
                    </div>
                  ))
                : null}

              {/* If no sessions and no routines on this day */}
              {daySessions.length === 0 &&
              (flowDayOffset > 0 || dayRoutines.length === 0) ? (
                <div className="timeline-empty-day-state">
                  <Clock size={22} className="text-muted" />
                  <p className="empty-day-title">
                    {flowDayOffset === 0
                      ? "No study activity logged yet today"
                      : `No study sessions recorded for ${targetDayLabel}`}
                  </p>
                  <p className="empty-day-sub">
                    {flowDayOffset === 0
                      ? "Start a focus timer in Study Tracker to maintain your habit streak."
                      : `You did not record focus minutes on ${targetFormattedDate}.`}
                  </p>
                  {flowDayOffset === 0 && (
                    <Link to="/tracker" className="timeline-start-cta">
                      <Zap size={14} />
                      <span>Start Focus Timer</span>
                    </Link>
                  )}
                </div>
              ) : null}
            </div>
          </Card>

          {/* Motivation & Daily Study Challenge Widget */}
          <div className="side-widgets-column">
            {/* Motivation Quote */}
            <Card className="quote-widget-card">
              <div className="quote-top-row">
                <Quote size={20} className="quote-icon-svg text-indigo" />
                <button
                  type="button"
                  className="quote-refresh-btn"
                  onClick={() =>
                    setQuoteIndex(
                      (prev) => (prev + 1) % MOTIVATION_QUOTES.length,
                    )
                  }
                  title="Next Quote"
                >
                  <Sparkles size={14} />
                  <span>Next Inspiration</span>
                </button>
              </div>
              <p className="quote-body-text">
                "{MOTIVATION_QUOTES[quoteIndex].quote}"
              </p>
              <span className="quote-author-text">
                — {MOTIVATION_QUOTES[quoteIndex].author}
              </span>
            </Card>

            {/* Daily Academic Challenge */}
            <Card className="challenge-widget-card">
              <div className="challenge-header">
                <Award size={20} className="text-amber" />
                <strong className="challenge-title">
                  Daily Study Challenge
                </strong>
              </div>
              <p className="challenge-desc">
                Log at least <strong>45 minutes</strong> of uninterrupted
                focused study today.
              </p>
              <div className="challenge-footer">
                <Badge variant="accent">+50 Scholar XP</Badge>
                <Link to="/tracker">
                  <Button variant="outline" size="sm">
                    Start Timer →
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
