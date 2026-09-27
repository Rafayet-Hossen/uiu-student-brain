import { Link } from "react-router-dom";
import { GraduationCap } from "lucide-react";
import Badge from "../../../components/Badge";

export default function GpaTrajectoryCard({ gpaSummary }) {
  if (!gpaSummary) {
    return (
      <div className="analytics-card">
        <div className="analytics-card-header">
          <div className="analytics-card-header-left">
            <h3 className="analytics-card-title">
              <span className="analytics-card-icon-pill icon-amber">
                <GraduationCap size={17} />
              </span>
              <span>Academic GPA Forecast</span>
            </h3>
            <p className="analytics-card-desc">
              Degree projection and honors target model.
            </p>
          </div>
          <Link to="/grades" className="text-primary text-xs font-semibold hover:underline">
            Configure Goal →
          </Link>
        </div>
        <div className="empty-chart-placeholder">
          <p className="text-muted text-sm">No grade plan configured yet. Set a target GPA in Grade Planner to view projection analytics.</p>
        </div>
      </div>
    );
  }

  const plan_name = gpaSummary.plan_name || "Academic Degree Plan";
  const current_gpa = Number(gpaSummary.current_gpa) || 0;
  const target_gpa = Number(gpaSummary.target_gpa) || 0;
  const completed_credits = Number(gpaSummary.completed_credits) || 0;
  const total_credits = Number(gpaSummary.total_credits) || 0;
  const remaining_credits = Number(gpaSummary.remaining_credits) || 0;
  const required_gpa = gpaSummary.required_gpa !== null && gpaSummary.required_gpa !== undefined
    ? Number(gpaSummary.required_gpa)
    : null;
  const possible = Boolean(gpaSummary.possible);
  const percent_complete = Math.min(100, Math.max(0, Number(gpaSummary.percent_complete) || 0));

  return (
    <div className="analytics-card">
      <div className="analytics-card-header">
        <div className="analytics-card-header-left">
          <h3 className="analytics-card-title">
            <span className="analytics-card-icon-pill icon-amber">
              <GraduationCap size={17} />
            </span>
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
