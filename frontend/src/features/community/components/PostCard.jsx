import { useState } from "react";
import Badge from "../../../components/Badge";
import Button from "../../../components/Button";
import Card from "../../../components/Card";
import Spinner from "../../../components/Spinner";
import {
  createComment,
  deleteComment,
  deletePost,
  extractCommunityErrorMessage,
  getComments,
  togglePostReaction,
} from "../api";
import { useAuth } from "../../auth/useAuth";

export default function PostCard({ post, onDeleted }) {
  const { user } = useAuth();
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [isLiked, setIsLiked] = useState(Boolean(post.is_liked));
  const [likeLoading, setLikeLoading] = useState(false);

  // Comments state
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentsCount, setCommentsCount] = useState(post.comments_count || 0);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [commentError, setCommentError] = useState("");

  const isAuthor = user?.id === post.author?.id;

  async function handleToggleReaction() {
    if (likeLoading) return;
    setLikeLoading(true);
    try {
      const res = await togglePostReaction(post.id);
      setIsLiked(res.liked);
      setLikesCount(res.likes_count);
    } catch (err) {
      console.error("Error liking post:", err);
    } finally {
      setLikeLoading(false);
    }
  }

  async function handleToggleComments() {
    if (!showComments && comments.length === 0) {
      setCommentsLoading(true);
      try {
        const data = await getComments(post.id);
        setComments(data);
      } catch (err) {
        console.error("Error fetching comments:", err);
      } finally {
        setCommentsLoading(false);
      }
    }
    setShowComments((prev) => !prev);
  }

  async function handleAddComment(e) {
    e.preventDefault();
    if (!newComment.trim()) return;

    setCommentSubmitting(true);
    setCommentError("");
    try {
      const created = await createComment(post.id, {
        content: newComment.trim(),
      });
      setComments((prev) => [...prev, created]);
      setCommentsCount((prev) => prev + 1);
      setNewComment("");
    } catch (err) {
      setCommentError(extractCommunityErrorMessage(err));
    } finally {
      setCommentSubmitting(false);
    }
  }

  async function handleDeleteComment(commentId) {
    try {
      await deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      setCommentsCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Error deleting comment:", err);
    }
  }

  async function handleDeletePost() {
    if (
      !window.confirm("Are you sure you want to delete this discussion post?")
    )
      return;
    try {
      await deletePost(post.id);
      onDeleted(post.id);
    } catch (err) {
      console.error("Error deleting post:", err);
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

  const formattedDate = new Date(post.created_at).toLocaleDateString(
    undefined,
    {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  );

  return (
    <Card className="community-post-card" style={{ marginBottom: "20px" }}>
      {/* Post Header */}
      <div
        className="post-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <div
            className="user-avatar"
            style={{ width: "38px", height: "38px", fontSize: "0.875rem" }}
          >
            {getInitials(post.author?.full_name)}
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: "0.9375rem", fontWeight: 600 }}>
              {post.author?.full_name || post.author?.email || "Scholar"}
            </h4>
            <span
              style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}
            >
              {formattedDate}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Badge variant="accent">{post.category}</Badge>
          {isAuthor && (
            <Button size="sm" variant="danger" onClick={handleDeletePost}>
              🗑️
            </Button>
          )}
        </div>
      </div>

      {/* Post Body */}
      <div style={{ marginTop: "14px", marginBottom: "16px" }}>
        <h3
          style={{
            margin: "0 0 8px 0",
            fontSize: "1.125rem",
            color: "var(--color-text)",
          }}
        >
          {post.title}
        </h3>
        <p
          style={{
            margin: 0,
            color: "var(--color-text)",
            lineHeight: 1.6,
            whiteSpace: "pre-wrap",
          }}
        >
          {post.content}
        </p>
      </div>

      {/* Action Footer */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          borderTop: "1px solid var(--color-border)",
          paddingTop: "12px",
        }}
      >
        <Button
          size="sm"
          variant={isLiked ? "primary" : "secondary"}
          onClick={handleToggleReaction}
          disabled={likeLoading}
        >
          <span>{isLiked ? "👍 Upvoted" : "👍 Upvote"}</span>
          <span style={{ marginLeft: "4px", fontWeight: 700 }}>
            ({likesCount})
          </span>
        </Button>

        <Button size="sm" variant="secondary" onClick={handleToggleComments}>
          <span>💬 Discussion ({commentsCount})</span>
        </Button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div
          style={{
            marginTop: "16px",
            paddingTop: "16px",
            borderTop: "1px dashed var(--color-border)",
          }}
        >
          <h4
            style={{
              fontSize: "0.875rem",
              color: "var(--color-text-muted)",
              marginBottom: "12px",
            }}
          >
            Replies & Solutions
          </h4>

          {commentsLoading ? (
            <Spinner />
          ) : comments.length === 0 ? (
            <p
              style={{
                fontSize: "0.875rem",
                color: "var(--color-text-muted)",
                margin: "8px 0",
              }}
            >
              No replies yet. Be the first to share an answer!
            </p>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                marginBottom: "16px",
              }}
            >
              {comments.map((comment) => {
                const isCommentAuthor = user?.id === comment.author?.id;
                return (
                  <div
                    key={comment.id}
                    style={{
                      background: "var(--color-surface-subtle)",
                      padding: "10px 14px",
                      borderRadius: "var(--radius-md)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          marginBottom: "4px",
                        }}
                      >
                        <span
                          style={{ fontWeight: 600, fontSize: "0.8125rem" }}
                        >
                          {comment.author?.full_name || comment.author?.email}
                        </span>
                        <span
                          style={{
                            fontSize: "0.75rem",
                            color: "var(--color-text-muted)",
                          }}
                        >
                          {new Date(comment.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "0.875rem",
                          color: "var(--color-text)",
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {comment.content}
                      </p>
                    </div>

                    {isCommentAuthor && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleDeleteComment(comment.id)}
                        style={{ padding: "2px 6px", fontSize: "0.75rem" }}
                      >
                        ✕
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* New Comment Input */}
          <form
            onSubmit={handleAddComment}
            style={{ display: "flex", gap: "8px", marginTop: "12px" }}
          >
            <input
              type="text"
              className="form-input"
              placeholder="Write a helpful reply..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              style={{
                flex: 1,
                padding: "8px 12px",
                borderRadius: "var(--radius-md)",
              }}
              required
            />
            <Button size="sm" type="submit" disabled={commentSubmitting}>
              {commentSubmitting ? "Posting..." : "Reply"}
            </Button>
          </form>
          {commentError && (
            <p
              style={{
                color: "var(--color-rose)",
                fontSize: "0.8125rem",
                marginTop: "6px",
              }}
            >
              {commentError}
            </p>
          )}
        </div>
      )}
    </Card>
  );
}
