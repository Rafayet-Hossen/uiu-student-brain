import Badge from "../../../components/Badge";

export default function ScheduleAdherenceCard({ adherence }) {
  if (!adherence) return null;

  const {
    active_schedules_count,
    scheduled_subjects,
    covered_subjects_this_week,
    adherence_rate,
  } = adherence;

  return (
    <div className="analytics-card">
      <div className="analytics-card-header">
        <div>
          <h3 className="analytics-card-title">
            <span>📅</span>
            <span>Routine Adherence</span>
          </h3>
          <p className="analytics-card-desc">
            Coverage of scheduled study routines during this week.
          </p>
        </div>
        <Badge
          variant={
            adherence_rate >= 80
              ? "success"
              : adherence_rate >= 50
              ? "accent"
              : "warning"
          }
        >
          {adherence_rate}% Coverage
        </Badge>
      </div>

      <div className="adherence-content">
        <div className="progress-header">
          <span>Weekly Routine Coverage</span>
          <span>
            {covered_subjects_this_week.length} of {scheduled_subjects.length}{" "}
            Courses
          </span>
        </div>
        <div className="progress-bar-track">
          <div
            className="progress-bar-fill"
            style={{ width: `${adherence_rate}%` }}
          />
        </div>

        <div className="adherence-subjects-wrap">
          {scheduled_subjects.map((sub) => {
            const covered = covered_subjects_this_week.includes(sub);
            return (
              <span
                key={sub}
                className={`adherence-chip ${
                  covered ? "chip-covered" : "chip-missed"
                }`}
              >
                {covered ? "✓" : "○"} {sub}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
