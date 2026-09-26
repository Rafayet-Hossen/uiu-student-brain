import { motion } from "framer-motion";
import { Users, Trophy, Flame, Clock, Award, ArrowRight, MessageSquare, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

export default function CommunityMomentum({
  leaderboard = [],
  communityStats = null,
}) {
  const rankings = Array.isArray(leaderboard)
    ? leaderboard
    : leaderboard?.rankings || [];

  // Map real opted-in leaderboard scholars without fake fallback names
  const topScholars = rankings.slice(0, 3).map((item, idx) => {
    const rawHours =
      item.study_hours != null
        ? Number(item.study_hours)
        : item.weekly_minutes != null
          ? Number(item.weekly_minutes) / 60
          : 0;

    return {
      rank: item.rank || idx + 1,
      name:
        item.display_name ||
        item.full_name ||
        item.user?.full_name ||
        item.username ||
        `Scholar #${idx + 1}`,
      department:
        item.user?.department ||
        item.department ||
        "Academic Scholar",
      weeklyHours: `${rawHours.toFixed(1)}h`,
      streak: item.current_streak ? `${item.current_streak} Days` : "0 Days",
      badge:
        (item.rank || idx + 1) === 1
          ? "Master Scholar"
          : (item.rank || idx + 1) === 2
            ? "Deep Diver"
            : "Consistent Learner",
      avatar: (
        item.display_name ||
        item.full_name ||
        item.user?.full_name ||
        item.username ||
        "S"
      )
        .charAt(0)
        .toUpperCase(),
    };
  });

  // Reorder for podium presentation: [Rank 2 (Silver), Rank 1 (Gold - Center), Rank 3 (Bronze)]
  const podiumOrder =
    topScholars.length === 3 && topScholars[0].rank === 1
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
      <div
        className={`dash-podium-stage ${
          topScholars.length > 0 && topScholars.length < 3
            ? "flex justify-center flex-wrap"
            : ""
        }`}
      >
        {/* Glowing Vertical Tree Stem between Top Card (#1) and Bottom Cards (#2, #3) */}
        {topScholars.length >= 3 && (
          <div className="dash-podium-tree-stem" aria-hidden="true" />
        )}

        {topScholars.length === 0 ? (
          <div className="dash-podium-empty-box">
            <div className="dash-podium-empty-icon-wrap">
              <Trophy size={34} className="text-amber" />
            </div>
            <h3 className="dash-podium-empty-title">
              Weekly Honors Podium is Open!
            </h3>
            <p className="dash-podium-empty-desc">
              No scholars have logged focus hours on the public leaderboard this week yet.
              Opt in and complete focus sessions in Study Tracker to claim the #1 Gold spot!
            </p>
            <div className="dash-podium-empty-actions">
              <Link to="/community" className="dash-btn-community-cta">
                <span>View Community & Opt In</span>
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        ) : (
          podiumOrder.map((student, pIdx) => {
            const isGold = student.rank === 1;
            const isSilver = student.rank === 2;
            const isBronze = student.rank === 3;
            const medalEmoji = isGold ? "🥇" : isSilver ? "🥈" : "🥉";
            const medalLabel = isGold
              ? "Gold Champion"
              : isSilver
                ? "Silver Contender"
                : "Bronze Scholar";

            return (
              <motion.div
                key={student.name}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: pIdx * 0.12 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className={`dash-podium-card rank-${student.rank} ${
                  isGold
                    ? "podium-gold"
                    : isSilver
                      ? "podium-silver"
                      : "podium-bronze"
                }`}
              >
                {/* Crown / Medal Top Ribbon */}
                <div className="dash-podium-crown-badge">
                  <span className="dash-podium-medal">{medalEmoji}</span>
                  <span className="dash-podium-rank-tag">
                    #{student.rank} {medalLabel}
                  </span>
                </div>

                {/* Scholar Avatar with Glowing Aura */}
                <div
                  className={`dash-podium-avatar-wrap rank-${student.rank}`}
                >
                  <div className="dash-podium-avatar-letter">
                    {student.avatar}
                  </div>
                  <div className="dash-podium-avatar-ring" />
                </div>

                {/* Scholar Details */}
                <div className="dash-podium-info">
                  <h3 className="dash-podium-name">{student.name}</h3>
                  <span className="dash-podium-dept">
                    {student.department}
                  </span>

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
                <div
                  className={`dash-podium-pedestal step-${student.rank}`}
                >
                  <span className="dash-pedestal-num">{student.rank}</span>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Community Action & Synergy Strip */}
      <div className="dash-community-synergy-strip">
        <div className="dash-synergy-left">
          <div className="dash-synergy-stat">
            <span className="dash-synergy-pulse-dot" />
            <strong>{communityStats?.todaySessionsCount || 0}</strong>
            <span>Study Sessions Logged Today</span>
          </div>
          <div className="dash-synergy-divider" />
          <div className="dash-synergy-stat">
            <MessageSquare size={14} className="text-indigo" />
            <strong>{communityStats?.solvedPosts ?? 0}</strong>
            <span>Peer Questions Solved</span>
          </div>
          <div className="dash-synergy-divider" />
          <div className="dash-synergy-stat">
            <Users size={14} className="text-primary" />
            <strong>
              {communityStats?.totalParticipants || rankings.length}
            </strong>
            <span>Active Campus Scholars</span>
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
