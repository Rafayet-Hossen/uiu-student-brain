import { Sparkles, Calendar, Clock, Flame } from "lucide-react";
import FocusTimeline from "./FocusTimeline";
import DailyChallenge from "./DailyChallenge";
import WeeklyRing from "./WeeklyRing";
import UpcomingSchedule from "./UpcomingSchedule";
import QuoteCard from "./QuoteCard";

export default function TodayMattersSection({
  targetDayLabel,
  targetFormattedDate,
  dayHours,
  dayMins,
  dayTotalMinutes,
  flowDayOffset,
  setFlowDayOffset,
  daySessions,
  dayRoutines,
  onOpenScheduleModal,
  todayMinutes,
  weeklyHours,
  weeklyPercent,
  schedules,
  todayWeekdayName,
  quoteIndex,
  quotes,
  onNextQuote,
}) {
  return (
    <section className="dash-today-matters-section" aria-label="Today Matters">
      <div className="dash-today-header">
        <div className="dash-today-title-wrap">
          <div className="dash-section-pill">
            <Clock size={14} className="text-primary" />
            <span>Daily Academic Cadence</span>
          </div>
          <h2 className="dash-today-h2">Today Matters</h2>
          <p className="dash-today-desc">
            Organize real-time focus sessions, track routine schedules, and hit daily learning thresholds.
          </p>
        </div>
      </div>

      {/* Asymmetric Editorial Layout: Left (Large Focus Flow) + Right (Stacked Intelligence) */}
      <div className="dash-today-asymmetric-grid">
        {/* Left Column (Wide / Dominant): Focus Timeline */}
        <div className="dash-today-left-col">
          <FocusTimeline
            targetDayLabel={targetDayLabel}
            targetFormattedDate={targetFormattedDate}
            dayHours={dayHours}
            dayMins={dayMins}
            dayTotalMinutes={dayTotalMinutes}
            flowDayOffset={flowDayOffset}
            setFlowDayOffset={setFlowDayOffset}
            daySessions={daySessions}
            dayRoutines={dayRoutines}
            onOpenScheduleModal={onOpenScheduleModal}
          />
        </div>

        {/* Right Column (Stacked Dynamic Cards) */}
        <div className="dash-today-right-col">
          <div className="dash-today-dual-rings">
            {/* Daily Challenge Gamified Ring */}
            <DailyChallenge todayMinutes={todayMinutes} targetMinutes={45} xpReward={80} />

            {/* Weekly Progress Ring */}
            <WeeklyRing
              weeklyHours={weeklyHours}
              targetWeeklyHours={10}
              weeklyPercent={weeklyPercent}
            />
          </div>

          {/* Upcoming Next Classes */}
          <UpcomingSchedule
            schedules={schedules}
            todayWeekdayName={todayWeekdayName}
            onOpenScheduleModal={onOpenScheduleModal}
          />

          {/* Motivation Quote */}
          <QuoteCard
            quoteIndex={quoteIndex}
            quotes={quotes}
            onNextQuote={onNextQuote}
          />
        </div>
      </div>
    </section>
  );
}
