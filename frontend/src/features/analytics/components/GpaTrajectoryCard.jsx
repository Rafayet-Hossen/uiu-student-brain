import Badge from "../../../components/Badge";

export default function GpaTrajectoryCard({ gpaSummary }) {
  if (!gpaSummary) {
    return (
      <div className="analytics-card">
        <h3 className="analytics-card-title">
          <span>🎓</span>
          <span>Academic GPA Forecast</span>
        </h3>
        <p className="analytics-card-desc">
          No grade plan configured yet. Set a target GPA in Grade Planner to view projection analytics.
        </p>
      </div>
    );
  }

  const {
    plan_name,
    current_gpa,
    target_gpa,
    completed_credits,
    total_credits,
    remaining_credits,
    required_gpa,
    possible,
    percent_complete,
  } = gpaSummary;

  return (
    <div className="analytics-card">
      <div className="analytics-card-header">
        <div>
          <h3 className="analytics-card-title">
            <span>🎓</span>
            <span>Academic GPA Forecast</span>
          </h3>
          <p className="analytics-card-desc">
            Progress model for <strong>{plan_name}</strong>.
          </p>
        </div>
        <Badge variant={possible ? "success" : "danger"}>
          {possible ? "Target Achievable" : "Target Unreachable"}
        </Badge>
      </div>

      <div className="gpa-comparison-grid">
        <div className="gpa-comparison-box">
          <span className="gpa-comp-label">Current Cumulative</span>
          <span className="gpa-comp-val">{current_gpa.toFixed(2)}</span>
          <span className="gpa-comp-sub">{completed_credits} Credits Completed</span>
        </div>

        <div className="gpa-comparison-box gpa-target-box">
          <span className="gpa-comp-label">Degree Target</span>
          <span className="gpa-comp-val">{target_gpa.toFixed(2)}</span>
          <span className="gpa-comp-sub">{total_credits} Total Credits</span>
        </div>
      </div>

      {/* Credit Progress */}
      <div style={{ marginTop: "16px" }}>
        <div className="progress-header">
          <span>Degree Credit Progress</span>
          <span>
            {completed_credits} / {total_credits} cr ({percent_complete}%)
          </span>
        </div>
        <div className="progress-bar-track">
          <div
            className="progress-bar-fill"
            style={{ width: `${percent_complete}%` }}
          />
        </div>
      </div>

      {/* Required GPA analysis */}
      <div className="gpa-forecast-footer">
        {possible && required_gpa !== null ? (
          <p className="forecast-message">
            ⚡ Maintain at least <strong>{required_gpa.toFixed(2)} GPA</strong> across the remaining <strong>{remaining_credits} credits</strong> to graduate with your target GPA.
          </p>
        ) : (
          <p className="forecast-message forecast-warning">
            ⚠️ Target GPA requires a GPA higher than 4.0 on remaining credits. Consider recalibrating your target GPA in Grade Planner.
          </p>
        )}
      </div>
    </div>
  );
}
