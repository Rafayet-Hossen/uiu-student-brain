import { useState } from "react";
import Badge from "../../../components/Badge";
import Button from "../../../components/Button";
import ScheduleDetailModal from "./ScheduleDetailModal";

const ALL_DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

// Vibrant academic color palettes for subject blocks
const SUBJECT_COLORS = [
  {
    bg: "rgba(37, 99, 235, 0.12)",
    border: "#2563eb",
    text: "#1d4ed8",
    badge: "primary",
    accent: "#2563eb",
  },
  {
    bg: "rgba(16, 185, 129, 0.12)",
    border: "#10b981",
    text: "#065f46",
    badge: "success",
    accent: "#10b981",
  },
  {
    bg: "rgba(245, 158, 11, 0.12)",
    border: "#f59e0b",
    text: "#92400e",
    badge: "warning",
    accent: "#f59e0b",
  },
  {
    bg: "rgba(139, 92, 246, 0.12)",
    border: "#8b5cf6",
    text: "#5b21b6",
    badge: "accent",
    accent: "#8b5cf6",
  },
  {
    bg: "rgba(244, 63, 94, 0.12)",
    border: "#f43f5e",
    text: "#9f1239",
    badge: "danger",
    accent: "#f43f5e",
  },
  {
    bg: "rgba(6, 182, 212, 0.12)",
    border: "#06b6d4",
    text: "#155e75",
    badge: "accent",
    accent: "#06b6d4",
  },
  {
    bg: "rgba(234, 88, 12, 0.12)",
    border: "#ea580c",
    text: "#9a3412",
    badge: "warning",
    accent: "#ea580c",
  },
];

function getSubjectColor(subject) {
  if (!subject) return SUBJECT_COLORS[0];
  let hash = 0;
  for (let i = 0; i < subject.length; i++) {
    hash = subject.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % SUBJECT_COLORS.length;
  return SUBJECT_COLORS[index];
}

function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + (m || 0);
}

export default function CalendarView({
  schedules,
  onEditSchedule,
  onDeleteSchedule,
  onSlotClick,
}) {
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0); // 0 = current week, -1 = last week, +1 = next week
  const [selectedSchedule, setSelectedSchedule] = useState(null);

  // Calculate week dates starting from Sunday of the active week
  const today = new Date();
  const currentDayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ...
  
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - currentDayOfWeek + currentWeekOffset * 7);
  startOfWeek.setHours(0, 0, 0, 0);

  const weekDays = ALL_DAYS.map((dayName, idx) => {
    const dayDate = new Date(startOfWeek);
    dayDate.setDate(startOfWeek.getDate() + idx);
    const isToday =
      dayDate.toDateString() === today.toDateString() && currentWeekOffset === 0;

    return {
      dayName,
      date: dayDate,
      dateFormatted: dayDate.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
      dayNumber: dayDate.getDate(),
      isToday,
    };
  });

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);

  const weekRangeLabel = `${startOfWeek.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })} – ${endOfWeek.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;

  // Time Axis configuration (from 07:00 to 22:00)
  const START_HOUR = 7;
  const END_HOUR = 22;
  const TOTAL_HOURS = END_HOUR - START_HOUR;
  const HOUR_HEIGHT = 64; // pixels per hour
  const PIXELS_PER_MINUTE = HOUR_HEIGHT / 60;

  const hoursArray = Array.from(
    { length: TOTAL_HOURS + 1 },
    (_, i) => START_HOUR + i,
  );

  // Group schedules by day
  const schedulesByDay = {};
  ALL_DAYS.forEach((d) => (schedulesByDay[d] = []));

  let totalWeeklyMinutes = 0;
  const activeSubjectsSet = new Set();

  schedules.forEach((sch) => {
    activeSubjectsSet.add(sch.subject);
    const dur = timeToMinutes(sch.end_time) - timeToMinutes(sch.start_time);
    sch.days?.forEach((d) => {
      if (schedulesByDay[d]) {
        schedulesByDay[d].push(sch);
        totalWeeklyMinutes += Math.max(0, dur);
      }
    });
  });

  // Calculate planned hours per day
  const dailyHoursMap = {};
  ALL_DAYS.forEach((d) => {
    const dayMins = schedulesByDay[d].reduce((acc, sch) => {
      return (
        acc + Math.max(0, timeToMinutes(sch.end_time) - timeToMinutes(sch.start_time))
      );
    }, 0);
    dailyHoursMap[d] = (dayMins / 60).toFixed(1);
  });

  // Current time position (for red indicator line)
  const now = new Date();
  const currentMinutesFromStart =
    now.getHours() * 60 + now.getMinutes() - START_HOUR * 60;
  const showCurrentTimeLine =
    currentWeekOffset === 0 &&
    now.getHours() >= START_HOUR &&
    now.getHours() <= END_HOUR;
  const currentTimeTop = Math.max(
    0,
    currentMinutesFromStart * PIXELS_PER_MINUTE,
  );

  return (
    <div className="planner-calendar-container">
      {/* Calendar Header / Navigation Bar */}
      <div className="calendar-header-bar">
        <div className="calendar-nav-controls">
          <div className="week-switch-buttons">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setCurrentWeekOffset((prev) => prev - 1)}
            >
              ◀ Prev Week
            </Button>
            <Button
              size="sm"
              variant={currentWeekOffset === 0 ? "primary" : "secondary"}
              onClick={() => setCurrentWeekOffset(0)}
            >
              Today
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setCurrentWeekOffset((prev) => prev + 1)}
            >
              Next Week ▶
            </Button>
          </div>

          <h2 className="calendar-range-title">
            <span>🗓️</span>
            <span>{weekRangeLabel}</span>
          </h2>
        </div>

        {/* Quick Weekly Statistics Pills */}
        <div className="calendar-summary-chips">
          <span className="cal-stat-chip">
            ⏱️ <strong>{(totalWeeklyMinutes / 60).toFixed(1)} hrs</strong> planned
          </span>
          <span className="cal-stat-chip">
            📚 <strong>{activeSubjectsSet.size}</strong> courses
          </span>
          <span className="cal-stat-chip">
            🎯 <strong>{schedules.length}</strong> routines
          </span>
        </div>
      </div>

      {/* Main Calendar Grid */}
      <div className="calendar-grid-wrapper">
        <div className="calendar-scroll-area">
          {/* Day Headers Row */}
          <div className="calendar-days-header-row">
            {/* Empty corner cell above time column */}
            <div className="time-axis-header-cell">
              <span className="time-zone-label">GMT+6</span>
            </div>

            {/* 7 Day Column Headers */}
            {weekDays.map((day) => (
              <div
                key={day.dayName}
                className={`day-header-cell ${
                  day.isToday ? "day-header-today" : ""
                }`}
              >
                <div className="day-name-row">
                  <span className="day-name-label">{day.dayName.slice(0, 3)}</span>
                  <span
                    className={`day-date-number ${
                      day.isToday ? "date-number-today" : ""
                    }`}
                  >
                    {day.dayNumber}
                  </span>
                </div>
                <div className="day-hours-pill">
                  {dailyHoursMap[day.dayName] > 0
                    ? `${dailyHoursMap[day.dayName]} hrs`
                    : "No routines"}
                </div>
              </div>
            ))}
          </div>

          {/* Timetable Body (Time Axis + 7 Day Columns) */}
          <div
            className="calendar-body-grid"
            style={{ height: `${TOTAL_HOURS * HOUR_HEIGHT}px` }}
          >
            {/* Left Time Axis */}
            <div className="calendar-time-axis">
              {hoursArray.map((hour) => {
                const hourFormatted = `${hour.toString().padStart(2, "0")}:00`;
                return (
                  <div
                    key={hour}
                    className="time-axis-slot"
                    style={{ height: `${HOUR_HEIGHT}px` }}
                  >
                    <span className="time-axis-label">{hourFormatted}</span>
                  </div>
                );
              })}
            </div>

            {/* 7 Day Event Lanes */}
            <div className="calendar-lanes-container">
              {weekDays.map((day, dayIndex) => {
                const daySchedules = schedulesByDay[day.dayName] || [];

                return (
                  <div
                    key={day.dayName}
                    className={`calendar-day-lane ${
                      day.isToday ? "lane-today" : ""
                    }`}
                    onClick={(e) => {
                      // Click on empty space in lane triggers quick add
                      if (e.target === e.currentTarget && onSlotClick) {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const clickY = e.clientY - rect.top;
                        const clickedHour =
                          START_HOUR + Math.floor(clickY / HOUR_HEIGHT);
                        const safeHour = Math.min(
                          Math.max(clickedHour, START_HOUR),
                          END_HOUR - 1,
                        );
                        onSlotClick(day.dayName, safeHour);
                      }
                    }}
                  >
                    {/* Background Hour Lines */}
                    {hoursArray.slice(0, -1).map((hour) => (
                      <div
                        key={hour}
                        className="lane-hour-row"
                        style={{ height: `${HOUR_HEIGHT}px` }}
                      >
                        <div className="lane-half-hour-line" />
                      </div>
                    ))}

                    {/* Live Current Time Line */}
                    {day.isToday && showCurrentTimeLine && (
                      <div
                        className="current-time-indicator-line"
                        style={{ top: `${currentTimeTop}px` }}
                      >
                        <span className="current-time-dot" />
                      </div>
                    )}

                    {/* Blocked Schedule Cards for this day */}
                    {daySchedules.map((schedule) => {
                      const startMins = timeToMinutes(schedule.start_time);
                      const endMins = timeToMinutes(schedule.end_time);

                      const topMinutes = Math.max(
                        0,
                        startMins - START_HOUR * 60,
                      );
                      const durationMinutes = Math.max(30, endMins - startMins);

                      const topPx = topMinutes * PIXELS_PER_MINUTE;
                      const heightPx = Math.max(
                        42,
                        durationMinutes * PIXELS_PER_MINUTE - 4,
                      );

                      const colorTheme = getSubjectColor(schedule.subject);
                      const durationHours = (durationMinutes / 60).toFixed(1);

                      return (
                        <div
                          key={`${schedule.id}-${day.dayName}`}
                          className="calendar-time-block"
                          style={{
                            top: `${topPx}px`,
                            height: `${heightPx}px`,
                            backgroundColor: colorTheme.bg,
                            borderLeft: `4px solid ${colorTheme.accent}`,
                            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSchedule(schedule);
                          }}
                        >
                          <div className="time-block-header">
                            <h4
                              className="time-block-subject"
                              style={{ color: colorTheme.text }}
                            >
                              {schedule.subject}
                            </h4>
                          </div>

                          <div className="time-block-meta">
                            <span
                              className="time-block-time-pill"
                              style={{
                                color: colorTheme.text,
                                background: "rgba(255,255,255,0.7)",
                              }}
                            >
                              ⏰ {schedule.start_time.slice(0, 5)}–{schedule.end_time.slice(0, 5)}
                            </span>

                            {heightPx >= 60 && (
                              <span className="time-block-dur-pill">
                                {durationHours}h
                              </span>
                            )}
                          </div>

                          {schedule.deadline && heightPx >= 75 && (
                            <div className="time-block-deadline">
                              🎯 Due {schedule.deadline.slice(5)}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Detail Popover Modal when time block is clicked */}
      {selectedSchedule && (
        <ScheduleDetailModal
          schedule={selectedSchedule}
          onClose={() => setSelectedSchedule(null)}
          onEdit={(sch) => {
            setSelectedSchedule(null);
            onEditSchedule(sch);
          }}
          onDelete={(id) => {
            setSelectedSchedule(null);
            onDeleteSchedule(id);
          }}
        />
      )}
    </div>
  );
}

