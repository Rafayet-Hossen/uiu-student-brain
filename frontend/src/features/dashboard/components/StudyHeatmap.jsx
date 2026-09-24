import { useMemo } from "react";
import { Flame } from "lucide-react";

export default function StudyHeatmap({ sessions = [] }) {
  const { weeks, monthLabels, totalActiveDays, totalMinutes } = useMemo(() => {
    // 30 weeks (~7 months) to completely fill the full box width from edge to edge
    const numWeeks = 30;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sessionsByDate = {};
    sessions.forEach((s) => {
      let dStr = s.session_date;
      if (!dStr && s.created_at) {
        dStr = s.created_at.slice(0, 10);
      }
      if (dStr) {
        if (!sessionsByDate[dStr]) sessionsByDate[dStr] = 0;
        sessionsByDate[dStr] += Number(s.duration_minutes || 0);
      }
    });

    const todayDayOfWeek = today.getDay(); // 0 is Sun, 6 is Sat
    // Total days to span numWeeks full weeks ending on this week's Saturday
    const daysRemainingInWeek = 6 - todayDayOfWeek;
    const totalDays = numWeeks * 7;
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - (totalDays - 1 - daysRemainingInWeek));

    const weekCols = [];
    let currentWeek = [];
    let activeDaysCount = 0;
    let sumMinutes = 0;

    for (let i = 0; i < totalDays; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const iso = d.toISOString().slice(0, 10);
      const isFuture = d > today;
      const mins = isFuture ? 0 : sessionsByDate[iso] || 0;

      if (!isFuture && mins > 0) {
        activeDaysCount++;
        sumMinutes += mins;
      }

      let level = 0;
      if (!isFuture) {
        if (mins > 0 && mins < 30) level = 1;
        else if (mins >= 30 && mins < 60) level = 2;
        else if (mins >= 60 && mins < 120) level = 3;
        else if (mins >= 120) level = 4;
      }

      const dateLabel = d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });

      currentWeek.push({
        date: iso,
        dateLabel,
        minutes: mins,
        level,
        isFuture,
        month: d.toLocaleDateString(undefined, { month: "short" }),
      });

      if (currentWeek.length === 7) {
        weekCols.push(currentWeek);
        currentWeek = [];
      }
    }

    // Determine month headers across the 30-week span
    const months = [];
    let lastMonth = "";
    weekCols.forEach((week) => {
      const firstValidDay = week[0];
      if (firstValidDay && firstValidDay.month !== lastMonth) {
        months.push({ text: firstValidDay.month });
        lastMonth = firstValidDay.month;
      }
    });

    return {
      weeks: weekCols,
      monthLabels: months,
      totalActiveDays: activeDaysCount,
      totalMinutes: sumMinutes,
    };
  }, [sessions]);

  return (
    <div className="dash-card-24 dash-heatmap-card">
      <div className="dash-section-header">
        <div className="dash-section-title-wrap">
          <h3 className="dash-section-h2">
            <Flame size={18} className="text-amber" />
            <span>Study Consistency</span>
          </h3>
          <p className="dash-section-desc">
            {totalActiveDays} active study days ({Math.round(totalMinutes / 60)}h total focus) recorded over the past 30 weeks
          </p>
        </div>
      </div>

      {/* Full-Width GitHub-style Contribution Matrix */}
      <div
        className="dash-github-heatmap-container"
        role="region"
        aria-label="Study Consistency Contribution Heatmap"
      >
        <div className="dash-github-heatmap-inner">
          {/* Month labels spanning the full width */}
          <div className="dash-github-months-row">
            {monthLabels.map((m, idx) => (
              <span key={idx}>{m.text}</span>
            ))}
          </div>

          <div className="dash-github-grid-body">
            <div className="dash-github-day-labels">
              <span>Mon</span>
              <span>Wed</span>
              <span>Fri</span>
            </div>
            <div className="dash-github-matrix">
              {weeks.map((week, wIdx) => (
                <div key={wIdx} className="dash-github-week-col">
                  {week.map((item) => (
                    <div
                      key={item.date}
                      className={`dash-github-cell gh-lvl-${item.level}`}
                      style={
                        item.isFuture ? { opacity: 0.2, cursor: "default" } : {}
                      }
                      title={
                        item.isFuture
                          ? `${item.dateLabel} (Future)`
                          : `${item.dateLabel}: ${
                              item.minutes > 0
                                ? `${item.minutes} mins studied`
                                : "No study recorded"
                            }`
                      }
                      aria-label={`${item.dateLabel}: ${item.minutes} minutes`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="dash-heatmap-legend">
        <span>Daily Intensity</span>
        <div className="dash-heatmap-scale">
          <span style={{ fontSize: "0.68rem" }}>Less</span>
          <span className="dash-heatmap-scale-dot gh-lvl-0" title="0 mins" />
          <span className="dash-heatmap-scale-dot gh-lvl-1" title="1-29 mins" />
          <span className="dash-heatmap-scale-dot gh-lvl-2" title="30-59 mins" />
          <span className="dash-heatmap-scale-dot gh-lvl-3" title="60-119 mins" />
          <span className="dash-heatmap-scale-dot gh-lvl-4" title="120+ mins" />
          <span style={{ fontSize: "0.68rem" }}>More</span>
        </div>
      </div>
    </div>
  );
}
