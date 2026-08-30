import { useState } from "react";
import Button from "../../../components/Button";
import Card from "../../../components/Card";
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

  const getInitials = (name) => {
    if (!name) return "S";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card
      className="student-profile-card"
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: "14px",
          alignItems: "center",
          marginBottom: "16px",
        }}
      >
        <div
          className="user-avatar"
          style={{ width: "46px", height: "46px", fontSize: "1.125rem" }}
        >
          {getInitials(student.full_name)}
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: "1.0625rem" }}>
            {student.full_name || "Peer Scholar"}
          </h3>
          <span
            style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}
          >
            {student.email}
          </span>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-around",
          padding: "10px 0",
          borderTop: "1px solid var(--color-border)",
          borderBottom: "1px solid var(--color-border)",
          margin: "8px 0 16px 0",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <span
            style={{ display: "block", fontWeight: 700, fontSize: "1.125rem" }}
          >
            {followersCount}
          </span>
          <span
            style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}
          >
            Followers
          </span>
        </div>

        <div style={{ textAlign: "center" }}>
          <span
            style={{ display: "block", fontWeight: 700, fontSize: "1.125rem" }}
          >
            {student.following_count || 0}
          </span>
          <span
            style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}
          >
            Following
          </span>
        </div>
      </div>

      <Button
        variant={isFollowing ? "secondary" : "primary"}
        onClick={handleToggleFollow}
        disabled={loading}
        className="btn-block"
      >
        {isFollowing ? "✓ Following" : "+ Follow Scholar"}
      </Button>
    </Card>
  );
}
