import Badge from "../../../components/Badge";
import Button from "../../../components/Button";
import Card from "../../../components/Card";

export default function ScheduleDetailModal({
  schedule,
  onClose,
  onEdit,
  onDelete,
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

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content-card"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "480px" }}
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
                {schedule.start_time.slice(0, 5)} – {schedule.end_time.slice(0, 5)}
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
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
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
        </div>

        <div className="modal-footer-row">
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

          <div style={{ display: "flex", gap: "8px" }}>
            <Button size="sm" variant="secondary" onClick={onClose}>
              Close
            </Button>
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
          </div>
        </div>
      </div>
    </div>
  );
}

