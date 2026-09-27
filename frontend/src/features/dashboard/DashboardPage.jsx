import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import { useAuth } from "../auth/useAuth";
import { getGradePlans } from "../grades/api";
import { getMaterials } from "../materials/api";
import { getSchedules } from "../planner/api";
import ScheduleDetailModal from "../planner/components/ScheduleDetailModal";
import { getStreakSummary, getStudySessions } from "../tracker/api";
import { getLeaderboard, getPosts } from "../community/api";

// Storytelling Academic Command Center Components
import HeroSection from "./components/HeroSection";
import AcademicJourney from "./components/AcademicJourney";
import TodayMattersSection from "./components/TodayMattersSection";
import SmartLearningTools from "./components/SmartLearningTools";
import StudyInsights from "./components/StudyInsights";
import CommunityMomentum from "./components/CommunityMomentum";
import ActiveSessionBanner from "./components/ActiveSessionBanner";

import "./dashboard.css";

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
  {
    quote:
      "Discipline is choosing between what you want now and what you want most.",
    author: "Abraham Lincoln",
  },
  {
    quote:
      "You don't have to be great to start, but you have to start to be great.",
    author: "Zig Ziglar",
  },
  {
    quote:
      "The expert in anything was once a beginner. Consistency turns effort into mastery.",
    author: "Helen Hayes",
  },
  {
    quote:
      "Focus on progress, not perfection. Every study session counts towards your dream.",
    author: "Academic Wisdom",
  },
  {
    quote:
      "Small daily improvements over time lead to stunning long-term results.",
    author: "Robin Sharma",
  },
  {
    quote: "An investment in knowledge pays the best interest.",
    author: "Benjamin Franklin",
  },
  {
    quote:
      "Believe in your preparation. The hard days are what make you strong.",
    author: "Aly Raisman",
  },
  {
    quote:
      "Action is the foundational key to all academic and personal success.",
    author: "Pablo Picasso",
  },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState([]);
  const [gradePlans, setGradePlans] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [streakData, setStreakData] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [communityPosts, setCommunityPosts] = useState([]);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [flowDayOffset, setFlowDayOffset] = useState(0); // 0 = Today, 1 = Yesterday, 2 = 2 days ago, 3 = 3 days ago
  const [selectedScheduleModal, setSelectedScheduleModal] = useState(null);
  const [currentTick, setCurrentTick] = useState(() => new Date());

  // Second-by-second ticker for live alert countdowns
  useEffect(() => {
    const interval = setInterval(() => setCurrentTick(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto-refresh motivation quote every 60 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % MOTIVATION_QUOTES.length);
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Load All Core Dashboard Data
  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      try {
        const [
          schedulesRes,
          gradesRes,
          sessionsRes,
          streakRes,
          materialsRes,
          leaderboardRes,
          postsRes,
        ] = await Promise.allSettled([
          getSchedules(),
          getGradePlans(),
          getStudySessions(),
          getStreakSummary(),
          getMaterials(),
          getLeaderboard("weekly"),
          getPosts(),
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
        if (leaderboardRes.status === "fulfilled")
          setLeaderboard(leaderboardRes.value || []);
        if (postsRes.status === "fulfilled")
          setCommunityPosts(postsRes.value || []);
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  // Compute Active or Upcoming Study Session Alert
  const activeSessionAlert = useMemo(() => {
    if (!sessions || sessions.length === 0) return null;
    const now = currentTick;
    const todayStr = now.toISOString().split("T")[0];

    // Priority 1: In-progress session
    const inProg = sessions.find((s) => s.status === "in_progress");
    if (inProg) {
      let timeRemainingStr = "";
      if (inProg.end_time && inProg.session_date === todayStr) {
        const [eh, em] = inProg.end_time.split(":").map(Number);
        const endDt = new Date(inProg.session_date);
        endDt.setHours(eh, em, 0, 0);
        const remSec = Math.max(
          0,
          Math.floor((endDt.getTime() - now.getTime()) / 1000),
        );
        const remMins = Math.floor(remSec / 60);
        const remSecs = remSec % 60;
        timeRemainingStr =
          remMins >= 60
            ? `${Math.floor(remMins / 60)}h ${remMins % 60}m ${remSecs < 10 ? "0" : ""}${remSecs}s`
            : `${remMins}m ${remSecs < 10 ? "0" : ""}${remSecs}s`;
      } else if (inProg.actual_started_at) {
        const started = new Date(inProg.actual_started_at);
        const totalSec =
          (inProg.duration_minutes + (inProg.extended_minutes || 0)) * 60;
        const elapsedSec = Math.max(
          0,
          Math.floor((now.getTime() - started.getTime()) / 1000),
        );
        const remSec = Math.max(0, totalSec - elapsedSec);
        const remMins = Math.floor(remSec / 60);
        const remSecs = remSec % 60;
        timeRemainingStr = `${remMins}m ${remSecs < 10 ? "0" : ""}${remSecs}s`;
      }

      return {
        session: inProg,
        type: "in_progress",
        badgeText: "STUDY SESSION IN PROGRESS",
        ctaText: "Resume Focus Session",
        timeTitle: "Time Remaining",
        countdown: timeRemainingStr,
      };
    }

    // Priority 2: Scheduled session with active window right now
    for (const s of sessions) {
      if (
        s.status === "scheduled" &&
        s.session_date === todayStr &&
        s.start_time
      ) {
        const [sh, sm] = s.start_time.split(":").map(Number);
        const startDt = new Date(s.session_date);
        startDt.setHours(sh, sm, 0, 0);

        const [eh, em] = (s.end_time || `${sh + 1}:${sm}`)
          .split(":")
          .map(Number);
        const endDt = new Date(s.session_date);
        endDt.setHours(eh, em, 0, 0);

        if (now >= startDt && now <= endDt) {
          const remainingSec = Math.max(
            0,
            Math.floor((endDt.getTime() - now.getTime()) / 1000),
          );
          const remMins = Math.floor(remainingSec / 60);
          const remSecs = remainingSec % 60;
          const timeStr =
            remMins >= 60
              ? `${Math.floor(remMins / 60)}h ${remMins % 60}m ${remSecs < 10 ? "0" : ""}${remSecs}s`
              : `${remMins}m ${remSecs < 10 ? "0" : ""}${remSecs}s`;

          return {
            session: s,
            type: "active_window",
            badgeText: "SCHEDULED FOCUS WINDOW",
            ctaText: "Start Focus Session",
            countdown: timeStr,
            timeTitle: "Time Remaining",
          };
        }

        // Priority 3: Upcoming within 25 minutes
        const diffSec = Math.floor((startDt.getTime() - now.getTime()) / 1000);
        if (diffSec > 0 && diffSec <= 25 * 60) {
          const remMins = Math.floor(diffSec / 60);
          const remSecs = diffSec % 60;
          const timeStr = `${remMins}m ${remSecs < 10 ? "0" : ""}${remSecs}s`;
          return {
            session: s,
            type: "starting_soon",
            badgeText: "UPCOMING STUDY SESSION",
            ctaText: "Prepare for Session",
            countdown: timeStr,
            timeTitle: "Starts In",
          };
        }
      }
    }
    return null;
  }, [sessions, currentTick]);

  // Robust material details resolution for banner
  const alertMaterial = useMemo(() => {
    if (!activeSessionAlert?.session) return null;
    const s = activeSessionAlert.session;
    if (s.material_details && s.material_details.title) {
      return s.material_details;
    }
    if (s.material && typeof s.material === "object" && s.material.title) {
      return s.material;
    }
    if (s.material && materials && materials.length > 0) {
      const found = materials.find((m) => String(m.id) === String(s.material));
      if (found) return found;
    }
    return null;
  }, [activeSessionAlert, materials]);

  const alertCourse = useMemo(() => {
    if (!activeSessionAlert?.session) return null;
    const s = activeSessionAlert.session;
    if (s.course_details && (s.course_details.code || s.course_details.title)) {
      return s.course_details;
    }
    if (s.course && typeof s.course === "object") {
      return s.course;
    }
    return null;
  }, [activeSessionAlert]);

  // Core Statistics
  const totalStudyMinutes = sessions.reduce(
    (total, session) => total + Number(session.duration_minutes || 0),
    0,
  );
  const totalHours = (totalStudyMinutes / 60).toFixed(1);
  const topGradePlan = gradePlans[0];
  const currentStreak = streakData?.current_streak || 0;
  const todayMinutes = streakData?.today_minutes || 0;

  const totalExtractedTopics = materials.reduce(
    (acc, m) => acc + (m.key_topics?.length || 0),
    0,
  );

  const currentDate = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  // Target Date calculations for Today's Flow navigation (Last 3 days)
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() - flowDayOffset);
  const targetIsoDate = targetDate.toISOString().slice(0, 10);
  const targetWeekdayName = targetDate.toLocaleDateString(undefined, {
    weekday: "long",
  });

  const targetDayLabel =
    flowDayOffset === 0
      ? "Today"
      : flowDayOffset === 1
        ? "Yesterday"
        : `${flowDayOffset} Days Ago`;

  const targetFormattedDate = targetDate.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  // Filter study sessions for target day
  const daySessions = useMemo(() => {
    return sessions.filter((s) => {
      if (s.session_date === targetIsoDate) return true;
      if (s.created_at && s.created_at.slice(0, 10) === targetIsoDate)
        return true;
      return false;
    });
  }, [sessions, targetIsoDate]);

  // Filter schedules matching target weekday
  const dayRoutines = useMemo(() => {
    return schedules.filter(
      (sch) => sch.days && sch.days.includes(targetWeekdayName),
    );
  }, [schedules, targetWeekdayName]);

  const todayWeekdayName = new Date().toLocaleDateString(undefined, {
    weekday: "long",
  });

  const todayClasses = useMemo(() => {
    return schedules.filter((sch) => sch.days?.includes(todayWeekdayName));
  }, [schedules, todayWeekdayName]);

  const dayTotalMinutes = daySessions.reduce(
    (acc, s) => acc + Number(s.duration_minutes || 0),
    0,
  );
  const dayHours = Math.floor(dayTotalMinutes / 60);
  const dayMins = dayTotalMinutes % 60;

  // Fully Dynamic Weekly Progress (Last 7 days vs User's configured daily target * 7)
  const targetWeeklyHours = useMemo(() => {
    const dailyMins = Number(user?.target_daily_minutes) || 60;
    return Number(((dailyMins * 7) / 60).toFixed(1));
  }, [user]);

  const { weeklyHours, weeklyPercent } = useMemo(() => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 6);
    oneWeekAgo.setHours(0, 0, 0, 0);

    const weeklyMins = sessions.reduce((acc, s) => {
      const sDate = new Date(s.session_date || s.created_at);
      if (!isNaN(sDate.getTime()) && sDate >= oneWeekAgo) {
        return acc + Number(s.duration_minutes || 0);
      }
      return acc;
    }, 0);

    const hours = (weeklyMins / 60).toFixed(1);
    const pct = targetWeeklyHours > 0
      ? Math.min(100, Math.round((Number(hours) / targetWeeklyHours) * 100))
      : 0;

    return { weeklyHours: hours, weeklyPercent: pct };
  }, [sessions, targetWeeklyHours]);

  // Fully Dynamic Community Stats (No demo data)
  const communityStats = useMemo(() => {
    const todayStr = currentTick.toISOString().split("T")[0];
    const todaySessionsCount = sessions.filter(
      (s) =>
        s.session_date === todayStr ||
        (s.created_at && s.created_at.slice(0, 10) === todayStr),
    ).length;

    const totalPosts = communityPosts.length;
    const solvedPosts = communityPosts.filter((p) => p.is_solved).length;
    const rankings = Array.isArray(leaderboard)
      ? leaderboard
      : leaderboard?.rankings || [];
    const totalParticipants = leaderboard?.total_participants || rankings.length;

    return {
      todaySessionsCount,
      totalPosts,
      solvedPosts,
      totalParticipants,
    };
  }, [sessions, currentTick, communityPosts, leaderboard]);

  return (
    <div className="app-screen">
      <Navbar />

      <main className="main-content dashboard-main-content">
        <div className="dashboard-storytelling-container">
          {/* Active / In-Progress Session Alert Banner */}
          <ActiveSessionBanner
            activeSessionAlert={activeSessionAlert}
            alertCourse={alertCourse}
            alertMaterial={alertMaterial}
          />

          {/* Section 1 — Hero Experience: Storytelling Header & Student Desk Illustration */}
          <HeroSection
            user={user}
            currentDate={currentDate}
            topGradePlan={topGradePlan}
            currentStreak={currentStreak}
            totalExtractedTopics={totalExtractedTopics}
            weeklyPercent={weeklyPercent}
            targetWeeklyHours={targetWeeklyHours}
            todayClasses={todayClasses}
          />

          {/* Section 2 — Your Academic Journey: Interconnected Milestone Highway */}
          <AcademicJourney
            user={user}
            totalHours={totalHours}
            sessionsCount={sessions.length}
            currentStreak={currentStreak}
            topGradePlan={topGradePlan}
            materialsCount={materials.length}
            totalExtractedTopics={totalExtractedTopics}
          />

          {/* Section 3 — Today Matters: Asymmetric Editorial Layout (Focus Flow + Stacked Intel) */}
          <TodayMattersSection
            targetDayLabel={targetDayLabel}
            targetFormattedDate={targetFormattedDate}
            dayHours={dayHours}
            dayMins={dayMins}
            dayTotalMinutes={dayTotalMinutes}
            flowDayOffset={flowDayOffset}
            setFlowDayOffset={setFlowDayOffset}
            daySessions={daySessions}
            dayRoutines={dayRoutines}
            onOpenScheduleModal={(routine) => setSelectedScheduleModal(routine)}
            todayMinutes={todayMinutes}
            weeklyHours={weeklyHours}
            targetWeeklyHours={targetWeeklyHours}
            targetDailyMinutes={Number(user?.target_daily_minutes) || 60}
            weeklyPercent={weeklyPercent}
            schedules={schedules}
            todayWeekdayName={todayWeekdayName}
            quoteIndex={quoteIndex}
            quotes={MOTIVATION_QUOTES}
            onNextQuote={() =>
              setQuoteIndex((prev) => (prev + 1) % MOTIVATION_QUOTES.length)
            }
          />

          {/* Section 4 — Smart Learning Tools: Magazine Masonry Architecture */}
          <SmartLearningTools
            user={user}
            schedules={schedules}
            todayClasses={todayClasses}
            todayWeekdayName={todayWeekdayName}
            materials={materials}
            totalExtractedTopics={totalExtractedTopics}
            topGradePlan={topGradePlan}
            communityStats={communityStats}
            onOpenScheduleModal={(routine) => setSelectedScheduleModal(routine)}
          />

          {/* Section 5 — Study Insights: Heatmap, 7-Day Trend, Subject Distribution, Score */}
          <StudyInsights
            sessions={sessions}
            schedules={schedules}
            currentStreak={currentStreak}
            totalHours={totalHours}
          />

          {/* Section 6 — Community Momentum: Top 3 Scholar Champions Podium */}
          <CommunityMomentum
            leaderboard={leaderboard}
            communityStats={communityStats}
          />
        </div>

        {/* Schedule Detail Modal when viewing from Dashboard */}
        {selectedScheduleModal && (
          <ScheduleDetailModal
            schedule={selectedScheduleModal}
            onClose={() => setSelectedScheduleModal(null)}
            onGoToPlanner={(schedule) => {
              setSelectedScheduleModal(null);
              navigate(`/planner?routineId=${schedule.id}`, {
                state: { highlightId: schedule.id },
              });
            }}
          />
        )}
      </main>
    </div>
  );
}
