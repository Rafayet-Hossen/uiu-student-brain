import { useState } from "react";
import {
  Bookmark,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  ExternalLink,
  FileText,
  HelpCircle,
  MessageSquare,
  MoreHorizontal,
  Send,
  Share2,
  Sparkles,
  ThumbsUp,
  Trash2,
  Users,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Badge from "../../../components/Badge";
import Button from "../../../components/Button";
import Card from "../../../components/Card";
import Spinner from "../../../components/Spinner";
import { formatRichContent } from "../../../lib/markdownHelper";
import ScholarAvatar from "../../auth/components/ScholarAvatar";
import { useAuth } from "../../auth/useAuth";
import {
  createComment,
  deleteComment,
  deletePost,
  extractCommunityErrorMessage,
  getComments,
  togglePostReaction,
} from "../api";

const CATEGORY_CONFIG = {
  "Exam Prep": { icon: Zap, variant: "accent", label: "Exam Prep" },
  "Course Help": { icon: HelpCircle, variant: "primary", label: "Course Help" },
  "Study Group": { icon: Users, variant: "success", label: "Study Group" },
  Resources: { icon: FileText, variant: "default", label: "Resources" },
  General: { icon: MessageSquare, variant: "default", label: "General Discussion" },
};

export default function PostCard({ post, onDeleted }) {
  const { user } = useAuth();
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [isLiked, setIsLiked] = useState(Boolean(post.is_liked || post.has_reacted));
  const [likeLoading, setLikeLoading] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

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
      setIsLiked(res.liked ?? res.has_reacted ?? !isLiked);
      setLikesCount(res.likes_count ?? res.reactions_count ?? (isLiked ? likesCount - 1 : likesCount + 1));
    } catch (err) {
      console.error("Error toggling upvote:", err);
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
      console.error("Error deleting reply:", err);
    }
  }

  async function handleDeletePost() {
    if (!window.confirm("Remove this discussion thread from the community?")) {
      return;
    }
    try {
      await deletePost(post.id);
      if (onDeleted) {
        onDeleted(post.id);
      }
    } catch (err) {
      console.error("Error deleting post:", err);
    }
  }

  function handleCopyPostLink() {
    const url = `${window.location.origin}/community#post-${post.id}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
    setShowMenu(false);
  }

  const formattedDate = new Date(post.created_at).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const catConfig = CATEGORY_CONFIG[post.category] || {
    icon: MessageSquare,
    variant: "default",
    label: post.category || "Discussion",
  };
  const CatIcon = catConfig.icon;

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      style={{ marginBottom: "20px" }}
      id={`post-${post.id}`}
    >
      <Card className="premium-social-post-card">
        {/* Top Header Row */}
        <div className="social-post-header">
          <div className="social-post-author-row">
            <div className="author-avatar-container">
              <ScholarAvatar user={post.author} size={48} />
              <div className="author-online-indicator" />
            </div>

            <div className="author-text-meta">
              <div className="author-name-line">
                <strong className="author-name">
                  {post.author?.full_name || post.author?.email?.split("@")[0] || "Scholar"}
                </strong>
                <span className="scholar-verified-badge" title="Verified University Scholar">
                  ✓
                </span>
                {post.author?.department && (
                  <span className="author-dept-chip">
                    {post.author.department}
                  </span>
                )}
              </div>

              <div className="author-sub-line">
                <Clock size={12} className="text-muted" />
                <span>{formattedDate}</span>
              </div>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="social-header-right">
            <Badge variant={catConfig.variant} size="sm">
              <CatIcon size={12} />
              <span>{catConfig.label}</span>
            </Badge>

            <div style={{ position: "relative" }}>
              <button
                type="button"
                className="social-options-btn"
                onClick={() => setShowMenu(!showMenu)}
                title="Options"
              >
                <MoreHorizontal size={16} />
              </button>

              {showMenu && (
                <div className="social-options-dropdown">
                  <button
                    type="button"
                    className="dropdown-item-btn"
                    onClick={handleCopyPostLink}
                  >
                    {copiedLink ? <Check size={14} className="text-emerald" /> : <Copy size={14} />}
                    <span>{copiedLink ? "Link Copied" : "Copy Link"}</span>
                  </button>

                  <button
                    type="button"
                    className="dropdown-item-btn"
                    onClick={() => {
                      setIsBookmarked(!isBookmarked);
                      setShowMenu(false);
                    }}
                  >
                    <Bookmark
                      size={14}
                      className={isBookmarked ? "text-amber fill-amber" : ""}
                    />
                    <span>{isBookmarked ? "Saved in Bookmarks" : "Bookmark Thread"}</span>
                  </button>

                  {isAuthor && (
                    <button
                      type="button"
                      className="dropdown-item-btn text-danger"
                      onClick={handleDeletePost}
                    >
                      <Trash2 size={14} />
                      <span>Delete Discussion</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Middle Content */}
        <div className="social-post-body">
          {post.title && (
            <h3 className="social-post-title">{post.title}</h3>
          )}

          <div className="social-post-markdown-content">
            {formatRichContent(post.content)}
          </div>
        </div>

        {/* Bottom Interactive Action Bar */}
        <div className="social-post-footer">
          <div className="social-action-buttons">
            <motion.button
              type="button"
              whileTap={{ scale: 0.9 }}
              className={`social-action-pill ${isLiked ? "pill-upvoted" : ""}`}
              onClick={handleToggleReaction}
              disabled={likeLoading}
            >
              <motion.div
                animate={isLiked ? { scale: [1, 1.35, 1] } : { scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                <ThumbsUp
                  size={15}
                  className={isLiked ? "text-primary fill-primary" : ""}
                />
              </motion.div>
              <span>{isLiked ? "Upvoted" : "Upvote"}</span>
              <span className="pill-count-badge">{likesCount}</span>
            </motion.button>

            <motion.button
              type="button"
              whileTap={{ scale: 0.92 }}
              className={`social-action-pill ${showComments ? "pill-active-drawer" : ""}`}
              onClick={handleToggleComments}
            >
              <MessageSquare size={15} />
              <span>Discussion</span>
              <span className="pill-count-badge">{commentsCount}</span>
              {showComments ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </motion.button>

            <button
              type="button"
              className="social-action-pill desktop-only"
              onClick={handleCopyPostLink}
              title="Share Link"
            >
              <Share2 size={14} />
              <span>Share</span>
            </button>

            <button
              type="button"
              className={`social-action-pill ${isBookmarked ? "pill-bookmarked" : ""}`}
              onClick={() => setIsBookmarked(!isBookmarked)}
              title="Bookmark"
            >
              <Bookmark
                size={14}
                className={isBookmarked ? "text-amber fill-amber" : ""}
              />
            </button>
          </div>
        </div>

        {/* Expandable Threaded Discussion Drawer */}
        <AnimatePresence>
          {showComments && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="threaded-comments-drawer"
            >
              {/* Reply Composer */}
              <form onSubmit={handleAddComment} className="threaded-composer-box">
                <ScholarAvatar user={user} size={36} />
                <div className="threaded-composer-input-row">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Contribute a helpful reply, insight, or solution..."
                    className="form-input-control threaded-input"
                    disabled={commentSubmitting}
                  />
                  <Button
                    type="submit"
                    size="sm"
                    variant="primary"
                    disabled={commentSubmitting || !newComment.trim()}
                    icon={Send}
                  >
                    Reply
                  </Button>
                </div>
              </form>

              {commentError && (
                <div className="comment-error-alert">{commentError}</div>
              )}

              {/* Nested Comments Stream */}
              <div className="threaded-comments-stream">
                {commentsLoading ? (
                  <div style={{ padding: "16px", textAlign: "center" }}>
                    <Spinner size="sm" standalone />
                  </div>
                ) : comments.length === 0 ? (
                  <div className="threaded-empty-state">
                    <MessageSquare size={20} className="text-muted" />
                    <span>No replies yet. Be the first scholar to contribute!</span>
                  </div>
                ) : (
                  comments.map((comment) => {
                    const isCommentAuthor = user?.id === comment.author?.id;
                    const commentDate = new Date(comment.created_at).toLocaleDateString(
                      undefined,
                      { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" },
                    );
                    return (
                      <div key={comment.id} className="threaded-comment-node">
                        {/* Colored reply line */}
                        <div className="thread-line" />

                        <div className="thread-avatar-col">
                          <ScholarAvatar user={comment.author} size={32} />
                        </div>

                        <div className="thread-bubble-content">
                          <div className="thread-bubble-header">
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <strong className="thread-author-name">
                                {comment.author?.full_name || comment.author?.email?.split("@")[0] || "Scholar"}
                              </strong>
                              {comment.author?.department && (
                                <span className="thread-dept-badge">
                                  {comment.author.department}
                                </span>
                              )}
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <span className="thread-timestamp">{commentDate}</span>
                              {isCommentAuthor && (
                                <button
                                  type="button"
                                  className="thread-delete-btn"
                                  onClick={() => handleDeleteComment(comment.id)}
                                  title="Delete Reply"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="thread-comment-body">
                            {formatRichContent(comment.content)}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}
