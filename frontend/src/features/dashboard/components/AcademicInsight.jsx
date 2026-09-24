import { useMemo } from "react";
import { Sparkles, Lightbulb, TrendingUp, Flame } from "lucide-react";

export default function AcademicInsight({
  sessions = [],
  topGradePlan,
  currentStreak = 0,
  totalHours = 0,
}) {
  const insights = useMemo(() => {
    const list = [];

    // Session momentum insight
    if (sessions.length > 0) {
      list.push({
        icon: TrendingUp,
        color: "text-indigo",
        text: `You have logged ${sessions.length} study sessions totaling ${totalHours}h of focused preparation so far.`,
      });
    } else {
      list.push({
        icon: Lightbulb,
        color: "text-amber",
        text: "Kickstart your semester habits today with a 25-minute Pomodoro study sprint in the Study Tracker.",
      });
    }

    // GPA Target insight
    if (topGradePlan) {
      const cur = parseFloat(topGradePlan.current_gpa) || 0;
      const tgt = parseFloat(topGradePlan.target_gpa) || 4.0;
      const diff = tgt - cur;
      if (diff > 0) {
        list.push({
          icon: Sparkles,
          color: "text-emerald",
          text: `You are ${diff.toFixed(2)} CGPA points away from your ${tgt.toFixed(2)} degree honors target. Maintaining required grades will lock it in.`,
        });
      } else {
        list.push({
          icon: Sparkles,
          color: "text-emerald",
          text: `Target CGPA achieved! Keep maintaining high standards across your remaining credits.`,
        });
      }
    }

    // Streak habit insight
    if (currentStreak > 0) {
      list.push({
        icon: Flame,
        color: "text-amber",
        text: `You're on a ${currentStreak}-day study streak! Complete one more focus block today to protect your habit flame.`,
      });
    } else {
      list.push({
        icon: Flame,
        color: "text-amber",
        text: "Consistency is key to academic retention. Complete today's focus session to ignite a new streak!",
      });
    }

    return list;
  }, [sessions, topGradePlan, currentStreak, totalHours]);

  return (
    <div className="dash-card-24 dash-insight-card">
      <div className="dash-insight-header">
        <Sparkles size={16} className="text-primary" />
        <span>Academic Insights</span>
      </div>

      <div className="flex flex-col gap-2.5 mt-2">
        {insights.map((ins, i) => {
          const IconComp = ins.icon;
          return (
            <div key={i} className="flex items-start gap-2.5">
              <IconComp
                size={15}
                className={`${ins.color} flex-shrink-0 mt-0.5`}
              />
              <p className="dash-insight-copy text-xs">{ins.text}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
