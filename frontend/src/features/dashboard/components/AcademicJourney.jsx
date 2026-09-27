import { motion } from "framer-motion";
import { Clock, Flame, GraduationCap, BookOpen, ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

export default function AcademicJourney({
  user,
  totalHours = "0.0",
  sessionsCount = 0,
  currentStreak = 0,
  topGradePlan,
  materialsCount = 0,
  totalExtractedTopics = 0,
}) {
  const targetGpa =
    topGradePlan && Number(topGradePlan.target_gpa) > 0
      ? Number(topGradePlan.target_gpa).toFixed(2)
      : user?.target_gpa && Number(user.target_gpa) > 0
        ? Number(user.target_gpa).toFixed(2)
        : "4.00";

  const currentGpa =
    topGradePlan && Number(topGradePlan.current_gpa) > 0
      ? Number(topGradePlan.current_gpa).toFixed(2)
      : user?.current_gpa !== null && user?.current_gpa !== undefined
        ? Number(user.current_gpa).toFixed(2)
        : "0.00";

  const completedCredits =
    topGradePlan && Number(topGradePlan.completed_credits) >= 0
      ? Number(topGradePlan.completed_credits)
      : Number(user?.completed_credits) || 0;

  const totalCredits =
    topGradePlan && Number(topGradePlan.total_credits) > 0
      ? Number(topGradePlan.total_credits)
      : Number(user?.total_credits) || 140;

  const milestones = [
    {
      id: "study-time",
      title: "Deep Focus Time",
      stat: `${totalHours} hrs`,
      sub: `${sessionsCount} logged sessions`,
      badge: "Study Velocity",
      icon: Clock,
      color: "orange",
      link: "/study-center?tab=tracker",
    },
    {
      id: "streak",
      title: "Habit Momentum",
      stat: `${currentStreak} Days`,
      sub: currentStreak > 0 ? "Unbroken consistency" : "Ready to ignite streak",
      badge: "Scholar Habit",
      icon: Flame,
      color: "amber",
      link: "/study-center",
    },
    {
      id: "gpa",
      title: "Degree Honors",
      stat: `${targetGpa} GPA`,
      sub: `${completedCredits} / ${totalCredits} cr • ${currentGpa} GPA`,
      badge: user?.current_trimester || "Honors Target",
      icon: GraduationCap,
      color: "emerald",
      link: "/grades",
    },
    {
      id: "knowledge",
      title: "Knowledge Vault",
      stat: `${materialsCount} Docs`,
      sub: `${totalExtractedTopics} AI Syllabus topics`,
      badge: "AI Indexed",
      icon: BookOpen,
      color: "rose",
      link: "/materials",
    },
  ];

  return (
    <section className="dash-journey-section" aria-label="Academic Journey">
      <div className="dash-journey-header">
        <div className="dash-journey-title-wrap">
          <div className="dash-section-pill">
            <Sparkles size={14} className="text-primary" />
            <span>Milestone Highway</span>
          </div>
          <h2 className="dash-journey-h2">Your Academic Journey</h2>
          <p className="dash-journey-desc">
            Continuous progress flow connecting your daily focus to degree honors and AI mastery.
          </p>
        </div>
      </div>

      {/* Interconnected Milestone Highway Track */}
      <div className="dash-journey-track">
        {milestones.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={item.id} className="dash-journey-step-wrapper">
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.08 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className={`dash-journey-card dash-journey-${item.color}`}
              >
                {/* Glowing decorative top accent bar */}
                <div className={`dash-journey-accent-bar ${item.color}`} />

                <div className="dash-journey-card-top">
                  <div className={`dash-journey-icon-wrap ${item.color}`}>
                    <Icon size={20} />
                  </div>
                  <span className={`dash-journey-badge ${item.color}`}>{item.badge}</span>
                </div>

                <div className="dash-journey-card-content">
                  <div className="dash-journey-step-row">
                    <span className={`dash-journey-step-dot ${item.color}`} />
                    <span className="dash-journey-card-step-num">Checkpoint 0{idx + 1}</span>
                  </div>
                  <h3 className="dash-journey-card-stat">{item.stat}</h3>
                  <strong className="dash-journey-card-title">{item.title}</strong>
                  <p className="dash-journey-card-sub">{item.sub}</p>
                </div>

                <Link to={item.link} className="dash-journey-card-link">
                  <span>Explore module</span>
                  <ArrowRight size={13} className="dash-journey-link-arrow" />
                </Link>
              </motion.div>

              {/* Connecting laser line between checkpoints (except last) */}
              {idx < milestones.length - 1 && (
                <div className="dash-journey-connector" aria-hidden="true">
                  <div className="dash-journey-connector-line" />
                  <div className="dash-journey-connector-node">
                    <ArrowRight size={10} className="dash-journey-connector-icon" />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
