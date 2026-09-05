import { motion } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "../theme/useTheme";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.92 }}
      whileHover={{ scale: 1.04 }}
      className={`premium-theme-toggle-switch ${isDark ? "theme-is-dark" : "theme-is-light"}`}
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
    >
      {/* Track background with subtle sun & moon ambient icons */}
      <div className="toggle-track-icons">
        <Sun
          size={13}
          className={`track-icon sun-icon ${!isDark ? "icon-active" : ""}`}
        />
        <Moon
          size={13}
          className={`track-icon moon-icon ${isDark ? "icon-active" : ""}`}
        />
      </div>

      {/* Floating Animated Pill Thumb */}
      <motion.div
        className="toggle-thumb"
        layout
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      >
        <motion.div
          key={theme}
          initial={{ rotate: -90, scale: 0.6, opacity: 0 }}
          animate={{ rotate: 0, scale: 1, opacity: 1 }}
          exit={{ rotate: 90, scale: 0.6, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="thumb-icon-wrap"
        >
          {isDark ? (
            <Moon size={13} className="thumb-icon-svg moon" />
          ) : (
            <Sun size={13} className="thumb-icon-svg sun" />
          )}
        </motion.div>
      </motion.div>
    </motion.button>
  );
}
