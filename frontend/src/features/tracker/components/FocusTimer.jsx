import { useState, useEffect, useRef } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  BookOpen,
  Volume2,
  VolumeX,
  Plus,
  Clock,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Button from "../../../components/Button";

const TIMER_MODES = [
  { id: "standardFocus", label: "Standard (25m)", minutes: 25 },
  { id: "deep", label: "Deep Sprint (50m)", minutes: 50 },
  { id: "marathon", label: "Marathon (90m)", minutes: 90 },
  { id: "powerSession", label: "Extended (2h)", minutes: 120 },
  { id: "manual", label: "⏱️ Manual / Custom Time", minutes: 60 },
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
  const [manualHours, setManualHours] = useState(0);
  const [manualMinutes, setManualMinutes] = useState(25);
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
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem("student_brain_notif_sound") !== "false";
  });

  const timerRef = useRef(null);
  const spokenMilestonesRef = useRef(new Set());
  const announcementTimeoutRef = useRef(null);

  // Pre-load voices on component mount for Chromium / Safari
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const loadVoices = () => {
        try {
          window.speechSynthesis.getVoices();
        } catch (e) {
          // ignore
        }
      };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // Web Audio chime / tone fallback
  const playAudibleTone = (freq = 587.33, duration = 0.25) => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === "suspended") {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(
        freq * 1.25,
        ctx.currentTime + duration * 0.5,
      );
      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      console.warn("Web Audio tone not available", e);
    }
  };

  const playCompletionSound = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === "suspended") {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.18);
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.8);
    } catch (e) {
      console.warn("Web Audio completion chime error", e);
    }
  };

  // Convert seconds into natural spoken English (e.g. "30 seconds", "2 minutes and 30 seconds", "1 hour")
  const getSpokenTimeText = (secs) => {
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const remainderSecs = secs % 60;

    if (hrs > 0 && mins > 0) {
      return `${hrs} hour${hrs > 1 ? "s" : ""} and ${mins} minute${mins > 1 ? "s" : ""}`;
    }
    if (hrs > 0 && mins === 0) {
      return `${hrs} hour${hrs > 1 ? "s" : ""}`;
    }
    if (mins > 0 && remainderSecs > 0) {
      return `${mins} minute${mins > 1 ? "s" : ""} and ${remainderSecs} second${remainderSecs > 1 ? "s" : ""}`;
    }
    if (mins > 0 && remainderSecs === 0) {
      return `${mins} minute${mins > 1 ? "s" : ""}`;
    }
    return `${remainderSecs} second${remainderSecs > 1 ? "s" : ""}`;
  };

  // Text-To-Speech Voice Coach
  const speakText = (text) => {
    if (!soundEnabled) return;

    // Show visual announcement pill immediately
    setVoiceAnnouncement(text);
    if (announcementTimeoutRef.current) {
      clearTimeout(announcementTimeoutRef.current);
    }
    announcementTimeoutRef.current = setTimeout(() => {
      setVoiceAnnouncement("");
    }, 7000);

    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    try {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }

      setTimeout(() => {
        try {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.rate = 1.0;
          utterance.pitch = 1.0;
          utterance.volume = 1.0;
          utterance.lang = "en-US";

          const voices = window.speechSynthesis.getVoices() || [];
          const preferredVoice =
            voices.find(
              (v) =>
                (v.name.includes("Natural") ||
                  v.name.includes("Google") ||
                  v.name.includes("Samantha") ||
                  v.name.includes("Zira") ||
                  v.name.includes("Jenny") ||
                  v.name.includes("David")) &&
                v.lang.startsWith("en"),
            ) || voices.find((v) => v.lang.startsWith("en"));

          if (preferredVoice) {
            utterance.voice = preferredVoice;
          }

          utterance.onend = () => {
            window._activeSpeechUtterance = null;
          };
          utterance.onerror = (e) => {
            console.warn("SpeechSynthesis error:", e);
            window._activeSpeechUtterance = null;
          };

          // Retain reference to prevent Chromium garbage collection
          window._activeSpeechUtterance = utterance;

          window.speechSynthesis.resume();
          window.speechSynthesis.speak(utterance);
        } catch (innerErr) {
          console.warn("Speech synthesis speak error:", innerErr);
        }
      }, 50);
    } catch (err) {
      console.warn("Speech synthesis outer error:", err);
    }
  };

  // Smart percentage-based & clock-accurate milestone checker
  const checkMilestoneSpeech = (remaining, total) => {
    if (total <= 0 || !soundEnabled) return;
    const elapsed = total - remaining;
    const pct = Math.floor((elapsed / total) * 100);

    // 1. Completion milestone (0 seconds remaining)
    if (remaining === 0) {
      if (!spokenMilestonesRef.current.has("done")) {
        spokenMilestonesRef.current.add("done");
        playCompletionSound();
        speakText(
          activeMode.includes("Break")
            ? "Break finished! Ready for your next focus block."
            : "Session complete! Outstanding job on your focus sprint.",
        );
      }
      return;
    }

    // 2. 50% Halfway Milestone (Triggers for ANY duration, e.g. 1m, 5m, 25m, 1h, 5h)
    if (pct >= 50 && !spokenMilestonesRef.current.has("pct_50")) {
      spokenMilestonesRef.current.add("pct_50");
      playAudibleTone(587, 0.25);
      const timeLeft = getSpokenTimeText(remaining);
      speakText(`50 percent completed. ${timeLeft} remaining.`);
      return;
    }

    // 3. 75% Milestone (Triggers for ANY duration)
    if (pct >= 75 && !spokenMilestonesRef.current.has("pct_75")) {
      spokenMilestonesRef.current.add("pct_75");
      playAudibleTone(660, 0.25);
      const timeLeft = getSpokenTimeText(remaining);
      speakText(`75 percent completed. ${timeLeft} left.`);
      return;
    }

    // 4. 25% Milestone (for sessions of 2 minutes or longer)
    if (total >= 120 && pct >= 25 && !spokenMilestonesRef.current.has("pct_25")) {
      spokenMilestonesRef.current.add("pct_25");
      playAudibleTone(520, 0.2);
      const timeLeft = getSpokenTimeText(remaining);
      speakText(`25 percent completed. ${timeLeft} left.`);
      return;
    }

    // 5. Fixed Clock Reminders (when not immediately overlapping with percentage alerts)
    // 5 minutes remaining (if total >= 10 mins)
    if (remaining === 300 && total >= 600) {
      if (!spokenMilestonesRef.current.has("rem_300")) {
        spokenMilestonesRef.current.add("rem_300");
        playAudibleTone(550, 0.2);
        speakText("5 minutes left. Prepare to wrap up.");
      }
    }

    // 1 minute remaining (if total >= 180s)
    if (remaining === 60 && total >= 180) {
      if (!spokenMilestonesRef.current.has("rem_60")) {
        spokenMilestonesRef.current.add("rem_60");
        playAudibleTone(660, 0.2);
        speakText("1 minute left. Begin wrapping up your thoughts.");
      }
    }

    // 30 seconds remaining (if total >= 90s, so not overlapping with 50% of a 60s session)
    if (remaining === 30 && total >= 90) {
      if (!spokenMilestonesRef.current.has("rem_30")) {
        spokenMilestonesRef.current.add("rem_30");
        playAudibleTone(660, 0.2);
        speakText("30 seconds left.");
      }
    }

    // 10 seconds remaining (for sessions >= 30s)
    if (remaining === 10 && total >= 30) {
      if (!spokenMilestonesRef.current.has("rem_10")) {
        spokenMilestonesRef.current.add("rem_10");
        playAudibleTone(700, 0.15);
        speakText("10 seconds remaining.");
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
        setManualHours(Math.floor(activeSession.duration_minutes / 60));
        setManualMinutes(activeSession.duration_minutes % 60);
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
    } else if (mode.id === "manual") {
      const totalMins = manualHours * 60 + manualMinutes;
      const validMins = totalMins > 0 ? totalMins : 60;
      setTotalSeconds(validMins * 60);
      setSecondsRemaining(validMins * 60);
    } else {
      const secs = mode.minutes * 60;
      setTotalSeconds(secs);
      setSecondsRemaining(secs);
      setManualHours(Math.floor(mode.minutes / 60));
      setManualMinutes(mode.minutes % 60);
    }
  };

  // Manual time update handler
  const updateManualDuration = (hrs, mins) => {
    const h = Math.max(0, Math.min(12, parseInt(hrs, 10) || 0));
    const m = Math.max(0, Math.min(59, parseInt(mins, 10) || 0));
    setManualHours(h);
    setManualMinutes(m);
    const totalMins = h * 60 + m;
    const finalMins = totalMins > 0 ? totalMins : 1;
    if (!isActive) {
      setTotalSeconds(finalMins * 60);
      setSecondsRemaining(finalMins * 60);
      spokenMilestonesRef.current.clear();
    }
  };

  // Quick adjust +/- minutes
  const handleQuickAdjust = (deltaMinutes) => {
    if (isActive) return;
    const currentMins = Math.max(1, Math.round(totalSeconds / 60));
    const nextMins = Math.max(1, currentMins + deltaMinutes);
    const h = Math.floor(nextMins / 60);
    const m = nextMins % 60;
    setManualHours(h);
    setManualMinutes(m);
    setTotalSeconds(nextMins * 60);
    setSecondsRemaining(nextMins * 60);
    spokenMilestonesRef.current.clear();
    playAudibleTone(520, 0.1);
  };

  // Timer Tick Effect
  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        if (activeMode === "stopwatch") {
          setStopwatchSeconds((prev) => {
            const next = prev + 1;
            if (next > 0 && next % 900 === 0) {
              const mins = Math.floor(next / 60);
              playAudibleTone(520, 0.2);
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
              handleCompleteAndLog();
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

  const handleTogglePlay = () => {
    const nextActive = !isActive;
    setIsActive(nextActive);
    playAudibleTone(nextActive ? 620 : 420, 0.15);
    if (nextActive) {
      if (
        activeMode !== "stopwatch" &&
        totalSeconds - secondsRemaining === 0
      ) {
        const timeText = getSpokenTimeText(totalSeconds);
        speakText(
          `Focus session started for ${timeText}. Stay in flow.`,
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
    playAudibleTone(440, 0.15);
    speakText("Timer reset.");
    if (activeMode === "stopwatch") {
      setStopwatchSeconds(0);
    } else if (activeMode === "manual") {
      const totalMins = manualHours * 60 + manualMinutes;
      const validMins = totalMins > 0 ? totalMins : 60;
      setTotalSeconds(validMins * 60);
      setSecondsRemaining(validMins * 60);
    } else {
      const mode =
        TIMER_MODES.find((m) => m.id === activeMode) || TIMER_MODES[0];
      const secs = mode.minutes * 60;
      setTotalSeconds(secs);
      setSecondsRemaining(secs);
    }
  };

  const formatTime = (secs) => {
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const remainderSecs = secs % 60;
    if (hrs > 0) {
      return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(remainderSecs).padStart(2, "0")}`;
    }
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
        const finalData =
          res ||
          activeSession || {
            id: res?.id || activeSession?.id,
            subject: finalSubject,
            duration_minutes: elapsedMins,
          };
        setCompletedSessionData(finalData);
        setShowCompletionOptions(true);
        setSessionSuccess(
          `Completed ${elapsedMins}m focus session! Streak updated 🔥`,
        );
        return finalData;
      } catch (err) {
        console.error("Failed to save focus timer session", err);
      } finally {
        setIsSaving(false);
      }
    }
    return null;
  };

  const handleTakeDiagnosticQuiz = async () => {
    try {
      setIsLoadingQuiz(true);
      let sessionData = completedSessionData;
      if (!sessionData || !sessionData.id) {
        sessionData = await handleCompleteAndLog();
      }
      if (sessionData && onTakeQuiz) {
        onTakeQuiz(sessionData);
      }
    } catch (err) {
      console.error("Failed to launch diagnostic quiz:", err);
    } finally {
      setIsLoadingQuiz(false);
    }
  };

  const handleExtendCurrentSession = () => {
    try {
      if (onExtendSession && (completedSessionData || activeSession)) {
        onExtendSession(completedSessionData || activeSession, 15);
      }
      setSecondsRemaining((prev) => prev + 15 * 60);
      setTotalSeconds((prev) => prev + 15 * 60);
      setShowCompletionOptions(false);
      spokenMilestonesRef.current.clear();
      setSessionSuccess("Session extended by +15 mins! Keep the flow going 🚀");
      playAudibleTone(660, 0.2);
    } catch (err) {
      console.error("Failed to extend session:", err);
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

      {/* Manual / Custom Duration Input Box */}
      {activeMode === "manual" && (
        <div className="focus-custom-duration-row">
          <div className="manual-time-inputs-cluster">
            <span className="manual-time-title">
              <Clock size={15} /> Set Duration:
            </span>

            <div className="manual-time-field">
              <input
                type="number"
                min="0"
                max="12"
                value={manualHours}
                onChange={(e) => updateManualDuration(e.target.value, manualMinutes)}
                className="form-input form-input-sm manual-num-input"
                disabled={isActive}
              />
              <span className="manual-time-unit">hr</span>
            </div>

            <span className="manual-time-colon">:</span>

            <div className="manual-time-field">
              <input
                type="number"
                min="0"
                max="59"
                value={manualMinutes}
                onChange={(e) => updateManualDuration(manualHours, e.target.value)}
                className="form-input form-input-sm manual-num-input"
                disabled={isActive}
              />
              <span className="manual-time-unit">min</span>
            </div>

            <span className="manual-time-total-tag">
              Total: <strong>{manualHours * 60 + manualMinutes} mins</strong>
            </span>
          </div>

          <div className="custom-duration-presets">
            <span className="text-xs text-muted font-medium mr-1">Presets:</span>
            {[
              { label: "15m", h: 0, m: 15 },
              { label: "30m", h: 0, m: 30 },
              { label: "45m", h: 0, m: 45 },
              { label: "1 hr", h: 1, m: 0 },
              { label: "1.5 hr", h: 1, m: 30 },
              { label: "2 hr", h: 2, m: 0 },
              { label: "3 hr", h: 3, m: 0 },
              { label: "5 hr (300m)", h: 5, m: 0 },
            ].map((p) => {
              const isMatch = manualHours === p.h && manualMinutes === p.m;
              return (
                <button
                  key={p.label}
                  type="button"
                  className={`btn-chip-preset ${isMatch ? "active" : ""}`}
                  onClick={() => updateManualDuration(p.h, p.m)}
                  disabled={isActive}
                >
                  {p.label}
                </button>
              );
            })}
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
                  : activeMode === "manual"
                    ? "Manual Time Ready to Start"
                    : "Ready to Begin"}
            </span>
          </div>
        </div>

        {/* Quick Adjust Buttons (available when paused or idle) */}
        {!isActive && activeMode !== "stopwatch" && (
          <div className="focus-quick-adjust-bar">
            <span className="quick-adjust-label">Quick Adjust:</span>
            <button
              type="button"
              className="btn-quick-adjust"
              onClick={() => handleQuickAdjust(-15)}
              disabled={totalSeconds <= 15 * 60}
              title="Subtract 15 minutes"
            >
              -15m
            </button>
            <button
              type="button"
              className="btn-quick-adjust"
              onClick={() => handleQuickAdjust(-5)}
              disabled={totalSeconds <= 5 * 60}
              title="Subtract 5 minutes"
            >
              -5m
            </button>
            <button
              type="button"
              className="btn-quick-adjust"
              onClick={() => handleQuickAdjust(5)}
              title="Add 5 minutes"
            >
              +5m
            </button>
            <button
              type="button"
              className="btn-quick-adjust"
              onClick={() => handleQuickAdjust(15)}
              title="Add 15 minutes"
            >
              +15m
            </button>
            <button
              type="button"
              className="btn-quick-adjust"
              onClick={() => handleQuickAdjust(30)}
              title="Add 30 minutes"
            >
              +30m
            </button>
            <button
              type="button"
              className="btn-quick-adjust"
              onClick={() => handleQuickAdjust(60)}
              title="Add 1 hour"
            >
              +1h
            </button>
          </div>
        )}

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
                playAudibleTone(660, 0.2);
                speakText("Voice coach enabled. Sound guidance active.");
              } else {
                if (typeof window !== "undefined" && "speechSynthesis" in window) {
                  window.speechSynthesis.cancel();
                }
              }
            }}
            title={soundEnabled ? "Voice coach active (click to mute)" : "Enable voice coach & audio"}
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
            initial={{ opacity: 0, scale: 0.97, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 10 }}
            transition={{ duration: 0.24, ease: "easeOut" }}
            className="post-session-celebration-card my-4"
          >
            <div className="celebration-card-glow-bg" />

            <div className="celebration-card-header">
              <div className="celebration-icon-box">
                <span className="celebration-emoji">🎉</span>
              </div>
              <div className="celebration-text-content">
                <div className="celebration-badge-pill">
                  <Sparkles size={13} />
                  <span>Session Target Completed</span>
                </div>
                <h4 className="celebration-card-title">
                  Outstanding Focus Sprint! What's Next?
                </h4>
                <p className="celebration-card-subtitle">
                  Solidify your retention with a 5-question AI diagnostic test or
                  extend your focus block to boost your daily goal & streak.
                </p>
              </div>
            </div>

            <div className="celebration-btn-group">
              <button
                type="button"
                className="btn-celebration-quiz"
                onClick={handleTakeDiagnosticQuiz}
                disabled={isLoadingQuiz}
              >
                <Sparkles
                  size={16}
                  className={isLoadingQuiz ? "animate-spin" : "sparkle-icon"}
                />
                <span>
                  {isLoadingQuiz
                    ? "Generating AI Quiz..."
                    : "Take AI Diagnostic Quiz"}
                </span>
              </button>

              <button
                type="button"
                className="btn-celebration-extend"
                onClick={handleExtendCurrentSession}
              >
                <Plus size={16} />
                <span>Extend +15 Minutes</span>
              </button>

              <button
                type="button"
                className="btn-celebration-dismiss"
                onClick={() => {
                  setShowCompletionOptions(false);
                  handleReset();
                }}
              >
                <CheckCircle2 size={16} />
                <span>Done for now</span>
              </button>
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
