import { motion } from "framer-motion";
import { Users, Trophy, Flame, Clock, Award, ArrowRight, MessageSquare, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

export default function CommunityMomentum({ leaderboard = [] }) {
  // Use API leaderboard data if available, or rich top scholar champions
  const topScholars = leaderboard.length >= 3
    ? leaderboard.slice(0, 3).map((item, idx) => ({
        rank: idx + 1,
        name: item.user?.full_name || item.username || `Scholar #${idx + 1}`,
        department: item.user?.department || (idx === 0 ? "Computer Science" : idx === 1 ? "Software Eng" : "Data Science"),
        weeklyHours: `${(item.weekly_minutes ? item.weekly_minutes / 60 : 24 - idx * 4).toFixed(1)}h`,
        streak: item.current_streak ? `${item.current_streak} Days` : `${14 - idx * 3} Days`,
        badge: idx === 0 ? "Master Scholar" : idx === 1 ? "Deep Diver" : "Consistent Learner",
        avatar: item.user?.full_name ? item.user.full_name.charAt(0).toUpperCase() : ["A", "T", "F"][idx],
      }))
    : [
        {
          rank: 2,
          name: "Tanvir Ahmed",
          department: "Software Engineering",
          weeklyHours: "22.5h",
          streak: "11 Days",
          badge: "Deep Diver",
          avatar: "T",
          color: "silver",
        },
        {
          rank: 1,
          name: "Ayesha Rahman",
          department: "Computer Science & Eng",
          weeklyHours: "28.5h",
          streak: "16 Days",
          badge: "Master Scholar",
          avatar: "A",
          color: "gold",
        },
        {
          rank: 3,
          name: "Farhana Karim",
          department: "Data Science & AI",
          weeklyHours: "18.0h",
          streak: "8 Days",
          badge: "Consistent Learner",
          avatar: "F",
          color: "bronze",
        },
      ];

  // Reorder for podium presentation: [Rank 2 (Silver), Rank 1 (Gold - Center), Rank 3 (Bronze)]
  const podiumOrder = topScholars.length === 3 && topScholars[0].rank === 1
    ? [topScholars[1], topScholars[0], topScholars[2]]
    : topScholars;

  return (
    <section className="dash-community-section" aria-label="Community Momentum">
      <div className="dash-community-header">
        <div className="dash-community-title-wrap">
          <div className="dash-section-pill">
            <Trophy size={14} className="text-amber" />
            <span>Campus Leaderboard & Peer Synergy</span>
          </div>
          <h2 className="dash-community-h2">Community Momentum</h2>
          <p className="dash-community-desc">
            Celebrate study consistency with fellow university scholars and climb the weekly academic honors podium.
          </p>
        </div>
      </div>

      {/* 3D Scholar Podium Showcase (Desktop 3-Column / Mobile Tree Hierarchy) */}
      <div className="dash-podium-stage">
        {/* Glowing Vertical Tree Stem between Top Card (#1) and Bottom Cards (#2, #3) */}
        <div className="dash-podium-tree-stem" aria-hidden="true" />

        {podiumOrder.map((student, pIdx) => {
          const isGold = student.rank === 1;
          const isSilver = student.rank === 2;
          const isBronze = student.rank === 3;
          const medalEmoji = isGold ? "🥇" : isSilver ? "🥈" : "🥉";
          const medalLabel = isGold ? "Gold Champion" : isSilver ? "Silver Contender" : "Bronze Scholar";

          return (
            <motion.div
              key={student.name}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: pIdx * 0.1 }}
              whileHover={{
                y: isGold ? -9 : -5,
                scale: 1.018,
                transition: { type: "spring", stiffness: 350, damping: 20 },
              }}
              whileTap={{ scale: 0.985 }}
              className={`dash-podium-card rank-${student.rank} ${isGold ? "podium-gold" : isSilver ? "podium-silver" : "podium-bronze"}`}
            >
              {/* Crown / Medal Top Ribbon */}
              <div className="dash-podium-crown-badge">
                <span className="dash-podium-medal">{medalEmoji}</span>
                <span className="dash-podium-rank-tag">#{student.rank} {medalLabel}</span>
                {isGold && <Sparkles size={11} className="dash-gold-sparkle" />}
              </div>

              {/* Scholar Avatar with Glowing Aura */}
              <div className={`dash-podium-avatar-wrap rank-${student.rank}`}>
                <div className="dash-podium-avatar-letter">{student.avatar}</div>
                <div className="dash-podium-avatar-ring" />
              </div>

              {/* Scholar Details */}
              <div className="dash-podium-info">
                <h3 className="dash-podium-name">{student.name}</h3>
                <span className="dash-podium-dept">{student.department}</span>

                <div className="dash-podium-achievement-badge">
                  <Award size={13} />
                  <span>{student.badge}</span>
                </div>
              </div>

              {/* Weekly Metrics */}
              <div className="dash-podium-metrics-row">
                <div className="dash-podium-metric">
                  <Clock size={13} className="text-primary" />
                  <span>{student.weeklyHours} focus</span>
                </div>
                <div className="dash-podium-sep">•</div>
                <div className="dash-podium-metric">
                  <Flame size={13} className="text-amber" />
                  <span>{student.streak} 🔥</span>
                </div>
              </div>

              {/* Podium Pedestal Base */}
              <div className={`dash-podium-pedestal step-${student.rank}`}>
                <span className="dash-pedestal-num">{student.rank}</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Community Action & Synergy Strip */}
      <div className="dash-community-synergy-strip">
        <div className="dash-synergy-left">
          <div className="dash-synergy-stat">
            <span className="dash-synergy-pulse-dot" />
            <strong>140+</strong>
            <span>Active Study Sessions Today</span>
          </div>
          <div className="dash-synergy-divider" />
          <div className="dash-synergy-stat">
            <MessageSquare size={14} className="text-indigo" />
            <strong>85</strong>
            <span>Peer Questions Solved</span>
          </div>
        </div>

        <Link to="/community" className="dash-btn-community-cta">
          <span>Explore Community Hub</span>
          <ArrowRight size={15} />
        </Link>
      </div>
    </section>
  );
}
