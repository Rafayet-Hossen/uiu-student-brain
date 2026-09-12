import { useState, useEffect } from "react";
import {
  Bookmark,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Code2,
  Copy,
  Edit3,
  ExternalLink,
  FileText,
  HelpCircle,
  Laptop,
  MessageSquare,
  MoreHorizontal,
  Send,
  Share2,
  Sparkles,
  ThumbsUp,
  Trash2,
  Users,
  X,
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
  markCommentHelpful,
  togglePostReaction,
  updatePost,
} from "../api";

const CATEGORY_CONFIG = {
  "Code Help": { icon: Code2, variant: "primary", label: "Code Help" },
  "Exam Prep": { icon: Zap, variant: "accent", label: "Exam Prep" },
  "Course Help": { icon: HelpCircle, variant: "primary", label: "Course Help" },
  "Study Group": { icon: Users, variant: "success", label: "Study Group" },
  Resources: { icon: FileText, variant: "default", label: "Resources" },
  General: {
    icon: MessageSquare,
    variant: "default",
    label: "General Discussion",
  },
};

const CODE_LANGUAGES = [
  { value: "python", label: "Python" },
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "cpp", label: "C++" },
  { value: "c", label: "C" },
  { value: "java", label: "Java" },
  { value: "csharp", label: "C#" },
  { value: "html", label: "HTML / CSS" },
  { value: "sql", label: "SQL" },
  { value: "php", label: "PHP" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "plaintext", label: "Other" },
];

function formatSafeDate(val) {
  if (!val) return "Recently";
  const d = new Date(val);
  return isNaN(d.getTime())
    ? "Recently"
    : d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
}

export default function PostCard({ post, onDeleted, onUpdated }) {
  if (!post) return null;
  const { user } = useAuth();
  const [currentPost, setCurrentPost] = useState(post);

  useEffect(() => {
    if (!post) return;
    setCurrentPost(post);
    setIsPostSolved(Boolean(post.is_solved));
    setLikesCount(post.likes_count || 0);
    setIsLiked(Boolean(post.is_liked || post.has_reacted));
    setCommentsCount(post.comments_count || 0);
  }, [post]);

  const [likesCount, setLikesCount] = useState(post?.likes_count || 0);
  const [isLiked, setIsLiked] = useState(
    Boolean(post?.is_liked || post?.has_reacted),
  );
  const [likeLoading, setLikeLoading] = useState(false);
  const bookmarkStorageKey = `student_brain_bookmarks_${user?.id || "global"}`;
  const [isBookmarked, setIsBookmarked] = useState(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem(bookmarkStorageKey) || "[]",
      );
      return Array.isArray(saved) && post?.id ? saved.includes(post.id) : false;
    } catch {
      return false;
    }
  });

  function handleToggleBookmark() {
    setIsBookmarked((prev) => {
      const next = !prev;
      try {
        const saved = JSON.parse(
          localStorage.getItem(bookmarkStorageKey) || "[]",
        );
        let updated = Array.isArray(saved) ? saved : [];
        if (next) {
          if (!updated.includes(currentPost.id)) updated.push(currentPost.id);
        } else {
          updated = updated.filter((id) => id !== currentPost.id);
        }
        localStorage.setItem(bookmarkStorageKey, JSON.stringify(updated));
      } catch (e) {
        console.error("Bookmark storage error:", e);
      }
      return next;
    });
  }

  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedCommentCodeId, setCopiedCommentCodeId] = useState(null);
  const [showMenu, setShowMenu] = useState(false);

  // Solved state
  const [isPostSolved, setIsPostSolved] = useState(Boolean(post.is_solved));
  const [solvedCommentId, setSolvedCommentId] = useState(
    post.solved_comment || null,
  );

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(post.title || "");
  const [editContent, setEditContent] = useState(post.content || "");
  const [editCategory, setEditCategory] = useState(post.category || "General");
  const [editHasCode, setEditHasCode] = useState(Boolean(post.code_snippet));
  const [editCodeSnippet, setEditCodeSnippet] = useState(
    post.code_snippet || "",
  );
  const [editCodeLanguage, setEditCodeLanguage] = useState(
    post.code_language || "python",
  );
  const [editLiveShareUrl, setEditLiveShareUrl] = useState(
    post.vscode_liveshare_url || "",
  );
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState("");

  // Comments state
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentsCount, setCommentsCount] = useState(post.comments_count || 0);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [commentError, setCommentError] = useState("");

  // Code solution in comment
  const [isSolutionMode, setIsSolutionMode] = useState(false);
  const [solutionCode, setSolutionCode] = useState("");
  const [solutionLang, setSolutionLang] = useState(
    post.code_language || "python",
  );

  const isAuthor = user?.id === currentPost.author?.id;

  async function handleToggleReaction() {
    if (likeLoading) return;
    setLikeLoading(true);
    try {
      const res = await togglePostReaction(currentPost.id);
      setIsLiked(res.liked ?? res.has_reacted ?? !isLiked);
      setLikesCount(
        res.likes_count ??
          res.reactions_count ??
          (isLiked ? likesCount - 1 : likesCount + 1),
      );
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
        const data = await getComments(currentPost.id);
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
    if (!newComment.trim() && !solutionCode.trim()) return;

    setCommentSubmitting(true);
    setCommentError("");
    try {
      const payload = {
        content:
          newComment.trim() || (solutionCode.trim() ? "Code solution:" : ""),
      };
      if (isSolutionMode && solutionCode.trim()) {
        payload.code_solution = solutionCode.trim();
        payload.code_language = solutionLang;
      }

      const created = await createComment(currentPost.id, payload);
      setComments((prev) => [...prev, created]);
      setCommentsCount((prev) => prev + 1);
      setNewComment("");
      setSolutionCode("");
      setIsSolutionMode(false);
    } catch (err) {
      setCommentError(extractCommunityErrorMessage(err));
    } finally {
      setCommentSubmitting(false);
    }
  }

  async function handleMarkHelpful(commentId) {
    try {
      const res = await markCommentHelpful(commentId);
      setIsPostSolved(Boolean(res.is_solved));
      setSolvedCommentId(res.is_helpful ? commentId : null);
      setComments((prev) =>
        prev.map((c) => ({
          ...c,
          is_helpful: c.id === commentId ? res.is_helpful : false,
        })),
      );
    } catch (err) {
      console.error("Failed to mark comment as helpful:", err);
    }
  }

  function handleCopyCode(code) {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  }

  function handleCopyCommentCode(commentId, code) {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedCommentCodeId(commentId);
    setTimeout(() => setCopiedCommentCodeId(null), 2000);
  }

  async function handleDeleteComment(commentId) {
    try {
      await deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      setCommentsCount((prev) => Math.max(0, prev - 1));
      if (solvedCommentId === commentId) {
        setIsPostSolved(false);
        setSolvedCommentId(null);
      }
    } catch (err) {
      console.error("Error deleting reply:", err);
    }
  }

  async function handleDeletePost() {
    if (!window.confirm("Remove this discussion thread from the community?")) {
      return;
    }
    try {
      await deletePost(currentPost.id);
      if (onDeleted) {
        onDeleted(currentPost.id);
      }
    } catch (err) {
      console.error("Error deleting post:", err);
    }
  }

  async function handleSharePost() {
    setShowMenu(false);
    const postUrl = `${window.location.origin}/community#post-${currentPost.id}`;
    const shareTitle = currentPost.title || "Student Brain Community Post";
    const shareSnippet = currentPost.content
      ? currentPost.content
          .replace(/[#*`_]/g, "")
          .slice(0, 140)
          .trim()
      : "Check out this discussion on Student Brain!";

    // Direct Native Web Share (opens native Windows Share Sheet / mobile sheet)
    if (
      typeof navigator !== "undefined" &&
      typeof navigator.share === "function"
    ) {
      try {
        await navigator.share({
          title: shareTitle,
          text: `${shareTitle} • ${shareSnippet}`,
          url: postUrl,
        });
        return;
      } catch (err) {
        if (err.name !== "AbortError") {
          console.warn("Native share error, falling back to clipboard:", err);
        } else {
          return;
        }
      }
    }

    // Fallback: Copy link with feedback toast
    try {
      await navigator.clipboard.writeText(postUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2200);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  }

  function handleCopyPostLink() {
    return handleSharePost();
  }

  async function handleToggleSolved() {
    setShowMenu(false);
    try {
      const nextSolved = !isPostSolved;
      const res = await updatePost(currentPost.id, { is_solved: nextSolved });
      setIsPostSolved(nextSolved);
      setCurrentPost((prev) => ({ ...prev, is_solved: nextSolved }));
      if (onUpdated) onUpdated(res);
    } catch (err) {
      console.error("Failed to update solved status:", err);
    }
  }

  async function handleSaveEdit(e) {
    if (e) e.preventDefault();
    if (!editContent.trim()) {
      setEditError("Post content cannot be empty.");
      return;
    }
    setEditSubmitting(true);
    setEditError("");
    try {
      const payload = {
        title: editTitle.trim(),
        content: editContent.trim(),
        category: editCategory,
        code_snippet: editHasCode ? editCodeSnippet : "",
        code_language: editHasCode ? editCodeLanguage : "plaintext",
        vscode_liveshare_url: editLiveShareUrl.trim(),
      };
      const updated = await updatePost(currentPost.id, payload);
      setCurrentPost(updated);
      setIsEditing(false);
      if (onUpdated) onUpdated(updated);
    } catch (err) {
      setEditError(extractCommunityErrorMessage(err));
    } finally {
      setEditSubmitting(false);
    }
  }

  function handleCancelEdit() {
    setEditTitle(currentPost.title || "");
    setEditContent(currentPost.content || "");
    setEditCategory(currentPost.category || "General");
    setEditHasCode(Boolean(currentPost.code_snippet));
    setEditCodeSnippet(currentPost.code_snippet || "");
    setEditCodeLanguage(currentPost.code_language || "python");
    setEditLiveShareUrl(currentPost.vscode_liveshare_url || "");
    setEditError("");
    setIsEditing(false);
  }

  const formattedDate = formatSafeDate(currentPost?.created_at);

  const catConfig = CATEGORY_CONFIG[currentPost.category] || {
    icon: MessageSquare,
    variant: "default",
    label: currentPost.category || "Discussion",
  };
  const CatIcon = catConfig.icon;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      style={{ marginBottom: "20px" }}
      id={`post-${currentPost.id}`}
    >
      <Card className="premium-social-post-card">
        {/* Top Header Row */}
        <div className="social-post-header">
          <div className="social-post-author-row">
            <div className="author-avatar-container">
              <ScholarAvatar user={currentPost.author} size={48} />
              <div className="author-online-indicator" />
            </div>

            <div className="author-text-meta">
              <div className="author-name-line">
                <strong className="author-name">
                  {currentPost.author?.full_name ||
                    currentPost.author?.email?.split("@")[0] ||
                    "Scholar"}
                </strong>
                <span
                  className="scholar-verified-badge"
                  title="Verified University Scholar"
                >
                  ✓
                </span>
                {currentPost.author?.department && (
                  <span className="author-dept-chip">
                    {currentPost.author.department}
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
            {isPostSolved && (
              <span className="solved-status-badge">
                <CheckCircle2 size={13} />
                <span>Solved</span>
              </span>
            )}

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
                    onClick={handleSharePost}
                  >
                    {copiedLink ? (
                      <Check size={14} className="text-emerald" />
                    ) : (
                      <Share2 size={14} />
                    )}
                    <span>{copiedLink ? "Link Copied" : "Share (Native)"}</span>
                  </button>

                  <button
                    type="button"
                    className="dropdown-item-btn"
                    onClick={() => {
                      handleToggleBookmark();
                      setShowMenu(false);
                    }}
                  >
                    <Bookmark
                      size={14}
                      fill={isBookmarked ? "currentColor" : "none"}
                      strokeWidth={isBookmarked ? 2.8 : 2}
                      className={isBookmarked ? "text-amber" : ""}
                    />
                    <span>{isBookmarked ? "Bookmarked" : "Bookmark"}</span>
                  </button>

                  {isAuthor && (
                    <>
                      <button
                        type="button"
                        className="dropdown-item-btn"
                        onClick={handleToggleSolved}
                      >
                        <CheckCircle2
                          size={14}
                          className={isPostSolved ? "text-emerald" : ""}
                        />
                        <span>
                          {isPostSolved ? "Mark as Unsolved" : "Mark as Solved"}
                        </span>
                      </button>

                      <button
                        type="button"
                        className="dropdown-item-btn"
                        onClick={() => {
                          setIsEditing(true);
                          setShowMenu(false);
                        }}
                      >
                        <Edit3 size={14} />
                        <span>Edit Post</span>
                      </button>

                      <button
                        type="button"
                        className="dropdown-item-btn text-danger"
                        onClick={handleDeletePost}
                      >
                        <Trash2 size={14} />
                        <span>Delete Discussion</span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Middle Content or Inline Edit Form */}
        {isEditing ? (
          <form onSubmit={handleSaveEdit} className="post-inline-edit-form">
            {editError && (
              <div
                className="form-error-banner"
                style={{ marginBottom: "12px" }}
              >
                {editError}
              </div>
            )}

            <div className="inline-edit-row">
              <div className="inline-edit-field" style={{ flex: 1 }}>
                <label className="inline-edit-label">Title (Optional)</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Thread title / Question..."
                  className="form-input-control"
                />
              </div>

              <div className="inline-edit-field" style={{ width: "160px" }}>
                <label className="inline-edit-label">Category</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="form-input-control"
                >
                  <option value="General">General</option>
                  <option value="Code Help">Code Help</option>
                  <option value="Exam Prep">Exam Prep</option>
                  <option value="Course Help">Course Help</option>
                  <option value="Study Group">Study Group</option>
                  <option value="Resources">Resources</option>
                </select>
              </div>
            </div>

            <div className="inline-edit-field">
              <label className="inline-edit-label">Discussion Content</label>
              <textarea
                rows={4}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="What would you like to discuss or ask?"
                className="form-input-control"
                required
              />
            </div>

            {/* Code Snippet & Live Share Controls */}
            <div className="inline-edit-field">
              <div className="inline-checkbox-label">
                <label
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    cursor: "pointer",
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={editHasCode}
                    onChange={(e) => setEditHasCode(e.target.checked)}
                  />
                  <span>Attach Code Snippet</span>
                </label>
              </div>

              {editHasCode && (
                <div className="inline-code-editor-wrap">
                  <div style={{ marginBottom: "6px" }}>
                    <select
                      value={editCodeLanguage}
                      onChange={(e) => setEditCodeLanguage(e.target.value)}
                      className="form-input-control"
                      style={{
                        width: "auto",
                        display: "inline-block",
                        fontSize: "0.78rem",
                        padding: "4px 8px",
                      }}
                    >
                      {CODE_LANGUAGES.map((lang) => (
                        <option key={lang.value} value={lang.value}>
                          {lang.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <textarea
                    rows={5}
                    value={editCodeSnippet}
                    onChange={(e) => setEditCodeSnippet(e.target.value)}
                    placeholder="Paste code snippet here..."
                    className="form-input-control code-editor-input"
                  />
                </div>
              )}
            </div>

            <div className="inline-edit-field">
              <label className="inline-edit-label">
                VS Code Live Share Link (Optional)
              </label>
              <input
                type="url"
                value={editLiveShareUrl}
                onChange={(e) => setEditLiveShareUrl(e.target.value)}
                placeholder="https://prod.liveshare.vsengsaas.visualstudio.com/join?..."
                className="form-input-control"
              />
            </div>

            <div className="inline-edit-actions">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCancelEdit}
                disabled={editSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={editSubmitting}
              >
                {editSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        ) : (
          <div className="social-post-body">
            {currentPost.title && (
              <h3 className="social-post-title">{currentPost.title}</h3>
            )}

            <div className="social-post-markdown-content">
              {formatRichContent(currentPost.content)}
            </div>

            {/* VS Code Live Share Banner */}
            {currentPost.vscode_liveshare_url && (
              <div className="vscode-liveshare-banner">
                <div className="liveshare-info">
                  <div className="liveshare-pulse-container">
                    <span className="liveshare-pulse-dot" />
                    <strong className="liveshare-title">
                      VS Code Live Share Collaboration
                    </strong>
                  </div>
                  <span className="liveshare-subtitle">
                    Click to join this live peer programming session directly in
                    VS Code
                  </span>
                </div>
                <a
                  href={currentPost.vscode_liveshare_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="liveshare-join-btn"
                >
                  <ExternalLink size={14} />
                  <span>Join in VS Code</span>
                </a>
              </div>
            )}

            {/* Code Snippet Box */}
            {currentPost.code_snippet && (
              <div className="code-snippet-box">
                <div className="code-snippet-header">
                  <div className="code-header-left">
                    <Code2 size={14} className="text-indigo" />
                    <span className="code-lang-tag">
                      {currentPost.code_language || "CODE"}
                    </span>
                    <span className="code-line-counter">
                      {currentPost.code_snippet.split("\n").length} lines
                    </span>
                  </div>
                  <button
                    type="button"
                    className="code-copy-btn"
                    onClick={() => handleCopyCode(currentPost.code_snippet)}
                    title="Copy code snippet"
                  >
                    {copiedCode ? (
                      <Check size={13} className="text-emerald" />
                    ) : (
                      <Copy size={13} />
                    )}
                    <span>{copiedCode ? "Copied" : "Copy Code"}</span>
                  </button>
                </div>
                <pre className="code-snippet-pre">
                  <code>{currentPost.code_snippet}</code>
                </pre>
              </div>
            )}
          </div>
        )}

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
              <span>Discussion & Solutions</span>
              <span className="pill-count-badge">{commentsCount}</span>
              {showComments ? (
                <ChevronUp size={13} />
              ) : (
                <ChevronDown size={13} />
              )}
            </motion.button>

            <button
              type="button"
              className="social-action-pill desktop-only"
              onClick={handleSharePost}
              title="Native Share"
            >
              <Share2 size={14} />
              <span>{copiedLink ? "Copied" : "Share"}</span>
            </button>

            <button
              type="button"
              className={`social-action-pill ${isBookmarked ? "pill-bookmarked" : ""}`}
              onClick={handleToggleBookmark}
              title={isBookmarked ? "Remove Bookmark" : "Save Bookmark"}
            >
              <Bookmark
                size={15}
                fill={isBookmarked ? "currentColor" : "none"}
                strokeWidth={isBookmarked ? 2.8 : 2}
                className={isBookmarked ? "text-amber" : ""}
              />
              <span className="desktop-only">
                {isBookmarked ? "Bookmarked" : "Bookmark"}
              </span>
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
              {/* Reply / Solution Mode Bar */}
              <div className="reply-type-switcher">
                <button
                  type="button"
                  className={`reply-type-pill ${!isSolutionMode ? "is-active" : ""}`}
                  onClick={() => setIsSolutionMode(false)}
                >
                  <MessageSquare size={13} />
                  <span>Discussion Reply</span>
                </button>
                <button
                  type="button"
                  className={`reply-type-pill ${isSolutionMode ? "is-active" : ""}`}
                  onClick={() => setIsSolutionMode(true)}
                >
                  <Code2 size={13} />
                  <span>Submit Code Solution</span>
                </button>
              </div>

              {/* Reply Composer */}
              <form
                onSubmit={handleAddComment}
                className="threaded-composer-box"
              >
                <ScholarAvatar user={user} size={36} />

                {!isSolutionMode ? (
                  <div className="threaded-composer-input-row">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Contribute a helpful reply, insight, or suggestion..."
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
                ) : (
                  <div className="solution-composer-panel">
                    <div className="solution-composer-header">
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <span style={{ fontSize: "0.8rem", fontWeight: 600 }}>
                          Language:
                        </span>
                        <select
                          value={solutionLang}
                          onChange={(e) => setSolutionLang(e.target.value)}
                          className="form-input"
                          style={{
                            padding: "4px 8px",
                            fontSize: "0.8rem",
                            borderRadius: "var(--radius-sm)",
                          }}
                          disabled={commentSubmitting}
                        >
                          {CODE_LANGUAGES.map((lang) => (
                            <option key={lang.value} value={lang.value}>
                              {lang.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--color-text-muted)",
                        }}
                      >
                        Formatted code solution with syntax styling
                      </span>
                    </div>

                    <textarea
                      value={solutionCode}
                      onChange={(e) => setSolutionCode(e.target.value)}
                      placeholder="// Write or paste your verified solution code here..."
                      rows={5}
                      className="form-input code-textarea"
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: "var(--radius-md)",
                        fontFamily: "monospace",
                        fontSize: "0.85rem",
                        marginTop: "8px",
                        resize: "vertical",
                      }}
                      disabled={commentSubmitting}
                    />

                    <div
                      style={{ display: "flex", gap: "8px", marginTop: "8px" }}
                    >
                      <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Explain your approach, algorithm logic, or complexity..."
                        className="form-input-control threaded-input"
                        disabled={commentSubmitting}
                      />
                      <Button
                        type="submit"
                        size="sm"
                        variant="primary"
                        disabled={
                          commentSubmitting ||
                          (!newComment.trim() && !solutionCode.trim())
                        }
                        icon={Send}
                      >
                        Submit Solution
                      </Button>
                    </div>
                  </div>
                )}
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
                    <span>
                      No replies or solutions yet. Be the first scholar to
                      contribute!
                    </span>
                  </div>
                ) : (
                  comments.map((comment) => {
                    const isCommentAuthor = user?.id === comment.author?.id;
                    const isCommentHelpful =
                      comment.is_helpful || solvedCommentId === comment.id;
                    const commentDate = formatSafeDate(comment?.created_at);

                    return (
                      <div
                        key={comment.id}
                        className={`threaded-comment-node ${isCommentHelpful ? "node-accepted-solution" : ""}`}
                      >
                        {/* Colored reply line */}
                        <div className="thread-line" />

                        <div className="thread-avatar-col">
                          <ScholarAvatar user={comment.author} size={32} />
                        </div>

                        <div
                          className={`thread-bubble-content ${isCommentHelpful ? "bubble-accepted-solution" : ""}`}
                        >
                          {/* Accepted Solution Ribbon */}
                          {isCommentHelpful && (
                            <div className="helpful-solution-ribbon">
                              <CheckCircle2 size={13} />
                              <span>
                                Accepted Solution • Marked Helpful by Author
                              </span>
                            </div>
                          )}

                          <div className="thread-bubble-header">
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                              }}
                            >
                              <strong className="thread-author-name">
                                {comment.author?.full_name ||
                                  comment.author?.email?.split("@")[0] ||
                                  "Scholar"}
                              </strong>
                              {comment.author?.department && (
                                <span className="thread-dept-badge">
                                  {comment.author.department}
                                </span>
                              )}
                            </div>

                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                              }}
                            >
                              <span className="thread-timestamp">
                                {commentDate}
                              </span>

                              {/* Author can mark as helpful if not already marked */}
                              {isAuthor && !isCommentHelpful && (
                                <button
                                  type="button"
                                  className="mark-helpful-btn"
                                  onClick={() => handleMarkHelpful(comment.id)}
                                  title="Mark this answer as helpful / accepted solution"
                                >
                                  <Check size={12} />
                                  <span>Mark Helpful</span>
                                </button>
                              )}

                              {isCommentAuthor && (
                                <button
                                  type="button"
                                  className="thread-delete-btn"
                                  onClick={() =>
                                    handleDeleteComment(comment.id)
                                  }
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

                          {/* Render Code Solution if comment includes code */}
                          {comment.code_solution && (
                            <div className="code-snippet-box solution-snippet-box">
                              <div className="code-snippet-header">
                                <div className="code-header-left">
                                  <Code2 size={13} className="text-emerald" />
                                  <span className="code-lang-tag solution-lang">
                                    {comment.code_language || "CODE"} SOLUTION
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  className="code-copy-btn"
                                  onClick={() =>
                                    handleCopyCommentCode(
                                      comment.id,
                                      comment.code_solution,
                                    )
                                  }
                                  title="Copy solution code"
                                >
                                  {copiedCommentCodeId === comment.id ? (
                                    <Check size={13} className="text-emerald" />
                                  ) : (
                                    <Copy size={13} />
                                  )}
                                  <span>
                                    {copiedCommentCodeId === comment.id
                                      ? "Copied"
                                      : "Copy Solution"}
                                  </span>
                                </button>
                              </div>
                              <pre className="code-snippet-pre">
                                <code>{comment.code_solution}</code>
                              </pre>
                            </div>
                          )}
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
