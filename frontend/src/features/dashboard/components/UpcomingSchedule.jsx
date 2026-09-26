import { useMemo } from "react";
import { Calendar, Clock } from "lucide-react";
import { Link } from "react-router-dom";

export default function UpcomingSchedule({
  schedules = [],
  todayWeekdayName,
  onOpenScheduleModal,
}) {
  const nextClasses = useMemo(() => {
    if (!schedules || schedules.length === 0) return [];

    // Sort today's classes first, then other classes
    const today = schedules.filter((s) => s.days?.includes(todayWeekdayName));
    const others = schedules.filter((s) => !s.days?.includes(todayWeekdayName));

    const combined = [...today, ...others];
    return combined.slice(0, 3);
  }, [schedules, todayWeekdayName]);

  return (
    <div className="dash-card-24 dash-upcoming-card">
      <div className="dash-section-header">
        <div className="dash-section-title-wrap">
          <h3 className="dash-section-h2">
            <Calendar size={18} className="text-primary" />
            <span>Upcoming Classes</span>
          </h3>
          <p className="dash-section-desc">
            Next lectures on your academic timetable
          </p>
        </div>
        <Link
          to="/planner"
          className="dash-bento-btn"
          style={{ fontSize: "0.72rem" }}
        >
          All ({schedules.length}) →
        </Link>
      </div>

      <div className="dash-upcoming-list">
        {nextClasses.length > 0 ? (
          nextClasses.map((item) => {
            const isToday = item.days?.includes(todayWeekdayName);
            const dayText = isToday ? "Today" : item.days?.[0] || "Weekly";
            return (
              <div
                key={item.id}
                className="dash-upcoming-card-item"
                onClick={() => onOpenScheduleModal && onOpenScheduleModal(item)}
                title="View class details"
              >
                <div className="dash-upcoming-left-info">
                  <strong className="dash-upcoming-subject-title">
                    {item.subject}
                  </strong>
                  <div className="dash-upcoming-time-wrap">
                    <Clock size={13} style={{ flexShrink: 0, opacity: 0.8 }} />
                    <span>
                      {item.start_time?.slice(0, 5)} –{" "}
                      {item.end_time?.slice(0, 5)}
                    </span>
                  </div>
                </div>
                <div className="dash-upcoming-right-badge">
                  <span
                    className={`dash-upcoming-day-badge ${
                      isToday
                        ? "dash-upcoming-badge-today"
                        : "dash-upcoming-badge-future"
                    }`}
                  >
                    {dayText}
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="dash-timeline-empty" style={{ padding: "16px 12px" }}>
            <span
              style={{ fontSize: "0.84rem", color: "var(--dash-text-muted)" }}
            >
              No upcoming classes scheduled yet.
            </span>
            <Link
              to="/planner"
              className="dash-bento-btn primary"
              style={{ marginTop: "8px" }}
            >
              + Add Class to Timetable
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
