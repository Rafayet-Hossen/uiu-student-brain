import { useState } from "react";
import { Check, GraduationCap, Plus, UserCheck, UserPlus, Users } from "lucide-react";
import { motion } from "framer-motion";
import Badge from "../../../components/Badge";
import Button from "../../../components/Button";
import Card from "../../../components/Card";
import ScholarAvatar from "../../auth/components/ScholarAvatar";
import { toggleFollowStudent } from "../api";

export default function StudentCard({ student }) {
  const [isFollowing, setIsFollowing] = useState(Boolean(student.is_following));
  const [followersCount, setFollowersCount] = useState(
    student.followers_count || 0,
  );
  const [loading, setLoading] = useState(false);

  async function handleToggleFollow() {
    if (loading) return;
    setLoading(true);
    try {
      const res = await toggleFollowStudent(student.id);
      setIsFollowing(res.following);
      setFollowersCount(res.followers_count);
    } catch (err) {
      console.error("Error toggling follow:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.18 }}
      style={{ height: "100%" }}
    >
      <Card className="student-profile-vertical-card">
        {/* Top Avatar & Name */}
        <div className="student-card-top">
          <div className="student-avatar-wrap">
            <ScholarAvatar user={student} size={54} />
          </div>

          <h3 className="student-name">
            {student.full_name || student.email?.split("@")[0] || "Peer Scholar"}
          </h3>

          <span className="student-email-sub">{student.email}</span>

          {student.department ? (
            <span className="student-dept-pill">
              <GraduationCap size={12} />
              <span>{student.department}</span>
            </span>
          ) : (
            <span className="student-dept-pill text-muted">
              <span>University Scholar</span>
            </span>
          )}
        </div>

        {/* Stats Row */}
        <div className="student-stats-row">
          <div className="student-stat-col">
            <strong className="student-stat-num">{followersCount}</strong>
            <span className="student-stat-lbl">Followers</span>
          </div>
          <div className="student-stat-divider" />
          <div className="student-stat-col">
            <strong className="student-stat-num">{student.following_count || 0}</strong>
            <span className="student-stat-lbl">Following</span>
          </div>
        </div>

        {/* Action Button */}
        <div className="student-card-action">
          <Button
            variant={isFollowing ? "secondary" : "primary"}
            size="sm"
            onClick={handleToggleFollow}
            disabled={loading}
            icon={isFollowing ? UserCheck : UserPlus}
            style={{ width: "100%", justifyContent: "center" }}
          >
            {isFollowing ? "Following" : "Follow"}
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}
