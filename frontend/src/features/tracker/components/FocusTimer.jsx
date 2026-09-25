import { useState, useEffect, useRef } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Coffee,
  Flame,
  Zap,
  BookOpen,
  Sparkles,
  Volume2,
  VolumeX,
  Plus,
  ArrowRight,
  Layers,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Button from "../../../components/Button";

const TIMER_MODES = [
  { id: "standardFocus", label: "Standard (25m)", minutes: 25 },
  { id: "deep", label: "Deep Sprint (50m)", minutes: 50 },
  { id: "marathon", label: "Marathon (90m)", minutes: 90 },
  { id: "powerSession", label: "Extended (2h)", minutes: 120 },
  { id: "custom", label: "Custom Time", minutes: 60 },
  { id: "shortBreak", label: "Break (5m)", minutes: 5 },
  { id: "longBreak", label: "Break (15m)", minutes: 15 },
  { id: "stopwatch", label: "Stopwatch", minutes: 0 },
];

export default function FocusTimer({
  activeSession = null,
  onSessionCompleted,
  onExtendSession,
  onTakeQuiz,
  availableSubjects = [],
}) {
  const [activeMode, setActiveMode] = useState("standardFocus");
  const [customMinutes, setCustomMinutes] = useState(60);
  const [totalSeconds, setTotalSeconds] = useState(25 * 60);
  const [secondsRemaining, setSecondsRemaining] = useState(25 * 60);
  const [stopwatchSeconds, setStopwatchSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [subject, setSubject] = useState(
    activeSession?.subject || "General Study",
  );
  const [customSubject, setCustomSubject] = useState("");
  const [notes, setNotes] = useState(activeSession?.notes || "");
  const [isSaving, setIsSaving] = useState(false);
  const [showCompletionOptions, setShowCompletionOptions] = useState(false);
  const [completedSessionData, setCompletedSessionData] = useState(null);
  const [sessionSuccess, setSessionSuccess] = useState("");
  const [voiceAnnouncement, setVoiceAnnouncement] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem("student_brain_notif_sound") !== "false";
  });

  const timerRef = useRef(null);
  const spokenMilestonesRef = useRef(new Set());
  const announcementTimeoutRef = useRef(null);

  // Text-To-Speech Voice Coach
  const speakText = (text) => {
    if (!soundEnabled) return;
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      const voices = window.speechSynthesis.getVoices();
      const preferredVoice =
        voices.find(
          (v) =>
            (v.name.includes("Natural") ||
              v.name.includes("Google") ||
              v.name.includes("Samantha") ||
              v.name.includes("Zira") ||
              v.name.includes("Jenny")) &&
            v.lang.startsWith("en"),
        ) || voices.find((v) => v.lang.startsWith("en"));

      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      setVoiceAnnouncement(text);
      if (announcementTimeoutRef.current) {
        clearTimeout(announcementTimeoutRef.current);
      }
      announcementTimeoutRef.current = setTimeout(() => {
        setVoiceAnnouncement("");
      }, 6000);

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn("Speech synthesis error:", err);
    }
  };

  // Smart percentage-based milestone checker
  const checkMilestoneSpeech = (remaining, total) => {
    if (total <= 0 || !soundEnabled) return;
    const elapsed = total - remaining;
    const pct = Math.floor((elapsed / total) * 100);

    // 1. Completion
    if (remaining === 0) {
      if (!spokenMilestonesRef.current.has("done")) {
        spokenMilestonesRef.current.add("done");
        speakText(
          activeMode.includes("Break")
            ? "Break finished! Ready for your next focus block."
            : "Session complete! Outstanding job on your focus sprint.",
        );
      }
      return;
    }

    // 2. Final countdowns
    if (remaining === 60 && total >= 180) {
      if (!spokenMilestonesRef.current.has("rem_60")) {
        spokenMilestonesRef.current.add("rem_60");
        speakText("One minute remaining. Finish up your current task.");
      }
    }

    if (remaining === 300 && total >= 600) {
      if (!spokenMilestonesRef.current.has("rem_300")) {
        spokenMilestonesRef.current.add("rem_300");
        speakText("Five minutes left. Prepare to wrap up this focus block.");
      }
    }

    if (remaining === 900 && total >= 2700) {
      if (!spokenMilestonesRef.current.has("rem_900")) {
        spokenMilestonesRef.current.add("rem_900");
        speakText("15 minutes remaining in your session.");
      }
    }

    // 3. Percentage milestones
    // Long sessions (>= 60 minutes, e.g. 1 hour, 2 hours, 5 hours):
    if (total >= 3600) {
      if (
        pct >= 25 &&
        pct < 30 &&
        !spokenMilestonesRef.current.has("pct_25")
      ) {
        spokenMilestonesRef.current.add("pct_25");
        speakText(
          "Quarter mark reached. 25 percent completed. Maintain your steady rhythm.",
        );
      } else if (
        pct >= 50 &&
        pct < 55 &&
        !spokenMilestonesRef.current.has("pct_50")
      ) {
        spokenMilestonesRef.current.add("pct_50");
        speakText(
          "Halfway point! 50 percent of your focus session is completed. Great stamina.",
        );
      } else if (
        pct >= 75 &&
        pct < 80 &&
        !spokenMilestonesRef.current.has("pct_75")
      ) {
        spokenMilestonesRef.current.add("pct_75");
        speakText(
          "Three quarters completed. 75 percent done. You are in the final stretch, keep pushing.",
        );
      }
    } else if (total >= 1200) {
      // Medium sessions (20m to 59m):
      if (
        pct >= 50 &&
        pct < 55 &&
        !spokenMilestonesRef.current.has("pct_50")
      ) {
        spokenMilestonesRef.current.add("pct_50");
        speakText(
          "Halfway mark! 50 percent of your study block is complete. Stay in the zone.",
        );
      }
    }
  };

  // Sync activeSession changes if passed in
  useEffect(() => {
    if (activeSession) {
      setSubject(activeSession.subject || "General Study");
      if (activeSession.duration_minutes) {
        const secs = activeSession.duration_minutes * 60;
        setTotalSeconds(secs);
        setSecondsRemaining(secs);
        spokenMilestonesRef.current.clear();
      }
    }
  }, [activeSession]);

  // Mode change handler
  const handleModeChange = (mode) => {
    setIsActive(false);
    setActiveMode(mode.id);
    setShowCompletionOptions(false);
    spokenMilestonesRef.current.clear();
    if (mode.id === "stopwatch") {
      setStopwatchSeconds(0);
    } else {
      const mins = mode.id === "custom" ? customMinutes : mode.minutes;
      const secs = mins * 60;
      setTotalSeconds(secs);
      setSecondsRemaining(secs);
    }
  };

  // Timer Tick Effect
  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        if (activeMode === "stopwatch") {
          setStopwatchSeconds((prev) => {
            const next = prev + 1;
            // Spoken milestones for stopwatch: every 15 minutes
            if (next > 0 && next % 900 === 0) {
              const mins = Math.floor(next / 60);
              speakText(`You have been studying for ${mins} minutes. Great focus.`);
            }
            return next;
          });
        } else {
          setSecondsRemaining((prev) => {
            if (prev <= 1) {
              clearInterval(timerRef.current);
              setIsActive(false);
              playCompletionSound();
              setShowCompletionOptions(true);
              checkMilestoneSpeech(0, totalSeconds);
              return 0;
            }
            const next = prev - 1;
            checkMilestoneSpeech(next, totalSeconds);
            return next;
          });
        }
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [isActive, activeMode, totalSeconds, soundEnabled]);

  const playCompletionSound = () => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.7);
    } catch (e) {
      console.warn("Web Audio chime not supported or allowed", e);
    }
  };

  const handleTogglePlay = () => {
    const nextActive = !isActive;
    setIsActive(nextActive);
    if (nextActive) {
      if (
        activeMode !== "stopwatch" &&
        totalSeconds - secondsRemaining === 0
      ) {
        speakText(
          `Focus session started for ${subject || "study"}. Eliminate distractions and stay in flow.`,
        );
      } else {
        speakText("Focus session resumed.");
      }
    } else {
      speakText("Focus session paused.");
    }
  };

  const handleReset = () => {
    setIsActive(false);
    setShowCompletionOptions(false);
    spokenMilestonesRef.current.clear();
    speakText("Timer reset.");
    if (activeMode === "stopwatch") {
      setStopwatchSeconds(0);
    } else {
      const mode =
        TIMER_MODES.find((m) => m.id === activeMode) || TIMER_MODES[0];
      const mins = mode.id === "custom" ? customMinutes : mode.minutes;
      const secs = mins * 60;
      setTotalSeconds(secs);
      setSecondsRemaining(secs);
    }
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainderSecs = secs % 60;
    return `${String(mins).padStart(2, "0")}:${String(remainderSecs).padStart(2, "0")}`;
  };

  const getElapsedMinutes = () => {
    if (activeMode === "stopwatch") {
      return Math.max(1, Math.round(stopwatchSeconds / 60));
    }
    const elapsedSecs = totalSeconds - secondsRemaining;
    return Math.max(1, Math.round(elapsedSecs / 60));
  };

  const handleCompleteAndLog = async () => {
    const elapsedMins = getElapsedMinutes();
    const finalSubject = (
      customSubject.trim() ||
      subject ||
      "Focus Session"
    ).trim();

    if (onSessionCompleted) {
      try {
        setIsSaving(true);
        const today = new Date().toISOString().split("T")[0];
        const res = await onSessionCompleted({
          id: activeSession?.id,
          subject: finalSubject,
          duration_minutes: elapsedMins,
          session_date: today,
          notes: notes.trim() || `Completed ${activeMode} focus timer session.`,
          status: "completed",
        });
        setCompletedSessionData(
          res ||
            activeSession || {
              subject: finalSubject,
              duration_minutes: elapsedMins,
            },
        );
        setShowCompletionOptions(true);
        setSessionSuccess(
          `Completed ${elapsedMins}m focus session! Streak updated 🔥`,
        );
      } catch (err) {
        console.error("Failed to save focus timer session", err);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const progressPercent =
    activeMode === "stopwatch"
      ? Math.min(100, (stopwatchSeconds % 3600) / 36)
      : totalSeconds > 0
        ? Math.round(((totalSeconds - secondsRemaining) / totalSeconds) * 100)
        : 0;

  const displayTime =
    activeMode === "stopwatch"
      ? formatTime(stopwatchSeconds)
      : formatTime(secondsRemaining);

  return (
    <div className="focus-timer-card-wrapper">
      {/* Mode Selector Tabs */}
      <div className="focus-timer-modes-bar">
        {TIMER_MODES.map((mode) => (
          <button
            key={mode.id}
            type="button"
            className={`focus-mode-chip ${activeMode === mode.id ? "mode-chip-active" : ""}`}
            onClick={() => handleModeChange(mode)}
          >
            {mode.label}
          </button>
        ))}
      </div>

      {/* Custom Duration Selector */}
      {activeMode === "custom" && (
        <div className="focus-custom-duration-row">
          <label className="text-xs text-muted font-medium">Custom Duration:</label>
          <div className="custom-duration-inputs">
            <input
              type="number"
              min="1"
              max="720"
              value={customMinutes}
              onChange={(e) => {
                const val = Math.max(1, Math.min(720, parseInt(e.target.value) || 1));
                setCustomMinutes(val);
                if (!isActive) {
                  setTotalSeconds(val * 60);
                  setSecondsRemaining(val * 60);
                  spokenMilestonesRef.current.clear();
                }
              }}
              className="form-input form-input-sm custom-mins-input"
            />
            <span className="text-xs text-muted font-semibold">
              mins ({Math.floor(customMinutes / 60)}h {customMinutes % 60}m)
            </span>
          </div>
          <div className="custom-duration-presets">
            {[30, 45, 60, 90, 120, 180, 300].map((presetMins) => (
              <button
                key={presetMins}
                type="button"
                className={`btn-chip-preset ${customMinutes === presetMins ? "active" : ""}`}
                onClick={() => {
                  setCustomMinutes(presetMins);
                  if (!isActive) {
                    setTotalSeconds(presetMins * 60);
                    setSecondsRemaining(presetMins * 60);
                    spokenMilestonesRef.current.clear();
                  }
                }}
              >
                {presetMins >= 60 ? `${presetMins / 60}h` : `${presetMins}m`}
              </button>
            ))}
          </div>
        </div>
      )}

      {sessionSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="alert-banner alert-banner-success my-3"
        >
          <span>{sessionSuccess}</span>
        </motion.div>
      )}

      {/* Main Timer Display Circle / Hero */}
      <div className="focus-timer-hero-container">
        <div className="focus-timer-dial">
          <svg className="timer-svg-ring" viewBox="0 0 200 200">
            <circle className="timer-ring-track" cx="100" cy="100" r="86" />
            <circle
              className="timer-ring-indicator"
              cx="100"
              cy="100"
              r="86"
              style={{
                strokeDasharray: 540,
                strokeDashoffset: 540 - (540 * progressPercent) / 100,
              }}
            />
          </svg>

          <div className="focus-timer-time-display">
            <span className="focus-timer-digits">{displayTime}</span>
            <span className="focus-timer-state-label">
              {isActive
                ? "Focus Block In Progress"
                : secondsRemaining === 0
                  ? "Session Target Completed"
                  : "Ready to Begin"}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="focus-timer-controls-row">
          <Button
            type="button"
            variant={isActive ? "secondary" : "primary"}
            size="lg"
            onClick={handleTogglePlay}
            icon={isActive ? Pause : Play}
            className="btn-timer-main-action"
          >
            {isActive ? "Pause" : "Start Focus"}
          </Button>

          <button
            type="button"
            className="btn-timer-reset"
            onClick={handleReset}
            title="Reset Timer"
          >
            <RotateCcw size={18} />
          </button>

          <button
            type="button"
            className={`btn-timer-sound ${soundEnabled ? "sound-active" : ""}`}
            onClick={() => {
              const next = !soundEnabled;
              setSoundEnabled(next);
              localStorage.setItem("student_brain_notif_sound", String(next));
              if (next) {
                speakText("Voice coach enabled. Sound guidance active.");
              } else {
                if (typeof window !== "undefined" && "speechSynthesis" in window) {
                  window.speechSynthesis.cancel();
                }
              }
            }}
            title={soundEnabled ? "Voice coach enabled (click to mute)" : "Enable voice coach & audio"}
          >
            {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
        </div>

        {/* Live Voice Coach Announcement Banner */}
        <AnimatePresence>
          {voiceAnnouncement && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.95 }}
              className="focus-voice-coach-banner"
            >
              <div className="voice-coach-pulse-dot" />
              <Volume2 size={14} className="text-primary animate-pulse" />
              <span className="voice-coach-text">{voiceAnnouncement}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Post-Session Action Prompt Card */}
      <AnimatePresence>
        {showCompletionOptions && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="post-session-celebration-card my-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">🎉</span>
              <h4 className="font-bold text-success text-sm m-0">
                Session Finished! What's Next?
              </h4>
            </div>
            <p className="text-xs text-muted mb-3">
              Solidify your retention with a 5-question AI diagnostic test or
              extend your focus block to boost your daily goal & streak.
            </p>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="primary"
                size="sm"
                icon={Sparkles}
                onClick={() => {
                  if (onTakeQuiz && completedSessionData) {
                    onTakeQuiz(completedSessionData);
                  }
                }}
              >
                Take AI Diagnostic Quiz
              </Button>

              <Button
                variant="outline"
                size="sm"
                icon={Plus}
                onClick={() => {
                  if (onExtendSession && completedSessionData) {
                    onExtendSession(completedSessionData, 15);
                    setShowCompletionOptions(false);
                    setSessionSuccess("Session extended by +15 mins! 🚀");
                  }
                }}
              >
                Extend +15 Minutes
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowCompletionOptions(false);
                  handleReset();
                }}
              >
                Done for now
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subject & Log Details Box */}
      <div className="focus-timer-session-meta">
        <h4 className="meta-box-title">
          <BookOpen size={16} className="text-primary" />
          <span>Active Study Topic & Details</span>
        </h4>

        <div
          className="modal-grid-2col"
          style={{ gap: "12px", marginBottom: "12px" }}
        >
          <div className="form-group">
            <label className="form-label text-xs">Subject / Category</label>
            <select
              value={subject}
              onChange={(e) => {
                setSubject(e.target.value);
                if (e.target.value !== "Custom") setCustomSubject("");
              }}
              className="form-input form-input-sm"
            >
              <option value="General Study">General Study</option>
              <option value="Exam Preparation">Exam Preparation</option>
              <option value="Problem Solving / Code">
                Problem Solving / Code
              </option>
              <option value="Syllabus Review">Syllabus Review</option>
              {availableSubjects.map((sub, idx) => (
                <option key={idx} value={sub}>
                  {sub}
                </option>
              ))}
              <option value="Custom">+ Custom Topic...</option>
            </select>
          </div>

          {subject === "Custom" && (
            <div className="form-group">
              <label className="form-label text-xs">Custom Subject Name</label>
              <input
                type="text"
                className="form-input form-input-sm"
                placeholder="e.g. DBMS Normalization"
                value={customSubject}
                onChange={(e) => setCustomSubject(e.target.value)}
              />
            </div>
          )}

          <div
            className="form-group"
            style={{ gridColumn: subject === "Custom" ? "span 2" : "auto" }}
          >
            <label className="form-label text-xs">Session Notes / Goals</label>
            <input
              type="text"
              className="form-input form-input-sm"
              placeholder="What did you accomplish in this focus block?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <div className="focus-timer-log-action-row">
          <span className="elapsed-mins-tag">
            ⏱️ Elapsed: <strong>{getElapsedMinutes()} mins</strong>
          </span>

          <Button
            type="button"
            variant="success"
            size="sm"
            icon={CheckCircle2}
            onClick={handleCompleteAndLog}
            loading={isSaving}
            disabled={
              isSaving ||
              (activeMode === "stopwatch"
                ? stopwatchSeconds < 10
                : totalSeconds - secondsRemaining < 10)
            }
          >
            Finish & Log Session
          </Button>
        </div>
      </div>
    </div>
  );
}
