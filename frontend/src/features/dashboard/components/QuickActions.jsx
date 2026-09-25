import { Link } from "react-router-dom";
import {
  Flame,
  UploadCloud,
  GraduationCap,
  Users,
  Sparkles,
} from "lucide-react";

export default function QuickActions() {
  const actions = [
    {
      label: "Start Focus",
      icon: Flame,
      to: "/study-center?tab=tracker",
      color: "text-amber",
      bg: "bg-amber-subtle",
    },
    {
      label: "Upload Notes",
      icon: UploadCloud,
      to: "/materials",
      color: "text-primary",
      bg: "bg-indigo-subtle",
    },
    {
      label: "GPA Planner",
      icon: GraduationCap,
      to: "/grades",
      color: "text-emerald",
      bg: "bg-emerald-subtle",
    },
    {
      label: "Community",
      icon: Users,
      to: "/community",
      color: "text-indigo",
      bg: "bg-indigo-subtle",
    },
    {
      label: "AI Notes",
      icon: Sparkles,
      to: "/study-center?tab=materials",
      color: "text-rose",
      bg: "bg-rose-subtle",
    },
  ];

  return (
    <div className="dash-quick-actions-bar" aria-label="Quick Actions">
      {actions.map((act, idx) => {
        const IconComponent = act.icon;
        return (
          <Link key={idx} to={act.to} className="dash-quick-btn">
            <span className={`icon-box ${act.bg} ${act.color}`}>
              <IconComponent size={14} />
            </span>
            <span>{act.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
