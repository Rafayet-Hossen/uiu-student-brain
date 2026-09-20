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
  { id: "pomodoro", label: "🍅 Pomodoro (25m)", minutes: 25 },
  { id: "deep", label: "⚡ Deep Focus (50m)", minutes: 50 },
  { id: "shortBreak", label: "☕ Short Break (5m)", minutes: 5 },
  { id: "longBreak", label: "🌴 Long Break (15m)", minutes: 15 },
  { id: "stopwatch", label: "⏱️ Open Stopwatch", minutes: 0 },
];

export default function FocusTimer({
  activeSession = null,
  onSessionCompleted,
  onExtendSession,
  onTakeQuiz,
  availableSubjects = [],
}) {
  const [activeMode, setActiveMode] = useState("pomodoro");
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
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem("student_brain_notif_sound") !== "false";
  });

  const timerRef = useRef(null);

  // Sync activeSession changes if passed in
  useEffect(() => {
    if (activeSession) {
      setSubject(activeSession.subject || "General Study");
      if (activeSession.duration_minutes) {
        const secs = activeSession.duration_minutes * 60;
        setTotalSeconds(secs);
        setSecondsRemaining(secs);
      }
    }
  }, [activeSession]);

  // Mode change handler
  const handleModeChange = (mode) => {
    setIsActive(false);
    setActiveMode(mode.id);
    setShowCompletionOptions(false);
    if (mode.id === "stopwatch") {
      setStopwatchSeconds(0);
    } else {
      const secs = mode.minutes * 60;
      setTotalSeconds(secs);
      setSecondsRemaining(secs);
    }
  };

  // Timer Tick Effect
  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        if (activeMode === "stopwatch") {
          setStopwatchSeconds((prev) => prev + 1);
        } else {
          setSecondsRemaining((prev) => {
            if (prev <= 1) {
              clearInterval(timerRef.current);
              setIsActive(false);
              playCompletionSound();
              setShowCompletionOptions(true);
              return 0;
            }
            return prev - 1;
          });
        }
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [isActive, activeMode]);

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
    setIsActive(!isActive);
  };

  const handleReset = () => {
    setIsActive(false);
    setShowCompletionOptions(false);
    if (activeMode === "stopwatch") {
      setStopwatchSeconds(0);
    } else {
      const mode =
        TIMER_MODES.find((m) => m.id === activeMode) || TIMER_MODES[0];
      const secs = mode.minutes * 60;
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
                ? "🔥 Focusing..."
                : secondsRemaining === 0
                  ? "🎉 Goal Reached!"
                  : "Ready to Focus"}
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
            className="btn-timer-sound"
            onClick={() => {
              const next = !soundEnabled;
              setSoundEnabled(next);
              localStorage.setItem("student_brain_notif_sound", String(next));
            }}
            title={soundEnabled ? "Mute audio chime" : "Enable audio chime"}
          >
            {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
        </div>
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
