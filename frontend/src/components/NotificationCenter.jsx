import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCheck, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  getNotificationState,
  saveNotificationState,
} from "../features/auth/api";
import { useAuth } from "../features/auth/useAuth";

const INITIAL_NOTIFICATIONS = [
  {
    id: "notif-1",
    category: "announcement",
    tab: "announcement",
    day: "02",
    month: "09",
    dateFormatted: "02 Sep, 2026 • Campus Announcement",
    title: "📢 New Announcement published!",
    message:
      "Important announcement is live now! Final Term DBMS & Algorithm Problem Solving Review Session with Faculty Advisors.",
    link: "/community",
    read: false,
  },
  {
    id: "notif-2",
    category: "comment",
    tab: "comment",
    day: "02",
    month: "09",
    dateFormatted: "02 Sep, 2026 • Discussion Reply",
    title: "💬 New Reply on your Post!",
    message:
      "Rafayet commented on your query: 'Check equation 4 for the Raspberry Pi camera configuration and reboot.'",
    link: "/community",
    read: false,
  },
  {
    id: "notif-3",
    category: "comment",
    tab: "comment",
    day: "01",
    month: "09",
    dateFormatted: "01 Sep, 2026 • Material Feedback",
    title: "👍 3 Scholars upvoted your DBMS notes!",
    message:
      "Your uploaded study material 'DBMS MID Solve' was marked helpful by classmates in your batch.",
    link: "/materials",
    read: false,
  },
  {
    id: "notif-4",
    category: "academic",
    tab: "academic",
    day: "31",
    month: "08",
    dateFormatted: "31 Aug, 2026 • Academic Roadmap",
    title: "🎓 Academic Projection Target Update",
    message:
      "Target CGPA alert: Maintaining a 3.75 GPA this semester secures Cum Laude Graduation Honors.",
    link: "/grades",
    read: false,
  },
  {
    id: "notif-5",
    category: "academic",
    tab: "academic",
    day: "30",
    month: "08",
    dateFormatted: "30 Aug, 2026 • Habit Tracker",
    title: "🔥 Study Habit Streak Active",
    message:
      "You've maintained your 5-day daily study streak! Log today's study session to keep the flame active.",
    link: "/tracker",
    read: false,
  },
];

export default function NotificationCenter() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all"); // "all" | "comment" | "announcement" | "academic"
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);

  const dropdownRef = useRef(null);

  // Sync with backend on mount, user change, or dropdown open for cross-device persistence
  useEffect(() => {
    if (!user) return;
    getNotificationState()
      .then((state) => {
        if (state?.read_notification_ids) {
          const readSet = new Set(state.read_notification_ids.map(String));
          setNotifications((prev) =>
            prev.map((n) => ({
              ...n,
              read: readSet.has(String(n.id)),
            })),
          );
        }
      })
      .catch((err) => {
        console.error("Notification state load error:", err);
      });
  }, [user?.id, isOpen]);

  useEffect(() => {
    localStorage.setItem(
      "student_brain_notifications_v4",
      JSON.stringify(notifications),
    );
  }, [notifications]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [prefVersion, setPrefVersion] = useState(0);

  useEffect(() => {
    function handlePrefUpdate() {
      setPrefVersion((v) => v + 1);
    }
    window.addEventListener("notificationPreferencesUpdated", handlePrefUpdate);
    return () =>
      window.removeEventListener(
        "notificationPreferencesUpdated",
        handlePrefUpdate,
      );
  }, []);

  const enabledNotifications = notifications.filter((n) => {
    if (
      n.category === "announcement" &&
      localStorage.getItem("student_brain_notif_announcements") === "false"
    ) {
      return false;
    }
    if (
      n.category === "comment" &&
      localStorage.getItem("student_brain_notif_comments") === "false"
    ) {
      return false;
    }
    if (
      n.category === "academic" &&
      localStorage.getItem("student_brain_notif_academic") === "false"
    ) {
      return false;
    }
    return true;
  });

  const unreadCount = enabledNotifications.filter((n) => !n.read).length;

  const countByTab = {
    all: enabledNotifications.length,
    comment: enabledNotifications.filter((n) => n.tab === "comment").length,
    announcement: enabledNotifications.filter((n) => n.tab === "announcement")
      .length,
    academic: enabledNotifications.filter((n) => n.tab === "academic").length,
  };

  function handleMarkAllRead(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const allIds = notifications.map((n) => n.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    saveNotificationState({
      mark_all: true,
      all_ids: allIds,
    }).catch(() => {});
  }

  // Direct seamless navigation to destination page
  function handleOpenDestination(notif, e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // Mark as read locally and in backend
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n)),
    );
    saveNotificationState({ read_id: notif.id }).catch(() => {});

    // Close notification dropdown immediately
    setIsOpen(false);

    // Navigate cleanly to the destination route
    if (notif.link) {
      navigate(notif.link);
    }
  }

  function handleDismiss(id, e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }

  const displayedList =
    activeTab === "all"
      ? enabledNotifications
      : enabledNotifications.filter((n) => n.tab === activeTab);

  return (
    <div className="notif-center-wrapper" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <motion.button
        type="button"
        whileTap={{ scale: 0.92 }}
        className="notif-bell-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
        title="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="notif-badge-bubble"
          >
            {unreadCount}
          </motion.span>
        )}
      </motion.button>

      {/* Floating Notification Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="notif-dropdown-panel"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="notif-panel-header">
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <h3 className="notif-panel-title">Notifications</h3>
                {unreadCount > 0 && (
                  <span
                    className="notif-tab-count-pill"
                    style={{ fontSize: "0.75rem" }}
                  >
                    {unreadCount} new
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={handleMarkAllRead}
                className="notif-mark-read-btn"
                disabled={unreadCount === 0}
                style={{
                  opacity: unreadCount === 0 ? 0.6 : 1,
                  cursor: unreadCount === 0 ? "default" : "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                }}
                title="Mark all notifications as read"
              >
                <CheckCheck size={14} />
                <span>{unreadCount > 0 ? "Mark all as read" : "All read"}</span>
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="notif-filters-bar">
              <button
                type="button"
                className={`notif-tab-item ${activeTab === "all" ? "tab-item-active" : ""}`}
                onClick={() => setActiveTab("all")}
              >
                <span>All</span>
                <span className="notif-tab-count-pill">{countByTab.all}</span>
              </button>

              <button
                type="button"
                className={`notif-tab-item ${activeTab === "comment" ? "tab-item-active" : ""}`}
                onClick={() => setActiveTab("comment")}
              >
                <span>Comment</span>
                {countByTab.comment > 0 && (
                  <span className="notif-tab-count-pill">
                    {countByTab.comment}
                  </span>
                )}
              </button>

              <button
                type="button"
                className={`notif-tab-item ${activeTab === "announcement" ? "tab-item-active" : ""}`}
                onClick={() => setActiveTab("announcement")}
              >
                <span>Status</span>
                {countByTab.announcement > 0 && (
                  <span className="notif-tab-count-pill">
                    {countByTab.announcement}
                  </span>
                )}
              </button>

              <button
                type="button"
                className={`notif-tab-item ${activeTab === "academic" ? "tab-item-active" : ""}`}
                onClick={() => setActiveTab("academic")}
              >
                <span>Resolved</span>
                {countByTab.academic > 0 && (
                  <span className="notif-tab-count-pill">
                    {countByTab.academic}
                  </span>
                )}
              </button>
            </div>

            {/* Notifications List */}
            <div className="notif-items-list">
              {displayedList.length === 0 ? (
                <div className="notif-empty-state">
                  <Bell size={22} className="text-muted" />
                  <p>No notifications in this category.</p>
                </div>
              ) : (
                displayedList.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={(e) => handleOpenDestination(notif, e)}
                    className={`notif-card-row ${notif.read ? "row-read" : "row-unread"}`}
                  >
                    {/* Left Date Badge */}
                    <div className="notif-date-badge-col">
                      <div className="notif-date-badge-box">
                        <span className="date-num">{notif.day}</span>
                        <span className="date-sub">{notif.month}</span>
                      </div>
                    </div>

                    {/* Content Column */}
                    <div className="notif-card-body-col">
                      <div className="notif-card-heading-row">
                        <strong className="notif-card-title">
                          {notif.title}
                        </strong>
                        <button
                          type="button"
                          className="notif-row-dismiss-btn"
                          onClick={(e) => handleDismiss(notif.id, e)}
                          title="Dismiss"
                        >
                          ✕
                        </button>
                      </div>

                      <p className="notif-card-desc-text">{notif.message}</p>

                      <div className="notif-card-footer-row">
                        <span className="notif-card-timestamp">
                          {notif.dateFormatted}
                        </span>
                      </div>

                      {/* Purple "Open" Button */}
                      <div className="notif-card-action-bar">
                        <button
                          type="button"
                          className="notif-purple-open-btn"
                          onClick={(e) => handleOpenDestination(notif, e)}
                        >
                          Open
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Panel Footer */}
            <div
              style={{
                padding: "10px 16px",
                borderTop: "1px solid var(--color-border-subtle)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "var(--color-surface-subtle, rgba(0,0,0,0.02))",
              }}
            >
              <span
                style={{
                  fontSize: "0.8rem",
                  color: "var(--color-text-muted)",
                }}
              >
                {unreadCount > 0
                  ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
                  : "All caught up!"}
              </span>
              <button
                type="button"
                onClick={handleMarkAllRead}
                disabled={unreadCount === 0}
                style={{
                  background:
                    unreadCount > 0
                      ? "var(--color-primary-subtle, rgba(99, 102, 241, 0.1))"
                      : "transparent",
                  border:
                    unreadCount > 0
                      ? "1px solid var(--color-primary, #6366f1)"
                      : "1px solid transparent",
                  color:
                    unreadCount > 0
                      ? "var(--color-primary, #6366f1)"
                      : "var(--color-text-muted)",
                  fontWeight: 600,
                  fontSize: "0.8rem",
                  padding: "4px 10px",
                  borderRadius: "6px",
                  cursor: unreadCount === 0 ? "default" : "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "all 0.15s ease",
                }}
                title="Mark all notifications as read"
              >
                <CheckCheck size={14} />
                <span>Mark all as read</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
