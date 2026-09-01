import { useEffect, useState } from "react";
import Button from "../../components/Button";
import Card from "../../components/Card";
import FormError from "../../components/FormError";
import Input from "../../components/Input";
import Navbar from "../../components/Navbar";
import Spinner from "../../components/Spinner";
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
  "All",
  "General",
  "Exam Prep",
  "Study Group",
  "Course Help",
  "Resources",
];

const TIMEFRAMES = [
  { key: "weekly", label: "⚡ Weekly Focus" },
  { key: "streak", label: "🔥 Streak Masters" },
  { key: "all_time", label: "👑 All-Time Focus" },
];

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState("posts"); // "posts" | "events" | "network" | "leaderboard"

  // Posts state
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsError, setPostsError] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [postSearch, setPostSearch] = useState("");
  const [showPostForm, setShowPostForm] = useState(false);
  const [expandedPostId, setExpandedPostId] = useState(null);
  const [commentsMap, setCommentsMap] = useState({});
  const [commentsLoadingMap, setCommentsLoadingMap] = useState({});

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
      const data = await getPosts(selectedCategory, postSearch);
      setPosts(data);
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
      setEvents(data);
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
      setStudents(data);
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
    if (activeTab === "posts") loadPosts();
    if (activeTab === "events") loadEvents();
    if (activeTab === "network") loadStudents();
    if (activeTab === "leaderboard") loadLeaderboard();
  }, [activeTab, selectedCategory, leaderboardTimeframe]);

  // Handle post creation
  async function handleCreatePost(payload) {
    const newPost = await createPost(payload);
    setPosts((prev) => [newPost, ...prev]);
    setShowPostForm(false);
  }

  // Handle post deletion
  function handleDeletePost(postId) {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  }

  // Handle post reaction toggle
  async function handleToggleReaction(postId) {
    try {
      const result = await togglePostReaction(postId);
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                has_reacted: result.has_reacted,
                reactions_count: result.reactions_count,
              }
            : p,
        ),
      );
    } catch (err) {
      console.error("Failed to react to post", err);
    }
  }

  // Handle comment load/expand
  async function handleToggleComments(postId) {
    if (expandedPostId === postId) {
      setExpandedPostId(null);
      return;
    }

    setExpandedPostId(postId);

    if (!commentsMap[postId]) {
      setCommentsLoadingMap((prev) => ({ ...prev, [postId]: true }));
      try {
        const comments = await getComments(postId);
        setCommentsMap((prev) => ({ ...prev, [postId]: comments }));
      } catch (err) {
        console.error("Failed to load comments", err);
      } finally {
        setCommentsLoadingMap((prev) => ({ ...prev, [postId]: false }));
      }
    }
  }

  // Handle create comment
  async function handleCreateComment(postId, content) {
    const newComment = await createComment(postId, { content });
    setCommentsMap((prev) => ({
      ...prev,
      [postId]: [...(prev[postId] || []), newComment],
    }));
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p,
      ),
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
  async function handleToggleRSVP(eventId) {
    try {
      const result = await toggleEventRSVP(eventId);
      setEvents((prev) =>
        prev.map((e) =>
          e.id === eventId
            ? {
                ...e,
                is_attending: result.is_attending,
                rsvps_count: result.rsvps_count,
              }
            : e,
        ),
      );
    } catch (err) {
      console.error("Failed to RSVP", err);
    }
  }

  // Handle Follow toggle
  async function handleToggleFollow(userId) {
    try {
      const result = await toggleFollowStudent(userId);

      // Update student network state
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

      // Update leaderboard state if active
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

  const rankings = leaderboardData?.rankings || [];
  const topThree = rankings.slice(0, 3);
  const remainingRankings = rankings.length > 3 ? rankings.slice(3) : rankings;

  return (
    <div className="app-screen">
      <Navbar />

      <main className="main-content">
        {/* Page Header */}
        <div className="page-header">
          <div className="page-header-row">
            <div>
              <h1 className="page-title">
                <span>💬</span>
                <span>Student Community & Network</span>
              </h1>
              <p className="page-description">
                Engage in academic discussions, organize study groups, compete
                on the leaderboard, and connect with fellow scholars.
              </p>
            </div>

            {activeTab === "posts" && (
              <Button onClick={() => setShowPostForm(!showPostForm)}>
                {showPostForm ? "✕ Close Form" : "✏️ Start Discussion"}
              </Button>
            )}

            {activeTab === "events" && (
              <Button onClick={() => setShowEventForm(!showEventForm)}>
                {showEventForm ? "✕ Close Form" : "📅 Host Study Session"}
              </Button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="community-tabs-bar">
          <button
            type="button"
            className={`community-tab-btn ${
              activeTab === "posts" ? "tab-active" : ""
            }`}
            onClick={() => setActiveTab("posts")}
          >
            💬 Discussions
          </button>
          <button
            type="button"
            className={`community-tab-btn ${
              activeTab === "events" ? "tab-active" : ""
            }`}
            onClick={() => setActiveTab("events")}
          >
            📅 Study Events
          </button>
          <button
            type="button"
            className={`community-tab-btn ${
              activeTab === "network" ? "tab-active" : ""
            }`}
            onClick={() => setActiveTab("network")}
          >
            👥 Student Network
          </button>
          <button
            type="button"
            className={`community-tab-btn ${
              activeTab === "leaderboard" ? "tab-active" : ""
            }`}
            onClick={() => setActiveTab("leaderboard")}
          >
            🏆 Leaderboard
          </button>
        </div>

        {/* ============================================================
            TAB 1: POSTS & DISCUSSIONS
            ============================================================ */}
        {activeTab === "posts" && (
          <div>
            {showPostForm && (
              <div style={{ marginBottom: "28px" }}>
                <PostForm
                  onSubmit={handleCreatePost}
                  onCancel={() => setShowPostForm(false)}
                />
              </div>
            )}

            {/* Filter and Search */}
            <div className="community-filters-row">
              <div className="category-pills">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    className={`category-pill ${
                      selectedCategory === cat ? "pill-active" : ""
                    }`}
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="community-search-box">
                <Input
                  id="post_search"
                  placeholder="Search discussions..."
                  value={postSearch}
                  onChange={(e) => setPostSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && loadPosts()}
                />
                <Button size="sm" variant="secondary" onClick={loadPosts}>
                  🔍 Search
                </Button>
              </div>
            </div>

            {postsLoading && (
              <Card className="empty-state-card">
                <Spinner standalone />
                <p className="page-loading-text">Loading discussions...</p>
              </Card>
            )}

            {!postsLoading && postsError && (
              <Card className="empty-state-card">
                <FormError message={postsError} className="form-error-block" />
                <Button onClick={loadPosts}>Try Again</Button>
              </Card>
            )}

            {!postsLoading && !postsError && posts.length === 0 && (
              <Card className="empty-state-card">
                <div className="empty-state-icon">💬</div>
                <h2 className="empty-state-title">No discussions found</h2>
                <p className="empty-state-desc">
                  Be the first to post a question, share resources, or start an
                  academic conversation!
                </p>
                <Button onClick={() => setShowPostForm(true)}>
                  Start First Discussion
                </Button>
              </Card>
            )}

            {!postsLoading && !postsError && posts.length > 0 && (
              <div className="posts-feed">
                {posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onToggleReaction={handleToggleReaction}
                    onToggleComments={handleToggleComments}
                    isExpanded={expandedPostId === post.id}
                    comments={commentsMap[post.id] || []}
                    commentsLoading={Boolean(commentsLoadingMap[post.id])}
                    onCreateComment={handleCreateComment}
                    onDeleted={handleDeletePost}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============================================================
            TAB 2: STUDY EVENTS
            ============================================================ */}
        {activeTab === "events" && (
          <div>
            {showEventForm && (
              <div style={{ marginBottom: "28px" }}>
                <EventForm
                  onSubmit={handleCreateEvent}
                  onCancel={() => setShowEventForm(false)}
                />
              </div>
            )}

            <div
              className="community-filters-row"
              style={{ justifyContent: "flex-end" }}
            >
              <div className="community-search-box">
                <Input
                  id="event_search"
                  placeholder="Search events by title or subject..."
                  value={eventSearch}
                  onChange={(e) => setEventSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && loadEvents()}
                />
                <Button size="sm" variant="secondary" onClick={loadEvents}>
                  🔍 Search
                </Button>
              </div>
            </div>

            {eventsLoading && (
              <Card className="empty-state-card">
                <Spinner standalone />
                <p className="page-loading-text">Loading study events...</p>
              </Card>
            )}

            {!eventsLoading && !eventsError && events.length === 0 && (
              <Card className="empty-state-card">
                <div className="empty-state-icon">📅</div>
                <h2 className="empty-state-title">No upcoming study events</h2>
                <p className="empty-state-desc">
                  Host an exam review, study group, or quiet work session with
                  your peers.
                </p>
                <Button onClick={() => setShowEventForm(true)}>
                  Host First Study Event
                </Button>
              </Card>
            )}

            {!eventsLoading && !eventsError && events.length > 0 && (
              <div className="events-grid">
                {events.map((event) => (
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
                <Input
                  id="student_search"
                  placeholder="Search students by name or email..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && loadStudents()}
                />
                <Button size="sm" variant="secondary" onClick={loadStudents}>
                  🔍 Search
                </Button>
              </div>
            </div>

            {studentsLoading && (
              <Card className="empty-state-card">
                <Spinner standalone />
                <p className="page-loading-text">
                  Loading student directory...
                </p>
              </Card>
            )}

            {!studentsLoading && !studentsError && students.length === 0 && (
              <Card className="empty-state-card">
                <div className="empty-state-icon">👥</div>
                <h2 className="empty-state-title">No students found</h2>
                <p className="empty-state-desc">
                  Invite your classmates to build your academic peer network!
                </p>
              </Card>
            )}

            {!studentsLoading && !studentsError && students.length > 0 && (
              <div className="students-grid">
                {students.map((student) => (
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
            {/* Opt-In Preferences Card */}
            {leaderboardData && (
              <LeaderboardOptInCard
                isOptedIn={leaderboardData.is_opted_in}
                currentQuote={leaderboardData.custom_quote}
                currentUserEntry={leaderboardData.current_user_entry}
                onOptInChange={loadLeaderboard}
              />
            )}

            {/* Timeframe Switcher */}
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

            {/* Loading */}
            {leaderboardLoading && (
              <Card className="empty-state-card">
                <Spinner standalone />
                <p className="page-loading-text">Calculating rankings...</p>
              </Card>
            )}

            {/* Error */}
            {!leaderboardLoading && leaderboardError && (
              <Card className="empty-state-card">
                <FormError
                  message={leaderboardError}
                  className="form-error-block"
                />
                <Button onClick={loadLeaderboard}>Try Again</Button>
              </Card>
            )}

            {/* Empty State */}
            {!leaderboardLoading &&
              !leaderboardError &&
              rankings.length === 0 && (
                <Card className="empty-state-card">
                  <div className="empty-state-icon">🏆</div>
                  <h2 className="empty-state-title">
                    No participants on the leaderboard yet
                  </h2>
                  <p className="empty-state-desc">
                    Be the first to opt in and climb the academic study
                    leaderboard!
                  </p>
                </Card>
              )}

            {/* Leaderboard Content */}
            {!leaderboardLoading &&
              !leaderboardError &&
              rankings.length > 0 && (
                <div className="leaderboard-display-wrap">
                  {/* Top 3 Podium */}
                  {topThree.length > 0 && (
                    <LeaderboardPodium
                      topThree={topThree}
                      timeframe={leaderboardTimeframe}
                      onToggleFollow={handleToggleFollow}
                    />
                  )}

                  {/* Table for remaining or all participants */}
                  <LeaderboardTable
                    rankings={rankings}
                    timeframe={leaderboardTimeframe}
                    onToggleFollow={handleToggleFollow}
                  />
                </div>
              )}
          </div>
        )}
      </main>
    </div>
  );
}
