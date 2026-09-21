import { useEffect, useRef, useState, useCallback } from "react";
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
    link: "/study-center?tab=materials",
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

function normalizeNotification(n, readSet) {
  const isRead = Boolean(n.is_read) || (readSet && readSet.has(String(n.id)));
  const dateObj = n.created_at ? new Date(n.created_at) : new Date();
  const day = String(dateObj.getDate()).padStart(2, "0");
  const month = dateObj.toLocaleString("en-US", { month: "short" });

  let tab = "all";
  if (n.category === "comment" || n.category === "reaction") tab = "comment";
  else if (n.category === "announcement" || n.category === "event")
    tab = "announcement";
  else if (
    n.category === "academic" ||
    n.category === "session" ||
    n.category === "milestone"
  )
    tab = "academic";

  return {
    id: n.id,
    category: n.category || "system",
    tab,
    day,
    month,
    dateFormatted: `${day} ${month} • ${(n.category || "NOTIFICATION").toUpperCase()}`,
    title: n.title,
    message: n.message,
    link: n.link || "/study-center?tab=tracker",
    read: Boolean(isRead),
    metadata: n.metadata || {},
    sender_name: n.sender_name,
  };
}

function getStoredNotifications() {
  try {
    const savedReadIds = localStorage.getItem(
      "student_brain_read_notification_ids",
    );
    const readSet = savedReadIds
      ? new Set((JSON.parse(savedReadIds) || []).map(String))
      : new Set();

    const cachedNotifs = localStorage.getItem(
      "student_brain_cached_notifications",
    );
    if (cachedNotifs) {
      const parsed = JSON.parse(cachedNotifs);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((n) => ({
          ...n,
          read: Boolean(n.read || readSet.has(String(n.id))),
        }));
      }
    }

    if (savedReadIds && readSet.size > 0) {
      return INITIAL_NOTIFICATIONS.map((n) => ({
        ...n,
        read: readSet.has(String(n.id)),
      }));
    }
  } catch (e) {
    console.error("Failed to parse stored notification ids:", e);
  }
  return INITIAL_NOTIFICATIONS;
}

export default function NotificationCenter() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all"); // "all" | "comment" | "announcement" | "academic"
  const [notifications, setNotifications] = useState(getStoredNotifications);

  const dropdownRef = useRef(null);

  // Sync with backend on mount, user change, or dropdown open for cross-device persistence
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const state = await getNotificationState();
      if (
        state?.notifications &&
        Array.isArray(state.notifications) &&
        state.notifications.length > 0
      ) {
        const readSet = new Set(
          (state.read_notification_ids || []).map(String),
        );
        const mapped = state.notifications.map((n) =>
          normalizeNotification(n, readSet),
        );
        setNotifications(mapped);
        try {
          localStorage.setItem(
            "student_brain_cached_notifications",
            JSON.stringify(mapped),
          );
        } catch {}
      } else if (
        state?.read_notification_ids &&
        Array.isArray(state.read_notification_ids)
      ) {
        const readSet = new Set(state.read_notification_ids.map(String));
        setNotifications((prev) => {
          const updated = prev.map((n) => ({
            ...n,
            read: readSet.has(String(n.id)),
          }));
          try {
            localStorage.setItem(
              "student_brain_cached_notifications",
              JSON.stringify(updated),
            );
          } catch {}
          return updated;
        });
      }
    } catch (err) {
      console.error("Notification state load error:", err);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 25000);
    return () => clearInterval(interval);
  }, [fetchNotifications, isOpen]);

  // Keep all pages, tabs, and components 100% synchronized in real time
  useEffect(() => {
    function handleSync(e) {
      const readIds = e?.detail?.readIds;
      if (Array.isArray(readIds)) {
        const readSet = new Set(readIds.map(String));
        setNotifications((prev) => {
          const updated = prev.map((n) => ({
            ...n,
            read: readSet.has(String(n.id)),
          }));
          try {
            localStorage.setItem(
              "student_brain_cached_notifications",
              JSON.stringify(updated),
            );
          } catch {}
          return updated;
        });
      }
    }

    function handleStorageChange(e) {
      if (e.key === "student_brain_read_notification_ids") {
        try {
          const parsed = JSON.parse(e.newValue || "[]");
          if (Array.isArray(parsed)) {
            const readSet = new Set(parsed.map(String));
            setNotifications((prev) => {
              const updated = prev.map((n) => ({
                ...n,
                read: readSet.has(String(n.id)),
              }));
              try {
                localStorage.setItem(
                  "student_brain_cached_notifications",
                  JSON.stringify(updated),
                );
              } catch {}
              return updated;
            });
          }
        } catch {}
      }
    }

    window.addEventListener("studentBrainNotificationsChanged", handleSync);
    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener(
        "studentBrainNotificationsChanged",
        handleSync,
      );
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

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

  async function handleMarkAllRead(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const allIds = notifications.map((n) => String(n.id));

    // 1. Immediately update local state & cache
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }));
      try {
        localStorage.setItem(
          "student_brain_cached_notifications",
          JSON.stringify(updated),
        );
      } catch {}
      return updated;
    });

    // 2. Persist to localStorage synchronously
    try {
      localStorage.setItem(
        "student_brain_read_notification_ids",
        JSON.stringify(allIds),
      );
    } catch {}

    // 3. Broadcast real-time event across current window
    window.dispatchEvent(
      new CustomEvent("studentBrainNotificationsChanged", {
        detail: { readIds: allIds },
      }),
    );

    // 4. Save to backend database for cross-device persistence
    try {
      const resp = await saveNotificationState({
        mark_all: true,
        all_ids: allIds,
      });
      if (
        resp?.notifications &&
        Array.isArray(resp.notifications) &&
        resp.notifications.length > 0
      ) {
        const readSet = new Set(
          (resp.read_notification_ids || allIds).map(String),
        );
        const mapped = resp.notifications.map((n) =>
          normalizeNotification(n, readSet),
        );
        setNotifications(mapped);
        try {
          localStorage.setItem(
            "student_brain_cached_notifications",
            JSON.stringify(mapped),
          );
        } catch {}
      }
    } catch (err) {
      console.error("Backend notification sync error:", err);
    }
  }

  async function handleMarkSingleRead(id, e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const readId = String(id);
    let currentReadIds = [];
    try {
      const saved = localStorage.getItem("student_brain_read_notification_ids");
      currentReadIds = saved ? JSON.parse(saved) : [];
    } catch {}
    const updatedIds = Array.from(new Set([...currentReadIds, readId]));

    try {
      localStorage.setItem(
        "student_brain_read_notification_ids",
        JSON.stringify(updatedIds),
      );
    } catch {}

    setNotifications((prev) => {
      const updated = prev.map((n) =>
        String(n.id) === readId ? { ...n, read: true } : n,
      );
      try {
        localStorage.setItem(
          "student_brain_cached_notifications",
          JSON.stringify(updated),
        );
      } catch {}
      return updated;
    });

    window.dispatchEvent(
      new CustomEvent("studentBrainNotificationsChanged", {
        detail: { readIds: updatedIds },
      }),
    );

    try {
      const resp = await saveNotificationState({ read_id: readId });
      if (
        resp?.notifications &&
        Array.isArray(resp.notifications) &&
        resp.notifications.length > 0
      ) {
        const readSet = new Set(
          (resp.read_notification_ids || updatedIds).map(String),
        );
        const mapped = resp.notifications.map((n) =>
          normalizeNotification(n, readSet),
        );
        setNotifications(mapped);
        try {
          localStorage.setItem(
            "student_brain_cached_notifications",
            JSON.stringify(mapped),
          );
        } catch {}
      }
    } catch (err) {
      console.error("Failed to mark single notif read in backend:", err);
    }
  }

  function handleMarkSingleUnread(id, e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const unreadId = String(id);
    let currentReadIds = [];
    try {
      const saved = localStorage.getItem("student_brain_read_notification_ids");
      currentReadIds = saved ? JSON.parse(saved) : [];
    } catch {}
    const updatedIds = currentReadIds.filter((x) => String(x) !== unreadId);

    try {
      localStorage.setItem(
        "student_brain_read_notification_ids",
        JSON.stringify(updatedIds),
      );
    } catch {}

    setNotifications((prev) => {
      const updated = prev.map((n) =>
        String(n.id) === unreadId ? { ...n, read: false } : n,
      );
      try {
        localStorage.setItem(
          "student_brain_cached_notifications",
          JSON.stringify(updated),
        );
      } catch {}
      return updated;
    });

    window.dispatchEvent(
      new CustomEvent("studentBrainNotificationsChanged", {
        detail: { readIds: updatedIds },
      }),
    );

    saveNotificationState({ unread_id: unreadId }).catch((err) => {
      console.error("Failed to mark single notif unread in backend:", err);
    });
  }

  // Direct seamless navigation to destination page
  function handleOpenDestination(notif, e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const readId = String(notif.id);
    let currentReadIds = [];
    try {
      const saved = localStorage.getItem("student_brain_read_notification_ids");
      currentReadIds = saved ? JSON.parse(saved) : [];
    } catch {}
    const updatedIds = Array.from(new Set([...currentReadIds, readId]));

    try {
      localStorage.setItem(
        "student_brain_read_notification_ids",
        JSON.stringify(updatedIds),
      );
    } catch {}

    // Mark as read locally
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n)),
    );

    // Broadcast change
    window.dispatchEvent(
      new CustomEvent("studentBrainNotificationsChanged", {
        detail: { readIds: updatedIds },
      }),
    );

    // Persist to backend
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
                  gap: "6px",
                  fontWeight: 600,
                }}
                title={
                  unreadCount > 0
                    ? "Mark all notifications as read"
                    : "All notifications are already marked as read"
                }
              >
                <CheckCheck size={14} />
                <span>Mark all as read</span>
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
                <span>Comments</span>
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
                <span>Announcements</span>
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
                <span>Academic</span>
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

                      {/* Action Bar: Open + Mark as read / Mark unread */}
                      <div
                        className="notif-card-action-bar"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          marginTop: "8px",
                        }}
                      >
                        <button
                          type="button"
                          className="notif-purple-open-btn"
                          onClick={(e) => handleOpenDestination(notif, e)}
                        >
                          Open
                        </button>

                        {!notif.read ? (
                          <button
                            type="button"
                            className="notif-card-mark-read-btn"
                            onClick={(e) => handleMarkSingleRead(notif.id, e)}
                            title="Mark this notification as read"
                          >
                            <CheckCheck size={13} />
                            <span>Mark as read</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="notif-card-mark-unread-btn"
                            onClick={(e) => handleMarkSingleUnread(notif.id, e)}
                            title="Mark this notification as unread"
                          >
                            <span>Mark unread</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Panel Footer - Clean status, NO duplicate button */}
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
                  : "All caught up! No unread notifications."}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
