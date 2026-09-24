import { motion } from "framer-motion";
import { Clock, Flame, Target, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import KPICard from "./KPICard";
import { StatSkeleton } from "../../../components/Skeleton";

export default function KPIGrid({
  loading,
  totalHours,
  sessionsCount,
  currentStreak,
  todayMinutes = 0,
  topGradePlan,
  materialsCount,
  totalExtractedTopics,
  weeklyPercent = 84,
}) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="dash-kpi-grid">
        <StatSkeleton />
        <StatSkeleton />
        <StatSkeleton />
        <StatSkeleton />
      </div>
    );
  }

  // Calculate study time progress towards 15h goal
  const hoursNum = parseFloat(totalHours) || 0;
  const studyProgress = Math.min(100, Math.round((hoursNum / 15) * 100));

  // Calculate streak progress towards 7-day milestone
  const streakProgress = Math.min(100, Math.round((currentStreak / 7) * 100));

  // Calculate GPA completion if available
  const gpaCurrent = topGradePlan
    ? parseFloat(topGradePlan.current_gpa) || 0
    : 3.8;
  const gpaTarget = topGradePlan
    ? parseFloat(topGradePlan.target_gpa) || 4.0
    : 4.0;
  const gpaProgress = Math.min(100, Math.round((gpaCurrent / gpaTarget) * 100));

  // Materials progress
  const materialProgress = Math.min(100, Math.max(10, materialsCount * 12));

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="dash-kpi-grid"
    >
      {/* 1. Study Time */}
      <KPICard
        title="Study Time"
        icon={Clock}
        variant="kpi-indigo"
        value={`${totalHours}h`}
        trend={`+${sessionsCount} sessions`}
        trendColor="text-indigo bg-indigo-subtle"
        progressPercent={studyProgress}
        progressColor="bg-primary"
        subtext="Total focused learning logged"
        iconBg="bg-indigo-subtle text-indigo"
        onClick={() => navigate("/study-center?tab=tracker")}
      />

      {/* 2. Active Streak */}
      <KPICard
        title="Active Streak"
        icon={Flame}
        variant="kpi-emerald"
        value={`${currentStreak} Days`}
        trend={todayMinutes > 0 ? `🔥 ${todayMinutes}m today` : "Active"}
        trendColor="text-emerald bg-emerald-subtle"
        progressPercent={streakProgress}
        progressColor="bg-emerald"
        subtext="Daily study consistency"
        iconBg="bg-emerald-subtle text-emerald"
        onClick={() => navigate("/study-center?tab=tracker")}
      />

      {/* 3. Academic Target */}
      <KPICard
        title="Academic Target"
        icon={Target}
        variant="kpi-amber"
        value={
          topGradePlan ? Number(topGradePlan.target_gpa).toFixed(2) : "3.80"
        }
        trend={
          topGradePlan
            ? `CGPA: ${Number(topGradePlan.current_gpa).toFixed(2)}`
            : "Target Honors"
        }
        trendColor="text-amber bg-amber-subtle"
        progressPercent={gpaProgress}
        progressColor="bg-amber"
        subtext={
          topGradePlan
            ? `${topGradePlan.completed_credits}/${topGradePlan.total_credits} credits done`
            : "Grade projection calculator"
        }
        iconBg="bg-amber-subtle text-amber"
        onClick={() => navigate("/grades")}
      />

      {/* 4. Study Materials */}
      <KPICard
        title="Study Materials"
        icon={FileText}
        variant="kpi-rose"
        value={String(materialsCount)}
        trend={`${totalExtractedTopics} topics`}
        trendColor="text-rose bg-rose-subtle"
        progressPercent={materialProgress}
        progressColor="bg-rose"
        subtext="Uploaded notes & extracted concepts"
        iconBg="bg-rose-subtle text-rose"
        onClick={() => navigate("/materials")}
      />
    </motion.section>
  );
}
