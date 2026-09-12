import { useEffect, useState, useMemo } from "react";
import {
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Code2,
  Crown,
  FileText,
  Flame,
  HelpCircle,
  Megaphone,
  MessageSquare,
  Plus,
  Radio,
  RefreshCw,
  Search,
  Sparkles,
  Tag,
  ThumbsUp,
  Trophy,
  Users,
  X,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Badge from "../../components/Badge";
import Button from "../../components/Button";
import Card from "../../components/Card";
import EmptyState from "../../components/EmptyState";
import ErrorState from "../../components/ErrorState";
import ErrorBoundary from "../../components/ErrorBoundary";
import Navbar from "../../components/Navbar";
import { CardSkeleton } from "../../components/Skeleton";
import ScholarAvatar from "../auth/components/ScholarAvatar";
import { useAuth } from "../auth/useAuth";
import {
  createComment,
  createEvent,
  createPost,
  extractCommunityErrorMessage,
  getComments,
  getEvents,
  getLeaderboard,
  getLeaderboardStatus,
  getPosts,
  getStudents,
  toggleEventRSVP,
  toggleFollowStudent,
  togglePostReaction,
} from "./api";
import EventCard from "./components/EventCard";
import EventForm from "./components/EventForm";
import LeaderboardOptInCard from "./components/LeaderboardOptInCard";
import LeaderboardPodium from "./components/LeaderboardPodium";
import LeaderboardTable from "./components/LeaderboardTable";
import PostCard from "./components/PostCard";
import PostForm from "./components/PostForm";
import StudentCard from "./components/StudentCard";

const CATEGORIES = [
  { label: "All Posts", value: "All", icon: BookOpen, count: null },
  { label: "Code Help", value: "Code Help", icon: Code2, count: null },
  { label: "Exam Prep", value: "Exam Prep", icon: Zap, count: null },
  { label: "Course Help", value: "Course Help", icon: HelpCircle, count: null },
  { label: "Study Group", value: "Study Group", icon: Users, count: null },
  { label: "Resources", value: "Resources", icon: FileText, count: null },
  { label: "General", value: "General", icon: MessageSquare, count: null },
];

const TIMEFRAMES = [
  { key: "weekly", label: "⚡ Weekly Focus" },
  { key: "streak", label: "🔥 Streak Masters" },
  { key: "all_time", label: "👑 All-Time Focus" },
];

export default function CommunityPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("posts"); // "posts" | "events" | "network" | "leaderboard"

  // Posts state
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsError, setPostsError] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [postSearch, setPostSearch] = useState("");
  const [showPostModal, setShowPostModal] = useState(false);
  const [modalCategory, setModalCategory] = useState("General");
  const [filterAuthor, setFilterAuthor] = useState("all"); // "all" | "my_posts"

  // Events state
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState("");
  const [eventSearch, setEventSearch] = useState("");
  const [showEventForm, setShowEventForm] = useState(false);

  // Students state
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentsError, setStudentsError] = useState("");
  const [studentSearch, setStudentSearch] = useState("");

  // Leaderboard state
  const [leaderboardData, setLeaderboardData] = useState(null);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [leaderboardError, setLeaderboardError] = useState("");
  const [leaderboardTimeframe, setLeaderboardTimeframe] = useState("weekly");

  // Load posts
  async function loadPosts() {
    setPostsLoading(true);
    setPostsError("");
    try {
      const data = await getPosts(
        selectedCategory === "All" ? "" : selectedCategory,
        postSearch,
      );
      setPosts(Array.isArray(data) ? data : data?.results || []);
    } catch (err) {
      setPostsError(extractCommunityErrorMessage(err));
    } finally {
      setPostsLoading(false);
    }
  }

  // Load events
  async function loadEvents() {
    setEventsLoading(true);
    setEventsError("");
    try {
      const data = await getEvents(eventSearch);
      setEvents(Array.isArray(data) ? data : data?.results || []);
    } catch (err) {
      setEventsError(extractCommunityErrorMessage(err));
    } finally {
      setEventsLoading(false);
    }
  }

  // Load students
  async function loadStudents() {
    setStudentsLoading(true);
    setStudentsError("");
    try {
      const data = await getStudents(studentSearch);
      setStudents(Array.isArray(data) ? data : data?.results || []);
    } catch (err) {
      setStudentsError(extractCommunityErrorMessage(err));
    } finally {
      setStudentsLoading(false);
    }
  }

  // Load leaderboard
  async function loadLeaderboard() {
    setLeaderboardLoading(true);
    setLeaderboardError("");
    try {
      const data = await getLeaderboard(leaderboardTimeframe);
      setLeaderboardData(data);
    } catch (err) {
      setLeaderboardError(extractCommunityErrorMessage(err));
    } finally {
      setLeaderboardLoading(false);
    }
  }

  useEffect(() => {
    if (activeTab === "posts") {
      loadPosts();
      loadEvents();
      loadLeaderboard();
    }
    if (activeTab === "events") loadEvents();
    if (activeTab === "network") loadStudents();
    if (activeTab === "leaderboard") loadLeaderboard();
  }, [activeTab, selectedCategory, leaderboardTimeframe]);

  // Dynamic debounced search listeners
  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab === "posts") loadPosts();
    }, 280);
    return () => clearTimeout(timer);
  }, [postSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab === "events" || activeTab === "posts") loadEvents();
    }, 280);
    return () => clearTimeout(timer);
  }, [eventSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab === "network") loadStudents();
    }, 280);
    return () => clearTimeout(timer);
  }, [studentSearch]);

  // Handle post creation
  async function handleCreatePost(payload) {
    const newPost = await createPost(payload);
    setPosts((prev) => [newPost, ...prev]);
    setShowPostModal(false);
  }

  // Handle post deletion
  function handleDeletePost(postId) {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  }

  // Handle post update
  function handleUpdatePost(updatedPost) {
    setPosts((prev) =>
      prev.map((p) => (p.id === updatedPost.id ? updatedPost : p)),
    );
  }

  // Handle event creation
  async function handleCreateEvent(payload) {
    const newEvent = await createEvent(payload);
    setEvents((prev) => [newEvent, ...prev]);
    setShowEventForm(false);
  }

  // Handle event deletion
  function handleDeleteEvent(eventId) {
    setEvents((prev) => prev.filter((e) => e.id !== eventId));
  }

  // Handle RSVP toggle
  async function handleToggleRSVP(eventId, status = "going") {
    try {
      const result = await toggleEventRSVP(eventId, status);
      setEvents((prev) =>
        prev.map((e) =>
          e.id === eventId
            ? {
                ...e,
                is_attending: result.user_rsvp_status === "going",
                user_rsvp_status: result.user_rsvp_status,
                rsvps_count: result.rsvps_count,
                going_count: result.going_count,
                interested_count: result.interested_count,
              }
            : e,
        ),
      );
      return result;
    } catch (err) {
      console.error("Failed to RSVP", err);
    }
  }

  // Handle Follow toggle
  async function handleToggleFollow(userId) {
    try {
      const result = await toggleFollowStudent(userId);
      setStudents((prev) =>
        prev.map((s) =>
          s.id === userId
            ? {
                ...s,
                is_following: result.following,
                followers_count: result.followers_count,
              }
            : s,
        ),
      );
      if (leaderboardData?.rankings) {
        setLeaderboardData((prev) => ({
          ...prev,
          rankings: prev.rankings.map((r) =>
            r.user_id === userId ? { ...r, is_following: result.following } : r,
          ),
        }));
      }
    } catch (err) {
      console.error("Failed to follow student", err);
    }
  }

  // Dynamic real-time filtered posts
  const displayedPosts = useMemo(() => {
    const rawList = Array.isArray(posts) ? posts : [];
    let list =
      filterAuthor === "my_posts"
        ? rawList.filter((p) => p && p.author?.id === user?.id)
        : rawList;
    if (selectedCategory && selectedCategory !== "All") {
      list = list.filter((p) => p && p.category === selectedCategory);
    }
    if (postSearch.trim()) {
      const q = postSearch.toLowerCase();
      list = list.filter(
        (p) =>
          p &&
          ((p.title && p.title.toLowerCase().includes(q)) ||
            (p.content && p.content.toLowerCase().includes(q)) ||
            (p.author?.full_name &&
              p.author.full_name.toLowerCase().includes(q)) ||
            (p.category && p.category.toLowerCase().includes(q)) ||
            (p.code_snippet && p.code_snippet.toLowerCase().includes(q))),
      );
    }
    return list;
  }, [posts, filterAuthor, selectedCategory, postSearch, user?.id]);

  // Dynamic real-time filtered events
  const displayedEvents = useMemo(() => {
    const rawList = Array.isArray(events) ? events : [];
    if (!eventSearch.trim()) return rawList;
    const q = eventSearch.toLowerCase();
    return rawList.filter(
      (e) =>
        e &&
        ((e.title && e.title.toLowerCase().includes(q)) ||
          (e.subject && e.subject.toLowerCase().includes(q)) ||
          (e.description && e.description.toLowerCase().includes(q)) ||
          (e.location && e.location.toLowerCase().includes(q))),
    );
  }, [events, eventSearch]);

  // Dynamic real-time filtered students
  const displayedStudents = useMemo(() => {
    const rawList = Array.isArray(students) ? students : [];
    if (!studentSearch.trim()) return rawList;
    const q = studentSearch.toLowerCase();
    return rawList.filter(
      (s) =>
        s &&
        ((s.full_name && s.full_name.toLowerCase().includes(q)) ||
          (s.email && s.email.toLowerCase().includes(q)) ||
          (s.department && s.department.toLowerCase().includes(q))),
    );
  }, [students, studentSearch]);

  const rankings = leaderboardData?.rankings || [];
  const topThree = rankings.slice(0, 3);

  // Category post counters
  const getCategoryCount = (catValue) => {
    const rawList = Array.isArray(posts) ? posts : [];
    if (catValue === "All") return rawList.length;
    return rawList.filter((p) => p && p.category === catValue).length;
  };

  return (
    <div className="app-screen">
      <Navbar />

      <main className="main-content">
        {/* Top Header */}
        <div className="page-header" style={{ marginBottom: "20px" }}>
          <div className="page-header-row">
            <div>
              <h1 className="page-title">
                <Users size={28} className="text-indigo" />
                <span>Student Community & Knowledge Hub</span>
              </h1>
              <p className="page-description">
                Ask questions, share syllabus summaries, join campus study
                groups, and climb the academic leaderboard.
              </p>
            </div>

            <Button
              variant="primary"
              onClick={() => {
                if (activeTab === "events") {
                  setShowEventForm(!showEventForm);
                } else {
                  setModalCategory("General");
                  setShowPostModal(true);
                }
              }}
              icon={Plus}
            >
              {activeTab === "events"
                ? showEventForm
                  ? "Close Form"
                  : "Host Study Event"
                : "Ask / Share Something"}
            </Button>
          </div>
        </div>

        {/* Primary Tab Navigation Pills */}
        <div
          className="community-main-tabs-wrapper"
          style={{ marginBottom: "24px" }}
        >
          <div className="community-tabs-bar">
            <button
              type="button"
              className={`community-tab-btn ${
                activeTab === "posts" ? "tab-active" : ""
              }`}
              onClick={() => setActiveTab("posts")}
            >
              <MessageSquare size={16} />
              <span>All Discussions</span>
            </button>
            <button
              type="button"
              className={`community-tab-btn ${
                activeTab === "events" ? "tab-active" : ""
              }`}
              onClick={() => setActiveTab("events")}
            >
              <Calendar size={16} />
              <span>Campus Events ({events.length})</span>
            </button>
            <button
              type="button"
              className={`community-tab-btn ${
                activeTab === "network" ? "tab-active" : ""
              }`}
              onClick={() => setActiveTab("network")}
            >
              <Users size={16} />
              <span>Student Directory</span>
            </button>
            <button
              type="button"
              className={`community-tab-btn ${
                activeTab === "leaderboard" ? "tab-active" : ""
              }`}
              onClick={() => setActiveTab("leaderboard")}
            >
              <Trophy size={16} />
              <span>Scholar Leaderboard</span>
            </button>
          </div>
        </div>

        {/* ============================================================
            TAB 1: DISCUSSIONS (2-COLUMN FEED + SIDEBAR LIKE REFERENCE)
            ============================================================ */}
        {activeTab === "posts" && (
          <div className="community-layout-grid">
            {/* LEFT / MAIN COLUMN (FEED) */}
            <div className="community-feed-column">
              {/* 1. Quick Post Creator Bar */}
              <Card className="quick-post-creator-card">
                <div className="quick-creator-top">
                  <ScholarAvatar user={user} size={42} />
                  <button
                    type="button"
                    className="quick-creator-input-trigger"
                    onClick={() => {
                      setModalCategory("General");
                      setShowPostModal(true);
                    }}
                  >
                    <span>Share or Ask Something to Everyone?</span>
                  </button>
                </div>
                <div className="quick-creator-bottom">
                  <div className="quick-creator-chips">
                    <span
                      className="quick-chip-item"
                      onClick={() => {
                        setModalCategory("General");
                        setShowPostModal(true);
                      }}
                    >
                      <FileText size={14} className="text-indigo" />
                      <span>Note / Topic</span>
                    </span>
                    <span
                      className="quick-chip-item"
                      onClick={() => {
                        setModalCategory("Exam Prep");
                        setShowPostModal(true);
                      }}
                    >
                      <Zap size={14} className="text-amber" />
                      <span>Exam Question</span>
                    </span>
                    <span
                      className="quick-chip-item"
                      onClick={() => {
                        setModalCategory("Code Help");
                        setShowPostModal(true);
                      }}
                      style={{
                        background: "rgba(16, 185, 129, 0.12)",
                        borderColor: "rgba(16, 185, 129, 0.35)",
                        color: "#10b981",
                        fontWeight: 600,
                      }}
                    >
                      <Code2 size={14} className="text-emerald" />
                      <span>💻 Code & Live Share</span>
                    </span>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setModalCategory("General");
                      setShowPostModal(true);
                    }}
                    icon={Plus}
                  >
                    Create Post
                  </Button>
                </div>
              </Card>

              {/* 2. Sub-Filters & Search Bar */}
              <div className="community-feed-filters-bar">
                <div className="feed-filter-tabs">
                  <button
                    type="button"
                    className={`feed-filter-btn ${
                      filterAuthor === "all" ? "filter-btn-active" : ""
                    }`}
                    onClick={() => setFilterAuthor("all")}
                  >
                    <BookOpen size={14} />
                    <span>All Posts</span>
                  </button>
                  <button
                    type="button"
                    className={`feed-filter-btn ${
                      filterAuthor === "my_posts" ? "filter-btn-active" : ""
                    }`}
                    onClick={() => setFilterAuthor("my_posts")}
                  >
                    <Users size={14} />
                    <span>My Posts</span>
                  </button>
                </div>

                <div className="feed-search-wrap">
                  <input
                    type="text"
                    placeholder="Search discussions..."
                    value={postSearch}
                    onChange={(e) => setPostSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && loadPosts()}
                    className="form-input-control feed-search-input"
                  />
                  <button
                    type="button"
                    className="feed-search-action-btn"
                    onClick={loadPosts}
                    title="Search"
                  >
                    <Search size={15} />
                  </button>
                </div>
              </div>

              {/* 3. Category Filter Pills */}
              <div className="category-scroll-bar">
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = selectedCategory === cat.value;
                  return (
                    <button
                      key={cat.value}
                      type="button"
                      className={`category-tag-pill ${
                        isSelected ? "category-tag-active" : ""
                      }`}
                      onClick={() => setSelectedCategory(cat.value)}
                    >
                      <Icon size={14} />
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* 4. Loading Skeletons */}
              {postsLoading && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                  }}
                >
                  <CardSkeleton />
                  <CardSkeleton />
                </div>
              )}

              {/* 5. Error State */}
              {!postsLoading && postsError && (
                <ErrorState
                  title="Failed to load discussions"
                  message={postsError}
                  onRetry={loadPosts}
                />
              )}

              {/* 6. Empty State */}
              {!postsLoading && !postsError && displayedPosts.length === 0 && (
                <EmptyState
                  icon={MessageSquare}
                  title="No discussions found"
                  description="Be the first scholar to ask an academic question, share study notes, or start a collaborative thread!"
                  actionLabel="Create First Discussion"
                  onAction={() => setShowPostModal(true)}
                />
              )}

              {/* 7. Posts Feed List */}
              {!postsLoading && !postsError && displayedPosts.length > 0 && (
                <div className="posts-feed-stream">
                  {displayedPosts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      onDeleted={handleDeletePost}
                      onUpdated={handleUpdatePost}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* RIGHT SIDEBAR (30% on desktop) */}
            <aside className="community-sidebar-column">
              {/* Sidebar Widget 1: Academic Channels / Topics */}
              <Card className="sidebar-widget-card">
                <div className="sidebar-widget-header">
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <Tag size={16} className="text-indigo" />
                    <strong className="sidebar-widget-title">
                      Course Topics & Channels
                    </strong>
                  </div>
                </div>

                <div className="sidebar-channels-list">
                  {CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    const count = getCategoryCount(cat.value);
                    const isSelected = selectedCategory === cat.value;
                    return (
                      <button
                        key={cat.value}
                        type="button"
                        className={`sidebar-channel-item ${
                          isSelected ? "sidebar-channel-active" : ""
                        }`}
                        onClick={() => setSelectedCategory(cat.value)}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                          }}
                        >
                          <Icon size={16} className="text-muted" />
                          <span>{cat.label}</span>
                        </div>
                        <span className="channel-count-badge">{count}</span>
                      </button>
                    );
                  })}
                </div>
              </Card>

              {/* Sidebar Widget 2: Upcoming Study Events Preview */}
              <Card className="sidebar-widget-card">
                <div className="sidebar-widget-header">
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <Calendar size={16} className="text-emerald" />
                    <strong className="sidebar-widget-title">
                      Upcoming Study Sessions
                    </strong>
                  </div>
                  <button
                    type="button"
                    className="sidebar-link-btn"
                    onClick={() => setActiveTab("events")}
                  >
                    View all
                  </button>
                </div>

                <div className="sidebar-events-list">
                  {events.length > 0 ? (
                    events.slice(0, 3).map((event) => (
                      <div key={event.id} className="sidebar-event-item">
                        <div>
                          <strong className="sidebar-event-title">
                            {event.title}
                          </strong>
                          <span className="sidebar-event-meta">
                            🗓️ {event.event_date} • ⏰{" "}
                            {event.start_time?.slice(0, 5)}
                          </span>
                        </div>
                        <Button
                          variant={event.is_attending ? "success" : "outline"}
                          size="sm"
                          onClick={() => handleToggleRSVP(event.id)}
                        >
                          {event.is_attending ? "✓ Going" : "+ Going"}
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="sidebar-empty-text">
                      No upcoming campus sessions. Host one for your peers!
                    </p>
                  )}
                </div>
              </Card>

              {/* Sidebar Widget 3: Top Scholars Spotlight */}
              {topThree.length > 0 && (
                <Card className="sidebar-widget-card">
                  <div className="sidebar-widget-header">
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <Trophy size={16} className="text-amber" />
                      <strong className="sidebar-widget-title">
                        Top Scholars This Week
                      </strong>
                    </div>
                    <button
                      type="button"
                      className="sidebar-link-btn"
                      onClick={() => setActiveTab("leaderboard")}
                    >
                      Leaderboard
                    </button>
                  </div>

                  <div className="sidebar-top-scholars">
                    {topThree.map((scholar, idx) => (
                      <div
                        key={scholar.user_id}
                        className="sidebar-scholar-row"
                      >
                        <div className="scholar-rank-medal">
                          {idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉"}
                        </div>
                        <div className="scholar-row-meta">
                          <strong className="scholar-row-name">
                            {scholar.full_name || scholar.email?.split("@")[0]}
                          </strong>
                          <span className="scholar-row-pts">
                            {scholar.total_points} XP
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </aside>
          </div>
        )}

        {/* ============================================================
            TAB 2: STUDY EVENTS
            ============================================================ */}
        {activeTab === "events" && (
          <div>
            <AnimatePresence>
              {showEventForm && (
                <motion.div
                  initial={{ opacity: 0, y: -12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.2 }}
                  style={{ marginBottom: "28px" }}
                >
                  <EventForm
                    onSubmit={handleCreateEvent}
                    onCancel={() => setShowEventForm(false)}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div
              className="community-filters-row"
              style={{ justifyContent: "flex-end" }}
            >
              <div className="community-search-box">
                <input
                  id="event_search"
                  placeholder="Search events by title or subject..."
                  value={eventSearch}
                  onChange={(e) => setEventSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && loadEvents()}
                  className="form-input-control"
                />
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={loadEvents}
                  icon={Search}
                >
                  Search
                </Button>
              </div>
            </div>

            {eventsLoading && (
              <div className="events-grid">
                <CardSkeleton />
                <CardSkeleton />
              </div>
            )}

            {!eventsLoading && !eventsError && events.length === 0 && (
              <EmptyState
                icon={Calendar}
                title="No upcoming study events"
                description="Host an exam review, study group, or quiet work session with your peers."
                actionLabel="Host First Study Event"
                onAction={() => setShowEventForm(true)}
              />
            )}

            {!eventsLoading &&
              !eventsError &&
              events.length > 0 &&
              displayedEvents.length === 0 && (
                <EmptyState
                  icon={Search}
                  title="No matching study events"
                  description={`No study events match "${eventSearch}".`}
                  actionLabel="Clear Search"
                  onAction={() => setEventSearch("")}
                />
              )}

            {!eventsLoading && !eventsError && displayedEvents.length > 0 && (
              <div className="events-grid">
                {displayedEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onToggleRSVP={handleToggleRSVP}
                    onDeleted={handleDeleteEvent}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============================================================
            TAB 3: STUDENT NETWORK
            ============================================================ */}
        {activeTab === "network" && (
          <div>
            <div
              className="community-filters-row"
              style={{ justifyContent: "flex-end" }}
            >
              <div className="community-search-box">
                <input
                  id="student_search"
                  placeholder="Search students by name or email..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && loadStudents()}
                  className="form-input-control"
                />
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={loadStudents}
                  icon={Search}
                >
                  Search
                </Button>
              </div>
            </div>

            {studentsLoading && (
              <div className="students-grid">
                <CardSkeleton />
                <CardSkeleton />
              </div>
            )}

            {!studentsLoading && !studentsError && students.length === 0 && (
              <EmptyState
                icon={Users}
                title="No students found"
                description="Invite your classmates to build your academic peer network!"
              />
            )}

            {!studentsLoading &&
              !studentsError &&
              students.length > 0 &&
              displayedStudents.length === 0 && (
                <EmptyState
                  icon={Search}
                  title="No students match search"
                  description={`No scholars match "${studentSearch}".`}
                  actionLabel="Clear Search"
                  onAction={() => setStudentSearch("")}
                />
              )}

            {!studentsLoading &&
              !studentsError &&
              displayedStudents.length > 0 && (
                <div className="students-grid">
                  {displayedStudents.map((student) => (
                    <StudentCard
                      key={student.id}
                      student={student}
                      onToggleFollow={handleToggleFollow}
                    />
                  ))}
                </div>
              )}
          </div>
        )}

        {/* ============================================================
            TAB 4: STUDY LEADERBOARD
            ============================================================ */}
        {activeTab === "leaderboard" && (
          <div className="leaderboard-tab-content">
            {leaderboardData && (
              <LeaderboardOptInCard
                isOptedIn={leaderboardData.is_opted_in}
                currentQuote={leaderboardData.custom_quote}
                currentUserEntry={leaderboardData.current_user_entry}
                onOptInChange={loadLeaderboard}
              />
            )}

            <div className="leaderboard-timeframe-bar">
              <div className="timeframe-buttons-group">
                {TIMEFRAMES.map((tf) => (
                  <button
                    key={tf.key}
                    type="button"
                    className={`timeframe-btn ${
                      leaderboardTimeframe === tf.key ? "tf-active" : ""
                    }`}
                    onClick={() => setLeaderboardTimeframe(tf.key)}
                  >
                    {tf.label}
                  </button>
                ))}
              </div>

              <div className="leaderboard-participants-count">
                <span>
                  👥 {leaderboardData?.total_participants || 0} Opted-In
                  Scholars
                </span>
              </div>
            </div>

            {leaderboardLoading && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                <CardSkeleton />
                <CardSkeleton />
              </div>
            )}

            {!leaderboardLoading && leaderboardError && (
              <ErrorState
                title="Failed to calculate rankings"
                message={leaderboardError}
                onRetry={loadLeaderboard}
              />
            )}

            {!leaderboardLoading &&
              !leaderboardError &&
              rankings.length === 0 && (
                <EmptyState
                  icon={Trophy}
                  title="No participants on the leaderboard yet"
                  description="Be the first to opt in and climb the academic study leaderboard!"
                />
              )}

            {!leaderboardLoading &&
              !leaderboardError &&
              rankings.length > 0 && (
                <div className="leaderboard-display-wrap">
                  {topThree.length > 0 && (
                    <LeaderboardPodium
                      topThree={topThree}
                      timeframe={leaderboardTimeframe}
                      onToggleFollow={handleToggleFollow}
                    />
                  )}

                  <LeaderboardTable
                    rankings={rankings}
                    timeframe={leaderboardTimeframe}
                    onToggleFollow={handleToggleFollow}
                  />
                </div>
              )}
          </div>
        )}

        {/* Discussion Creator Modal */}
        {showPostModal && (
          <div
            className="modal-backdrop"
            onClick={() => setShowPostModal(false)}
          >
            <div
              className="modal-content-card"
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: "600px" }}
            >
              <div className="modal-header-row">
                <div
                  style={{ display: "flex", alignItems: "center", gap: "10px" }}
                >
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "var(--radius-md)",
                      background: "var(--color-primary-subtle)",
                      color: "var(--color-primary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <MessageSquare size={20} />
                  </div>
                  <div>
                    <h3 className="modal-title">
                      Start a Discussion or Question
                    </h3>
                    <span
                      style={{
                        fontSize: "0.8125rem",
                        color: "var(--color-text-muted)",
                      }}
                    >
                      Share with your fellow university scholars
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setShowPostModal(false)}
                >
                  ✕
                </button>
              </div>

              <PostForm
                initialCategory={modalCategory}
                onSubmit={handleCreatePost}
                onCancel={() => setShowPostModal(false)}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
