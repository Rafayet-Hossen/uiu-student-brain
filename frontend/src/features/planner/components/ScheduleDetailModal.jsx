import Badge from "../../../components/Badge";
import Button from "../../../components/Button";

export default function ScheduleDetailModal({
  schedule,
  onClose,
  onEdit,
  onDelete,
  onGoToPlanner,
}) {
  if (!schedule) return null;

  const calculateDuration = (start, end) => {
    if (!start || !end) return "";
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    const diff = eh * 60 + em - (sh * 60 + sm);
    if (diff <= 0) return "";
    const hours = Math.floor(diff / 60);
    const mins = diff % 60;
    if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
    if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""}`;
    return `${mins} mins`;
  };

  const getDeadlineInfo = (deadlineStr) => {
    if (!deadlineStr) return null;
    const deadlineDate = new Date(deadlineStr + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));
    return {
      dateStr: deadlineDate.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      diffDays,
    };
  };

  const deadlineInfo = getDeadlineInfo(schedule.deadline);
  const duration = calculateDuration(schedule.start_time, schedule.end_time);
  const getResourcesSafe = (res) => {
    if (Array.isArray(res)) return res;
    if (typeof res === "string") {
      try {
        const parsed = JSON.parse(res);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        return [];
      }
    }
    return [];
  };
  const resources = getResourcesSafe(schedule.resources);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content-card"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "520px" }}
      >
        <div className="modal-header-row">
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "1.5rem" }}>📅</span>
            <div>
              <h3 className="modal-title">{schedule.subject}</h3>
              <span className="modal-subtitle">Study Routine Block</span>
            </div>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="modal-body-content">
          {/* Time & Duration */}
          <div className="modal-info-row">
            <span className="modal-info-label">⏰ Time Slot:</span>
            <span className="modal-info-value">
              <strong>
                {schedule.start_time.slice(0, 5)} –{" "}
                {schedule.end_time.slice(0, 5)}
              </strong>{" "}
              {duration && <Badge variant="accent">{duration}</Badge>}
            </span>
          </div>

          {/* Days */}
          <div className="modal-info-row">
            <span className="modal-info-label">🗓️ Recurring Days:</span>
            <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
              {schedule.days?.map((day) => (
                <Badge key={day} variant="default">
                  {day}
                </Badge>
              ))}
            </div>
          </div>

          {/* Deadline */}
          {deadlineInfo && (
            <div className="modal-info-row">
              <span className="modal-info-label">🎯 Target Deadline:</span>
              <div
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <span>{deadlineInfo.dateStr}</span>
                {deadlineInfo.diffDays >= 0 ? (
                  <Badge
                    variant={
                      deadlineInfo.diffDays <= 3
                        ? "danger"
                        : deadlineInfo.diffDays <= 7
                          ? "warning"
                          : "success"
                    }
                  >
                    {deadlineInfo.diffDays === 0
                      ? "Today"
                      : deadlineInfo.diffDays === 1
                        ? "Tomorrow"
                        : `${deadlineInfo.diffDays} days left`}
                  </Badge>
                ) : (
                  <Badge variant="default">Past Deadline</Badge>
                )}
              </div>
            </div>
          )}

          {/* Notes & Agenda */}
          {schedule.notes && (
            <div
              style={{
                marginTop: "16px",
                padding: "12px 14px",
                background: "var(--color-surface-subtle)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--color-border)",
              }}
            >
              <div
                style={{
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  color: "var(--color-text-muted)",
                  marginBottom: "6px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span>📝</span>
                <span>Study Notes & Syllabus Agenda</span>
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: "0.875rem",
                  color: "var(--color-text)",
                  lineHeight: 1.5,
                  whiteSpace: "pre-wrap",
                }}
              >
                {schedule.notes}
              </p>
            </div>
          )}

          {/* Attached Learning Resources */}
          {resources.length > 0 && (
            <div style={{ marginTop: "16px" }}>
              <div
                style={{
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  color: "var(--color-text-muted)",
                  marginBottom: "8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span>🔗</span>
                <span>Attached Learning Resources ({resources.length})</span>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                {resources.map((res, idx) => (
                  <a
                    key={idx}
                    href={res.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 14px",
                      background: "var(--color-surface-subtle)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "var(--radius-md)",
                      textDecoration: "none",
                      color: "inherit",
                      transition: "all 0.15s ease-in-out",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "var(--color-accent)";
                      e.currentTarget.style.background = "var(--color-surface)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "var(--color-border)";
                      e.currentTarget.style.background =
                        "var(--color-surface-subtle)";
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        overflow: "hidden",
                      }}
                    >
                      <span style={{ fontSize: "1.125rem" }}>
                        {res.type === "drive"
                          ? "📁"
                          : res.type === "video"
                            ? "🎥"
                            : res.type === "doc"
                              ? "📄"
                              : "🔗"}
                      </span>
                      <div style={{ overflow: "hidden" }}>
                        <strong
                          style={{
                            display: "block",
                            fontSize: "0.875rem",
                            color: "var(--color-text)",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {res.title}
                        </strong>
                        <span
                          style={{
                            display: "block",
                            fontSize: "0.75rem",
                            color: "var(--color-text-muted)",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {res.url}
                        </span>
                      </div>
                    </div>

                    <Badge
                      variant={
                        res.type === "drive"
                          ? "primary"
                          : res.type === "video"
                            ? "danger"
                            : res.type === "doc"
                              ? "success"
                              : "default"
                      }
                      style={{
                        fontSize: "0.75rem",
                        textTransform: "capitalize",
                      }}
                    >
                      {res.type === "drive"
                        ? "Google Drive"
                        : res.type === "video"
                          ? "Video Lecture"
                          : res.type === "doc"
                            ? "Document"
                            : "Web Link"}{" "}
                      ↗
                    </Badge>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer-row">
          {onDelete ? (
            <Button
              size="sm"
              variant="danger"
              onClick={() => {
                onClose();
                onDelete(schedule.id);
              }}
            >
              🗑️ Delete
            </Button>
          ) : (
            <div />
          )}

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {onGoToPlanner && (
              <Button
                size="sm"
                variant="primary"
                onClick={() => {
                  onClose();
                  onGoToPlanner(schedule);
                }}
              >
                🔗 Open in Routine Planner
              </Button>
            )}

            <Button size="sm" variant="secondary" onClick={onClose}>
              Close
            </Button>

            {onEdit && (
              <Button
                size="sm"
                variant="primary"
                onClick={() => {
                  onClose();
                  onEdit(schedule);
                }}
              >
                ✏️ Edit Routine
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
