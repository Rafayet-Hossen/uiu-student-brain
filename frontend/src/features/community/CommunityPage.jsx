import { useEffect, useState } from "react";
import Badge from "../../components/Badge";
import Button from "../../components/Button";
import Card from "../../components/Card";
import FormError from "../../components/FormError";
import Navbar from "../../components/Navbar";
import Spinner from "../../components/Spinner";
import {
  extractCommunityErrorMessage,
  getEvents,
  getPosts,
  getStudents,
} from "./api";
import PostCard from "./components/PostCard";
import PostForm from "./components/PostForm";
import EventCard from "./components/EventCard";
import EventForm from "./components/EventForm";
import StudentCard from "./components/StudentCard";

const CATEGORIES = [
  "All",
  "General",
  "Exam Prep",
  "Study Group",
  "Course Help",
  "Resources",
];

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState("posts"); // "posts", "events", "students"

  // Posts state
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [postsError, setPostsError] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [postSearch, setPostSearch] = useState("");
  const [showPostForm, setShowPostForm] = useState(false);

  // Events state
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState("");
  const [showEventForm, setShowEventForm] = useState(false);

  // Students state
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentsError, setStudentsError] = useState("");
  const [studentSearch, setStudentSearch] = useState("");

  // Load posts
  async function loadPosts() {
    setPostsLoading(true);
    setPostsError("");
    try {
      const data = await getPosts({
        category: selectedCategory === "All" ? undefined : selectedCategory,
        search: postSearch.trim() || undefined,
      });
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
      const data = await getEvents();
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
      const data = await getStudents({
        search: studentSearch.trim() || undefined,
      });
      setStudents(data);
    } catch (err) {
      setStudentsError(extractCommunityErrorMessage(err));
    } finally {
      setStudentsLoading(false);
    }
  }

  useEffect(() => {
    if (activeTab === "posts") {
      loadPosts();
    } else if (activeTab === "events") {
      loadEvents();
    } else if (activeTab === "students") {
      loadStudents();
    }
  }, [activeTab, selectedCategory]);

  function handlePostSearchSubmit(e) {
    e.preventDefault();
    loadPosts();
  }

  function handleStudentSearchSubmit(e) {
    e.preventDefault();
    loadStudents();
  }

  function handlePostCreated(newPost) {
    setPosts((prev) => [newPost, ...prev]);
    setShowPostForm(false);
  }

  function handlePostDeleted(id) {
    setPosts((prev) => prev.filter((p) => p.id !== id));
  }

  function handleEventCreated(newEvent) {
    setEvents((prev) => [newEvent, ...prev]);
    setShowEventForm(false);
  }

  function handleEventDeleted(id) {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }

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
                <span>Academic Community</span>
              </h1>
              <p className="page-description">
                Connect with peer scholars, discuss coursework, share resources,
                and join study sessions.
              </p>
            </div>

            <div>
              {activeTab === "posts" && (
                <Button onClick={() => setShowPostForm((prev) => !prev)}>
                  {showPostForm ? "✕ Close Form" : "➕ New Discussion"}
                </Button>
              )}
              {activeTab === "events" && (
                <Button onClick={() => setShowEventForm((prev) => !prev)}>
                  {showEventForm ? "✕ Close Form" : "➕ Schedule Meetup"}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div
          style={{
            display: "flex",
            gap: "10px",
            marginBottom: "24px",
            borderBottom: "1px solid var(--color-border)",
            paddingBottom: "12px",
          }}
        >
          <Button
            variant={activeTab === "posts" ? "primary" : "secondary"}
            onClick={() => setActiveTab("posts")}
          >
            💬 Discussions & Q&A
          </Button>

          <Button
            variant={activeTab === "events" ? "primary" : "secondary"}
            onClick={() => setActiveTab("events")}
          >
            📅 Study Events & Meetups
          </Button>

          <Button
            variant={activeTab === "students" ? "primary" : "secondary"}
            onClick={() => setActiveTab("students")}
          >
            👥 Student Network
          </Button>
        </div>

        {/* ============================================================
            TAB 1: DISCUSSIONS & Q&A
            ============================================================ */}
        {activeTab === "posts" && (
          <div>
            {/* Create Post Card */}
            {showPostForm && (
              <Card style={{ marginBottom: "24px" }}>
                <div className="card-header">
                  <h2 className="card-title">
                    <span>📝</span>
                    <span>Start an Academic Discussion</span>
                  </h2>
                </div>
                <PostForm
                  onCreated={handlePostCreated}
                  onCancel={() => setShowPostForm(false)}
                />
              </Card>
            )}

            {/* Filter and Search Bar */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "space-between",
                gap: "12px",
                marginBottom: "20px",
              }}
            >
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className="btn btn-sm"
                    style={{
                      background:
                        selectedCategory === cat
                          ? "var(--color-accent)"
                          : "var(--color-surface)",
                      color:
                        selectedCategory === cat ? "#fff" : "var(--color-text)",
                      borderColor: "var(--color-border)",
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <form
                onSubmit={handlePostSearchSubmit}
                style={{ display: "flex", gap: "8px" }}
              >
                <input
                  type="text"
                  placeholder="Search topics..."
                  value={postSearch}
                  onChange={(e) => setPostSearch(e.target.value)}
                  className="form-input"
                  style={{
                    padding: "6px 12px",
                    fontSize: "0.875rem",
                    borderRadius: "var(--radius-md)",
                  }}
                />
                <Button size="sm" type="submit" variant="secondary">
                  🔍
                </Button>
              </form>
            </div>

            {/* Loading */}
            {postsLoading && (
              <Card className="empty-state-card">
                <Spinner standalone />
                <p className="page-loading-text">Loading discussions...</p>
              </Card>
            )}

            {/* Error */}
            {!postsLoading && postsError && (
              <Card className="empty-state-card">
                <FormError message={postsError} className="form-error-block" />
                <Button onClick={loadPosts}>Try Again</Button>
              </Card>
            )}

            {/* Empty */}
            {!postsLoading && !postsError && posts.length === 0 && (
              <Card className="empty-state-card">
                <div className="empty-state-icon">💬</div>
                <h2 className="empty-state-title">
                  No discussions in this category
                </h2>
                <p className="empty-state-desc">
                  Start the conversation! Post questions, share study resources,
                  or create a study group discussion.
                </p>
                <Button onClick={() => setShowPostForm(true)}>
                  Post the First Topic
                </Button>
              </Card>
            )}

            {/* Posts Feed */}
            {!postsLoading && !postsError && posts.length > 0 && (
              <div>
                {posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onDeleted={handlePostDeleted}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============================================================
            TAB 2: STUDY EVENTS & MEETUPS
            ============================================================ */}
        {activeTab === "events" && (
          <div>
            {showEventForm && (
              <Card style={{ marginBottom: "24px" }}>
                <div className="card-header">
                  <h2 className="card-title">
                    <span>📅</span>
                    <span>Schedule a Group Study Meetup</span>
                  </h2>
                </div>
                <EventForm
                  onCreated={handleEventCreated}
                  onCancel={() => setShowEventForm(false)}
                />
              </Card>
            )}

            {eventsLoading && (
              <Card className="empty-state-card">
                <Spinner standalone />
                <p className="page-loading-text">Loading study events...</p>
              </Card>
            )}

            {!eventsLoading && eventsError && (
              <Card className="empty-state-card">
                <FormError message={eventsError} className="form-error-block" />
                <Button onClick={loadEvents}>Try Again</Button>
              </Card>
            )}

            {!eventsLoading && !eventsError && events.length === 0 && (
              <Card className="empty-state-card">
                <div className="empty-state-icon">📅</div>
                <h2 className="empty-state-title">
                  No upcoming study meetups scheduled
                </h2>
                <p className="empty-state-desc">
                  Organize an exam review session, a library study table, or an
                  online sprint with classmates.
                </p>
                <Button onClick={() => setShowEventForm(true)}>
                  Schedule Meetup Now
                </Button>
              </Card>
            )}

            {!eventsLoading && !eventsError && events.length > 0 && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                  gap: "20px",
                }}
              >
                {events.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onDeleted={handleEventDeleted}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============================================================
            TAB 3: STUDENT NETWORK
            ============================================================ */}
        {activeTab === "students" && (
          <div>
            <form
              onSubmit={handleStudentSearchSubmit}
              style={{
                display: "flex",
                gap: "8px",
                maxWidth: "400px",
                marginBottom: "24px",
              }}
            >
              <input
                type="text"
                placeholder="Search classmates by name or email..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="form-input"
                style={{
                  flex: 1,
                  padding: "8px 14px",
                  borderRadius: "var(--radius-md)",
                }}
              />
              <Button type="submit" variant="secondary">
                Search
              </Button>
            </form>

            {studentsLoading && (
              <Card className="empty-state-card">
                <Spinner standalone />
                <p className="page-loading-text">
                  Loading scholar directory...
                </p>
              </Card>
            )}

            {!studentsLoading && studentsError && (
              <Card className="empty-state-card">
                <FormError
                  message={studentsError}
                  className="form-error-block"
                />
                <Button onClick={loadStudents}>Try Again</Button>
              </Card>
            )}

            {!studentsLoading && !studentsError && students.length === 0 && (
              <Card className="empty-state-card">
                <div className="empty-state-icon">👥</div>
                <h2 className="empty-state-title">No classmates found</h2>
                <p className="empty-state-desc">
                  Check your search criteria or invite peer students to join
                  StudentBrain.
                </p>
              </Card>
            )}

            {!studentsLoading && !studentsError && students.length > 0 && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                  gap: "20px",
                }}
              >
                {students.map((student) => (
                  <StudentCard key={student.id} student={student} />
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
