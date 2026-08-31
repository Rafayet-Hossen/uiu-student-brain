import { useState } from "react";
import Badge from "../../../components/Badge";
import Button from "../../../components/Button";
import Input from "../../../components/Input";
import { toggleLeaderboardOptIn } from "../api";

export default function LeaderboardOptInCard({
  isOptedIn,
  currentQuote,
  currentUserEntry,
  onOptInChange,
}) {
  const [editing, setEditing] = useState(false);
  const [optedIn, setOptedIn] = useState(Boolean(isOptedIn));
  const [quoteInput, setQuoteInput] = useState(currentQuote || "");
  const [saving, setSaving] = useState(false);

  async function handleToggleOptIn(newStatus) {
    setSaving(true);
    try {
      await toggleLeaderboardOptIn({
        is_opted_in: newStatus,
        custom_quote: quoteInput,
      });
      setOptedIn(newStatus);
      setEditing(false);
      if (onOptInChange) onOptInChange();
    } catch (err) {
      console.error("Failed to update opt-in status", err);
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveQuote(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await toggleLeaderboardOptIn({
        is_opted_in: optedIn,
        custom_quote: quoteInput,
      });
      setEditing(false);
      if (onOptInChange) onOptInChange();
    } catch (err) {
      console.error("Failed to save quote", err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="leaderboard-optin-card">
      <div className="optin-header-row">
        <div className="optin-info-col">
          <div className="optin-status-badge">
            <span style={{ fontSize: "1.25rem" }}>🏆</span>
            <span className="optin-title">Leaderboard Participation</span>
            <Badge variant={optedIn ? "success" : "default"}>
              {optedIn ? "Public Ranking Active" : "Private / Opted Out"}
            </Badge>
          </div>

          <p className="optin-desc">
            {optedIn
              ? "Your study hours and streak are visible to fellow students on the leaderboard."
              : "Opt in to showcase your study consistency, inspire fellow scholars, and compete on the leaderboard."}
          </p>

          {optedIn && !editing && currentQuote && (
            <p className="optin-active-quote">
              Motto: <em>"{currentQuote}"</em>
            </p>
          )}
        </div>

        <div className="optin-actions-col">
          {optedIn ? (
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setEditing(!editing)}
              >
                {editing ? "Cancel" : "✏️ Edit Motto"}
              </Button>
              <Button
                size="sm"
                variant="danger"
                loading={saving}
                disabled={saving}
                onClick={() => handleToggleOptIn(false)}
              >
                Opt Out
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              variant="primary"
              loading={saving}
              disabled={saving}
              onClick={() => handleToggleOptIn(true)}
            >
              ⭐ Opt In to Leaderboard
            </Button>
          )}
        </div>
      </div>

      {editing && (
        <form onSubmit={handleSaveQuote} className="optin-quote-form">
          <Input
            id="custom_quote_input"
            label="Your Academic Motto / Quote"
            placeholder="e.g. Consistency beats talent when talent doesn't work hard."
            value={quoteInput}
            onChange={(e) => setQuoteInput(e.target.value)}
            maxLength={120}
            disabled={saving}
          />
          <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
            <Button type="submit" size="sm" loading={saving} disabled={saving}>
              Save Motto
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => setEditing(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}

      {/* Current User Snapshot Preview */}
      {currentUserEntry && (
        <div className="optin-user-snapshot">
          <span className="snapshot-title">Your Live Stats Snapshot:</span>
          <div className="snapshot-chips-row">
            <span className="snapshot-chip">
              ⏱️ {currentUserEntry.study_hours} hrs focus
            </span>
            <span className="snapshot-chip">
              🔥 {currentUserEntry.current_streak} days streak
            </span>
            <span className="snapshot-chip">
              🏆 {currentUserEntry.trophies_count} badges unlocked
            </span>
            {currentUserEntry.rank && (
              <span className="snapshot-chip snapshot-rank-chip">
                🏅 Rank #{currentUserEntry.rank}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
